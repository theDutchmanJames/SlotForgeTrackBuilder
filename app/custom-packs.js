(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./core.js'));else root.CustomPacks=factory(root.Forge);})(typeof globalThis!=='undefined'?globalThis:this,function(F){
'use strict';
const STORAGE='slotforge.custom-library.v2';
// Every step adds one full road width: adjacent annular road edges coincide.
function curveParameters(base,number=1){
 if(!Number.isInteger(number)||number<1||number>8)throw Error('Choose a radius from R1 to R8.');
 if(!base||typeof base!=='object')throw Error('Set the curve family dimensions.');
 const p={type:'curve',innerRadiusMm:base.innerRadiusMm+(number-1)*base.widthMm,widthMm:base.widthMm,angleDeg:base.angleDeg,laneCount:base.laneCount,laneSpacingMm:base.laneSpacingMm};
 return F.validateDefinition({id:'custom:family-preview',name:'Radius preview',parameters:p}).parameters;
}
function name(value,fallback='My track pack'){if(value===undefined)return fallback;if(typeof value!=='string'||!value.trim()||value.trim().length>100)throw Error('Pack names must be 1–100 characters.');return value.trim();}
function definition(d){return{id:d.id,name:d.name,sku:d.sku,pack:d.pack,family:d.family,parameters:d.parameters,color:d.color,status:d.status,mirror:d.mirror,...(d.referenceImage?{referenceImage:d.referenceImage}:{})};}
function empty(){return{activePackId:'custom',packs:[{id:'custom',name:'Custom / unbranded',inLibrary:true,pieces:[]}]};}
function read(raw){
 if(raw==null)return empty();
 if(Array.isArray(raw))raw={format:'slotforge.custom-library',version:2,activePackId:'custom',packs:[{id:'custom',name:'Custom / unbranded',inLibrary:true,pieces:raw}]};
 if(raw.format!=='slotforge.custom-library'||raw.version!==2||!Array.isArray(raw.packs)||!raw.packs.length||raw.packs.length>100)throw Error('Invalid saved track pack library.');
 const ids=new Set(),pieceIds=new Set();let total=0;
 const packs=raw.packs.map(p=>{if(!p||typeof p.id!=='string'||!(p.id==='custom'||/^custom-pack-[-\w]{1,100}$/.test(p.id))||ids.has(p.id)||!Array.isArray(p.pieces)||typeof p.inLibrary!=='boolean')throw Error('Invalid or duplicate custom pack.');ids.add(p.id);total+=p.pieces.length;if(total>500)throw Error('The custom library supports up to 500 pieces.');const pieces=p.pieces.map(d=>{const clean=F.validateDefinition(d);if(!clean.id.startsWith('custom:')||pieceIds.has(clean.id))throw Error('Invalid or duplicate custom piece ID.');pieceIds.add(clean.id);return clean;});return{id:p.id,name:name(p.name),inLibrary:p.inLibrary,pieces,...(p.curveFamily?{curveFamily:curveParameters(p.curveFamily)}:{})};});
 return{packs,activePackId:ids.has(raw.activePackId)?raw.activePackId:packs[0].id};
}
function serialize(library){return{format:'slotforge.custom-library',version:2,activePackId:library.activePackId,packs:library.packs.map(p=>({...p,pieces:p.pieces.map(definition)}))};}
function importPack(raw,library){
 if(raw?.format!=='slotforge.custom-pack'||raw.version!==1||!Array.isArray(raw.pieces)||raw.pieces.length>500)throw Error('Choose a SlotForge custom pack v1 JSON file.');
 if(Object.hasOwn(raw,'units')&&raw.units!=='mm')throw Error('Track packs support millimetres only.');
 if(library.packs.length>=100||library.packs.reduce((sum,p)=>sum+p.pieces.length,0)+raw.pieces.length>500)throw Error('The library supports 100 custom packs and 500 custom pieces.');
 const packName=name(raw.name,'Imported track pack'),validated=raw.pieces.map(F.validateDefinition);
 if(new Set(validated.map(d=>d.id)).size!==validated.length)throw Error('Duplicate piece IDs in the imported pack.');
 return{id:'custom-pack-'+F.uid(),name:packName,inLibrary:true,...(raw.curveFamily?{curveFamily:curveParameters(raw.curveFamily)}:{}),pieces:validated.map(d=>({...d,id:'custom:'+F.uid(),pack:packName}))};
}
function exportPack(pack){return{format:'slotforge.custom-pack',version:1,name:name(pack.name),units:'mm',...(pack.curveFamily?{curveFamily:curveParameters(pack.curveFamily)}:{}),pieces:pack.pieces.filter(d=>d.parameters).map(d=>({...definition(F.validateDefinition(d)),pack:pack.name}))};}
return{STORAGE,name,empty,read,serialize,importPack,exportPack,curveParameters};
});
