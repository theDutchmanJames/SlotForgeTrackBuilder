const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('Rejected FreeForm edits leave Undo and Redo histories unchanged',()=>{
 const source=fs.readFileSync(require.resolve('./freeform-editor.js'),'utf8'),fn=source.slice(source.indexOf(' function act('),source.indexOf(' function refs('));
 const state={value:1,history:['older'],future:['redo'],message:null};
 const context={state,snapshot:()=>String(state.value),restore:s=>{state.value=Number(s);},changed:s=>{state.history.push(s);state.future=[];},$:()=>({textContent:''}),fill:()=>{},render:()=>{if(state.value===2)throw Error('Invalid spacing');},renderTools:()=>{},error:e=>{state.message=e.message;}};
 vm.createContext(context);vm.runInContext(fn+';act(()=>state.value=2);',context);assert.equal(state.value,1);assert.deepEqual(state.history,['older']);assert.deepEqual(state.future,['redo']);assert.equal(state.message,'Invalid spacing');
});
