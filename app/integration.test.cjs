const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const F=require('./core.js'),I=require('./integration.js');
const {oval}=require('./integration-fixtures.cjs');
test('Contract negotiation covers all serialized definitions, including unused tabletop and flowing definitions',()=>{const raw=oval(),s=F.Routed.settings({...F.Routed.defaults,constructionMode:'table'}),d=F.Routed.definition(s,{type:'straight',lengthMm:500},'routed:unused-table');assert.equal(I.prepare({...raw,definitions:[...raw.definitions,d]}).integration.contractVersion,I.TABLETOP_CONTRACT);const flowing=F.Routed.definition(F.Routed.settings(),{type:'routed-spline',controlPointsMm:F.Routed.Spline.preset('bend',F.Routed.settings())},'routed:unused-flowing');assert.equal(I.prepare({...raw,definitions:[...raw.definitions,flowing]}).integration.contractVersion,I.FLOWING_CONTRACT);});
test('A physical tabletop changes design revision, while locking it remains an editor preference',()=>{const raw=structuredClone(require('../integration/slotforge-timing/routed-examples/closed-tabletop-track.slotforge.json')),base=I.prepare(raw),resized=I.prepare({...raw,workspace:{...raw.workspace,spaceGuide:{...raw.workspace.spaceGuide,lengthMm:raw.workspace.spaceGuide.lengthMm+100}}}),moved=I.prepare({...raw,workspace:{...raw.workspace,spaceGuide:{...raw.workspace.spaceGuide,x:raw.workspace.spaceGuide.x+50}}}),unlocked=I.prepare({...raw,workspace:{...raw.workspace,spaceGuide:{...raw.workspace.spaceGuide,locked:false}}}),removed=I.prepare({...raw,workspace:{routed:raw.workspace.routed}});assert.notEqual(resized.design.revision,base.design.revision);assert.notEqual(moved.design.revision,base.design.revision);assert.notEqual(removed.design.revision,base.design.revision);assert.equal(unlocked.design.revision,base.design.revision);assert.equal(resized.design.id,base.design.id);assert.deepEqual(resized.track,base.track);assert.deepEqual(resized.timing,base.timing);});
test('Circuit branding preserves identity, routes and timing from Track Builder exports',()=>{const raw=oval(4),expected=structuredClone(raw);raw.producer={name:'SlotForge Track Builder',version:'0.3.8'};const before=structuredClone(raw),out=I.prepare(raw,I.importLayout(raw).state);assert.equal(out.producer.name,'SlotForge Circuit');assert.deepEqual(out.design,expected.design);assert.deepEqual(out.track,expected.track);assert.deepEqual(out.timing,expected.timing);assert.deepEqual(out.preparedGeometry,expected.preparedGeometry);assert.deepEqual(raw,before);});
test('SHA-256 is consistent with standard Node implementation',()=>{for(const s of ['','abc','Straße 😀','x'.repeat(10000)])assert.equal(I.hash(s),crypto.createHash('sha256').update(s).digest('hex'));});
for(const n of [2,4,8])test(n+' lanes: lengths, continuity and physical timing offsets',()=>{
 const out=oval(n),model=F.validateLayout(out),net=I.network(model.pieces,model.definitions);assert.equal(out.track.validClosedRouteCount,n);assert.equal(out.track.laneCount,n);
 const lengths=out.track.lanes.map(r=>r.lengthMm).sort((a,b)=>a-b);for(let i=0;i<n;i++)assert.ok(Math.abs(lengths[i]-(6*345+2*Math.PI*(450+i*100)))<1e-6);
 for(const r of net.routes){for(let i=0;i<r.segments.length;i++){const a=F.at(r,r.sections[i].startMm+.000001),b=F.at(r,r.sections[i].startMm-.000001);assert.ok(Math.hypot(a.x-b.x,a.y-b.y)<.0001);}
  const s=r.sections.find(s=>s.pieceId==='piece-05'),p=model.pieces.find(p=>p.id===s.pieceId),d=model.definitions[p.definitionId],seg=d.geometry.lanePaths[s.laneIndex].segments[0],a=F.rad(seg.startAngleDeg+.37*seg.sweepDeg),point=F.point([seg.center[0]+seg.radiusMm*Math.cos(a),seg.center[1]+seg.radiusMm*Math.sin(a)],p),offset=out.timing.startFinishOffsets.find(o=>o.routeId===r.id).offsetMm,q=F.at(r,offset);assert.ok(F.dist(point,[q.x,q.y])<1e-6);
 }
 assert.ok(new Set(out.timing.startFinishOffsets.map(o=>o.offsetMm)).size===n);
});
test('round trips, labels and reorder preserve design/route identity',()=>{
 const out=oval(),r=out.track.lanes[0];out.timing.routeLabels[r.id]='Red lane';const exported=I.prepare(out);const loaded=I.importLayout(JSON.parse(JSON.stringify(exported))),copy=I.prepare(exported,loaded.state);
 assert.deepEqual(copy,exported);assert.equal(copy.track.lanes[0].label,'Red lane');
 const reordered=I.prepare({...exported,pieces:[...exported.pieces].reverse()});assert.deepEqual(reordered.preparedGeometry.routes,exported.preparedGeometry.routes);assert.equal(reordered.timing.routeMappingRevision,exported.timing.routeMappingRevision);assert.equal(reordered.design.id,exported.design.id);assert.notEqual(reordered.design.revision,exported.design.revision);assert.equal(reordered.timing.requiresLaneRemap,false);
});
test('rotation, mirror and driving direction preserve canonical routes and correct timing point',()=>{
 const out=oval(),model=F.validateLayout(out),from=model.pieces[0],to={...from,x:750,y:-300,angle:37,flip:true},pieces=F.repositionGroup(model.pieces,from,to),moved=I.prepare({...out,pieces});assert.deepEqual(moved.track.lanes,out.track.lanes);assert.equal(moved.timing.routeMappingRevision,out.timing.routeMappingRevision);
 const reverse=I.prepare({...moved,timing:{...moved.timing,direction:-1}});assert.deepEqual(reverse.preparedGeometry,moved.preparedGeometry);assert.deepEqual(reverse.timing.startFinishOffsets,moved.timing.startFinishOffsets);assert.notEqual(reverse.design.revision,moved.design.revision);
 const net=I.network(pieces,model.definitions);for(const r of net.routes){const offset=reverse.timing.startFinishOffsets.find(o=>o.routeId===r.id).offsetMm,a=I.atTravel(r,0,offset,1),b=I.atTravel(r,0,offset,-1);assert.equal(a.x,b.x);assert.equal(a.y,b.y);assert.equal(b.heading,a.heading+180);assert.equal(b.curvature,-a.curvature);}
});
test('reverse preview still obeys acceleration and braking in travel direction',()=>{
 const out=oval(),model=F.validateLayout(out),route=I.network(model.pieces,model.definitions).routes[0],p=F.presets.Balanced;
 for(const direction of [1,-1]){const speed=I.travelPlan(route,p,834,direction);for(let d=0;d<route.lengthMm;d+=5){const a=(speed(d+1)**2-speed(d)**2)/2;assert.ok(a<=p.acceleration+.0001);assert.ok(a>=-p.brake-.0001);}}
});
test('changed topology requires remapping and changes revision; open intermediate retains baseline',()=>{
 const out=oval(),open=I.prepare({...out,pieces:out.pieces.slice(1)});assert.equal(open.timing.routeMappingRevision,out.timing.routeMappingRevision);
 const pieces=out.pieces.map(p=>p.id==='piece-00'?{...p,id:'replacement-piece'}:p),changed=I.prepare({...out,pieces},I.readState(open));assert.equal(changed.timing.requiresLaneRemap,true);assert.notEqual(changed.timing.routeMappingRevision,out.timing.routeMappingRevision);assert.notEqual(changed.design.revision,out.design.revision);assert.equal(changed.design.id,out.design.id);
 const duplicate=I.prepare(out,{...I.readState(out),designId:'new-design'});assert.notEqual(duplicate.design.id,out.design.id);assert.notEqual(duplicate.design.revision,out.design.revision);
});
test('open, disconnected and ambiguous layouts export no usable lap totals',()=>{
 const out=oval();for(const [pieces,code]of [[out.pieces.slice(1),'open-circuit'],[[...out.pieces,...out.pieces.map(p=>({...p,id:p.id+'b',x:p.x+5000}))],'disconnected-circuits'],[[...out.pieces,{...out.pieces[0],id:'overlap'}],'ambiguous-connections']]){const result=I.prepare({...out,pieces});assert.equal(result.track.laneCount,null);assert.deepEqual(result.track.slotCountsInDrawing,[2]);assert.equal(result.track.validClosedRouteCount,0);assert.deepEqual(result.track.lanes,[]);assert.ok(result.compatibility.issues.some(i=>i.code===code));}
});
test('lane changers keep through routes and explicitly report switching limitation',()=>{
 const out=oval(),p=out.definitions.find(d=>d.parameters.type==='straight').parameters;p.laneChange='both';p.switchStartMm=69;p.switchEndMm=276;const result=I.prepare(out);assert.equal(result.preparedGeometry.closed,true);assert.ok(result.preparedGeometry.alternateRoutes.length>0);assert.ok(result.compatibility.issues.some(i=>i.code==='lane-changing-branches'));
});
test('old v1, missing prepared geometry and missing image regenerate offline',()=>{
 const out=oval();delete out.preparedGeometry;const result=I.prepare(out);assert.equal(result.track.validClosedRouteCount,2);assert.equal(result.image,undefined);
 delete out.design;delete out.timing;delete out.integration;const legacy=I.importLayout(out);assert.ok(legacy.state.designId);assert.equal(legacy.state.startFinish,null);assert.equal(I.prepare(out,legacy.state).preparedGeometry.routes.length,2);
});
test('invalid dimensions/metadata reject and malicious derived data is ignored',()=>{
 const out=oval();assert.throws(()=>I.importLayout({...out,definitions:out.definitions.map(d=>({...d,parameters:{...d.parameters,widthMm:-1}}))}));
 for(const timing of [{version:2,direction:1},{version:1,direction:0},{version:1,direction:1,startFinish:{pieceId:'piece-00',fraction:1.1}}])assert.throws(()=>I.importLayout({...out,timing}));
 out.preparedGeometry={surfaces:[{outline:'<script>bad</script>'}]};assert.ok(!JSON.stringify(I.prepare(out)).includes('<script>'));
});
test('picture is transparent, bounded and contains only regenerated geometry',()=>{
 const out=oval(),pic=I.picture(out);assert.ok(pic.width<=1600&&pic.height<=1600);assert.ok(pic.svg.startsWith('<svg'));assert.ok(!/grid|selection|<script|<image|<rect/.test(pic.svg));assert.equal(I.picture(out,{maxDimension:99999}).width,2048);
 const border=F.validateDefinition({id:'border',name:'Border',parameters:{type:'straight-border',lengthMm:345,widthMm:100,side:'inner'}});out.definitions.push(border);out.pieces.push({...F.pose(border,0,5000),id:'border-placement'});assert.notEqual(I.picture(out).svg,I.picture(out,{borders:false}).svg);
});
test('explicit unsupported units reject at every integration boundary, before normalization',()=>{
 const valid=oval();for(const units of ['inches','cm','MM','',null,1,{},[],false,undefined]){
  const raw={...valid,units};for(const parse of [I.importLayout,I.prepare,r=>I.prepare(r,I.newState()),I.picture])assert.throws(()=>parse(raw),/Unsupported layout units/);
 }
});
test('millimetres and legacy omitted units remain supported',()=>{
 for(const explicit of [true,false]){const raw=oval();if(!explicit)delete raw.units;const imported=I.importLayout(raw),out=I.prepare(raw,imported.state);assert.equal(out.units,'mm');assert.deepEqual(out.track.lanes,raw.track.lanes);assert.equal(I.prepare(raw).units,'mm');}
});
test('unsupported and malformed contract versions reject before timing metadata',()=>{
 const valid=oval();for(const version of ['99.0.0','1.0.0','',null,1,{},[],false,undefined]){
  const raw={...valid,integration:{...valid.integration,contractVersion:version},timing:{version:99}};
  for(const parse of [I.importLayout,I.prepare,r=>I.prepare(r,I.newState()),I.picture])assert.throws(()=>parse(raw),/integration contract version/i);
 }
});
test('malformed integration objects and known metadata fields reject',()=>{
 const valid=oval();for(const integration of [null,undefined,[],true,1,'1.0.0-draft.1',{target:null},{status:[]},{image:3},{profilePurpose:{}},{target:''},{status:'x'.repeat(201)}]){
  const raw={...valid,integration};for(const parse of [I.importLayout,I.prepare,r=>I.prepare(r,I.newState()),I.picture])assert.throws(()=>parse(raw),/Invalid integration metadata/);
 }
});
test('supported contract, unversioned v0.1.3 and missing integration metadata all import',()=>{
 const base=oval(),old=JSON.parse(require('node:fs').readFileSync(require('node:path').join(__dirname,'../integration/slotforge-timing/fixtures/01-closed-oval.slotforge.json'),'utf8'));
 // Use the actual old export as well as additive metadata and the minimal legacy envelope.
 for(const raw of [base,old,{...base,integration:{futureAdditiveField:{data:true}}}]){const imported=I.importLayout(raw),out=I.prepare(raw,imported.state);assert.equal(out.integration.contractVersion,I.CONTRACT);assert.equal(out.preparedGeometry.closed,true);assert.equal(I.prepare(raw).integration.contractVersion,I.CONTRACT);}
 const missing=structuredClone(base);delete missing.integration;delete missing.units;assert.equal(I.prepare(missing,I.importLayout(missing).state).preparedGeometry.closed,true);
});
test('explicit state cannot bypass unknown timing versions or rewrite the incoming declaration',()=>{
 const raw=oval();raw.timing.version=99;for(const parse of [I.importLayout,I.prepare,r=>I.prepare(r,I.newState())])assert.throws(()=>parse(raw),/Unsupported timing/);
 const unsupported=oval();unsupported.units='inches';const before=structuredClone(unsupported);assert.throws(()=>I.prepare(unsupported));assert.deepEqual(unsupported,before);
});
test('ScaleAuto grid markings survive save/reopen and appear in regenerated pictures without changing slots',()=>{
 for(const sku of ['SC-10001C','SC-10001D']){
  const d=F.validateDefinition({id:'scaleauto:'+sku,name:'Starting grid',family:'scaleauto',sku,parameters:{type:'straight',lengthMm:400,widthMm:200,laneCount:2,laneSpacingMm:100}}),raw={format:'slotforge.layout',version:1,definitions:[d],pieces:[{...F.pose(d),angle:37,flip:true}]},copy=I.prepare(raw),restored=F.validateLayout(JSON.parse(JSON.stringify(copy))).definitions[d.id];
  assert.match(F.surfaceMarkings(restored),/scaleauto-start-grid/);assert.match(I.picture(copy).svg,/scaleauto-start-grid/);assert.ok(F.surfaceMarkings(restored,true).includes('#777777'));assert.deepEqual(restored.geometry.lanePaths,d.geometry.lanePaths);assert.equal(F.surfaceMarkings({...restored,sku:'SC-10001'}),'');
 }
});
test('Every buildable catalogue starting-grid variant has markings after validation and export',()=>{
 const fs=require('node:fs'),vm=require('node:vm'),context={window:{}};vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'catalogue.js'),'utf8'),context);
 const grids=context.window.TRACK_PACKS.flatMap(p=>p.pieces).filter(d=>d.parameters&&/start.*grid/i.test(d.name));assert.equal(grids.length,4);
 for(const raw of grids){const d=F.validateDefinition(JSON.parse(JSON.stringify(raw))),layout={format:'slotforge.layout',version:1,definitions:[d],pieces:[F.pose(d)]};assert.match(F.surfaceMarkings(d),/data-artwork=.*start-grid/,d.name);assert.match(I.picture(I.prepare(layout)).svg,/data-artwork=.*start-grid/,d.name);}
});
