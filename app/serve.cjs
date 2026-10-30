// Loopback-only app server. Disk APIs are enabled only with an explicit store.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.ico':'image/x-icon','.svg':'image/svg+xml','.png':'image/png','.zip':'application/zip','.txt':'text/plain; charset=utf-8'};
function createHandler(directory,options={}){
 const root=fs.realpathSync(directory),store=options.store,token=require('node:crypto').randomBytes(32).toString('hex');
 const instanceId=store?require('node:crypto').createHash('sha256').update(store.directory).digest('hex'):null;
 const permitted=file=>{const relative=path.relative(root,file);return relative!=='..'&&!relative.startsWith('..'+path.sep)&&!path.isAbsolute(relative)&&!relative.split(path.sep).some(p=>p.startsWith('.'));};
 return async(req,res)=>{
  const end=(status,message='',headers={})=>res.writeHead(status,headers).end(req.method==='HEAD'?'':message);
  try{
   const host=req.headers.host||'';
   if(!/^(127\.0\.0\.1|localhost)(:\d+)?$/i.test(host)||options.port&&host.split(':')[1]!==String(options.port))return end(403,'Local requests only');
   if(req.headers.origin&&req.headers.origin!==`http://${host}`)return end(403,'Cross-origin request rejected');

   const url=new URL(req.url,`http://${host}`),decoded=decodeURIComponent(url.pathname);
   if(decoded.includes('\0')||decoded.includes(':'))return end(400,'Invalid path');
   if(decoded.startsWith('/api/')){
    const json=(status,value)=>end(status,JSON.stringify(value),{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    if(!store)return json(404,{error:'Disk storage is not enabled.'});
    if(req.headers['sec-fetch-site']==='cross-site')return json(403,{error:'Same-origin requests only.'});
    if(decoded==='/api/health'&&req.method==='GET')return json(200,{app:'SlotForgeTrackBuilder',version:require('./integration.js').VERSION,instanceId,buildId:options.buildId||null});
    if(decoded==='/api/session'&&req.method==='GET'){if(req.headers['x-slotforge-client']!=='1')return json(403,{error:'App client header required.'});return json(200,{storage:'disk',version:require('./integration.js').VERSION,instanceId,dataDirectory:store.directory,token});}
    if(req.headers['x-slotforge-token']!==token)return json(403,{error:'Open the app through its local launcher.'});
    const write=!['GET','HEAD'].includes(req.method);if(write&&(req.headers.origin!==`http://${host}`||!/^application\/json(?:;|$)/i.test(req.headers['content-type']||'')))return json(403,{error:'Same-origin JSON requests only.'});
    try{
     let body;if(write){const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>require('./disk-store.cjs').MAX)throw Object.assign(Error('Import exceeds 50 MiB.'),{status:413});chunks.push(chunk);}try{body=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw Object.assign(Error('Invalid JSON.'),{status:400});}}
     if(decoded==='/api/current'&&req.method==='GET')return json(200,await store.current());
     if(decoded==='/api/current'&&req.method==='PUT')return json(200,await store.putCurrent(body.data,body.expectedRevision,body.librarySource));
     if(decoded==='/api/packs'&&req.method==='GET')return json(200,await store.packs());
     if(decoded==='/api/packs'&&req.method==='PUT')return json(200,await store.putPacks(body.data,body.expectedRevision));
     if(decoded==='/api/designs'&&req.method==='GET')return json(200,await store.list());
     if(decoded==='/api/designs'&&req.method==='PUT')return json(200,await store.putDesign(body.data,body.expectedRevision));
     if(decoded.startsWith('/api/designs/')&&req.method==='GET')return json(200,await store.get(decoded.slice(13)));
     if(decoded.startsWith('/api/designs/')&&req.method==='DELETE')return json(200,await store.remove(decoded.slice(13),body.expectedRevision));
     if(decoded==='/api/quit'&&req.method==='POST'&&options.onQuit){const result=json(200,{stopped:true});setImmediate(()=>options.onQuit());return result;}
     if(decoded==='/api/export-workspace'&&req.method==='GET')return json(200,await store.exportBundle());
     if(decoded==='/api/import-workspace'&&req.method==='POST')return json(200,await store.importBundle(body));
     return json(404,{error:'Unknown app endpoint.'});
    }catch(e){return json(e.status||400,{error:e.message});}
   }
   if(!['GET','HEAD'].includes(req.method))return end(405,'Read-only files',{'Allow':'GET, HEAD'});
   const file=path.resolve(root,'.'+decoded);
   if(!permitted(file))return end(403);
   const actual=decoded.endsWith('/')?path.join(file,'index.html'):file;
   const type=types[path.extname(actual).toLowerCase()];if(!type)return end(404,'Not found');
   // Resolve links so junctions and symlinks cannot escape the workspace.
   let resolved;try{resolved=await fs.promises.realpath(actual);}catch{return end(404,'Not found');}
   if(!permitted(resolved))return end(403);
   let data;try{data=await fs.promises.readFile(resolved);}catch{return end(404,'Not found');}
   res.writeHead(200,{'Content-Type':type,'Content-Length':data.length,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Cross-Origin-Resource-Policy':'same-origin'});
   res.end(req.method==='HEAD'?undefined:data);
  }catch{return end(400,'Bad request');}
 };
}
if(require.main===module){
 const port=Number(process.env.SLOTFORGE_PORT||8173);
 if(!Number.isInteger(port)||port<1||port>65535)throw Error('SLOTFORGE_PORT must be an integer from 1 to 65535');
 (async()=>{const {DiskStore,home}=require('./disk-store.cjs'),store=await new DiskStore(process.env.SLOTFORGE_DATA_DIR||path.join(home(),'data')).init();const options={store,port},server=http.createServer(createHandler(path.resolve(__dirname,'..'),options));options.onQuit=async()=>{await store.queue;server.close();server.closeIdleConnections();};server.on('error',e=>{console.error(e.message);process.exitCode=1;});server.listen(port,'127.0.0.1',()=>console.log(`SlotForge Track Builder: http://127.0.0.1:${port}/app/\nUser data: ${store.directory}`));})().catch(e=>{console.error(e.message);process.exitCode=1;});
}
module.exports={createHandler};
