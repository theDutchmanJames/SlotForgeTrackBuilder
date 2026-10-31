const test=require('node:test'),assert=require('node:assert/strict');
const F=require('./core.js'),FF=F.FreeForm,R=F.Routed,C=require('./routed-checks.js'),I=require('./integration.js'),CAD=require('./cad-export.js');
const settings=(n=1,extra={})=>R.settings({...R.defaults,laneCount:n,constructionMode:'table',...extra});
const elevation=(start,end=start)=>({version:1,startMm:start,endMm:end,thicknessMm:12,clearanceMm:60});
const raw=(d,p)=>({format:'slotforge.layout',version:1,title:'Review regression',definitions:[d],pieces:[p||F.pose(d)]});

test('A single FreeForm lane respects both requested table-edge clearances',()=>{
 const s=settings(1,{innerClearanceMm:10,outerClearanceMm:200}),m=FF.append(FF.append(FF.empty(),[100,100]),[900,100]),d=FF.definition(m,s);
 const table={x:0,y:0,lengthMm:1000,widthMm:1000,kind:'table',locked:true};
 assert.ok(FF.check(d,table).some(i=>i.code==='table-clearance'));
 assert.ok(FF.check(FF.definition(m,settings(1,{innerClearanceMm:200,outerClearanceMm:10})),table).some(i=>i.code==='table-clearance'));
});
test('Moved and reflected FreeForm layouts check and export in world coordinates without revalidating world positions as local anchors',()=>{
 const d=FF.definition(FF.oval(settings(2)),settings(2)),p={...F.pose(d,60000,70000),angle:35,flip:true},before=structuredClone(d);
 const b=F.bounds([p],{[d.id]:d}),table={x:b[0]-500,y:b[1]-500,lengthMm:b[2]+1000,widthMm:b[3]+1000,kind:'table',locked:true};
 const issues=C.checks([p],{[d.id]:d},table);assert.ok(!issues.some(i=>i.code==='table'||i.code==='table-clearance'));
 assert.ok(C.checks([p],{[d.id]:d},{...table,x:0,y:0}).some(i=>i.code==='table'));
 assert.doesNotThrow(()=>CAD.build({...raw(d,p),workspace:{spaceGuide:table}}));assert.deepEqual(d,before);
});
test('Editing far-away FreeForm placements preserves all world slot positions and stable identities',()=>{
 const s=settings(4),m=FF.oval(s);m.nodes[0].squeeze={version:1,spacingMm:80,domain:[0,1]};
 const d=FF.definition(m,s),p={...F.pose(d,100000,-80000),angle:43,flip:true},frame=FF.editingFrame(m,p),next=FF.definition(frame.model,s),np={...p,x:frame.offset[0],y:frame.offset[1],angle:0,flip:false};
 assert.ok(frame.offset.some(Boolean));assert.deepEqual(frame.model.laneIds,m.laneIds);
 for(let i=0;i<4;i++){const a=d.geometry.lanePaths[i].segments[0],b=next.geometry.lanePaths[i].segments[0];for(const f of[0,.2,.6,1]){const x=R.Spline.at(a,a.lengthMm*f),y=R.Spline.at(b,b.lengthMm*f);assert.ok(F.dist(F.point([x.x,x.y],p),F.point([y.x,y.y],np))<.05);}}
 assert.deepEqual(I.prepare(raw(d,p)).track.lanes.map(l=>l.id),I.prepare(raw(next,np)).track.lanes.map(l=>l.id));
});
test('Out-of-range drawing clicks cannot leave an unsaveable FreeForm model',()=>{
 const m=FF.empty(),before=structuredClone(m);for(const p of[[50001,0],[0,Infinity],[NaN,0]])assert.throws(()=>FF.append(m,p),/50,000/);assert.deepEqual(m,before);
});
test('Proportional L-table shrinking preserves all proportions at the smallest legal leg',()=>{
 const g={x:0,y:0,lengthMm:3000,widthMm:1000,locked:false,shape:{type:'l',corner:'bottom-left',cutoutLengthMm:2990,cutoutWidthMm:500}};
 const same=F.resizeSpaceGuide(g,-2900,-900,true);assert.deepEqual(same,g);
 const bigger={...g,shape:{...g.shape,cutoutLengthMm:2900}},small=F.resizeSpaceGuide(bigger,-2900,-900,true),factor=small.lengthMm/bigger.lengthMm;
 assert.equal(small.widthMm/bigger.widthMm,factor);assert.equal(small.shape.cutoutWidthMm/bigger.shape.cutoutWidthMm,factor);assert.equal(small.shape.cutoutLengthMm/bigger.shape.cutoutLengthMm,factor);
});
test('Closing elevated routed chains matches fixed endpoint heights for new and reshaped sections',()=>{
 for(const replace of[false,true]){const a=F.validateLayout(require('../integration/slotforge-timing/routed-examples/closed-routed-oval.slotforge.json')),items=a.pieces.slice(1).map(p=>({...p,elevation:elevation(100)})),connection=C.closeLoopDraft(items,a.definitions,replace?items[0].id:null),d=R.definition(connection.settings,{type:'routed-spline',controlPointsMm:connection.controlPointsMm}),out=C.applyClosure(items,a.definitions,connection,d);
 assert.equal(F.routes(out.items,out.definitions).closed,true);assert.equal(out.items.find(p=>p.id===out.selectId).elevation.startMm,100);assert.equal(out.items.find(p=>p.id===out.selectId).elevation.endMm,100);assert.equal(out.items.find(p=>p.id===out.selectId).elevation.clearanceMm,60);}
});
test('Gap placement interpolates between two different fixed heights',()=>{
 const s=settings(2),d=R.definition(s,{type:'straight',lengthMm:1000}),a={...F.pose(d),elevation:elevation(20)},b={...F.pose(d,2000,0),elevation:elevation(150)},defs={[d.id]:d},connection={pose:{x:1000,y:0,angle:0,flip:false},targets:[F.ports(a,defs)[1],F.ports(b,defs)[0]]};
 const p=C.connectionPlacement([a,b],defs,connection,d);assert.deepEqual([p.elevation.startMm,p.elevation.endMm],[20,150]);assert.equal(F.connections([a,p,b],defs).links.size,4);
});
test('Endpoint magnets do not pretend to connect track ends with incompatible heights',()=>{
 const d=R.definition(settings(2),{type:'straight',lengthMm:1000}),defs={[d.id]:d},a={...F.pose(d),elevation:elevation(100)},b=F.pose(d,1020,0);
 assert.notEqual(F.snap(b,[a],defs,40)?.kind,'end');b.elevation=elevation(100);assert.equal(F.snap(b,[a],defs,40)?.kind,'end');
});

test('Import merging cannot replace incoming FreeForm reflection permissions with an existing definition',()=>{
 const s=settings(2),a=F.validateDefinition(FF.definition(FF.oval(s),s)),b=F.validateDefinition({...a,mirror:false,color:'#123456'}),p=F.pose(b),result=F.mergeDefinitions({[b.id]:b},[p],{[a.id]:a});
 assert.notEqual(result.pieces[0].definitionId,a.id);assert.equal(result.definitions[result.pieces[0].definitionId].mirror,false);assert.equal(result.definitions[result.pieces[0].definitionId].color,'#123456');assert.equal(a.mirror,true);
});
