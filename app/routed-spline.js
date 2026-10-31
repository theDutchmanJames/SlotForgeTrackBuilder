(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.RoutedSpline=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
// A cubic describes the middle of the slot bundle. All slots and verges are
// evaluated on its unit normal, never by scaling the cubic's control points.
const TYPE='routed-spline',EPS=.025,rad=d=>d*Math.PI/180,deg=r=>r*180/Math.PI;
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
function clearances(s){const metal=s.slotWidthMm/2+s.conductorGapMm+s.conductorWidthMm;return s.constructionMode==='table'?{first:metal,last:metal}:{first:s.innerClearanceMm,last:s.outerClearanceMm};}
function curve(raw){
 if(!Array.isArray(raw)||raw.length!==4||raw.some(p=>!Array.isArray(p)||p.length!==2||p.some(v=>!Number.isFinite(v)||Math.abs(v)>10000)))throw Error('A flowing curve needs four finite control points within ±10,000 mm.');
 const points=raw.map(p=>p.slice());if(distance(points[0],[0,0])>1e-9)throw Error('The flowing curve must start at its local origin.');
 if(distance(points[0],points[1])<1||distance(points[2],points[3])<1||distance(points[0],points[3])<1)throw Error('Separate the ends and give both direction handles at least 1 mm of length.');return points;
}
function evaluate(c,t){
 const u=1-t,p=[0,1].map(i=>u*u*u*c[0][i]+3*u*u*t*c[1][i]+3*u*t*t*c[2][i]+t*t*t*c[3][i]);
 const v=[0,1].map(i=>3*u*u*(c[1][i]-c[0][i])+6*u*t*(c[2][i]-c[1][i])+3*t*t*(c[3][i]-c[2][i]));
 const a=[0,1].map(i=>6*u*(c[2][i]-2*c[1][i]+c[0][i])+6*t*(c[3][i]-2*c[2][i]+c[1][i]));
 const speed=Math.hypot(...v);if(speed<.001)throw Error('The curve doubles back to a stationary point. Move its handles apart.');
 return{t,p,normal:[-v[1]/speed,v[0]/speed],heading:deg(Math.atan2(v[1],v[0])),curvature:(v[0]*a[1]-v[1]*a[0])/speed**3};
}
const offset=(q,d)=>[q.p[0]+q.normal[0]*d,q.p[1]+q.normal[1]*d];
const path=points=>'M '+points.map(p=>p.map(v=>Number(v.toFixed(6))).join(' ')).join(' L ');
const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
function intersects(a,b,c,d){
 if(Math.max(a[0],b[0])<Math.min(c[0],d[0])-1e-7||Math.max(c[0],d[0])<Math.min(a[0],b[0])-1e-7||Math.max(a[1],b[1])<Math.min(c[1],d[1])-1e-7||Math.max(c[1],d[1])<Math.min(a[1],b[1])-1e-7)return false;
 return cross(a,b,c)*cross(a,b,d)<=0&&cross(c,d,a)*cross(c,d,b)<=0;
}
function simple(poly,closed){const n=poly.length-(closed?0:1);for(let i=0;i<n;i++)for(let j=i+2;j<n;j++){if(closed&&i===0&&j===n-1)continue;if(intersects(poly[i],poly[(i+1)%poly.length],poly[j],poly[(j+1)%poly.length]))return false;}return true;}
function samples(c,lo,hi,s){
 const cache=new Map(),at=t=>{if(!cache.has(t))cache.set(t,evaluate(c,t));return cache.get(t);};
 // Dense curvature checks catch folds between visible handles. Adaptive normal
 // sampling then bounds drawing/chord error and avoids speed jumps at vertices.
 let worst=null;for(let i=0;i<=2048;i++){const q=at(i/2048);for(const [side,d]of [['first',lo],['last',hi]]){const factor=1-d*q.curvature;if(!worst||factor<worst.factor)worst={side,offsetMm:d,factor,t:q.t,curvature:q.curvature};}}
 if(worst.factor<=.002){const lane=worst.side==='first'?1:s.laneCount,edges=clearances(s),clearanceMm=worst.side==='first'?edges.first:edges.last,slotRadiusMm=1/Math.abs(worst.curvature)-(s.laneCount-1)*s.laneSpacingMm/2,kind=slotRadiusMm<=0?'slot':s.constructionMode==='table'?'conductor':'surface',message=kind==='slot'?`Lane ${lane} folds inside this bend. Widen the curve or reduce lane spacing.`:kind==='conductor'?`The conductor beside Lane ${lane} pinches or folds inside this bend. Widen the curve or reduce lane spacing; tabletop routing still needs room for the slot and conductor.`:`The piece edge beyond Lane ${lane} pinches or folds: the slot radius there is ${slotRadiusMm.toFixed(1)} mm, but that edge clearance is ${clearanceMm} mm. Widen the curve, shorten this clearance, or choose Tabletop routing if this section belongs to one continuous board.`;const error=Error(message);error.code='ROUTED_OFFSET_FOLD';error.fold={...worst,lane,clearanceMm,slotRadiusMm,kind};throw error;}
 const out=[at(0)];
 function split(a,b,depth){
  const mid=(a.t+b.t)/2,m=at(mid);let error=0;
  for(const d of[lo,0,hi]){const pa=offset(a,d),pb=offset(b,d);for(const f of[.25,.5,.75]){const q=offset(at(a.t+(b.t-a.t)*f),d);error=Math.max(error,distance(q,[pa[0]+(pb[0]-pa[0])*f,pa[1]+(pb[1]-pa[1])*f]));}}
  const turn=Math.max(Math.abs(Math.atan2(Math.sin(rad(m.heading-a.heading)),Math.cos(rad(m.heading-a.heading)))),Math.abs(Math.atan2(Math.sin(rad(b.heading-m.heading)),Math.cos(rad(b.heading-m.heading)))));
  if(b.t-a.t>1/32||error>EPS||turn>rad(1)){if(depth===0)throw Error('This curve is too complex to sample accurately. Spread its handles.');split(a,m,depth-1);split(m,b,depth-1);}else out.push(b);
 }
 split(at(0),at(1),14);if(out.length>4097)throw Error('Use shorter sections for this flowing curve.');return out;
}
function polyline(qs,d){
 const points=qs.map(q=>offset(q,d)),distancesMm=[0];for(let i=1;i<points.length;i++)distancesMm.push(distancesMm[i-1]+distance(points[i-1],points[i]));
 return{type:'polyline',samplingTargetMm:EPS,points,distancesMm,headingsDeg:qs.map(q=>q.heading),curvaturesPerMm:qs.map(q=>q.curvature/(1-d*q.curvature)),lengthMm:distancesMm.at(-1)};
}
const cache=new Map();
function derive(p){
 const key=JSON.stringify([p.controlPointsMm,p.routed]);if(cache.has(key))return cache.get(key);
 const c=curve(p.controlPointsMm),s=p.routed,edges=clearances(s),span=(s.laneCount-1)*s.laneSpacingMm,lo=-span/2-edges.first,hi=span/2+edges.last,qs=samples(c,lo,hi,s),reference=polyline(qs,0),fractions=reference.distancesMm.map(d=>d/reference.lengthMm);
 const first=qs.map(q=>offset(q,lo)),last=qs.map(q=>offset(q,hi)),outline=first.concat(last.slice().reverse());
 if(!simple(outline,true))throw Error('The flowing surface crosses itself. Separate its ends or spread its handles.');
 const lanePaths=Array.from({length:s.laneCount},(_,i)=>{const d=-span/2+i*s.laneSpacingMm,segment={...polyline(qs,d),referenceFractions:fractions};if(!simple(segment.points,false))throw Error('A slot crosses itself. Open up this curve.');return{id:'lane-'+(i+1),start:segment.points[0],end:segment.points.at(-1),segments:[segment],lengthMm:segment.lengthMm,d:path(segment.points)};});
 const conductors=lanePaths.map((l,i)=>{const d=-span/2+i*s.laneSpacingMm,delta=s.slotWidthMm/2+s.conductorGapMm+s.conductorWidthMm/2;return[-1,1].map(sign=>path(qs.map(q=>offset(q,d+sign*delta))));});
 const minRadiiMm=lanePaths.map((l,i)=>{const d=-span/2+i*s.laneSpacingMm;let max=0;for(let j=0;j<=2048;j++){const k=evaluate(c,j/2048).curvature;max=Math.max(max,Math.abs(k/(1-d*k)));}return max?1/max:null;});
 const xs=outline.map(p=>p[0]),ys=outline.map(p=>p[1]);let area=0;for(let i=0;i<outline.length;i++){const a=outline[i],b=outline[(i+1)%outline.length];area+=a[0]*b[1]-b[0]*a[1];}
 const g={outlineSvgPath:path(outline)+' Z',sampledOutline:outline,boundsMm:[Math.min(...xs),Math.min(...ys),Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys)],lanePaths,centrelineLengthMm:polyline(qs,(lo+hi)/2).lengthMm,reference,parametersT:qs.map(q=>q.t),conductors,minRadiiMm,surfaceAreaMm2:Math.abs(area)/2,samplingToleranceMm:EPS,connectors:[{id:'a',position:[0,0],outwardAngleDeg:qs[0].heading+180},{id:'b',position:c[3].slice(),outwardAngleDeg:qs.at(-1).heading}]};
 for(const port of g.connectors)port.lanes=lanePaths.map(l=>({pathId:l.id,position:port.id==='a'?l.start:l.end}));
 if(cache.size>=32)cache.delete(cache.keys().next().value);cache.set(key,g);return g;
}
function geometry(p){return structuredClone(derive(p));}
function validate(p){derive(p);}
function interval(values,value){let lo=0,hi=values.length-1;while(lo+1<hi){const mid=(lo+hi)>>1;if(values[mid]<=value)lo=mid;else hi=mid;}return{lo,hi,f:(value-values[lo])/(values[hi]-values[lo]||1)};}
function at(segment,d){const {lo,hi,f}=interval(segment.distancesMm,Math.max(0,Math.min(segment.lengthMm,d))),a=segment.points[lo],b=segment.points[hi],ha=segment.headingsDeg[lo],hb=segment.headingsDeg[hi],turn=deg(Math.atan2(Math.sin(rad(hb-ha)),Math.cos(rad(hb-ha))));return{x:a[0]+(b[0]-a[0])*f,y:a[1]+(b[1]-a[1])*f,heading:ha+turn*f,curvature:segment.curvaturesPerMm[lo]*(1-f)+segment.curvaturesPerMm[hi]*f};}
function distanceAtFraction(segment,fraction){const {lo,hi,f}=interval(segment.referenceFractions,Math.max(0,Math.min(1,fraction)));return segment.distancesMm[lo]+(segment.distancesMm[hi]-segment.distancesMm[lo])*f;}
function crossSection(p,g,fraction){const {lo,hi,f}=interval(g.reference.distancesMm,fraction*g.reference.lengthMm),t=g.parametersT[lo]+(g.parametersT[hi]-g.parametersT[lo])*f,q=evaluate(p.controlPointsMm,t),s=p.routed,edges=clearances(s),span=(s.laneCount-1)*s.laneSpacingMm;return[offset(q,-span/2-edges.first),offset(q,span/2+edges.last)];}
function preset(name,s){const r=Math.max(600,((s.laneCount-1)*s.laneSpacingMm+s.innerClearanceMm+s.outerClearanceMm)*1.1),k=.5522847498307936;if(name==='s-bend')return[[0,0],[r*.65,r*.3],[r*1.35,-r*.3],[r*2,0]];if(name==='transition')return[[0,0],[r*.6,0],[r*1.4,0],[r*2,0]];return[[0,0],[r*k,0],[r,r*(1-k)],[r,r]];}
return{TYPE,EPS,clearances,curve,evaluate,offset,path,geometry,validate,at,distanceAtFraction,crossSection,preset};
});
