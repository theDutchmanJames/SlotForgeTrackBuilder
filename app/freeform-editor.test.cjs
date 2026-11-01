const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('Rejected FreeForm edits leave Undo and Redo histories unchanged',()=>{
 const source=fs.readFileSync(require.resolve('./freeform-editor.js'),'utf8'),fn=source.slice(source.indexOf(' function act('),source.indexOf(' function refs('));
 const state={value:1,history:['older'],future:['redo'],message:null};
 const context={state,snapshot:()=>String(state.value),restore:s=>{state.value=Number(s);},changed:s=>{state.history.push(s);state.future=[];},$:()=>({textContent:''}),fill:()=>{},render:()=>{if(state.value===2)throw Error('Invalid spacing');},renderTools:()=>{},error:e=>{state.message=e.message;}};
 vm.createContext(context);vm.runInContext(fn+';act(()=>state.value=2);',context);assert.equal(state.value,1);assert.deepEqual(state.history,['older']);assert.deepEqual(state.future,['redo']);assert.equal(state.message,'Invalid spacing');
});

test('Returning to FreeForm follows changed builder tracks only when the draft is clean',()=>{
 const source=fs.readFileSync(require.resolve('./freeform-editor.js'),'utf8'),fn=source.slice(source.indexOf(' function enter('),source.indexOf(' function launch('));
 for(const changed of[false,true])for(const dirty of[false,true]){
  const note={},opened=[],context={editorActive:true,baseKey:'original',cleanSnapshot:'clean',builderKey:()=>changed?'new':'original',documentSnapshot:()=>dirty?'edited':'clean',$:()=>note,updateView:()=>{},render:()=>{},h:{get:()=>({items:[{id:'new',definitionId:'d'}],defs:{d:{parameters:{type:'freeform'}}}}),message:()=>{}},FF:{TYPE:'freeform'},open:p=>opened.push(p),location:{}};
  vm.createContext(context);vm.runInContext(fn+';enter();',context);
  assert.equal(opened.length,changed&&!dirty?1:0);assert.equal(note.hidden,!(changed&&dirty));
  if(changed&&!dirty)assert.equal(opened[0].id,'new');
  if(changed&&dirty)assert.match(note.textContent,/unsaved FreeForm draft is kept/);
 }
});

test('Late library lookup cannot overwrite a newer Save dialog or a closed one',async()=>{
 const source=fs.readFileSync(require.resolve('./app.js'),'utf8'),fn=source.slice(source.indexOf('async function openDesignSave('),source.indexOf('async function saveDesign('));
 const elements=new Map(),get=id=>{if(!elements.has(id))elements.set(id,{value:'',textContent:'',open:false,reset(){},showModal(){this.open=true;}});return elements.get(id);},pending=[];
 const context={designSaveGeneration:0,stop:()=>{},$:get,title:'Track',DL:{list:()=>new Promise((resolve,reject)=>pending.push({resolve,reject}))},integrationState:{designId:'track'},librarySource:null,layout:()=>({design:{revision:'rev'}})};
 vm.createContext(context);vm.runInContext(fn,context);
 const old=context.openDesignSave();get('save-design-dialog').open=false;const latest=context.openDesignSave();
 pending[1].resolve([]);await latest;const label=get('design-save-submit').textContent;assert.equal(label,'Save design');
 pending[0].reject(Error('Old request failed'));await old;assert.equal(get('design-save-error').textContent,'');assert.equal(get('design-save-submit').textContent,label);
 const closed=context.openDesignSave();get('save-design-dialog').open=false;pending[2].resolve([]);await closed;assert.equal(get('design-save-submit').disabled,true);
});
