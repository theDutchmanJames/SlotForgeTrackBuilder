(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./core.js'),require('./track-exports.js'));else root.TrackDrawing=factory(root.Forge,root.TrackExports);})(typeof globalThis!=='undefined'?globalThis:this,function(F,XM){
'use strict';
const G=F.G,NS='http://www.w3.org/2000/svg';
function transform(p){return`translate(${p.x} ${p.y}) rotate(${p.angle}) scale(1 ${p.flip?-1:1})`;}
const drawBody=F.drawBody;
function pdfDiagram(raw){const model=XM.build(raw),table=model.routed.sections?model.layout.workspace?.spaceGuide:null,b=F.Routed.tableBounds(model.summary.bounds,table),limit=2400,pad=30,scale=(limit-pad*2)/Math.max(b[2],b[3],1),width=Math.max(1,Math.ceil(b[2]*scale+pad*2)),height=Math.max(1,Math.ceil(b[3]*scale+pad*2));const scene=F.Routed.drawTable(table,true)+model.pieces.map(p=>`<g transform="${transform(p)}">${drawBody(model.definitions[p.definitionId],true)}</g>`).join('');return{width,height,svg:`<svg xmlns="${NS}" width="${width}" height="${height}" viewBox="${b[0]-pad/scale} ${b[1]-pad/scale} ${width/scale} ${height/scale}">${scene}</svg>`};}
return{body:drawBody,pdfDiagram};
});
