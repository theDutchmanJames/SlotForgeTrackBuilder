(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./vendor/jspdf.umd.min.js').jsPDF,require('./vendor/pdf-fonts.js'),require('./track-exports.js'));else root.TrackPDF=factory(root.jspdf.jsPDF,root.SlotForgePdfFonts,root.TrackExports);})(typeof globalThis!=='undefined'?globalThis:this,function(jsPDF,fonts,X){
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
 text('SLOTFORGE  /  TRACK BUILDER',margin,15,8,true,muted);text(String(date),W-margin-doc.getTextWidth(String(date)),15,8,false,muted);
 doc.setDrawColor(229,72,77);doc.setLineWidth(.8);doc.line(margin,20,margin+19,20);y=28;
 const titleLines=wrapped(model.title||'Untitled circuit',23,width);for(const line of titleLines){text(line,margin,y,23,true);y+=10;}y+=2;
 const metrics=[['TRACK CENTRELINE',s.planning?(s.roads?metres(s.length)+' + unknown':'Not calculated'):metres(s.length)],['PLACED PIECES',String(model.pieces.length)],['FOOTPRINT WITH BORDERS',Math.ceil(s.bounds[2])+' × '+Math.ceil(s.bounds[3])+' mm']];
 metrics.forEach(([label,value],i)=>{const x=margin+i*width/3;text(label,x,y,7.5,true,muted);text(value,x,y+8,13,true);});y+=15;
 text(s.planning?(s.roads+s.planning)+' road pieces ('+s.planning+' approximate)  /  '+s.borders+' borders  /  '+(s.references-s.planning)+' other references':s.roads+' road pieces  /  '+s.borders+' borders  /  '+s.references+' references',margin,y,8,false,muted);y+=6;
 const maxImageHeight=orientation==='portrait'?102:65,scale=Math.min(width/diagram.width,maxImageHeight/diagram.height),iw=diagram.width*scale,ih=diagram.height*scale;
 ensure(ih+9);doc.addImage(diagram.data,'JPEG',margin+(width-iw)/2,y,iw,ih,undefined,'FAST');y+=ih+5;
 text('Layout overview - fitted to page, not a 1:1 template.',margin,y,7.5,false,muted);y+=8;
 if(network.closed){const lanes=model.layout.track.lanes;paragraph(lanes.map((lane,i)=>(lane.label||'Lane '+(i+1))+': '+metres(lane.lengthMm)).join('   |   '),9,body);}
 else paragraph(s.planning?'Approximate visual layout: guide slots and lap lengths are not calculated.':'Per-lane circuit lengths unavailable: '+network.reason,9,body);
 const hasSwitches=model.pieces.some(p=>model.definitions[p.definitionId].parameters.laneChange);
 paragraph((s.planning?'Planning dimensions are estimates. Magnetic alignment does not validate physical fit. ':'Calculated nominal or user-entered dimensions. ')+'Footprint includes placed borders; overlaps and vertical clearance are not checked.'+(hasSwitches?' Lane changers use straight-through routes for these totals.':''),8);

 // Whole rows move together; each continuation page repeats the column headings.
 const fractions=[.16,.34,.24,.08,.18],columns=fractions.map(v=>v*width),xs=[margin];for(let i=0;i<columns.length-1;i++)xs.push(xs[i]+columns[i]);
 function tableHeading(continued=false){text('Parts list'+(continued?' - continued':''),margin,y+5,13,true);y+=10;doc.setFillColor(243,245,247);doc.rect(margin,y,width,12,'F');const labels=['Product code','Piece','Track pack','Qty','Length / piece'];labels.forEach((label,i)=>{font(8,true,muted);doc.text(doc.splitTextToSize(label,columns[i]-4),xs[i]+2,y+4.5);});y+=14;}
 const rowLines=({d,count})=>{const length=d.parameters.type==='reference'?'Unknown':d.parameters.type.endsWith('border')?'Border':d.geometry.centrelineLengthMm.toFixed(1)+' mm';return[d.sku||'Custom',d.name,d.pack,String(count),length].map((v,i)=>wrapped(v,8.5,columns[i]-4));};
 const rows=inventory.map(rowLines);const rowHeight=lines=>Math.max(...lines.map(l=>l.length))*4.2+5;
 ensure(24+rowHeight(rows[0]));tableHeading();
 for(const cells of rows){const h=rowHeight(cells);if(y+h>bottom){newPage();tableHeading(true);}for(let c=0;c<cells.length;c++){font(8.5);doc.text(cells[c],xs[c]+2,y+4,{lineHeightFactor:1.4});}doc.setDrawColor(223,227,231);doc.setLineWidth(.2);doc.line(margin,y+h,W-margin,y+h);y+=h;}
 y+=6;paragraph('Quantities count placed pieces, not retail multipacks.'+(s.references?' Reference pictures have approximate display sizes and unknown lengths; an image may show an assembly.':''),8);
 const pages=doc.getNumberOfPages();for(let i=1;i<=pages;i++){doc.setPage(i);doc.setDrawColor(220,225,230);doc.line(margin,H-14,W-margin,H-14);text('SlotForge Track Builder  /  Planning reference',margin,H-9,7.5,false,muted);text(i+' / '+pages,W-margin-12,H-9,7.5,false,muted);}
 doc.setProperties({title:model.title,subject:'Track layout, nominal lengths and parts list',creator:'SlotForge Track Builder',author:'SlotForge Track Builder'});
 return{bytes:doc.output('arraybuffer'),pages,orientation,title:model.title};
}
return{create};
});
