const test=require('node:test'),assert=require('node:assert/strict'),F=require('./core.js'),I=require('./integration.js');
const straight=(id,length=345,width=200)=>F.validateDefinition({id,name:id,family:'test',parameters:{type:'straight',lengthMm:length,widthMm:width,laneCount:2,laneSpacingMm:100}});
const curve=(id,radius,angle=30)=>F.validateDefinition({id,name:id,family:'test',parameters:{type:'curve',innerRadiusMm:radius,widthMm:200,laneCount:2,laneSpacingMm:100,angleDeg:angle}});
const s=straight('straight'),short=straight('short',100),r1=curve('r1',200),r2=curve('r2',400),r3=curve('r3',600),defs=Object.fromEntries([s,short,r1,r2,r3].map(d=>[d.id,d]));
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
test('Parallel straights snap on either side and align nearby ends without creating road connections',()=>{
 const fixed=F.pose(s);for(const y of[-208,208]){const moving={...F.pose(s),x:8,y},result=F.snap(moving,[fixed],defs,40);assert.equal(result.kind,'side');close(result.pose.x,0);close(result.pose.y,Math.sign(y)*200);assert.equal(F.connections([fixed,result.pose],defs).links.size,0);assert.equal(F.connections([fixed,result.pose],defs).open.length,4);assert.match(result.guide.d,/H 345/);}
});
test('Different straight lengths can align either end or slide along an overlapping road edge',()=>{
 const fixed=F.pose(s);for(const [x,expected]of[[7,0],[239,245],[120,120]]){const moving={...F.pose(short),x,y:206},result=F.sideSnap(moving,[fixed],defs,30);assert.ok(result);close(result.pose.x,expected);close(result.pose.y,200);}assert.equal(F.sideSnap({...F.pose(short),x:400,y:204},[fixed],defs,30),null);
});
test('Side alignment respects rotated, reversed and reflected straight poses',()=>{
 for(const angle of[0,35,90,-145])for(const flip of[false,true]){const fixed={...F.pose(s),x:120,y:70,angle,flip},moving=F.repositionGroup([{...F.pose(s),x:5,y:208}],{x:0,y:0,angle:0,flip:false},fixed)[0],result=F.sideSnap(moving,[fixed],defs,40);assert.ok(result);const expected=F.point([0,200],fixed);close(result.pose.x,expected[0]);close(result.pose.y,expected[1]);close(result.pose.angle,angle);assert.equal(result.pose.flip,flip);}
 const fixed=F.pose(s),moving={...F.pose(s),x:350,y:407,angle:180},result=F.sideSnap(moving,[fixed],defs,40);assert.ok(result);close(result.pose.x,345);close(result.pose.y,400); // Reversed +x and +y axes: its upper physical edge touches y=200.
});
test('Matching nested curve radii share a centre, in either inward or outward placement',()=>{
 for(const [outer,inner]of[[r2,r1],[r3,r2]])for(const reverse of[false,true]){const fixed=F.pose(reverse?inner:outer),moving={...F.pose(reverse?outer:inner),x:8,y:-5},before=structuredClone(defs[moving.definitionId].parameters),result=F.snap(moving,[fixed],defs,40);assert.equal(result.kind,'side');close(result.pose.x,0);close(result.pose.y,0);close(result.pose.angle,0);assert.deepEqual(defs[moving.definitionId].parameters,before);assert.equal(F.connections([fixed,result.pose],defs).open.length,4);}
});
test('Nested arcs work under reflection, rotation and opposite parameter directions',()=>{
 for(const angle of[0,73,-179])for(const flip of[false,true]){const fixed={...F.pose(r2),x:350,y:-90,angle,flip},moving={...F.pose(r1),x:356,y:-84,angle:angle+(flip?-1:1),flip},result=F.sideSnap(moving,[fixed],defs,45);assert.ok(result);close(result.pose.x,350);close(result.pose.y,-90);close(F.wrap(result.pose.angle-angle),0);}
 const fixed=F.pose(r2),moving={...F.pose(r1),x:4,y:6,angle:-150,flip:true},result=F.sideSnap(moving,[fixed],defs,40);assert.ok(result);close(result.pose.x,0);close(result.pose.y,0);close(result.pose.angle,-150);
});
test('Different arc lengths can share a side, with start or finish seams aligned',()=>{
 const wide=curve('wide',400,60),all={...defs,wide},fixed=F.pose(wide);for(const [angle,expected]of[[1,0],[29,30],[15,15]]){const result=F.sideSnap({...F.pose(r1),x:5,y:3,angle},[fixed],all,40);assert.ok(result);close(result.pose.angle,expected);}
});
test('Magnetic sides reject incompatible families, radii, surfaces, orientations and distant pieces',()=>{
 const fixed=F.pose(r2),foreign={...r1,id:'foreign',family:'foreign'},wrong=curve('wrong',220),border=F.validateDefinition({id:'border',name:'Border',family:'test',parameters:{type:'curve-border',innerRadiusMm:300,widthMm:100,angleDeg:30,side:'inner'}}),reference=F.validateDefinition({id:'reference',name:'Reference',parameters:{type:'reference',lengthMm:345,widthMm:200}}),all={...defs,foreign,wrong,border,reference};for(const d of[foreign,wrong,border,reference])assert.equal(F.sideSnap(F.pose(d),[fixed],all,40),null);
 assert.equal(F.sideSnap({...F.pose(r1),x:100,y:0},[fixed],defs,40),null);assert.equal(F.sideSnap({...F.pose(r1),angle:100},[fixed],defs,40),null);assert.equal(F.sideSnap({...F.pose(s),angle:90,y:200},[F.pose(s)],defs,40),null);assert.equal(F.sideSnap({...F.pose(s),y:400},[F.pose(s)],defs,40),null);
});
test('Side magnets remain available when a moving group has no free end connectors',()=>{
 const fixed=F.pose(r2),moving={...F.pose(r1),x:8,y:-3},result=F.snap(moving,[fixed],defs,40,[],[]);assert.equal(result.kind,'side');close(result.pose.x,0);close(result.pose.y,0);
});
test('A snapped selection moves rigidly and preserves its internal connections and exported lane geometry',()=>{
 const a=F.pose(s),b=F.join(F.pose(r1),r1,0,F.ports(a,defs)[1]),group=[a,b].map(p=>({...p,y:p.y+207,x:p.x+5})),fixed=F.pose(s),result=F.snap(group[0],[fixed],defs,40,[0],F.connections([fixed],defs).open);assert.equal(result.kind,'side');const moved=F.repositionGroup(group,group[0],result.pose),before=F.connections(group,defs),after=F.connections(moved,defs);assert.equal(after.links.size,before.links.size);close(F.dist([moved[0].x,moved[0].y],[moved[1].x,moved[1].y]),F.dist([group[0].x,group[0].y],[group[1].x,group[1].y]));const raw=I.prepare({format:'slotforge.layout',version:1,title:'Parallel roads',definitions:[s,r1],pieces:[fixed,...moved]});assert.deepEqual(I.prepare(raw).definitions,raw.definitions);
});
test('A nearby real end connection keeps its normal magnetic priority',()=>{
 const fixed=F.pose(s),moving={...F.pose(s),x:350,y:3},result=F.snap(moving,[fixed],defs,40);assert.equal(result.kind,'end');close(result.pose.x,345);close(result.pose.y,0);assert.equal(F.connections([fixed,result.pose],defs).links.size,2);
});
test('An entire closed inner circuit snaps beside an outer circuit without altering either lane network',()=>{
 function oval(c,y){const items=[];for(const d of[s,...Array(6).fill(c),s,...Array(6).fill(c)]){let p=F.pose(d,0,y);if(items.length)p=F.join(p,d,0,F.ports(items.at(-1),defs)[1]);items.push(p);}return items;}
 const outer=oval(r2,0),inner=oval(r1,200),dragged=inner.map(p=>({...p,x:p.x+8,y:p.y+6}));assert.equal(F.connections(dragged,defs).open.length,0);const result=F.snap(dragged[0],outer,defs,40,[],[]);assert.equal(result.kind,'side');const moved=F.repositionGroup(dragged,dragged[0],result.pose);const before=F.routes(inner,defs),after=F.routes(moved,defs);assert.equal(after.closed,true);assert.deepEqual(after.routes.map(r=>r.lengthMm),before.routes.map(r=>r.lengthMm));assert.equal(F.routes(outer,defs).closed,true);assert.equal(F.connections([...outer,...moved],defs).links.size,(outer.length+moved.length)*2);
});
test('Published nested curve families in the built-in catalogues use their real road widths and radii',()=>{
 const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ctx={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'catalogue.js'),'utf8'),ctx);let pairs=0;
 for(const pack of ctx.window.TRACK_PACKS){const curves=pack.pieces.filter(d=>d.parameters?.type==='curve').map(d=>F.validateDefinition(JSON.parse(JSON.stringify(d))));const all=Object.fromEntries(curves.map(d=>[d.id,d]));for(const inner of curves)for(const outer of curves){if(Math.abs(inner.parameters.innerRadiusMm+inner.parameters.widthMm-outer.parameters.innerRadiusMm)>.01)continue;const fixed=F.pose(outer),moving={...F.pose(inner),x:7,y:-4},result=F.sideSnap(moving,[fixed],all,35);assert.ok(result,pack.name+': '+inner.name+' / '+outer.name);close(result.pose.x,0);close(result.pose.y,0);pairs++;}}
 assert.ok(pairs>20);
});
