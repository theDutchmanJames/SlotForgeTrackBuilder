const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const I=require('../../app/integration.js');
const root=path.join(__dirname,'v1-fixtures'),expected=JSON.parse(fs.readFileSync(path.join(root,'expected-results.json')));let passed=0;
for(const[name,want]of Object.entries(expected.files)){
 const raw=JSON.parse(fs.readFileSync(path.join(root,name+'.slotforge.json')));
 if(want.reject){assert.throws(()=>I.importLayout(raw));passed++;continue;}
 const imported=I.importLayout(raw),out=I.prepare(raw,imported.state);
 assert.equal(out.preparedGeometry.closed,want.closed,name);
 const lengths=out.track.lanes.map(l=>l.lengthMm);assert.equal(lengths.length,want.lengthsMm.length);lengths.forEach((n,i)=>assert.ok(Math.abs(n-want.lengthsMm[i])<1e-6,name));
 if(want.newDesignIdOnImport){assert.ok(out.design.id);assert.equal(out.timing.startFinish,null);}
 else{assert.equal(out.design.id,want.designId);assert.equal(out.design.revision,want.revision);assert.equal(out.timing.routeMappingRevision,want.routeMappingRevision);assert.equal(out.timing.requiresLaneRemap,want.requiresLaneRemap);assert.deepEqual(out.track.lanes.map(l=>l.id),want.routeIds);assert.deepEqual(out.timing.startFinishOffsets,want.timingOffsets);assert.deepEqual(out.compatibility.issues.map(i=>i.code),want.compatibilityCodes);}
 assert.deepEqual(I.prepare(JSON.parse(JSON.stringify(out))),out,name+' round trip');passed++;
}
console.log(passed+' integration fixtures verified, including round trips and expected rejection');
