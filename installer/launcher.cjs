// Copied beside active-app.json by the per-user installer.
const fs=require('node:fs/promises'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto'),{spawn}=require('node:child_process');
function openBrowser(url){const command=process.platform==='win32'?'rundll32.exe':process.platform==='darwin'?'open':'xdg-open',args=process.platform==='win32'?['url.dll,FileProtocolHandler',url]:[url];const child=spawn(command,args,{stdio:'ignore',windowsHide:true});child.on('error',()=>console.log('Open this address in a browser: '+url));child.unref();}
async function launch(home,{port=8173,open=true}={}){
 home=path.resolve(home);const active=JSON.parse(await fs.readFile(path.join(home,'active-app.json'),'utf8')),app=path.resolve(home,active.directory);
 if(!app.startsWith(home+path.sep)||!active.directory.startsWith('app/'))throw Error('Invalid installed app pointer.');
 await fs.access(path.join(app,'.ready.json'));
 const {DiskStore}=require(path.join(app,'app/disk-store.cjs')),{createHandler}=require(path.join(app,'app/serve.cjs')),I=require(path.join(app,'app/integration.js')),store=await new DiskStore(path.join(home,'data')).init(),instanceId=crypto.createHash('sha256').update(store.directory).digest('hex');
 for(let candidate=port;candidate<(port===0?1:port+20);candidate++){
  const options={store,port:candidate,buildId:active.directory},server=http.createServer(createHandler(app,options));options.onQuit=async()=>{await store.queue;server.close();server.closeIdleConnections();};
  try{await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(candidate,'127.0.0.1',resolve);});options.port=server.address().port;const url=`http://127.0.0.1:${options.port}/app/`;console.log(JSON.stringify({url,dataDirectory:store.directory,version:I.VERSION}));if(open)openBrowser(url);return{server,url,reused:false};}
  catch(e){if(e.code!=='EADDRINUSE')throw e;try{const response=await fetch(`http://127.0.0.1:${candidate}/api/health`,{signal:AbortSignal.timeout(800)}),health=await response.json();if(health.app==='SlotForgeTrackBuilder'&&health.instanceId===instanceId&&health.version===I.VERSION&&health.buildId===active.directory){const url=`http://127.0.0.1:${candidate}/app/`;console.log(JSON.stringify({url,reused:true}));if(open)openBrowser(url);return{url,reused:true};}}catch{}}
 }
 throw Error('All local SlotForge ports are busy. Stop an older local app and try again.');
}
if(require.main===module){const args=process.argv.slice(2),value=name=>args.includes(name)?args[args.indexOf(name)+1]:undefined,port=Number(value('--port')||process.env.SLOTFORGE_PORT||8173);if(!Number.isInteger(port)||port<0||port>65515)throw Error('Invalid local port.');launch(value('--home')||__dirname,{port,open:!args.includes('--no-open')&&process.env.SLOTFORGE_NO_OPEN!=='1'}).catch(e=>{console.error(e.message);process.exitCode=1;});}
module.exports={launch};
