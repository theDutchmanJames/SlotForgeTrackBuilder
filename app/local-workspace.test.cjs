const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
function client(handler){
 const calls=[],context={location:{protocol:'http:'},structuredClone,AbortSignal,fetch:async(url,options={})=>{
  const call={endpoint:url.slice(5),method:options.method||'GET',body:options.body?JSON.parse(options.body):undefined};calls.push(call);
  const result=await handler(call);return{ok:!result.status||result.status<400,status:result.status||200,text:async()=>JSON.stringify(result.data),json:async()=>result.data};
 }};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'local-workspace.js'),'utf8'),context);return{api:context.LocalWorkspace,calls};
}
function service(override=()=>undefined){return async call=>{
 const result=await override(call);if(result)return result;
 return{data:call.endpoint==='session'?{storage:'disk',token:'test',dataDirectory:'isolated'}:call.endpoint==='designs'&&call.method==='GET'?[{id:'design',revision:'newer',layout:{}}]:call.endpoint.startsWith('designs/')?{id:'design',revision:'newer',layout:{}}:null};
};}
test('Listing and previewing library records cannot replace an editor revision baseline',async()=>{
 const {api,calls}=client(service(call=>call.method==='PUT'&&call.endpoint==='designs'?{status:409,data:{error:'Stale design'}}:undefined));await api.init();await api.list();await api.get('design');
 await assert.rejects(api.putDesign({title:'My unsaved edits'},'opened-revision'),/Stale design/);
 assert.equal(calls.at(-1).body.expectedRevision,'opened-revision');
 await api.remove('design','delete-dialog-revision');assert.equal(calls.at(-1).body.expectedRevision,'delete-dialog-revision');
});
test('Queued saves snapshot data and source at invocation, including when another save is pending',async()=>{
 let release;const gate=new Promise(resolve=>release=resolve),{api,calls}=client(service(async call=>{
  if(call.endpoint==='current'&&call.method==='PUT'){if(call.body.data.title==='First')await gate;return{data:{revision:call.body.data.title,data:call.body.data,librarySource:call.body.librarySource}};}
 }));await api.init();const first=api.putCurrent({title:'First'}),data={title:'Second'},source={id:'design',revision:'opened'};
 const second=api.putCurrent(data,source);data.title='Mutated later';source.revision='Mutated later';assert.equal(api.unsaved,true);release();await Promise.all([first,second]);
 const puts=calls.filter(c=>c.endpoint==='current'&&c.method==='PUT');assert.equal(puts[1].body.data.title,'Second');assert.equal(puts[1].body.expectedRevision,'First');assert.equal(puts[1].body.librarySource.revision,'opened');assert.equal(api.currentSource.revision,'opened');assert.equal(api.unsaved,false);
});
test('A failed autosave prevents shutdown; a successful retry clears the unsaved state',async()=>{
 let fail=true;const {api,calls}=client(service(call=>call.endpoint==='current'&&call.method==='PUT'?fail?{status:500,data:{error:'Disk full'}}:{data:{revision:'saved',data:call.body.data}}:undefined));await api.init();
 await assert.rejects(api.putCurrent({title:'Keep my work'}),/Disk full/);await api.flush();assert.equal(api.unsaved,true);await assert.rejects(api.quit(),/kept running/);assert.equal(calls.some(c=>c.endpoint==='quit'),false);
 fail=false;await api.putCurrent({title:'Keep my work'});assert.equal(api.unsaved,false);await api.quit();assert.equal(calls.at(-1).endpoint,'quit');
});
test('A conflict remains blocked until reload and cannot be cleared by a blind retry',async()=>{
 const {api,calls}=client(service(call=>call.endpoint==='packs'&&call.method==='PUT'?{status:409,data:{error:'Changed in another window'}}:undefined));await api.init();await assert.rejects(api.putPacks({packs:[]}),/Changed/);const count=calls.length;await assert.rejects(api.putPacks({packs:[]}),/Reload/);assert.equal(calls.length,count);assert.equal(api.unsaved,true);await assert.rejects(api.quit(),/kept running/);
});
test('Failed startup does not fall back to an empty writable browser workspace',async()=>{
 const {api}=client(async()=>({status:500,data:{error:'Unavailable'}}));await api.init();assert.equal(api.mode,'unavailable');assert.equal(api.disk,true);await assert.rejects(api.putCurrent({title:'Example'}),/unavailable/i);assert.equal(api.unsaved,true);
});
test('Shutdown also drains saves appended while an earlier save is still pending',async()=>{
 let releaseFirst,releaseSecond;const firstGate=new Promise(r=>releaseFirst=r),secondGate=new Promise(r=>releaseSecond=r),{api,calls}=client(service(async call=>{
  if(call.endpoint==='current'&&call.method==='PUT'){await(call.body.data.title==='First'?firstGate:secondGate);return{data:{revision:call.body.data.title,data:call.body.data}};}
 }));await api.init();const first=api.putCurrent({title:'First'}),quit=api.quit(),second=api.putCurrent({title:'Second'});releaseFirst();await first;await new Promise(resolve=>setImmediate(resolve));assert.equal(calls.some(c=>c.endpoint==='quit'),false);releaseSecond();await second;await quit;assert.equal(calls.at(-1).endpoint,'quit');assert.equal(api.current.title,'Second');
});
