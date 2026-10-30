const test=require('node:test'),assert=require('node:assert/strict'),C=require('./custom-packs.js'),F=require('./core.js');
const piece=(id,type='straight')=>F.validateDefinition({id:'custom:'+id,name:id,family:'custom',parameters:type==='straight'?{type,lengthMm:345,widthMm:200,laneCount:2,laneSpacingMm:100}:{type,innerRadiusMm:400,angleDeg:30,widthMm:200,laneCount:2,laneSpacingMm:100}});
test('Legacy loose pieces migrate together into one pack without changing IDs or dimensions',()=>{
 const old=[piece('straight'),piece('curve','curve')],library=C.read(old);assert.equal(library.packs.length,1);assert.equal(library.activePackId,'custom');assert.equal(library.packs[0].inLibrary,true);assert.deepEqual(library.packs[0].pieces,old);assert.deepEqual(C.read(C.serialize(library)),library);
});
test('Multiple named packs retain separate membership, names and publication state after reload',()=>{
 const library=C.empty();library.packs[0].name='Club A';library.packs[0].pieces.push(piece('a'));library.packs.push({id:'custom-pack-b',name:'Club B',inLibrary:false,pieces:[piece('b','curve')]});library.activePackId='custom-pack-b';const restored=C.read(JSON.parse(JSON.stringify(C.serialize(library))));assert.deepEqual(restored,library);assert.equal(restored.packs[0].pieces.length,1);assert.equal(restored.packs[1].pieces[0].id,'custom:b');
});
test('Export contains only selected pack and importing creates one complete named set',()=>{
 const a={id:'custom-pack-a',name:'Club A',pieces:[piece('a'),piece('b','curve')]},b={id:'custom-pack-b',name:'Club B',pieces:[piece('c')]},library={packs:[a,b]};const out=C.exportPack(a);assert.equal(out.name,'Club A');assert.equal(out.pieces.length,2);assert.ok(!out.pieces.some(p=>p.id==='custom:c'));const imported=C.importPack(JSON.parse(JSON.stringify(out)),library);assert.equal(imported.name,'Club A');assert.equal(imported.pieces.length,2);assert.equal(imported.inLibrary,true);assert.notEqual(imported.pieces[0].id,a.pieces[0].id);assert.equal(imported.pieces[1].family,'custom');assert.deepEqual(imported.pieces[1].parameters,a.pieces[1].parameters);assert.equal(library.packs.length,2);
});
test('Renaming a pack does not mutate definitions or mix pieces from another pack',()=>{
 const d=piece('a'),before=structuredClone(d),p={id:'custom',name:'Renamed set',pieces:[d]};assert.equal(C.exportPack(p).pieces[0].pack,'Renamed set');assert.deepEqual(d,before);assert.equal(C.exportPack(p).pieces[0].id,d.id);
});
test('Invalid pack imports fail atomically, including duplicate IDs and unsupported units',()=>{
 const library=C.empty(),before=structuredClone(library),good={format:'slotforge.custom-pack',version:1,name:'Kit',pieces:[piece('a')]};for(const raw of [{...good,pieces:[piece('a'),piece('a')]},{...good,name:''},{...good,units:'inches'},{...good,pieces:[piece('a'),{bad:true}]}])assert.throws(()=>C.importPack(raw,library));assert.deepEqual(library,before);
});
test('Stored pack and piece IDs must be unique and piece counts remain bounded',()=>{
 const library=C.empty();library.packs[0].pieces=[piece('a')];const raw=C.serialize(library);assert.throws(()=>C.read({...raw,packs:[...raw.packs,...raw.packs]}));assert.throws(()=>C.read({...raw,packs:[raw.packs[0],{id:'custom-pack-b',name:'B',inLibrary:true,pieces:[piece('a')]}]}));assert.throws(()=>C.importPack({format:'slotforge.custom-pack',version:1,name:'Large',pieces:Array(501).fill(piece('a'))},C.empty()));
});
