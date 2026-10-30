const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const G=require('./geometry.cjs');
const root=path.resolve(__dirname,'../carrera-evolution-digital');
const pack=JSON.parse(fs.readFileSync(path.join(root,'pack.json')));
const checks=[];
function check(name,fn){fn();checks.push({name,result:'passed'});}
function near(a,b){assert.ok(Math.abs(a-b)<1e-5,`${a} != ${b}`);}
const base={type:'curve',innerRadiusMm:200,widthMm:198,angleDeg:60,laneCount:2,laneSpacingMm:100};
check('Lane spacing is independent of road width',()=>{
 const g=G.derive(base);near(g.lanePaths[0].segments[0].radiusMm,249);near(g.lanePaths[1].segments[0].radiusMm,349);
 const h=G.derive({...base,laneSpacingMm:90});near(h.lanePaths[0].segments[0].radiusMm,254);assert.equal(h.outlineSvgPath,g.outlineSvgPath);
 near(g.lanePaths[1].lengthMm-g.lanePaths[0].lengthMm,100*Math.PI/3);
});
check('Six 60 degree arcs reproduce full-circle lane lengths',()=>{
 const g=G.derive(base);for(const lane of g.lanePaths)near(6*lane.lengthMm,2*Math.PI*lane.segments[0].radiusMm);
});
check('Connector slot positions match paths',()=>{
 const g=G.derive(base);for(let i=0;i<2;i++){assert.deepEqual(g.connectors[0].lanes[i].position,g.lanePaths[i].start);assert.deepEqual(g.connectors[1].lanes[i].position,g.lanePaths[i].end);}
});
check('Nested curves share a boundary on the nominal grid',()=>{
 const inner=G.resolve({...base,widthMm:200}),outer=G.resolve({...base,widthMm:200,innerRadiusMm:400});near(inner.innerRadiusMm+inner.widthMm,outer.innerRadiusMm);
});
check('Invalid and ambiguous dimensions rejected',()=>{
 for(const patch of [{widthMm:90},{laneSpacingMm:0},{innerRadiusMm:NaN},{angleDeg:200},{laneCount:0},{laneOffsetsMm:[49,149]}])assert.throws(()=>G.derive({...base,...patch}));
 assert.throws(()=>G.derive({type:'straight',lengthMm:10,widthMm:100,laneOffsetsMm:[50,50]}));
});
check('Explicit uneven offsets supported',()=>{const g=G.derive({type:'straight',lengthMm:345,widthMm:300,laneOffsetsMm:[40,130,260]});assert.equal(g.lanePaths.length,3);near(g.lanePaths[2].start[1],260);});
check('Borders add footprint but no lane distance',()=>{const g=G.derive({type:'straight-border',lengthMm:345,widthMm:100,side:'outer'});assert.equal(g.lanePaths.length,0);assert.equal(g.centrelineLengthMm,0);});
check('Catalogue references, capability flags and assets are valid',()=>{
 const ids=new Set(pack.pieces.map(p=>p.id));assert.equal(ids.size,pack.pieces.length);
 for(const p of pack.pieces){assert.ok(fs.existsSync(path.join(root,p.asset)));assert.equal(p.capabilities.exactFit,false);if(!p.geometry){assert.equal(p.capabilities.nominalSnap,false);assert.equal(p.capabilities.nominalLaneLength,false);}else G.derive(p.geometry.parameters);
 if(p.mirror.mode==='counterpart'){assert.ok(ids.has(p.mirror.pieceId));assert.equal(pack.pieces.find(q=>q.id===p.mirror.pieceId).mirror.pieceId,p.id);}}
 for(const p of pack.products)for(const c of p.contents){if(c.pieceId)assert.ok(ids.has(c.pieceId));assert.ok(c.quantity===null||(Number.isInteger(c.quantity)&&c.quantity>0));}
 const coverage=JSON.parse(fs.readFileSync(path.join(root,'coverage.json')));assert.equal(coverage.missing.length,0);
});
fs.writeFileSync(path.join(root,'validation.json'),JSON.stringify({date:'2026-10-29',checks,limits:'Checks validate nominal calculations and catalogue structure, not real-world mould dimensions.'},null,2));
console.log(`${checks.length} checks passed`);
