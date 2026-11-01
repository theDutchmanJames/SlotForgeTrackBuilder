const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),X=require('./track-exports.js');
const fixture=()=>JSON.parse(fs.readFileSync(path.join(__dirname,'../integration/slotforge-timing/v2-examples/closed-with-reference.slotforge.json'),'utf8'));
test('Saved exports use their own geometry, inventory, profile and timing without reading or changing the builder',async()=>{
 const saved=fixture(),before=structuredClone(saved);saved.title='Saved circuit';before.title=saved.title;
 const result=await X.resolveSource('saved:chosen',()=>{throw Error('Builder must not be read');},async id=>{assert.equal(id,'chosen');return{layout:saved};});
 assert.equal(result.title,'Saved circuit');assert.equal(result.pieces.length,saved.pieces.length);assert.equal(result.network.closed,true);assert.deepEqual(result.layout.profile,saved.profile);assert.deepEqual(result.layout.timing,saved.timing);assert.deepEqual(result.layout.track.lanes,saved.track.lanes);assert.deepEqual(saved,before);
 assert.equal(result.inventory.reduce((n,r)=>n+r.count,0),saved.pieces.length);assert.equal(result.summary.references,1);assert.ok(result.summary.length>0);assert.match(X.csv(result),/Reference/i);
 result.pieces[0].x+=100;assert.deepEqual(saved,before);
});
test('Current and saved sources remain distinct, including calculated lengths, report parts and filenames',async()=>{
 const saved=fixture(),current=fixture();current.title='Unsaved / current';current.pieces=current.pieces.filter(p=>current.definitions.find(d=>d.id===p.definitionId).parameters.type==='straight').slice(0,1);
 const before=structuredClone(current),a=await X.resolveSource('current',()=>current,()=>{throw Error('Library must not be read');}),b=await X.resolveSource('saved:one',()=>current,async()=>({layout:saved}));
 assert.equal(a.pieces.length,1);assert.equal(a.inventory.length,1);assert.equal(a.network.closed,false);assert.notEqual(a.summary.length,b.summary.length);assert.notEqual(X.csv(a),X.csv(b));assert.equal(X.filename(a.title),'Unsaved - current');assert.equal(b.title,saved.title);assert.deepEqual(current,before);
});
test('Unavailable, invalid or incompatible saved sources never fall back to the current track',async()=>{
 const current=()=>{throw Error('Unexpected fallback to current');};
 await assert.rejects(X.resolveSource('saved:missing',current,async()=>null),/unavailable/);
 await assert.rejects(X.resolveSource('bad-choice',current,async()=>null),/Choose a track/);
 await assert.rejects(X.resolveSource('saved:broken',current,async()=>{throw Error('Storage unavailable');}),/Storage unavailable/);
 for(const change of [{units:'inches'},{integration:{contractVersion:'99.0.0'}}])await assert.rejects(X.resolveSource('saved:bad',current,async()=>({layout:{...fixture(),...change}})));
});
test('Empty tracks have no fabricated lengths or inventory and reference rows have unknown lengths',()=>{
 const raw=fixture();raw.pieces=raw.pieces.filter(p=>raw.definitions.find(d=>d.id===p.definitionId).parameters.type==='reference');const reference=X.build(raw);assert.equal(reference.summary.length,0);assert.equal(reference.summary.roads,0);assert.equal(reference.summary.references,1);assert.match(X.csv(reference),/"reference","",/);
 raw.pieces=[];const empty=X.build(raw);assert.equal(empty.inventory.length,0);assert.equal(empty.summary.length,0);assert.equal(empty.network.closed,false);
});

test('Invalid FreeForm inventories keep quantities but do not claim zero-length track',()=>{
 const F=require('./core.js'),FF=F.FreeForm,s=F.Routed.settings({laneCount:1,constructionMode:'table'});
 let m=FF.empty();for(const p of[[300,300],[1400,1300],[300,1300],[1400,300]])m=FF.append(m,p);m=FF.close(m);
 const d=FF.definition(m,s),raw={format:'slotforge.layout',version:1,title:'Crossed draft',definitions:[d],pieces:[F.pose(d)]},model=X.build(raw);
 assert.equal(model.summary.invalidFreeform,true);assert.equal(model.inventory[0].count,1);assert.equal(X.pieceLength(model.inventory[0].d),null);assert.match(X.csv(model),/"freeform","",/);
 const valid=FF.definition(FF.oval(s),s);assert.ok(X.pieceLength(valid)>0);
});
