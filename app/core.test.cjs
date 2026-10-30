const test=require('node:test'),assert=require('node:assert/strict'),F=require('./core.js');
const straight=F.validateDefinition({id:'test:straight',name:'Straight',family:'test',parameters:{type:'straight',lengthMm:345,widthMm:200,laneCount:2,laneSpacingMm:100}});
const curve=F.validateDefinition({id:'test:curve',name:'Curve',family:'test',parameters:{type:'curve',innerRadiusMm:400,widthMm:200,laneCount:2,laneSpacingMm:100,angleDeg:30}});
const defs={[straight.id]:straight,[curve.id]:curve};
function oval(){const items=[];for(const d of [...Array(3).fill(straight),...Array(6).fill(curve),...Array(3).fill(straight),...Array(6).fill(curve)]){let p=F.pose(d);if(items.length)p=F.join(p,d,0,F.ports(items.at(-1),defs)[1]);items.push(p);}return items;}
test('Closed oval measures global physical lanes, not local lane-index sums',()=>{const items=oval(),r=F.routes(items,defs);assert.equal(r.closed,true);const lengths=r.routes.map(r=>r.lengthMm).sort((a,b)=>a-b);assert.ok(Math.abs(lengths[0]-(6*345+2*Math.PI*450))<.0001);assert.ok(Math.abs(lengths[1]-(6*345+2*Math.PI*550))<.0001);for(const route of r.routes)assert.ok(F.dist(route.points[0].p,route.points.at(-1).p)<.0001);});
test('Broken and separate circuits cannot start a misleading preview',()=>{const items=oval();items[0].x+=10;assert.equal(F.routes(items,defs).closed,false);const a=oval(),b=oval().map(p=>({...p,x:p.x+5000}));assert.equal(F.routes([...a,...b],defs).closed,false);});
test('Snapping aligns endpoint positions and rejects unrelated brands and lane spacing',()=>{const a=F.pose(straight),b={...F.pose(curve),x:345,y:600};const result=F.snap(b,[a,b],defs,100);assert.ok(result);assert.ok(F.dist(F.ports(result.pose,defs)[0].position,F.ports(a,defs)[1].position)<.0001);const foreign={...curve,id:'foreign',family:'another-brand'},otherDefs={...defs,foreign};assert.equal(F.snap({...b,definitionId:'foreign'},[a],otherDefs,100),null);const narrow=F.validateDefinition({...curve,id:'narrow',parameters:{...curve.parameters,laneSpacingMm:90}});assert.equal(F.snap({...b,definitionId:'narrow'},[a],{...defs,narrow},100),null);});
test('Reflecting and rotating a complete loop preserves lane lengths and connectivity',()=>{const items=oval(),before=F.routes(items,defs).routes.map(r=>r.lengthMm).sort();const transformed=items.map(p=>({...p,x:p.y+200,y:p.x-600,angle:90-p.angle,flip:!p.flip}));const result=F.routes(transformed,defs);assert.equal(result.closed,true);assert.deepEqual(result.routes.map(r=>Number(r.lengthMm.toFixed(4))).sort(),before.map(n=>Number(n.toFixed(4))));});
test('Duplicate overlapping connections are ambiguous, never counted as one valid circuit',()=>{const items=oval(),copy={...items[0],id:F.uid()};assert.equal(F.routes([...items,copy],defs).closed,false);});
test('Lane spacing is independent of surface width; invalid dimensions are rejected',()=>{const d=F.validateDefinition({...straight,id:'wide-slots',parameters:{...straight.parameters,laneSpacingMm:120}});assert.equal(d.geometry.outlineSvgPath,straight.geometry.outlineSvgPath);assert.equal(d.geometry.lanePaths[0].start[1],40);for(const p of[{...straight.parameters,laneSpacingMm:250},{...curve.parameters,angleDeg:181},{...straight.parameters,lengthMm:NaN},{...straight.parameters,laneCount:20}])assert.throws(()=>F.validateDefinition({...straight,parameters:p}));});
test('Border dimensions expand the occupied envelope without adding route length',()=>{const border=F.validateDefinition({id:'border',name:'Border',parameters:{type:'straight-border',lengthMm:345,widthMm:100,side:'outer'}});const a=F.pose(straight),b={...F.pose(border),y:-100};assert.equal(border.geometry.lanePaths.length,0);assert.equal(border.geometry.centrelineLengthMm,0);assert.deepEqual(F.bounds([a,b],{...defs,border}),[0,-100,345,300]);});
test('Speed planning brakes before corners and obeys acceleration/braking limits',()=>{const route=F.routes(oval(),defs).routes[0],p=F.presets.Balanced,speed=F.speedPlan(route,p);assert.ok(speed(1030)<speed(450));assert.ok(speed(1700)<p.speed);for(let d=0;d<route.lengthMm;d+=5){assert.ok(Number.isFinite(speed(d)));assert.ok(speed(d)<=p.speed+.0001);assert.ok(speed(d)>0);const acceleration=(speed(d+1)**2-speed(d)**2)/2;assert.ok(acceleration<=p.acceleration+1e-5);assert.ok(acceleration>=-p.brake-1e-5);}assert.ok(Math.abs(speed(0)-speed(route.lengthMm))<.0001);});
test('Layout validation regenerates geometry and retains hardware mirror restrictions',()=>{const raw={format:'slotforge.layout',version:1,title:'Round trip',pieces:oval(),definitions:[{...straight,mirror:false,geometry:{broken:true}},curve],profile:F.presets.Aggressive};const copy=F.validateLayout(JSON.parse(JSON.stringify(raw)));assert.equal(copy.definitions[straight.id].mirror,false);assert.equal(F.routes(copy.pieces,copy.definitions).closed,true);assert.throws(()=>F.validateLayout({...raw,pieces:[{...raw.pieces[0],x:Infinity}]}));assert.throws(()=>F.validateLayout({...raw,pieces:[{...raw.pieces[0],definitionId:'missing'}]}));assert.throws(()=>F.validateLayout({...raw,definitions:[straight,straight]}));});
test('Generated slot paths supply continuous guide positions across wraparound',()=>{for(const route of F.routes(oval(),defs).routes){const a=F.at(route,route.lengthMm-.001),b=F.at(route,.001);assert.ok(Math.hypot(a.x-b.x,a.y-b.y)<.01);assert.ok(Number.isFinite(F.at(route,-100).heading));}});
test('Group transforms preserve connected lanes through translation, rotation and reflection',()=>{
 const group=oval(),from=group[3],to={...from,x:1250,y:-320,angle:127,flip:!from.flip};
 const moved=F.repositionGroup(group,from,to);
 assert.equal(F.routes(moved,defs).closed,true);
 assert.ok(F.dist([moved[3].x,moved[3].y],[to.x,to.y])<1e-8);
 const restored=F.repositionGroup(moved,to,from);
 for(let i=0;i<group.length;i++){assert.ok(F.dist([restored[i].x,restored[i].y],[group[i].x,group[i].y])<1e-8);assert.ok(Math.abs(F.wrap(restored[i].angle-group[i].angle))<1e-8);assert.equal(restored[i].flip,group[i].flip);}
});
test('Marquee hits track surfaces, including crossing edges, but excludes empty space inside curves',()=>{
 const p=F.pose(straight);
 assert.equal(F.inSelectionBox(p,straight,[20,20],[40,40]),true);
 assert.equal(F.inSelectionBox(p,straight,[100,-10],[110,210]),true);
 assert.equal(F.inSelectionBox(p,straight,[400,210],[-10,-10]),true);
 assert.equal(F.inSelectionBox(p,straight,[400,0],[410,10]),false);
 const c=F.pose(curve);
 assert.equal(F.inSelectionBox(c,curve,[5,-580],[10,-570]),true);
 assert.equal(F.inSelectionBox(c,curve,[280,-590],[290,-580]),false);
 const reflected={...p,x:1000,y:500,angle:90,flip:true};
 assert.equal(F.inSelectionBox(reflected,straight,[1010,510],[1020,520]),true);
});
test('A reflected new curve attaches with its chosen handedness intact',()=>{
 const a=F.pose(straight),p={...F.pose(curve),flip:true};
 const b=F.join(p,curve,0,F.ports(a,defs)[1]);
 assert.equal(b.flip,true);assert.equal(F.connections([a,b],defs).open.length,2);
 assert.ok(F.ports(b,defs)[1].position[1]<F.ports(b,defs)[0].position[1]);
});
test('Uneven slots must coincide physically, not just share distances from a connector',()=>{
 const d=F.validateDefinition({...straight,id:'asymmetric',parameters:{type:'straight',lengthMm:345,widthMm:200,laneOffsetsMm:[30,80]}}),ds={asymmetric:d};
 const a=F.pose(d),b={...F.pose(d),x:345,y:200,flip:true};
 assert.equal(F.connections([a,b],ds).open.length,4);
 assert.equal(F.snap(b,[a],ds,30),null);
 const aligned={...b,y:0,flip:false};assert.equal(F.connections([a,aligned],ds).open.length,2);
});
test('Definition collisions never modify the catalogue or undo history definitions',()=>{
 const original={...straight},existing={...defs};
 for(const patch of [{family:'different'},{mirror:false},{name:'Renamed'},{parameters:{...straight.parameters,lengthMm:200}}]){
  const changed=F.validateDefinition({...straight,...patch}),p=F.pose(changed),merged=F.mergeDefinitions({[changed.id]:changed},[p],existing);
  assert.notEqual(merged.pieces[0].definitionId,straight.id);assert.equal(existing[straight.id],straight);
  assert.deepEqual(existing[straight.id],original);assert.equal(Object.values(merged.definitions)[0].family,changed.family);
 }
 const same=F.mergeDefinitions({[straight.id]:straight},[F.pose(straight)],existing);assert.equal(Object.keys(same.definitions).length,0);
});
test('Browser shortcut modifiers cannot accidentally rotate or mirror a layout',()=>{
 assert.equal(F.shortcut({key:'r',ctrlKey:true}),null);assert.equal(F.shortcut({key:'m',metaKey:true}),null);assert.equal(F.shortcut({key:'r',altKey:true}),null);
 assert.equal(F.shortcut({key:'r'}),'rotate');assert.equal(F.shortcut({key:'R',shiftKey:true}),'rotateBack');assert.equal(F.shortcut({key:'z',ctrlKey:true,shiftKey:true}),'redo');
});
test('Preview start/stop never accumulates animation callbacks',()=>{
 let next=0,frames=0;const pending=new Map();const loop=F.animationLoop(fn=>{pending.set(++next,fn);return next;},id=>pending.delete(id),()=>frames++);
 loop.start();loop.start();assert.equal(pending.size,1);loop.stop();assert.equal(pending.size,0);loop.start();
 const [id,fn]=[...pending][0];pending.delete(id);fn(100);assert.equal(frames,1);assert.equal(pending.size,1);loop.stop();assert.equal(pending.size,0);
});
test('Exported world-coordinate arcs and lines are continuous after reflection',()=>{
 const pieces=F.repositionGroup(oval(),{x:0,y:0,angle:0,flip:false},{x:350,y:-600,angle:43,flip:true});
 const endpoint=(s,end)=>s.type==='line'?(end?s.to:s.from):[s.center[0]+s.radiusMm*Math.cos(F.rad(s.startAngleDeg+(end?s.sweepDeg:0))),s.center[1]+s.radiusMm*Math.sin(F.rad(s.startAngleDeg+(end?s.sweepDeg:0)))];
 for(const route of F.routes(pieces,defs).routes){const segments=F.worldSegments(route,pieces,defs);assert.ok(Math.abs(segments.reduce((s,p)=>s+p.lengthMm,0)-route.lengthMm)<1e-8);for(let i=0;i<segments.length;i++)assert.ok(F.dist(endpoint(segments[i],true),endpoint(segments[(i+1)%segments.length],false))<.00001);}
});
test('Malformed and conflicting input is rejected before changing a layout',()=>{
 const layout={format:'slotforge.layout',version:1,definitions:[straight],pieces:[F.pose(straight)]};
 for(const pieces of [[null],[{...layout.pieces[0],flip:'false'}]])assert.throws(()=>F.validateLayout({...layout,pieces}));
 assert.throws(()=>F.validateLayout({...layout,definitions:[{...straight,mirror:false}],pieces:[{...layout.pieces[0],flip:true}]}));
 for(const parameters of [{...straight.parameters,lengthMm:1e-12},{...straight.parameters,laneOffsetsMm:[50,150]},{...straight.parameters,laneCount:2.5},{...straight.parameters,widthMm:'200'}])assert.throws(()=>F.validateDefinition({...straight,parameters}));
});
test('Every bundled buildable definition survives the same import/export validation',()=>{
 const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ctx={window:{}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'catalogue.js'),'utf8'),ctx);let count=0;
 for(const pack of ctx.window.TRACK_PACKS)for(const raw of pack.pieces)if(raw.parameters){const d=F.validateDefinition(JSON.parse(JSON.stringify(raw)));assert.equal(d.geometry.outlineSvgPath,raw.geometry.outlineSvgPath);assert.equal(d.geometry.centrelineLengthMm,raw.geometry.centrelineLengthMm);assert.deepEqual(d.geometry.lanePaths.map(l=>l.lengthMm),Array.from(raw.geometry.lanePaths,l=>l.lengthMm));count++;}
 assert.equal(count,125);
});
test('Preview guides stay on the exact arc, including reflected and reversed travel',()=>{
 for(const reflected of [false,true]){
  const base=oval();base[0]={...base[0],x:345,y:200,angle:180};
  const pieces=F.repositionGroup(base,{x:0,y:0,angle:0,flip:false},{x:700,y:200,angle:37,flip:reflected});
  for(const route of F.routes(pieces,defs).routes)for(let i=0;i<route.sections.length;i++){
   const section=route.sections[i],segment=route.segments[i];if(segment.type!=='arc')continue;
   const q=F.at(route,section.startMm+section.lengthMm*.371);
   assert.ok(Math.abs(F.dist([q.x,q.y],segment.center)-segment.radiusMm)<1e-8);
   assert.equal(Math.sign(q.curvature),Math.sign(segment.sweepDeg));
  }
 }
});
test('Maximum-size straight chain keeps only its two external ends open',()=>{
 const items=Array.from({length:500},(_,i)=>({...F.pose(straight),x:i*345}));const network=F.connections(items,defs);
 assert.equal(network.open.length,2);assert.equal(network.links.size,998);assert.equal(network.ambiguous.size,0);
});
function borderDefinition(id,parameters,family='test'){return F.validateDefinition({id,name:id,family,parameters});}
test('Automatic straight borders tile both edges and follow rotated, mirrored roads',()=>{
 const border=borderDefinition('border',{type:'straight-border',lengthMm:115,widthMm:100,side:'outer'}),ds={...defs,border},road={...F.pose(straight),x:400,y:700,angle:37,flip:true};
 const result=F.planBorders([road],[road],ds);assert.equal(result.added.length,6);assert.equal(result.missing.length,0);
 const untransformed=F.repositionGroup(result.added,road,{...road,x:0,y:0,angle:0,flip:false});
 assert.deepEqual(F.bounds(untransformed,ds).map(Math.round),[0,-100,345,400]);
 assert.equal(result.added.reduce((n,p)=>n+ds[p.definitionId].geometry.centrelineLengthMm,0),0);
 assert.equal(F.planBorders([road],[road,...result.added],ds).added.length,0);
});
test('Curve borders tile shorter sections at the correct inner and outer radii',()=>{
 const inner=borderDefinition('inner',{type:'curve-border',innerRadiusMm:300,widthMm:100,angleDeg:15,side:'inner'}),outer=borderDefinition('outer',{type:'curve-border',innerRadiusMm:600,widthMm:100,angleDeg:15,side:'outer'}),ds={...defs,inner,outer};
 const road={...F.pose(curve),x:50,y:500,angle:80,flip:true},result=F.planBorders([road],[road],ds);
 assert.equal(result.added.length,4);assert.equal(result.missing.length,0);assert.deepEqual(result.added.map(p=>p.angle),[80,65,80,65]);assert.ok(result.added.every(p=>p.flip&&p.x===road.x&&p.y===road.y));
 assert.equal(F.planBorders([road],[road,...result.added],ds).duplicates,4);
});
test('Border matching rejects incompatible families, radii and non-tiling lengths',()=>{
 const foreign=borderDefinition('foreign',{type:'straight-border',lengthMm:345,widthMm:100,side:'outer'},'other'),short=borderDefinition('short',{type:'straight-border',lengthMm:100,widthMm:100,side:'outer'}),wrong=borderDefinition('wrong',{type:'curve-border',innerRadiusMm:550,widthMm:100,angleDeg:30,side:'outer'}),ds={...defs,foreign,short,wrong};
 const roads=[F.pose(straight),F.pose(curve)],result=F.planBorders(roads,roads,ds);assert.equal(result.added.length,0);assert.equal(result.missing.length,4);
});
test('Border placement obeys requested sides and reports the layout limit before mutation',()=>{
 const border=borderDefinition('border',{type:'straight-border',lengthMm:345,widthMm:100,side:'outer'}),ds={...defs,border},road=F.pose(straight);
 assert.equal(F.planBorders([road],[road],ds,['inner']).added.length,1);
 const full=Array.from({length:500},(_,i)=>({...F.pose(straight),x:i*345}));assert.equal(F.planBorders([full[0]],full,ds).overflow,true);assert.equal(full.length,500);
});
test('Published Policar and ScaleAuto borders repeat shorter sections without changing lane length',()=>{
 const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ctx={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'catalogue.js'),'utf8'),ctx);
 const ds=Object.fromEntries(ctx.window.TRACK_PACKS.flatMap(p=>p.pieces).filter(d=>d.parameters).map(d=>[d.id,F.validateDefinition(JSON.parse(JSON.stringify(d)))]));
 for(const id of ['policar:P009','scaleauto:SC-10008']){const road=F.pose(ds[id]),result=F.planBorders([road],[road],ds);assert.equal(result.missing.length,0);assert.ok(result.added.length>=2);assert.ok(result.added.every(p=>ds[p.definitionId].geometry.lanePaths.length===0));}
});
function circuitBorderDefs(){return{...defs,
 'border:straight':borderDefinition('border:straight',{type:'straight-border',lengthMm:345,widthMm:100,side:'outer'}),
 'border:inner':borderDefinition('border:inner',{type:'curve-border',innerRadiusMm:300,widthMm:100,angleDeg:15,side:'inner'}),
 'border:outer':borderDefinition('border:outer',{type:'curve-border',innerRadiusMm:600,widthMm:100,angleDeg:15,side:'outer'})};}
test('Outside borders form one continuous oval boundary on straights and curves',()=>{
 const ds=circuitBorderDefs(),roads=oval(),outside=F.planBorders(roads,roads,ds,['outer']),inside=F.planBorders(roads,roads,ds,['inner']);
 assert.equal(outside.sideMode,'circuit');assert.equal(outside.missing.length,0);assert.equal(outside.added.length,30);
 const bounds=F.bounds(roads,ds);assert.deepEqual(F.bounds([...roads,...outside.added],ds).map(Math.round),[bounds[0]-100,bounds[1]-100,bounds[2]+200,bounds[3]+200].map(Math.round));
 assert.deepEqual(F.bounds([...roads,...inside.added],ds).map(Math.round),bounds.map(Math.round));
 assert.deepEqual(F.bounds(F.planBorders([roads[0]],roads,ds,['outer']).added,ds),[0,-100,345,100]);
 assert.deepEqual(F.bounds(F.planBorders([roads[0]],roads,ds,['inner']).added,ds),[0,200,345,100]);
 assert.equal(F.planBorders(roads,[...roads,...outside.added],ds,['outer']).added.length,0);
});
test('Circuit border sides survive reflection, rotation, reversed pieces and selection order',()=>{
 const ds=circuitBorderDefs(),base=oval();base[0]={...base[0],x:345,y:200,angle:180};assert.equal(F.routes(base,ds).closed,true);
 const expected=F.planBorders([base[0]],base,ds,['outer']);assert.deepEqual(F.bounds(expected.added,ds).map(n=>Math.round(n)||0),[0,-100,345,100]);
 const from=base[0],to={...from,x:700,y:350,angle:37,flip:true},moved=F.repositionGroup(base,from,to),plan=F.planBorders([moved[0]],[...moved].reverse(),ds,['outer']),back=F.repositionGroup(plan.added,to,from);
 assert.equal(plan.sideMode,'circuit');assert.deepEqual(F.bounds(back,ds).map(n=>Math.round(n)||0),[0,-100,345,100]);
});
test('Open straight borders follow a connected reflected corner, with explicit fallback',()=>{
 const ds=circuitBorderDefs(),road=F.pose(straight),bend=F.join({...F.pose(curve),flip:true},curve,0,F.ports(road,ds)[1]),plan=F.planBorders([road],[road,bend],ds,['outer']);
 assert.equal(plan.sideMode,'connected-or-local');assert.deepEqual(F.bounds(plan.added,ds).map(Math.round),[0,200,345,100]);
 const standalone=F.planBorders([road],[road],ds,['outer']);assert.deepEqual(F.bounds(standalone.added,ds),[0,-100,345,100]);
});
test('Disconnected closed loops each determine their own border inside and outside',()=>{
 const ds=circuitBorderDefs(),a=oval(),b=F.repositionGroup(oval(),{x:0,y:0,angle:0,flip:false},{x:4000,y:300,angle:90,flip:true}),all=[...a,...b];
 assert.equal(F.planBorders([a[0],b[0]],all,ds,['outer']).sideMode,'circuit');
 const second=F.planBorders([b[0]],all,ds,['outer']).added,restored=F.repositionGroup(second,{x:4000,y:300,angle:90,flip:true},{x:0,y:0,angle:0,flip:false});
 assert.deepEqual(F.bounds(restored,ds).map(n=>Math.round(n)||0),[0,-100,345,100]);
});
test('Custom lane changers retain through slots and add correctly directed switching routes',()=>{
 for(const[direction,pairs]of [['left',[[1,0]]],['right',[[0,1]]],['both',[[0,1],[1,0]]]]){
  const d=F.validateDefinition({...straight,id:'switch:'+direction,parameters:{...straight.parameters,laneChange:direction,switchStartMm:60,switchEndMm:285}}),g=d.geometry;
  assert.deepEqual(g.alternateLanePaths.map(r=>[r.fromLaneIndex,r.toLaneIndex]),pairs);assert.equal(g.lanePaths.length,2);
  for(const r of g.alternateLanePaths){assert.deepEqual(r.start,g.lanePaths[r.fromLaneIndex].start);assert.deepEqual(r.end,g.lanePaths[r.toLaneIndex].end);assert.ok(r.lengthMm>345);assert.ok(r.lengthMm<445);assert.equal(r.segments[1].type,'cubic');}
 }
});
test('Lane changer imports reject invalid switch spans, directions and lane counts',()=>{
 const p={...straight.parameters,laneChange:'both',switchStartMm:60,switchEndMm:285};
 for(const patch of [{switchStartMm:-1},{switchEndMm:346},{switchStartMm:290},{switchEndMm:60},{laneChange:'unknown'},{laneCount:3,laneSpacingMm:50},{type:'curve',innerRadiusMm:200,angleDeg:30}])assert.throws(()=>F.validateDefinition({...straight,parameters:{...p,...patch}}));
});
test('Lane changer geometry round-trips and exports reflected cubic control points',()=>{
 const d=F.validateDefinition({...straight,id:'switch',parameters:{...straight.parameters,laneChange:'both',switchStartMm:60,switchEndMm:285}}),p={...F.pose(d),x:500,y:400,angle:45,flip:true},raw={format:'slotforge.layout',version:1,definitions:[d],pieces:[p]};
 const restored=F.validateLayout(JSON.parse(JSON.stringify(raw)));assert.deepEqual(restored.definitions.switch.geometry,d.geometry);
 const paths=F.alternateRoutes(restored.pieces,restored.definitions);assert.equal(paths.length,2);
 for(let i=0;i<2;i++){const a=paths[i].segments[1],b=d.geometry.alternateLanePaths[i].segments[1];for(const key of ['from','to','control1','control2'])assert.deepEqual(a[key],F.point(b[key],p));}
});
test('Closed circuits with a custom lane changer preview the through route without double-counting branches',()=>{
 const d=F.validateDefinition({...straight,id:'switch',parameters:{...straight.parameters,laneChange:'both',switchStartMm:0,switchEndMm:345}}),ds={...defs,switch:d},items=oval(),before=F.routes(items,defs);
 items[0].definitionId=d.id;const after=F.routes(items,ds);assert.equal(after.closed,true);assert.deepEqual(after.routes.map(r=>r.lengthMm),before.routes.map(r=>r.lengthMm));assert.equal(F.alternateRoutes(items,ds).length,2);
});
