const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),F=require('./core.js'),I=require('./integration.js'),D=require('./design-library.js'),X=require('./track-exports.js');
const guide=()=>({x:-300,y:250,lengthMm:3000,widthMm:1500,locked:false});
const fixture=()=>JSON.parse(fs.readFileSync(path.join(__dirname,'../integration/slotforge-timing/v2-examples/closed-with-reference.slotforge.json'),'utf8'));
test('Space guide dimensions and positions are validated without changing the input',()=>{
 const raw=guide(),copy=F.validateSpaceGuide(raw);assert.deepEqual(copy,raw);assert.notEqual(copy,raw);assert.equal(F.validateSpaceGuide(undefined),null);
 for(const change of [{lengthMm:0},{widthMm:50001},{lengthMm:'3000'},{widthMm:NaN},{x:Infinity},{y:1000001},{locked:'false'}])assert.throws(()=>F.validateSpaceGuide({...raw,...change}));
 for(const raw of [[],false,'guide'])assert.throws(()=>F.validateSpaceGuide(raw));
});
test('Move and resize guide preserve its origin/dimensions as appropriate and clamp limits',()=>{
 const g=guide(),moved=F.moveSpaceGuide(g,100,-400),resized=F.resizeSpaceGuide(g,500,-200);
 assert.deepEqual(moved,{...g,x:-200,y:-150});assert.deepEqual(resized,{...g,lengthMm:3500,widthMm:1300});assert.deepEqual(g,guide());
 assert.equal(F.resizeSpaceGuide(g,-4000,60000).lengthMm,10);assert.equal(F.resizeSpaceGuide(g,-4000,60000).widthMm,50000);assert.equal(F.moveSpaceGuide(g,2000000,0).x,1000000);
});
test('Proportional guide scaling keeps aspect ratio and obeys dimension limits',()=>{
 const g=guide(),scaled=F.resizeSpaceGuide(g,1500,0,true);assert.equal(scaled.lengthMm,4500);assert.equal(scaled.widthMm,2250);
 const small=F.resizeSpaceGuide(g,-9999,0,true),large=F.resizeSpaceGuide(g,999999,0,true);assert.equal(small.widthMm,10);assert.equal(small.lengthMm,20);assert.equal(large.lengthMm,50000);assert.equal(large.widthMm,25000);
});
test('A locked guide cannot be moved or resized through either helper',()=>{
 const g={...guide(),locked:true};assert.deepEqual(F.moveSpaceGuide(g,1000,-200),g);assert.deepEqual(F.resizeSpaceGuide(g,1000,200),g);assert.deepEqual(F.resizeSpaceGuide(g,1000,200,true),g);
});
test('Guide round trips through layout, library and exports without affecting timing or track calculations',async()=>{
 const raw=fixture(),original=I.prepare(raw);raw.workspace={spaceGuide:{...guide(),locked:true}};
 const prepared=I.prepare(raw),opened=I.importLayout(prepared),saved=D.prepare(prepared,raw.title),exported=await X.resolveSource('saved:guide',()=>{throw Error('Not current');},async()=>({layout:saved}));
 for(const value of [prepared,opened,saved,exported.layout])assert.deepEqual(value.workspace,raw.workspace);
 assert.deepEqual(prepared.design,original.design);assert.deepEqual(prepared.timing,original.timing);assert.deepEqual(prepared.track,original.track);assert.deepEqual(prepared.preparedGeometry,original.preparedGeometry);assert.deepEqual(prepared.pieces,original.pieces);
 assert.deepEqual(X.build(prepared).summary,X.build(original).summary);assert.equal(X.csv(X.build(prepared)),X.csv(X.build(original)));assert.equal(I.picture(prepared).svg,I.picture(original).svg);
 opened.workspace.spaceGuide.x+=1;assert.deepEqual(saved.workspace,raw.workspace);
});
test('Legacy layouts have no guide; malformed workspace metadata rejects at both integration entry points',()=>{
 const raw=fixture();assert.equal(I.prepare(raw).workspace,undefined);assert.equal(I.importLayout(raw).workspace,undefined);
 for(const workspace of [null,[],false,{spaceGuide:{...guide(),widthMm:-5}},{spaceGuide:{...guide(),locked:0}}]){assert.throws(()=>I.prepare({...raw,workspace}));assert.throws(()=>I.importLayout({...raw,workspace}));}
 const empty={...raw,pieces:[],workspace:{spaceGuide:guide()}};assert.equal(I.prepare(empty).pieces.length,0);assert.deepEqual(I.prepare(empty).workspace,empty.workspace);
});
