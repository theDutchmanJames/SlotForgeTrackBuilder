const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),G=require('./geometry.cjs');
for(const dir of['afx-racing','carrera-go','carrera-hybrid','fleischmann-auto-rallye']){
 const root=path.resolve(__dirname,'..',dir),p=JSON.parse(fs.readFileSync(path.join(root,'pack.json'))),ids=new Set();
 assert.equal(p.units,'mm');assert.ok(p.modelScale);
 for(const d of p.pieces){assert.ok(!ids.has(d.id));ids.add(d.id);assert.ok(fs.existsSync(path.join(root,d.asset)));assert.ok(d.evidence.sources.every(id=>p.sources.some(s=>s.id===id)));if(d.geometry){assert.deepEqual(JSON.parse(JSON.stringify(G.derive(d.geometry.parameters))),d.geometry.derived);assert.equal(d.capabilities.nominalSnap,true);}else assert.equal(d.capabilities.nominalLaneLength,false);if(p.trackSystem==='slotless'){assert.equal(d.geometry,null);assert.equal(d.mirror.mode,'forbidden');}}
 for(const product of p.products)for(const d of product.contents){assert.ok(ids.has(d.pieceId));assert.ok(Number.isInteger(d.quantity)&&d.quantity>0);}
 const result={status:'passed',drawingCount:p.pieces.length,nominalRoadModels:p.pieces.filter(d=>d.geometry).length,referenceDrawings:p.pieces.filter(d=>!d.geometry).length,checks:['Unique piece IDs and existing SVG assets','Evidence references resolve','Re-derived nominal geometry matches stored geometry','Retail contents refer to existing pieces with positive whole quantities','Slotless references supply no slot model or reflection'],regressionCommand:'node --test app/additional-packs.test.cjs',limitations:p.outstanding};
 fs.writeFileSync(path.join(root,'validation.json'),JSON.stringify(result,null,2)+'\n');console.log(dir+': '+result.drawingCount+' drawings, '+result.nominalRoadModels+' road models, validation passed');
}
