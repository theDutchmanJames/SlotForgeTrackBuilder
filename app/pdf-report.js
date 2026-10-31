(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./vendor/jspdf.umd.min.js').jsPDF,require('./vendor/pdf-fonts.js'),require('./track-exports.js'),require('./core.js'));else root.TrackPDF=factory(root.jspdf.jsPDF,root.SlotForgePdfFonts,root.TrackExports,root.Forge);})(typeof globalThis!=='undefined'?globalThis:this,function(jsPDF,fonts,X,F){
'use strict';
const metres=n=>(n/1000).toFixed(2)+' m';
function create(raw,diagram,{orientation='portrait',date=new Date().toLocaleDateString()}={}){
 if(!['portrait','landscape'].includes(orientation))throw Error('Choose portrait or landscape.');
 const model=X.build(raw),{summary:s,inventory,network}=model;
 if(!model.pieces.length)throw Error('Add pieces to the track before exporting a PDF.');
 if(!diagram||typeof diagram.data!=='string'||!diagram.data.startsWith('data:image/jpeg;base64,')||!Number.isFinite(diagram.width)||!Number.isFinite(diagram.height)||diagram.width<=0||diagram.height<=0)throw Error('The track picture could not be prepared.');
 const doc=new jsPDF({orientation,unit:'mm',format:'a4',compress:true,putOnlyUsedFonts:true});
 for(const style of ['regular','bold']){const file='NotoSans-'+style+'.ttf';doc.addFileToVFS(file,fonts[style]);doc.addFont(file,'NotoSans',style==='regular'?'normal':'bold');}
 const W=doc.internal.pageSize.getWidth(),H=doc.internal.pageSize.getHeight(),margin=16,width=W-margin*2,bottom=H-19;
 let y=20;const body=[36,43,51],muted=[91,101,110];
 const font=(size=10,bold=false,color=body)=>{doc.setFont('NotoSans',bold?'bold':'normal');doc.setFontSize(size);doc.setTextColor(...color);};
 const text=(value,x,baseline,size=10,bold=false,color=body)=>{font(size,bold,color);doc.text(String(value),x,baseline);};
 const wrapped=(value,size,available)=>{font(size);return doc.splitTextToSize(String(value),available);};
 function newPage(){doc.addPage('a4',orientation);text('SLOTFORGE  /  TRACK REPORT',margin,16,8,true,muted);doc.setDrawColor(218,223,228);doc.line(margin,20,W-margin,20);y=28;}
 function ensure(height){if(y+height>bottom)newPage();}
 function paragraph(value,size=9,color=muted){const lines=wrapped(value,size,width),step=size*.352778*1.45;for(const line of lines){ensure(step);text(line,margin,y+step*.8,size,false,color);y+=step;}y+=3;}
 text('SLOTFORGE  /  CIRCUIT',margin,15,8,true,muted);text(String(date),W-margin-doc.getTextWidth(String(date)),15,8,false,muted);
 doc.setDrawColor(229,72,77);doc.setLineWidth(.8);doc.line(margin,20,margin+19,20);y=28;
 const titleLines=wrapped(model.title||'Untitled circuit',23,width);for(const line of titleLines){text(line,margin,y,23,true);y+=10;}y+=2;
 const metrics=[[s.freeform?'REFERENCE SLOT':'TRACK CENTRELINE',s.invalidFreeform?'Not calculated':s.planning?(s.roads?metres(s.length)+' + unknown':'Not calculated'):metres(s.length)],['PLACED PIECES',String(model.pieces.length)],['FOOTPRINT WITH BORDERS',Math.ceil(s.bounds[2]-1e-6)+' × '+Math.ceil(s.bounds[3]-1e-6)+' mm']];
 metrics.forEach(([label,value],i)=>{const x=margin+i*width/3;text(label,x,y,7.5,true,muted);text(value,x,y+8,13,true);});y+=15;
 text(model.pieces.some(p=>model.definitions[p.definitionId].parameters.type==='freeform')?'FreeForm circuit / tabletop routing':s.planning?(s.roads+s.planning)+' road pieces ('+s.planning+' approximate)  /  '+s.borders+' borders  /  '+(s.references-s.planning)+' other references':s.roads+' road pieces  /  '+s.borders+' borders  /  '+s.references+' references',margin,y,8,false,muted);y+=6;
 const maxImageHeight=orientation==='portrait'?(model.routed.sections?90:102):65,scale=Math.min(width/diagram.width,maxImageHeight/diagram.height),iw=diagram.width*scale,ih=diagram.height*scale;
 ensure(ih+9);doc.addImage(diagram.data,'JPEG',margin+(width-iw)/2,y,iw,ih,undefined,'FAST');y+=ih+5;
 text('Layout overview - fitted to page, not a 1:1 template.',margin,y,7.5,false,muted);y+=8;
 if(network.closed){const lanes=model.layout.track.lanes;paragraph(lanes.map((lane,i)=>(lane.label||'Lane '+(i+1))+': '+metres(lane.lengthMm)).join('   |   '),9,body);}
 else paragraph(s.planning?'Approximate visual layout: guide slots and lap lengths are not calculated.':'Per-lane circuit lengths unavailable: '+network.reason,9,body);
 if(model.routed.sections){
  const r=model.routed;paragraph(s.invalidFreeform?'Invalid FreeForm draft: slot lengths and conductor quantities are unavailable until the geometry is repaired.':'Routed wood: '+r.sections+' design sections. Total guide-slot length: '+metres(r.slotMm)+'. Estimated braid: '+metres(r.orderBraidMm)+'; copper tape: '+metres(r.orderTapeMm)+' (both sides, including the specified allowance).',9,body);
  const table=model.layout.workspace?.spaceGuide;if(table?.kind==='table')paragraph('Table: '+F.Routed.Table.description(table)+'. '+(r.tableRoutingSections?'Tabletop routing uses the continuous table; sections are slot paths, not separate boards. ':'')+(r.tableRoutingSections===r.sections?'':'Individual-piece surface area: '+(r.sectionAreaMm2/1000000).toFixed(2)+' m², summed before overlap deductions. ')+'This is not a board cutting or stock nesting plan.',8);
  const profiles=[...new Set(model.pieces.filter(p=>model.definitions[p.definitionId].parameters.routed).map(p=>{const v=model.definitions[p.definitionId].parameters.routed;return(v.constructionMode==='table'?'Tabletop routing; ':'Individual piece; ')+v.laneCount+' lanes / '+v.laneSpacingMm+' mm spacing; slot '+v.slotWidthMm+' × '+v.slotDepthMm+' mm; '+v.conductor+' '+v.conductorWidthMm+' mm wide; recess '+(v.conductor==='braid'?v.recessDepthMm:0)+' mm; board '+v.boardThicknessMm+' mm';}))];
  for(const p of profiles)paragraph('Construction profile: '+p,8);
 }
 if(F.Elevation.active(model.pieces,model.definitions)){paragraph('Height plan: dimensions and lengths are plan-view values. Elevations and sampled clearances do not verify ramp buildability, car bodies or support clearance.',9,body);for(const issue of F.Elevation.checks(model.pieces,model.definitions,F))paragraph(issue.message,8);for(const p of model.pieces){const d=model.definitions[p.definitionId];if(p.elevation)paragraph(d.name+': start '+p.elevation.startMm+' mm; end '+p.elevation.endMm+' mm; deck '+p.elevation.thicknessMm+' mm; required clearance '+p.elevation.clearanceMm+' mm.',8);if(d.parameters.type==='freeform')paragraph('Anchor heights (mm): '+d.parameters.freeform.nodes.map((n,i)=>(i+1)+': '+(n.heightMm||0)).join(', '),8);}}
 const hasFlowing=model.pieces.some(p=>model.definitions[p.definitionId].parameters.type==='routed-spline'||model.definitions[p.definitionId].parameters.type==='freeform');
 const hasSwitches=model.pieces.some(p=>model.definitions[p.definitionId].parameters.laneChange);
 paragraph((s.planning?'Planning dimensions are estimates. Magnetic alignment does not validate physical fit. ':'Calculated nominal or user-entered dimensions. ')+(model.routed.sections?'Footprint includes piece verges or tabletop slot/conductor geometry; 2D checks do not verify vehicle clearance or bridge heights.':'Footprint includes placed borders; overlaps and vertical clearance are not checked.')+(hasFlowing?' Flowing curves use numerically sampled paths.':'')+(hasSwitches?' Lane changers use straight-through routes for these totals.':''),8);

 // Whole rows move together; each continuation page repeats the column headings.
 const fractions=[.16,.34,.24,.08,.18],columns=fractions.map(v=>v*width),xs=[margin];for(let i=0;i<columns.length-1;i++)xs.push(xs[i]+columns[i]);
 function tableHeading(continued=false){text((model.routed.sections?'Sections and parts list':'Parts list')+(continued?' - continued':''),margin,y+5,13,true);y+=10;doc.setFillColor(243,245,247);doc.rect(margin,y,width,12,'F');const labels=['Product code','Piece','Track pack','Qty','Length / piece'];labels.forEach((label,i)=>{font(8,true,muted);doc.text(doc.splitTextToSize(label,columns[i]-4),xs[i]+2,y+4.5);});y+=14;}
 const rowLines=({d,count})=>{const length=d.parameters.type==='reference'?'Unknown':d.parameters.type.endsWith('border')?'Border':d.geometry.centrelineLengthMm.toFixed(1)+' mm';return[d.sku||'Custom',d.name,d.pack,String(count),length].map((v,i)=>wrapped(v,8.5,columns[i]-4));};
 const rows=inventory.map(rowLines);const rowHeight=lines=>Math.max(...lines.map(l=>l.length))*4.2+5;
 ensure(24+rowHeight(rows[0]));tableHeading();
 const notice=(model.routed.sections?'Routed quantities count editable design sections, not physical boards. Other quantities count placed pieces, not retail multipacks.':'Quantities count placed pieces, not retail multipacks.')+(s.references?' Reference pictures have approximate display sizes and unknown lengths; an image may show an assembly.':'');
 for(const [index,cells]of rows.entries()){const h=rowHeight(cells),tail=index===rows.length-1?6+wrapped(notice,8,width).length*8*.352778*1.45+3:0;if(y+h+tail>bottom){newPage();tableHeading(true);}for(let c=0;c<cells.length;c++){font(8.5);doc.text(cells[c],xs[c]+2,y+4,{lineHeightFactor:1.4});}doc.setDrawColor(223,227,231);doc.setLineWidth(.2);doc.line(margin,y+h,W-margin,y+h);y+=h;}
 y+=6;paragraph(notice,8);
 const pages=doc.getNumberOfPages();for(let i=1;i<=pages;i++){doc.setPage(i);doc.setDrawColor(220,225,230);doc.line(margin,H-14,W-margin,H-14);text('SlotForge Circuit  /  Planning reference',margin,H-9,7.5,false,muted);text(i+' / '+pages,W-margin-12,H-9,7.5,false,muted);}
 doc.setProperties({title:model.title,subject:'Track layout, nominal lengths and parts list',creator:'SlotForge Circuit',author:'SlotForge Circuit'});
 return{bytes:doc.output('arraybuffer'),pages,orientation,title:model.title};
}
return{create};
});
