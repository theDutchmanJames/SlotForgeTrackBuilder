const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),F=require('./core.js'),I=require('./integration.js'),RA=require('./reference-artwork.js');
const code=fs.readFileSync(path.join(__dirname,'app.js'),'utf8'),place=code.slice(code.indexOf('async function placeReference('),code.indexOf('function modify(')),image='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==',plan={type:'straight',lengthMm:360,widthMm:200};
function harness(source,{editing=false,load=async()=>({})}={}){
 const fields=new Map(),added=[],messages=[],placed=F.pose(source),items=editing?[placed]:[],stats={checkpoints:0,refreshes:0,captures:0};
 const field=id=>{if(!fields.has(id))fields.set(id,{value:id==='reference-width'?350:200,disabled:false,open:true,textContent:'',close(){this.open=false;}});return fields.get(id);};
 const context={F,I,RA,referenceRequests:RA.requestGuard(),referenceChoice:source,referenceEditingId:editing?placed.id:null,integrationState:{designId:'same-design'},$:field,referenceFormPlan:()=>plan,defs:editing?{[source.id]:source}:{},items,referenceImageAdapter:{load,capture:()=>{stats.captures++;return image;}},add:d=>added.push(d),checkpoint(){stats.checkpoints++;},stop(){},refresh(){stats.refreshes++;},say:m=>messages.push(m)};
 vm.runInNewContext(place,context);return{context,added,messages,field,placed,stats};
}
const source=()=>({id:'source:straight',name:'Reference straight',family:'example',pack:'Example',asset:'local.svg'});
test('Closing a reference dialog while its image loads does not place or autosave the piece',async()=>{
 let release;const gate=new Promise(r=>release=r),h=harness(source(),{load:()=>gate}),pending=h.context.placeReference();h.field('reference-dialog').close();release({});await pending;assert.equal(h.added.length,0);assert.equal(h.stats.checkpoints,0);assert.equal(h.stats.refreshes,0);assert.equal(h.stats.captures,0);assert.equal(h.messages.length,0);
});
test('A cancelled request cannot close or enable controls belonging to a newer editor',async()=>{
 let release;const gate=new Promise(r=>release=r),h=harness(source(),{load:()=>gate}),pending=h.context.placeReference();h.context.referenceRequests.cancel();h.field('reference-dialog').open=true;h.context.referenceRequests.begin();h.field('reference-place').disabled=true;release({});await pending;assert.equal(h.field('reference-dialog').open,true);assert.equal(h.field('reference-place').disabled,true);assert.equal(h.added.length,0);assert.equal(h.messages.length,0);
});
test('Valid imported references without artwork can be edited and retain a visible fallback',async()=>{
 const blank=F.validateDefinition({id:'custom:blank',name:'Blank reference',sku:'blank',family:'example',mirror:false,color:'#2f5d42',parameters:{type:'reference',lengthMm:350,widthMm:200}}),h=harness(blank,{editing:true,load:()=>assert.fail('No image to load')});h.context.defs['custom:permissive']=F.validateDefinition({...blank,id:'custom:permissive',mirror:true,parameters:{type:'reference',...F.planningSize(plan),planning:plan}});await h.context.placeReference();assert.notEqual(h.placed.definitionId,blank.id);const result=h.context.defs[h.placed.definitionId];assert.deepEqual(result.parameters.planning,F.validatePlanning(plan));assert.equal(result.referenceImage,undefined);assert.equal(result.mirror,false);assert.equal(result.sku,'blank');assert.equal(result.color,blank.color);assert.match(F.drawBody(result),/fill="#2f5d42"/);assert.equal(h.stats.checkpoints,1);assert.equal(h.stats.refreshes,1);assert.equal(h.field('reference-error').textContent,'');
});
test('Decode failures from cancelled requests stay quiet and cannot mutate a newer layout',async()=>{
 let reject;const gate=new Promise((_,r)=>reject=r),h=harness(source(),{load:()=>gate}),pending=h.context.placeReference();h.context.referenceRequests.cancel();h.context.integrationState.designId='different-design';reject(Error('Late decode failure'));await pending;assert.equal(h.added.length,0);assert.equal(h.messages.length,0);
});
test('An active decode failure reports an error and re-enables the current apply button',async()=>{
 const h=harness(source(),{load:async()=>{throw Error('Decode failed');}});await h.context.placeReference();assert.match(h.field('reference-error').textContent,/Decode failed/);assert.equal(h.field('reference-place').disabled,false);assert.equal(h.added.length,0);
});
