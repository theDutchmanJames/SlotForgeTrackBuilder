const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),C=require('./catalogue-folders.js'),D=require('./design-library.js'),I=require('./integration.js');
const fixture=()=>JSON.parse(fs.readFileSync(path.join(__dirname,'../integration/slotforge-timing/v2-examples/closed-with-reference.slotforge.json'),'utf8'));
test('Catalogue has requested folder order, numeric radii and longest-first straights without mutating the source',()=>{
 const pieces=[{id:'r10',name:'R10 curve',parameters:{type:'curve',innerRadiusMm:1000}},{id:'r2',name:'R2 curve',parameters:{type:'curve',innerRadiusMm:200}},{id:'r1',name:'R1 curve',parameters:{type:'curve',innerRadiusMm:100}},{id:'short',name:'A short straight',parameters:{type:'straight',lengthMm:100}},{id:'long',name:'Z long straight',parameters:{type:'straight',lengthMm:400}},{id:'mid',name:'Straight · 200 mm',category:'Straights'}],before=structuredClone(pieces),groups=C.group(pieces);
 assert.deepEqual(groups.map(g=>g.name),['Straights','Corners','Digital pieces','Extras']);assert.deepEqual(groups[1].pieces.map(p=>p.id),['r1','r2','r10']);assert.deepEqual(groups[0].pieces.map(p=>p.id),['long','mid','short']);assert.deepEqual(pieces,before);
});
test('Digital curves/switches, borders, analog crossings and accessories go to their proper folders',()=>{
 for(const [d,want]of [[{name:'R2 curve switch',category:'Digital switches'},'Digital pieces'],[{name:'Measured changer',parameters:{type:'straight',laneChange:'left'}},'Digital pieces'],[{name:'R1 curve outer border',parameters:{type:'curve-border'}},'Extras'],[{name:'Passive crossover',category:'Lane changes and pit lane'},'Extras'],[{name:'Advance turnout',category:'Advance track'},'Digital pieces'],[{name:'Control Unit',category:'Power and timing'},'Digital pieces'],[{name:'Analog powerbase',category:'Timing and power'},'Extras']])assert.equal(C.category(d),want,d.name);
});
test('All six catalogues retain every item exactly once, including reference pieces',()=>{
 const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'catalogue.js'),'utf8'),context);for(const p of context.window.TRACK_PACKS){const grouped=C.group(p.pieces).flatMap(g=>g.pieces);assert.equal(grouped.length,p.pieces.length,p.name);assert.equal(new Set(grouped.map(d=>d.id)).size,p.pieces.length,p.name);}
});
test('Library snapshots retain reference artwork, geometry, profile, timing and design identity independently of edits',()=>{
 const raw=fixture(),before=structuredClone(raw),saved=D.prepare(raw,'  My saved circuit  ');assert.equal(saved.title,'My saved circuit');assert.equal(saved.design.id,raw.design.id);assert.deepEqual(saved.profile,raw.profile);assert.deepEqual(saved.timing,raw.timing);assert.deepEqual(saved.track.lanes,raw.track.lanes);assert.deepEqual(saved.definitions,raw.definitions);assert.deepEqual(raw,before);raw.pieces[0].x+=500;assert.notEqual(saved.pieces[0].x,raw.pieces[0].x);assert.equal(I.importLayout(saved).state.designId,saved.design.id);
});
test('Saving a copy creates a distinct design identity while updates keep identity and change revision',()=>{
 const raw=fixture(),update=D.prepare(raw,'Updated name'),copy=D.prepare(raw,'Copy',true);assert.equal(update.design.id,raw.design.id);assert.notEqual(update.design.revision,raw.design.revision);assert.notEqual(copy.design.id,raw.design.id);assert.deepEqual(copy.track.lanes,raw.track.lanes);assert.deepEqual(D.prepare(update,'Updated name'),update);
});
test('Library rejects invalid names, unsupported units/contracts and missing browser storage',async()=>{
 const raw=fixture();for(const name of ['',null,'x'.repeat(101)])assert.throws(()=>D.prepare(raw,name));assert.throws(()=>D.prepare({...raw,units:'inches'},'Bad'));assert.throws(()=>D.prepare({...raw,integration:{contractVersion:'99'}},'Bad'));await assert.rejects(D.list(),/library is unavailable/);
});
