(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./core.js'),require('./track-exports.js'),require('./routed-checks.js'));else root.TrackCAD=factory(root.Forge,root.TrackExports,root.RoutedChecks);})(typeof globalThis!=='undefined'?globalThis:this,function(F,X,C){
'use strict';
const R=F.Routed,S=R.Spline,TOL=.00001;
const defaults={slots:true,slotEdges:false,conductors:false,surfaces:true,table:true,timing:false,scale:false};
const layers={SLOT_CENTRES:{label:'Slot centrelines',color:'#2563a5',aci:5},SLOT_EDGES:{label:'Slot edges',color:'#cc4040',aci:1},BRAID_EDGES:{label:'Braid edges',color:'#946300',aci:3},TAPE_EDGES:{label:'Copper tape edges',color:'#a35722',aci:30},SURFACE_EDGES:{label:'Track surface contours',color:'#444c55',aci:7},TABLE:{label:'Table outline',color:'#7b8794',aci:8},TIMING_LINE:{label:'Timing reference',color:'#8947ac',aci:6},SCALE_CHECK:{label:'100 mm scale check',color:'#111827',aci:7}};
const number=v=>{if(!Number.isFinite(v))throw Error('CAD geometry must contain finite coordinates.');return String(Number(v.toFixed(6)));};
const bulgeNumber=v=>String(Number(v.toFixed(12)));
const xml=v=>String(v).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/g,'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
function options(raw={}){if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Invalid CAD export options.');const out={...defaults};for(const key of Object.keys(defaults))if(raw[key]!==undefined){if(typeof raw[key]!=='boolean')throw Error('CAD layer options must be true or false.');out[key]=raw[key];}return out;}
function edge(d,offset){
 const p=d.parameters;if(p.type==='straight')return{points:[[0,offset],[p.lengthMm,offset]],bulges:[0,0]};
 if(p.type==='curve'){const r=p.innerRadiusMm+offset;return{points:[F.G.pt(r,0),F.G.pt(r,F.rad(p.angleDeg))],bulges:[Math.tan(F.rad(p.angleDeg)/4),0]};}
 const points=S.edgePoints(p,d.geometry,offset);return{points,bulges:points.map(()=>0)};
}
function reverse(path){const n=path.points.length;return{...path,points:path.points.slice().reverse(),bulges:path.points.map((_,i)=>!path.closed&&i===n-1?0:-path.bulges[(n-2-i+n)%n])};}
function signature(path){return path.layer+'|'+path.points.map((p,i)=>p.map(number).join(',')+':'+bulgeNumber(path.bulges[i])).join(';')+'|'+!!path.closed;}
function simplify(path){
 if(path.closed||path.points.length<3||path.bulges.some(Boolean))return path;const a=path.points[0],b=path.points.at(-1),length=F.dist(a,b);if(!length)return path;
 if(path.points.some(p=>Math.abs((b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]))/length>1e-7||(p[0]-a[0])*(p[0]-b[0])+(p[1]-a[1])*(p[1]-b[1])>0))return path;
 return{...path,points:[a,b],bulges:[0,0]};
}
function join(paths){
 const seen=new Set(),unique=[];let duplicates=0;
 for(const input of paths){const p=simplify(input),a=signature(p),b=signature(reverse(p));if(seen.has(a)||seen.has(b)){duplicates++;continue;}seen.add(a);unique.push(p);}
 const closed=unique.filter(p=>p.closed),open=unique.filter(p=>!p.closed),nodes=[],buckets=new Map(),adj=new Map();
 function node(point,layer){const cell=point.map(v=>Math.floor(v/TOL));for(let x=-1;x<=1;x++)for(let y=-1;y<=1;y++)for(const i of buckets.get(layer+'|'+(cell[0]+x)+','+(cell[1]+y))||[])if(F.dist(point,nodes[i])<TOL)return i;const i=nodes.length;nodes.push(point);const key=layer+'|'+cell.join(',');if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(i);return i;}
 const ends=open.map((p,i)=>{const a=node(p.points[0],p.layer),b=node(p.points.at(-1),p.layer);for(const n of[a,b]){if(!adj.has(n))adj.set(n,[]);adj.get(n).push(i);}return[a,b];});
 const used=new Set(),result=closed.slice();
 function trace(first,start){let current=first,at=start,out=null;const origin=start;
  while(!used.has(current)){
   used.add(current);const [a,b]=ends[current],part=a===at?open[current]:reverse(open[current]),next=a===at?b:a;
   if(!out)out={...part,points:part.points.slice(),bulges:part.bulges.slice()};else{out.bulges[out.bulges.length-1]=part.bulges[0];out.points.push(...part.points.slice(1));out.bulges.push(...part.bulges.slice(1));}
   if(next===origin&&adj.get(next).length===2){out.closed=true;out.points.pop();out.bulges.pop();break;}
   if(adj.get(next).length!==2)break;const candidate=adj.get(next).find(i=>!used.has(i));if(candidate===undefined)break;at=next;current=candidate;
  }if(out)result.push(out);
 }
 for(let i=0;i<open.length;i++)if(!used.has(i)){const [a,b]=ends[i];if(adj.get(a).length!==2||adj.get(b).length!==2)trace(i,adj.get(a).length!==2?a:b);}
 for(let i=0;i<open.length;i++)if(!used.has(i))trace(i,ends[i][0]);
 return{paths:result,duplicates,junctions:[...adj.values()].filter(v=>v.length>2).length};
}
function arc(a,b,bulge){const chord=F.dist(a,b),radius=chord*(1+bulge*bulge)/(4*Math.abs(bulge)),dx=b[0]-a[0],dy=b[1]-a[1],h=(1-bulge*bulge)/(4*bulge);return{radius,center:[(a[0]+b[0])/2-dy*h,(a[1]+b[1])/2+dx*h],sweep:4*Math.atan(bulge)};}
function bounds(paths){let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;const add=p=>{x0=Math.min(x0,p[0]);y0=Math.min(y0,p[1]);x1=Math.max(x1,p[0]);y1=Math.max(y1,p[1]);};
 for(const p of paths){p.points.forEach(add);for(let i=0;i<p.points.length-(p.closed?0:1);i++){const bulge=p.bulges[i];if(!bulge)continue;const a=p.points[i],b=p.points[(i+1)%p.points.length],c=arc(a,b,bulge),start=Math.atan2(a[1]-c.center[1],a[0]-c.center[0]);for(const angle of[0,Math.PI/2,Math.PI,Math.PI*1.5]){const delta=((Math.sign(c.sweep)*(angle-start))%(Math.PI*2)+Math.PI*2)%(Math.PI*2);if(delta<=Math.abs(c.sweep)+1e-10)add([c.center[0]+c.radius*Math.cos(angle),c.center[1]+c.radius*Math.sin(angle)]);}}}
 return[x0,y0,x1-x0,y1-y0];
}
function info(raw){const model=X.build(raw),roads=model.pieces.filter(p=>model.definitions[p.definitionId].parameters.routed);if(!roads.length)throw Error('SVG / DXF construction export needs at least one routed section.');return{title:model.title,routedSections:roads.length,excluded:model.pieces.length-roads.length,surfacesAvailable:roads.some(p=>model.definitions[p.definitionId].parameters.routed.constructionMode!=='table'),tableAvailable:model.layout.workspace?.spaceGuide?.kind==='table',timingAvailable:roads.some(p=>p.id===model.layout.timing.startFinish?.pieceId)};}
function build(raw,requested){
 const model=X.build(raw),config=options(requested),{pieces,definitions:defs}=model,roads=pieces.filter(p=>defs[p.definitionId].parameters.routed);if(!roads.length)throw Error('SVG / DXF construction export needs at least one routed section.');
 let vertexCount=0;const paths=[],push=path=>{vertexCount+=path.points.length;if(vertexCount>1000000)throw Error('CAD export exceeds one million vertices. Select fewer layers or use a smaller layout.');paths.push(path);},net=F.connections(roads,defs),byId=new Map(roads.map(p=>[p.id,p]));let removedCaps=0;
 const add=(local,placement,layer,closed=false)=>push({layer,points:local.points.map(p=>F.point(p,placement)),bulges:local.bulges.map(b=>b*(placement.flip?-1:1)),closed});
 function cap(p,index){const d=defs[p.definitionId],a=edge(d,0),b=edge(d,d.parameters.widthMm);return[a.points[index?a.points.length-1:0],b.points[index?b.points.length-1:0]].map(q=>F.point(q,p));}
 for(const placement of roads){const d=defs[placement.definitionId],p=d.parameters,s=p.routed;
  for(const offset of p.laneOffsetsMm){
   if(config.slots)add(edge(d,offset),placement,'SLOT_CENTRES');
   if(config.slotEdges)for(const side of[-1,1])add(edge(d,offset+side*s.slotWidthMm/2),placement,'SLOT_EDGES');
   if(config.conductors){const delta=s.slotWidthMm/2+s.conductorGapMm+s.conductorWidthMm/2;for(const side of[-1,1])for(const boundary of[-1,1])add(edge(d,offset+side*delta+boundary*s.conductorWidthMm/2),placement,s.conductor==='braid'?'BRAID_EDGES':'TAPE_EDGES');}
  }
  if(config.surfaces&&s.constructionMode!=='table'){add(edge(d,0),placement,'SURFACE_EDGES');add(edge(d,p.widthMm),placement,'SURFACE_EDGES');for(const index of[0,1]){const ends=cap(placement,index),link=net.links.get(placement.id+':'+index),other=link&&defs[byId.get(link.pieceId).definitionId].parameters.routed.constructionMode!=='table'?cap(byId.get(link.pieceId),link.index):null;if(other&&(F.dist(ends[0],other[0])<TOL&&F.dist(ends[1],other[1])<TOL||F.dist(ends[0],other[1])<TOL&&F.dist(ends[1],other[0])<TOL)){removedCaps++;continue;}push({layer:'SURFACE_EDGES',points:ends,bulges:[0,0],closed:false});}}
 }
 const table=model.layout.workspace?.spaceGuide,tableAvailable=table?.kind==='table';
 if(config.table&&tableAvailable){const {x,y,lengthMm:l,widthMm:w}=table;push({layer:'TABLE',points:[[x,y],[x+l,y],[x+l,y+w],[x,y+w]],bulges:[0,0,0,0],closed:true});}
 const timing=model.layout.timing.startFinish,piece=timing&&byId.get(timing.pieceId);let timingAvailable=!!piece;
 if(config.timing&&piece){const d=defs[piece.definitionId],p=d.parameters,f=timing.fraction,ends=p.type==='routed-spline'?S.crossSection(p,d.geometry,f):p.type==='straight'?[[f*p.lengthMm,0],[f*p.lengthMm,p.widthMm]]:[F.G.pt(p.innerRadiusMm,F.rad(p.angleDeg*f)),F.G.pt(p.innerRadiusMm+p.widthMm,F.rad(p.angleDeg*f))];add({points:ends,bulges:[0,0]},piece,'TIMING_LINE');}
 if(!paths.length)throw Error('Choose at least one available geometry layer.');
 const joined=join(paths),drawing=joined.paths;if(config.scale){const b=bounds(drawing),x=b[0],y=b[1]+b[3]+20;for(const points of[[[x,y],[x+100,y]],[[x,y-5],[x,y+5]],[[x+100,y-5],[x+100,y+5]]])drawing.push({layer:'SCALE_CHECK',points,bulges:[0,0],closed:false});}
 const extent=bounds(drawing),messages=C.checks(roads,defs,tableAvailable?table:null).filter(i=>i.code!=='conductor-height').map(i=>i.message),excluded=pieces.length-roads.length;
 if(roads.some(p=>defs[p.definitionId].parameters.routed.constructionMode==='table'))messages.unshift('Tabletop routing has no separate piece outlines. Use the table outline for the board boundary; only slots and conductor geometry are exported for tabletop sections.');if(excluded)messages.unshift(excluded+' non-routed piece(s) excluded from construction geometry.');if(joined.duplicates)messages.push(joined.duplicates+' duplicate path(s) removed.');if(joined.junctions)messages.push(joined.junctions+' CAD junction(s) have multiple branches; paths were left separate.');
 const openSlots=drawing.filter(p=>p.layer==='SLOT_CENTRES'&&!p.closed).length*2;if(openSlots)messages.push(openSlots+' open CAD slot ends. Gaps above 0.00001 mm are retained.');
 if(config.conductors)messages.push('Conductor boundaries use the entered braid/tape width; recess clearance and cutter compensation are not added.');
 const used=Object.keys(layers).filter(id=>drawing.some(p=>p.layer===id));
 return{format:'slotforge.cad',version:1,title:model.title,units:'mm',paths:drawing.map((p,i)=>({...p,id:p.layer.toLowerCase()+'-'+(i+1)})),bounds:extent,layers:used.map(id=>({id,...layers[id],paths:drawing.filter(p=>p.layer===id).length})),config,routedSections:roads.length,excluded,tableAvailable,timingAvailable,removedCaps,openSlots,messages,sampled:roads.some(p=>defs[p.definitionId].parameters.type==='routed-spline')};
}
function pathData(p){let d='M '+p.points[0].map(number).join(' ');for(let i=0;i<p.points.length-(p.closed?0:1);i++){const a=p.points[i],b=p.points[(i+1)%p.points.length],bulge=p.bulges[i];if(bulge){const r=arc(a,b,bulge).radius;d+=' A '+number(r)+' '+number(r)+' 0 '+(Math.abs(bulge)>1?1:0)+' '+(bulge>0?1:0)+' '+b.map(number).join(' ');}else d+=' L '+b.map(number).join(' ');}return d+(p.closed?' Z':'');}
function svgSize(model,requested=1){
 const width=model.bounds[2]+10,height=model.bounds[3]+10;
 // A compact page, not a geometry simplification. Standard scales remain easy
 // to reverse in drawing software; display zoom depends on the user's screen.
 const denominator=requested==='compact'?[1,2,5,10,20,25,50,100,200,500,1000,2000,5000,10000].find(n=>width/n<=400&&height/n<=225):requested;
 if(typeof denominator!=='number'||!Number.isFinite(denominator)||denominator<1||denominator>10000)throw Error('Choose an SVG scale between 1:1 and 1:10000.');
 return{denominator,widthMm:width/denominator,heightMm:height/denominator,restorePercent:denominator*100};
}
function serializeSVG(model,preview=false,requestedScale=1){const b=model.bounds,pad=5,width=b[2]+pad*2,height=b[3]+pad*2,size=svgSize(model,preview?1:requestedScale),description=(size.denominator===1?'Millimetres; 1 SVG user unit = 1 mm. ':'Scale 1:'+size.denominator+'. Enlarge to '+size.restorePercent+'% to restore full size. Coordinates remain full-size millimetres. ')+ 'Routed construction paths; no cutter compensation, depths or toolpaths. '+(model.sampled?'Flowing offsets use adaptive samples (0.025 mm target). ':'')+model.messages.join(' ');
 return`<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="${number(size.widthMm)}mm" height="${number(size.heightMm)}mm" viewBox="${[b[0]-pad,b[1]-pad,width,height].map(number).join(' ')}" role="img"><title>${xml(model.title)} - routed construction${size.denominator===1?'':' - scale 1:'+size.denominator}</title><desc>${xml(description)}</desc><metadata>${xml(JSON.stringify({format:'slotforge.cad',version:1,units:'mm',scaleDenominator:size.denominator,restoreFullSizePercent:size.restorePercent,coordinates:'builder-world-positive-y-down',joinToleranceMm:TOL,flowingSamplingTargetMm:model.sampled?0.025:null,options:model.config}))}</metadata>${model.layers.map(layer=>`<g id="${layer.id}" inkscape:groupmode="layer" inkscape:label="${layer.label}" fill="none" stroke="${layer.color}" stroke-width="${preview?1:.25}" stroke-linecap="butt" stroke-linejoin="round">${model.paths.filter(p=>p.layer===layer.id).map(p=>`<path id="${p.id}" d="${pathData(p)}"${preview?' vector-effect="non-scaling-stroke"':''}/>`).join('')}</g>`).join('')}</svg>\n`;
}
function dxfText(text){return String(text).replace(/[\r\n\t\u0000-\u001f]/g,' ').replace(/[^\x20-\x7e]/g,c=>'\\U+'+c.charCodeAt(0).toString(16).padStart(4,'0').toUpperCase());}
function serializeDXF(model){
 let counter=256;
 const handle=()=> (++counter).toString(16).toUpperCase();
 const codes=(...args)=>args.map((v,i)=>i%2===0?String(v).padStart(3,' '):typeof v==='number'?number(v):v).join('\r\n')+'\r\n';
 const b=model.bounds,tableIds=Object.fromEntries(['VPORT','LTYPE','LAYER','STYLE','VIEW','UCS','APPID','DIMSTYLE','BLOCK_RECORD'].map(name=>[name,handle()]));
 const modelRecord=handle(),paperRecord=handle(),dictionary=handle(),standardStyle=handle(),layoutDictionary=handle(),modelLayout=handle(),paperLayout=handle(),plotStyles=handle(),normalPlotStyle=handle(),groups=handle();
 const record=(type,subclass,name,values=[],id=handle())=>codes(0,type,type==='DIMSTYLE'?105:5,id,330,tableIds[type],100,'AcDbSymbolTableRecord',100,subclass,2,name,70,0,...values);
 const table=(name,records)=>codes(0,'TABLE',2,name,5,tableIds[name],330,'0',100,'AcDbSymbolTable',70,records.length,...(name==='DIMSTYLE'?[100,'AcDbDimStyleTable']:[]))+records.join('')+codes(0,'ENDTAB');
 // Strict CAD importers need the standard symbol tables even when there is no
 // text/dimension geometry. Tolerant readers silently supplied these before.
 const tables=codes(0,'SECTION',2,'TABLES')+
  table('VPORT',[record('VPORT','AcDbViewportTableRecord','*Active',[10,0,20,0,11,1,21,1,12,b[0]+b[2]/2,22,-b[1]-b[3]/2,13,0,23,0,14,10,24,10,15,10,25,10,16,0,26,0,36,1,17,0,27,0,37,0,40,Math.max(10,b[3]*1.1),41,Math.max(.01,b[2])/Math.max(.01,b[3]),42,50,43,0,44,0,50,0,51,0,71,0,72,100,73,1,74,3,75,0,76,0,77,0,78,0])])+
  table('LTYPE',['ByBlock','ByLayer','CONTINUOUS'].map(name=>record('LTYPE','AcDbLinetypeTableRecord',name,[3,name==='CONTINUOUS'?'Solid line':'',72,65,73,0,40,0])))+
  table('LAYER',['0',...model.layers.map(l=>l.id)].map(name=>record('LAYER','AcDbLayerTableRecord',name,[62,layers[name]?.aci||7,6,'CONTINUOUS',370,-3,390,normalPlotStyle])))+
  table('STYLE',[record('STYLE','AcDbTextStyleTableRecord','Standard',[40,0,41,1,50,0,71,0,42,2.5,3,'txt',4,''],standardStyle)])+
  table('VIEW',[])+table('UCS',[])+
  table('APPID',[record('APPID','AcDbRegAppTableRecord','ACAD')])+
  table('DIMSTYLE',[record('DIMSTYLE','AcDbDimStyleTableRecord','Standard',[40,1,41,2.5,140,2.5,340,standardStyle])])+
  table('BLOCK_RECORD',[[modelRecord,'*Model_Space',modelLayout],[paperRecord,'*Paper_Space',paperLayout]].map(([id,name,layout])=>record('BLOCK_RECORD','AcDbBlockTableRecord',name,[340,layout],id)))+codes(0,'ENDSEC');
 const blocks=codes(0,'SECTION',2,'BLOCKS')+[[modelRecord,'*Model_Space'],[paperRecord,'*Paper_Space']].map(([owner,name])=>codes(0,'BLOCK',5,handle(),330,owner,100,'AcDbEntity',8,'0',100,'AcDbBlockBegin',2,name,70,0,10,0,20,0,30,0,3,name,1,'',0,'ENDBLK',5,handle(),330,owner,100,'AcDbEntity',8,'0',100,'AcDbBlockEnd')).join('')+codes(0,'ENDSEC');
 const entities=codes(0,'SECTION',2,'ENTITIES')+model.paths.map(p=>codes(0,'LWPOLYLINE',5,handle(),330,modelRecord,100,'AcDbEntity',8,p.layer,100,'AcDbPolyline',90,p.points.length,70,p.closed?1:0,43,0)+p.points.map((point,i)=>codes(10,point[0],20,-point[1],...(p.bulges[i]?[42,bulgeNumber(-p.bulges[i])]:[]))).join('')).join('')+codes(0,'ENDSEC');
 const layout=(id,name,order,block)=>codes(0,'LAYOUT',5,id,330,layoutDictionary,100,'AcDbPlotSettings',1,'',4,'A4',6,'',40,0,41,0,42,0,43,0,44,297,45,210,46,0,47,0,48,0,49,0,140,0,141,0,142,1,143,1,70,order===0?1024:0,72,1,73,0,74,5,7,'',75,16,76,0,77,2,78,300,147,1,148,0,149,0,100,'AcDbLayout',1,name,70,1,71,order,10,b[0],20,-b[1]-b[3],11,b[0]+b[2],21,-b[1],12,0,22,0,32,0,14,b[0],24,-b[1]-b[3],34,0,15,b[0]+b[2],25,-b[1],35,0,146,0,13,0,23,0,33,0,16,1,26,0,36,0,17,0,27,1,37,0,76,1,330,block);
 const objects=codes(0,'SECTION',2,'OBJECTS',0,'DICTIONARY',5,dictionary,330,'0',100,'AcDbDictionary',281,1,3,'ACAD_GROUP',350,groups,3,'ACAD_LAYOUT',350,layoutDictionary,3,'ACAD_PLOTSTYLENAME',350,plotStyles,0,'DICTIONARY',5,groups,330,dictionary,100,'AcDbDictionary',281,1,0,'ACDBDICTIONARYWDFLT',5,plotStyles,330,dictionary,100,'AcDbDictionary',281,1,3,'Normal',350,normalPlotStyle,100,'AcDbDictionaryWithDefault',340,normalPlotStyle,0,'ACDBPLACEHOLDER',5,normalPlotStyle,330,plotStyles,0,'DICTIONARY',5,layoutDictionary,330,dictionary,100,'AcDbDictionary',281,1,3,'Model',350,modelLayout,3,'Layout1',350,paperLayout)+layout(modelLayout,'Model',0,modelRecord)+layout(paperLayout,'Layout1',1,paperRecord)+codes(0,'ENDSEC');
 const header=codes(0,'SECTION',2,'HEADER',9,'$ACADVER',1,'AC1015',9,'$DWGCODEPAGE',3,'ANSI_1252',9,'$HANDSEED',5,(counter+1).toString(16).toUpperCase(),9,'$INSUNITS',70,4,9,'$MEASUREMENT',70,1,9,'$LUNITS',70,2,9,'$LUPREC',70,6,9,'$INSBASE',10,0,20,0,30,0,9,'$EXTMIN',10,b[0],20,-(b[1]+b[3]),30,0,9,'$EXTMAX',10,b[0]+b[2],20,-b[1],30,0,9,'$LIMMIN',10,b[0],20,-(b[1]+b[3]),9,'$LIMMAX',10,b[0]+b[2],20,-b[1],999,'SlotForge Circuit - routed construction geometry',999,dxfText(model.title),999,'Units: mm. XY geometry only; no cutter compensation or toolpaths.',999,'Builder X preserved; CAD Y is negative builder Y; origin is unchanged.',0,'ENDSEC');
 return header+codes(0,'SECTION',2,'CLASSES',0,'ENDSEC')+tables+blocks+entities+objects+codes(0,'EOF');
}
function svg(raw,config,scale=1){return serializeSVG(build(raw,config),false,scale);}function dxf(raw,config){return serializeDXF(build(raw,config));}function preview(model){return serializeSVG(model,true).replace(/^<\?xml[^>]*>\s*/,'');}
return{defaults,layers,options,info,build,svg,dxf,preview,pathData,svgSize};
});
