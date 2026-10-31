(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./core.js'));else root.RoutedChecks=factory(root.Forge);})(typeof globalThis!=='undefined'?globalThis:this,function(F){
'use strict';
function reflow(items,defs,replacements,anchorId,flips=new Map()){
 const nextDefs={...defs},next=items.map(p=>({...p})),old=F.connections(items,defs),byId=new Map(next.map(p=>[p.id,p])),visited=new Set();
 for(const [id,d]of replacements){nextDefs[d.id]=d;byId.get(id).definitionId=d.id;if(flips.has(id))byId.get(id).flip=flips.get(id);}
 const seeds=[...replacements.keys()].sort((a,b)=>a===anchorId?-1:b===anchorId?1:0);
 for(const id of seeds){if(visited.has(id))continue;const seed=byId.get(id),previous=items.find(p=>p.id===id),oldPort=F.ports(previous,defs)[0],newPort=F.ports(seed,nextDefs)[0];seed.x+=oldPort.position[0]-newPort.position[0];seed.y+=oldPort.position[1]-newPort.position[1];visited.add(id);const queue=[seed];
  while(queue.length){const p=queue.shift();for(const port of F.ports(p,nextDefs)){const link=old.links.get(p.id+':'+port.index);if(!link||visited.has(link.pieceId))continue;const child=byId.get(link.pieceId);if(!nextDefs[child.definitionId].parameters.routed)continue;const childPort=F.ports(child,nextDefs)[link.index];if(!F.compatible(childPort,port))continue;const joined=F.join(child,nextDefs[child.definitionId],link.index,port);Object.assign(child,joined);visited.add(child.id);queue.push(child);}}
 }
 if(next.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)||Math.abs(p.x)>1000000||Math.abs(p.y)>1000000))throw Error('Updated sections would exceed the workspace coordinate limit.');
 return{items:next,definitions:nextDefs};
}
const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
function inside(p,poly,bounds){if(bounds&&(p[0]<bounds[0]||p[1]<bounds[1]||p[0]>bounds[0]+bounds[2]||p[1]>bounds[1]+bounds[3]))return false;let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[j],b=poly[i],dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy);if(length&&Math.abs(cross(a,b,p))/length<.02&&p[0]>=Math.min(a[0],b[0])-.02&&p[0]<=Math.max(a[0],b[0])+.02&&p[1]>=Math.min(a[1],b[1])-.02&&p[1]<=Math.max(a[1],b[1])+.02)return false;if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
function polygonBounds(poly){let x=Infinity,y=Infinity,xx=-Infinity,yy=-Infinity;for(const p of poly){x=Math.min(x,p[0]);y=Math.min(y,p[1]);xx=Math.max(xx,p[0]);yy=Math.max(yy,p[1]);}return[x,y,xx-x,yy-y];}
function arcExtrema(segment,placement){const angles=[segment.startAngleDeg,segment.startAngleDeg+segment.sweepDeg],sign=Math.sign(segment.sweepDeg)||1;for(const world of[0,90,180,270]){const local=(world-placement.angle)*(placement.flip?-1:1),delta=(((local-segment.startAngleDeg)*sign)%360+360)%360;if(delta<=Math.abs(segment.sweepDeg)+1e-9)angles.push(segment.startAngleDeg+sign*delta);}return angles.map(a=>F.point([segment.center[0]+segment.radiusMm*Math.cos(F.rad(a)),segment.center[1]+segment.radiusMm*Math.sin(F.rad(a))],placement));}
function overlap(a,b,ba=polygonBounds(a),bb=polygonBounds(b)){
 if(a.length===b.length&&ba.every((v,i)=>Math.abs(v-bb[i])<.01)){const key=p=>p.map(v=>Math.round(v*10000)).join(','),points=new Set(b.map(key));if(a.every(p=>points.has(key(p))))return true;}
 if(a.some(p=>inside(p,b,bb))||b.some(p=>inside(p,a,ba)))return true;
 const segments=(poly,box)=>poly.map((p,i)=>[p,poly[(i+1)%poly.length]]).filter(([p,q])=>Math.max(p[0],q[0])>=box[0]&&Math.min(p[0],q[0])<=box[0]+box[2]&&Math.max(p[1],q[1])>=box[1]&&Math.min(p[1],q[1])<=box[1]+box[3]);
 for(const [a0,a1]of segments(a,bb))for(const[b0,b1]of segments(b,ba)){if(Math.max(a0[0],a1[0])<Math.min(b0[0],b1[0])||Math.max(b0[0],b1[0])<Math.min(a0[0],a1[0])||Math.max(a0[1],a1[1])<Math.min(b0[1],b1[1])||Math.max(b0[1],b1[1])<Math.min(a0[1],a1[1]))continue;if(cross(a0,a1,b0)*cross(a0,a1,b1)<-.0001&&cross(b0,b1,a0)*cross(b0,b1,a1)<-.0001)return true;}
 // Coincident rectangles can have all vertices on the boundary.
 if(a.some((p,i)=>inside([(p[0]+a[(i+1)%a.length][0])/2,(p[1]+a[(i+1)%a.length][1])/2],b,bb)))return true;
 // Coincident boundaries can have different sampling densities. Probe the
 // interior side of an edge, rather than relying on equal vertex counts.
 let area=0;for(let i=0;i<a.length;i++){const p=a[i],q=a[(i+1)%a.length];area+=p[0]*q[1]-q[0]*p[1];}
 return a.some((p,i)=>{const q=a[(i+1)%a.length],length=F.dist(p,q);if(!length)return false;const sign=area>0?1:-1,point=[(p[0]+q[0])/2-sign*(q[1]-p[1])*.05/length,(p[1]+q[1])/2+sign*(q[0]-p[0])*.05/length];return inside(point,b,bb)&&inside(point,a,ba);});
}
function checks(items,defs,table){
 const roads=items.filter(p=>defs[p.definitionId].parameters.routed),issues=[];
 const warn=(code,message,ids=[])=>issues.push({code,message,pieceIds:ids});
 const tooTight=roads.filter(p=>F.Routed.minimumRadii(defs[p.definitionId]).some(r=>r!==null&&r<defs[p.definitionId].parameters.routed.minRadiusMm));
 if(tooTight.length)warn('radius',tooTight.length+' corner(s) are tighter than the chosen minimum slot radius.',tooTight.map(p=>p.id));
 const outlines=roads.map(p=>{const d=defs[p.definitionId],q=d.parameters,poly=F.outline(d).map(q=>F.point(q,p)),extrema=q.type==='curve'?[q.innerRadiusMm,q.innerRadiusMm+q.widthMm].flatMap(radiusMm=>arcExtrema({...d.geometry.lanePaths[0].segments[0],radiusMm},p)):poly;return{p,poly,extrema,b:F.bounds([p],defs)};});
 const tabletop=roads.filter(p=>defs[p.definitionId].parameters.routed.constructionMode==='table');
 if(table){const outside=outlines.filter(({extrema})=>extrema.some(([x,y])=>x<table.x-.1||y<table.y-.1||x>table.x+table.lengthMm+.1||y>table.y+table.widthMm+.1));if(outside.length)warn('table',outside.length+' piece outline(s) or routing path(s) extend beyond the '+(table.kind==='table'?'table.':'available-space guide.'),outside.map(v=>v.p.id));}
 if(table?.kind==='table'){
  const close=[];for(const p of tabletop){const d=defs[p.definitionId],s=d.parameters.routed;for(const [index,clearance]of [[0,s.innerClearanceMm],[s.laneCount-1,s.outerClearanceMm]]){const segment=d.geometry.lanePaths[index].segments[0],points=segment.type==='polyline'?segment.points.map(q=>F.point(q,p)):segment.type==='line'?[segment.from,segment.to].map(q=>F.point(q,p)):arcExtrema(segment,p);if(points.some(([x,y])=>Math.min(x-table.x,y-table.y,table.x+table.lengthMm-x,table.y+table.widthMm-y)<clearance-.1)){close.push(p.id);break;}}}
  if(close.length)warn('table-clearance',close.length+' tabletop section(s) are closer to the table boundary than their requested Lane 1 / last-lane edge clearances. These are table-edge guidelines, not separate piece outlines.',close);
 }else if(tabletop.length)warn('table-missing','Add a Wood / MDF table to check tabletop routing clearances against the board boundary. An available-space guide is not a physical table.',tabletop.map(p=>p.id));
 let pairs=0;for(let i=0;i<outlines.length;i++)for(let j=i+1;j<outlines.length;j++){const a=outlines[i],b=outlines[j];if(Math.min(a.b[0]+a.b[2],b.b[0]+b.b[2])-Math.max(a.b[0],b.b[0])<.05||Math.min(a.b[1]+a.b[3],b.b[1]+b.b[3])-Math.max(a.b[1],b.b[1])<.05)continue;if(overlap(a.poly,b.poly,a.b,b.b))pairs++;}
 if(pairs)warn('overlap',pairs+(tabletop.length?' piece/routing footprint overlap(s)':' routed surface overlap(s)')+' found in the top view. Overpasses need separate height checks.');
 const net=F.connections(roads,defs);if(roads.length&&net.open.length)warn('open',net.open.length+' routed ends are open. Match both the slots and their direction.');if(net.ambiguous.size)warn('ambiguous','Multiple sections share a routed connection.');
 let steps=0;const done=new Set();
 const edge=(p,index)=>{const d=defs[p.definitionId],q=d.parameters;return(q.type==='routed-spline'?F.Routed.Spline.crossSection(q,d.geometry,index):q.type==='straight'?[[index?q.lengthMm:0,0],[index?q.lengthMm:0,q.widthMm]]:[F.G.pt(q.innerRadiusMm,F.rad(index?q.angleDeg:0)),F.G.pt(q.innerRadiusMm+q.widthMm,F.rad(index?q.angleDeg:0))]).map(v=>F.point(v,p));};
 for(const a of net.all){const b=net.links.get(a.pieceId+':'+a.index);if(!b)continue;const pa=items.find(p=>p.id===a.pieceId),pb=items.find(p=>p.id===b.pieceId);if([pa,pb].some(p=>defs[p.definitionId].parameters.routed.constructionMode==='table'))continue;const key=[a.pieceId+':'+a.index,b.pieceId+':'+b.index].sort().join('|');if(done.has(key))continue;done.add(key);const axis=[-Math.sin(F.rad(a.angle)),Math.cos(F.rad(a.angle))],project=points=>points.map(q=>(q[0]-a.position[0])*axis[0]+(q[1]-a.position[1])*axis[1]).sort((x,y)=>x-y),aa=project(edge(pa,a.index)),bb=project(edge(pb,b.index));if(aa.some((v,i)=>Math.abs(v-bb[i])>.5))steps++;}
 if(steps)warn('verge-step',steps+' join(s) have a step in the surface edges. Equal verges avoid this; blend unequal verges during construction.');
 const proud=roads.filter(p=>{const s=defs[p.definitionId].parameters.routed;return s.conductorThicknessMm+s.adhesiveThicknessMm-(s.conductor==='tape'?0:s.recessDepthMm)>.05;});if(proud.length)warn('conductor-height',proud.length+' section(s) have conductor above the surface. Check the intended tape/braid installation.');
 return issues;
}
function bridgeDraft(items,defs,selectedIds){
 const chosen=new Set(selectedIds),roads=items.filter(p=>chosen.has(p.id)&&defs[p.definitionId].parameters.routed);if(chosen.size!==2||roads.length!==2)throw Error('Select two routed sections with an open end each, then choose Bridge gap.');
 const open=F.connections(items,defs).open.filter(p=>chosen.has(p.pieceId)),pairs=[];for(const a of open)for(const b of open)if(a.pieceId===roads[0].id&&b.pieceId===roads[1].id&&F.compatible(a,b)&&F.dist(a.position,b.position)>=1)pairs.push({a,b,length:F.dist(a.position,b.position)});
 pairs.sort((a,b)=>a.length-b.length);if(!pairs.length)throw Error('These sections need two distinct open ends with matching lane spacing and count.');
 const {a,b,length}=pairs[0],angle=F.rad(a.angle),dx=b.position[0]-a.position[0],dy=b.position[1]-a.position[1],end=[dx*Math.cos(angle)+dy*Math.sin(angle),-dx*Math.sin(angle)+dy*Math.cos(angle)],h=length/3,exit=F.rad(b.angle+180-a.angle);
 return{settings:defs[roads[0].definitionId].parameters.routed,controlPointsMm:[[0,0],[h,0],[end[0]-h*Math.cos(exit),end[1]-h*Math.sin(exit)],end],pose:{x:a.position[0],y:a.position[1],angle:a.angle,flip:false},targets:[a,b]};
}
// Closing a circuit only changes the new/replacement section. In particular,
// do not use reflow here: that would move the far end we are trying to reach.
function closureStamp(items,defs){return JSON.stringify([items,items.map(p=>defs[p.definitionId].parameters)]);}
function openRoutedChain(items,defs){
 const roads=items.filter(p=>{const g=defs[p.definitionId].geometry;return(g?.planningConnectors||g?.connectors)?.length;});
 if(roads.some(p=>!defs[p.definitionId].parameters.routed))throw Error('Close loop is only available for a layout made of routed wood sections.');
 if(roads.length<2)throw Error('Add at least two connected routed sections before closing the loop.');
 const net=F.connections(roads,defs);
 if(net.ambiguous.size)throw Error('Resolve overlapping or ambiguous connections before closing the loop.');
 if(!net.open.length)throw Error('This routed layout already has no open ends.');
 if(net.open.length!==2)throw Error('Close loop needs one connected routed track with exactly two open ends. Connect the other gaps first.');
 const visited=new Set(),queue=[roads[0].id];while(queue.length){const id=queue.shift();if(visited.has(id))continue;visited.add(id);for(const port of net.all.filter(p=>p.pieceId===id)){const link=net.links.get(id+':'+port.index);if(link)queue.push(link.pieceId);}}
 if(visited.size!==roads.length)throw Error('Close loop needs one connected routed track. Separate circuits cannot be closed together.');
 return{roads,net};
}
function fittedConnection(a,b,settings,flip){
 if(!F.compatible(a,b))throw Error('The two ends must have matching slot spacing and lane count.');
 const length=F.dist(a.position,b.position);if(length<1)throw Error('These ends are too close for a connecting curve. Adjust their position or direction first.');
 const angle=F.rad(a.angle),sign=flip?-1:1,dx=b.position[0]-a.position[0],dy=b.position[1]-a.position[1],end=[dx*Math.cos(angle)+dy*Math.sin(angle),sign*(-dx*Math.sin(angle)+dy*Math.cos(angle))],exit=F.rad(F.wrap(b.angle+180-a.angle)*sign);
 const points=(u,v)=>[[0,0],[length*u,0],[end[0]-length*v*Math.cos(exit),end[1]-length*v*Math.sin(exit)],end];
 // Try a bounded set of handle lengths. Prefer the user's minimum radius;
 // if it cannot be met, keep the valid candidate with the gentlest tight bend.
 let best=null,score=-Infinity;
 for(const [u,v]of [[1/3,1/3],[.5,.5],[.2,.2],[.65,.65],[.85,.85],[.2,.5],[.5,.2],[.35,.65],[.65,.35]]){
  const c=points(u,v);try{const d=F.Routed.definition(settings,{type:'routed-spline',controlPointsMm:c}),r=Math.min(...d.geometry.minRadiiMm.map(v=>v===null?Infinity:v));if(r>score){best=c;score=r;}if(r>=settings.minRadiusMm)break;}catch{/* The preview explains any remaining invalid geometry. */}
 }
 return{settings,controlPointsMm:best||points(1/3,1/3),pose:{x:a.position[0],y:a.position[1],angle:F.wrap(a.angle),flip},targets:[a,b]};
}
function closeLoopDraft(items,defs,replaceId=null){
 const {roads,net}=openRoutedChain(items,defs);let a,b,source,flip;
 if(replaceId){
  source=roads.find(p=>p.id===replaceId);if(!source)throw Error('Select one routed section at an open end to reshape.');
  const free=net.open.find(p=>p.pieceId===replaceId);if(!free)throw Error('Select a section at either open end. An interior section cannot close this gap without moving the rest of the track.');
  const other=net.open.find(p=>p.pieceId!==replaceId),linked=net.links.get(replaceId+':'+(1-free.index));
  if(!other||!linked)throw Error('The selected section must have one connected end and one open end.');
  [a,b]=free.index===0?[other,linked]:[linked,other];
  flip=!!source.flip!==(defs[source.definitionId].parameters.type==='curve');
 }else{
  if(items.length>=500)throw Error('The layout already has 500 pieces. Reshape an end section instead.');
  [a,b]=net.open;source=roads.find(p=>p.id===a.pieceId);
  flip=Boolean((source.flip?1:0)^(defs[source.definitionId].parameters.type==='curve'?1:0)^(a.index===0?1:0));
 }
 const connection=fittedConnection(a,b,defs[source.definitionId].parameters.routed,flip);
 return{...connection,...(replaceId&&defs[source.definitionId].parameters.squeeze?{squeeze:structuredClone(defs[source.definitionId].parameters.squeeze)}:{}),closeLoop:true,replaceId,originalStamp:closureStamp(items,defs)};
}
function applyClosure(items,defs,connection,definition){
 if(!connection.closeLoop||closureStamp(items,defs)!==connection.originalStamp)throw Error('The layout changed while the closing preview was open. Close it and try again.');
 const d=F.validateDefinition(definition),nextDefs={...defs,[d.id]:d};
 if(!d.parameters.routed||d.parameters.type!=='routed-spline')throw Error('Closing a loop requires a routed flowing section.');
 const old=items.find(p=>p.id===connection.replaceId),p={...(old||F.pose(d)),...connection.pose,definitionId:d.id},ports=F.ports(p,nextDefs);
 for(let i=0;i<2;i++){const target=connection.targets[i];if(F.dist(ports[i].position,target.position)>.1||Math.abs(Math.abs(F.wrap(ports[i].angle-target.angle))-180)>.1||!F.compatible(ports[i],target)||!F.slotsMatch(ports[i],target,.1))throw Error('The closing curve must match both fixed ends and every slot.');}
 const next=connection.replaceId?items.map(v=>v.id===connection.replaceId?p:v):[...items,p],roads=next.filter(v=>nextDefs[v.definitionId].parameters.routed),net=F.connections(roads,nextDefs);
 if(net.open.length||net.ambiguous.size)throw Error('This curve does not form an unambiguous closed loop. Adjust its handles or the layout.');
 return{items:next,definitions:nextDefs,selectId:p.id};
}
return{reflow,checks,overlap,bridgeDraft,closeLoopDraft,applyClosure};
});
