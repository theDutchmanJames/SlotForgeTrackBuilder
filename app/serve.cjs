// Optional read-only local preview server. Never binds to the LAN.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.ico':'image/x-icon','.svg':'image/svg+xml','.png':'image/png','.zip':'application/zip','.txt':'text/plain; charset=utf-8'};
function createHandler(directory){
 const root=fs.realpathSync(directory);
 const permitted=file=>{const relative=path.relative(root,file);return relative!=='..'&&!relative.startsWith('..'+path.sep)&&!path.isAbsolute(relative)&&!relative.split(path.sep).some(p=>p.startsWith('.'));};
 return async(req,res)=>{
  const end=(status,message='',headers={})=>res.writeHead(status,headers).end(req.method==='HEAD'?'':message);
  try{
   const host=req.headers.host||'';
   if(!/^(127\.0\.0\.1|localhost)(:\d+)?$/i.test(host))return end(403,'Local requests only');
   if(req.headers.origin&&req.headers.origin!==`http://${host}`)return end(403,'Cross-origin request rejected');
   if(!['GET','HEAD'].includes(req.method))return end(405,'Read-only server',{'Allow':'GET, HEAD'});
   const url=new URL(req.url,`http://${host}`),decoded=decodeURIComponent(url.pathname);
   if(decoded.includes('\0')||decoded.includes(':'))return end(400,'Invalid path');
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
 http.createServer(createHandler(path.resolve(__dirname,'..'))).listen(port,'127.0.0.1',()=>console.log(`SlotForge Track Builder: http://127.0.0.1:${port}/app/`));
}
module.exports={createHandler};
