const test=require('node:test'),assert=require('node:assert/strict'),C=require('./custom-packs.js'),F=require('./core.js'),I=require('./integration.js');
const base={innerRadiusMm:200,widthMm:200,angleDeg:45,laneCount:2,laneSpacingMm:100};
test('R1–R8 family shares touching road edges, equal angular spans and uniform slot spacing',()=>{
 let previous;for(let n=1;n<=8;n++){const p=C.curveParameters(base,n),g=F.G.derive(p);assert.equal(p.innerRadiusMm,200*n);assert.equal(p.angleDeg,45);if(previous){assert.equal(previous.innerRadiusMm+previous.widthMm,p.innerRadiusMm);assert.equal(p.innerRadiusMm+50-(previous.innerRadiusMm+150),100);}assert.equal(g.lanePaths[0].segments[0].radiusMm,p.innerRadiusMm+50);previous=p;}
 assert.throws(()=>C.curveParameters(base,0));assert.throws(()=>C.curveParameters(base,1.5));assert.throws(()=>C.curveParameters({...base,widthMm:50}));assert.throws(()=>C.curveParameters({...base,innerRadiusMm:9900},8));
});
test('Pack family settings survive local and portable round trips without altering saved pieces',()=>{
 const library=C.empty(),pack=library.packs[0];pack.curveFamily=base;pack.pieces=[F.validateDefinition({id:'custom:r2',name:'R2',parameters:C.curveParameters(base,2)})];const before=structuredClone(pack.pieces);
 const restored=C.read(C.serialize(library));assert.deepEqual(restored.packs[0].curveFamily,{type:'curve',...base});const imported=C.importPack(C.exportPack(pack),C.empty());assert.deepEqual(imported.curveFamily,restored.packs[0].curveFamily);pack.curveFamily={...base,widthMm:240};assert.deepEqual(pack.pieces,before);
 assert.throws(()=>C.importPack({...C.exportPack(pack),curveFamily:{innerRadiusMm:-1}},C.empty()));
});
const ref=()=>F.validateDefinition({id:'reference:test',name:'Reference control unit',sku:'Example',parameters:{type:'reference',lengthMm:350,widthMm:220},referenceImage:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg=='});
test('Reference pieces preserve artwork, transformations and unknown lengths across layout round trips',()=>{
 const d=ref(),p={...F.pose(d,110,230),angle:37,flip:true},raw={format:'slotforge.layout',version:1,definitions:[d],pieces:[p]},out=I.prepare(raw),again=I.prepare(JSON.parse(JSON.stringify(out)));
 assert.deepEqual(again,out);assert.equal(out.integration.contractVersion,'1.0.0-draft.2');assert.equal(d.status,'reference-only');assert.deepEqual(d.geometry.connectors,[]);assert.deepEqual(d.geometry.lanePaths,[]);assert.equal(d.geometry.centrelineLengthMm,0);assert.equal(out.track.laneCount,null);assert.ok(out.compatibility.issues.some(x=>x.code==='reference-artwork'));assert.match(I.picture(out).svg,/<image href="data:image\/png/);assert.match(I.picture(out).svg,/REFERENCE/);assert.equal(F.ports(p,{[d.id]:d}).length,0);assert.ok(F.bounds([p],{[d.id]:d}).every(Number.isFinite));
 assert.equal(F.inSelectionBox(p,d,[0,0],[1000,1000]),true);
});
test('Reference placement cannot supply missing connectors or change existing lane identities',()=>{
 const fs=require('node:fs'),raw=JSON.parse(fs.readFileSync(require('node:path').join(__dirname,'../integration/slotforge-timing/v1-fixtures/01-two-lane.slotforge.json'),'utf8'));
 const before=I.prepare(raw),d=ref();raw.definitions.push(d);raw.pieces.push(F.pose(d));const after=I.prepare(raw);assert.deepEqual(after.track.lanes,before.track.lanes);assert.equal(after.preparedGeometry.closed,true);
 raw.pieces=raw.pieces.filter(p=>p.id!==before.pieces[0].id);assert.equal(I.prepare(raw).preparedGeometry.closed,false);
});
test('Reference imports reject remote or executable artwork and preserve conflicting images independently',()=>{
 const d=ref();for(const referenceImage of ['https://example.com/x.png','data:image/svg+xml;base64,PHN2Zz4=',{},'data:image/png;base64,iVBORw0KGgo" onload="alert(1)'])assert.throws(()=>F.validateDefinition({...d,referenceImage}));assert.throws(()=>F.validateDefinition({...d,parameters:{...d.parameters,lengthMm:Infinity}}));
 const other=F.validateDefinition({...d,referenceImage:undefined}),merged=F.mergeDefinitions({[d.id]:d},[F.pose(d)],{[d.id]:other});assert.notEqual(merged.pieces[0].definitionId,d.id);
 const legacy=I.prepare({format:'slotforge.layout',version:1,integration:{contractVersion:'1.0.0-draft.1'},definitions:[],pieces:[]});assert.equal(legacy.integration.contractVersion,'1.0.0-draft.2');
});
