const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),F=require('./core.js'),I=require('./integration.js'),D=require('./design-library.js'),Drawing=require('./track-drawing.js');
const raw=()=>JSON.parse(fs.readFileSync(path.join(__dirname,'../integration/slotforge-timing/fixtures/01-closed-oval.slotforge.json'),'utf8'));
test('Saved design baselines validate identity and cover legacy IndexedDB records',()=>{
 const layout=I.prepare(raw()),record={id:layout.design.id,layout},legacy=D.source(record);assert.equal(legacy.revision,layout.design.revision);assert.doesNotThrow(()=>D.checkRevision(record,legacy.revision));
 const latest={...record,revision:'newer-save'};assert.throws(()=>D.checkRevision(latest,legacy.revision),/another window/);assert.throws(()=>D.checkRevision(undefined,'deleted-save'),/another window/);assert.doesNotThrow(()=>D.checkRevision(undefined,null));assert.throws(()=>D.checkRevision(latest,null),/another window/);
 for(const source of [{id:'wrong',revision:'valid'},[],{id:layout.design.id,revision:{}},{id:layout.design.id,revision:''}])assert.throws(()=>D.validateSource(source,layout.design.id));
 assert.equal(D.validateSource(null,layout.design.id),null);
});
test('PNG artwork shares the editor body, including brand markings, grids and border palettes',()=>{
 const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'catalogue.js'),'utf8'),context);let count=0;
 assert.equal(Drawing.body,F.drawBody);
 for(const pack of context.window.TRACK_PACKS)for(const input of pack.pieces){if(!input.parameters)continue;const d=F.validateDefinition(JSON.parse(JSON.stringify(input))),piece=F.pose(d),layout={format:'slotforge.layout',version:1,definitions:[d],pieces:[piece]};const body=Drawing.body(d),picture=I.picture(layout).svg;
  assert.ok(picture.includes(body),d.id+' uses the same body in PNG and editor');assert.doesNotMatch(picture,/NaN|Infinity|undefined/);count++;
 }
 assert.ok(count>100);const carrera=F.validateDefinition(raw().definitions.find(d=>d.parameters.type==='straight'));assert.match(F.drawBody(carrera),/stroke-dasharray/);
});
test('Invalid connector and mirror metadata cannot silently become compatible geometry',()=>{
 const d=raw().definitions[0];for(const family of ['',null,17,{},'invalid family','x'.repeat(101)])assert.throws(()=>F.validateDefinition({...d,family}),/connector family/);for(const mirror of ['false',0,null,{}])assert.throws(()=>F.validateDefinition({...d,mirror}),/reflection/);
 assert.equal(F.validateDefinition({...d,family:'club:measured-v1',mirror:false}).mirror,false);const legacy={...d};delete legacy.family;delete legacy.mirror;assert.ok(F.validateDefinition(legacy).geometry);
});
test('POSIX launcher emits printf newline escapes, not literal backslash-n text',()=>{
 const script=require('../installer/posix-start.cjs').start('/safe/node');assert.ok(script.includes("printf '%s\\n'"));assert.ok(script.includes('browser.\\nLaunch details: %s\\n'));assert.equal(script.includes('\\\\n'),false);
});
