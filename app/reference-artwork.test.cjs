const test=require('node:test'),assert=require('node:assert/strict'),F=require('./core.js'),A=require('./reference-artwork.js');
const curve={type:'curve',innerRadiusMm:250,widthMm:250,angleDeg:60,artworkPaddingMm:6},straight={type:'straight',lengthMm:433,widthMm:250,artworkPaddingMm:6};
function pixels(width=80,height=80){const data=new Uint8ClampedArray(width*height*4);for(let y=0;y<height;y++)for(let x=0;x<width;x++){const i=(y*width+x)*4;data[i]=Math.round((x+.5)/width*255);data[i+1]=Math.round((y+.5)/height*255);data[i+2]=120;data[i+3]=255;}return{width,height,data};}
function inspectTexture(previous,next){const before=pixels(),out=A.remap(before,previous,next,128),from=A.mapping(previous),to=A.mapping(next);for(const u of[.15,.5,.85]){const q=to.imagePoint(u,.5),x=Math.floor(q[0]*out.width),y=Math.floor(q[1]*out.height),uv=to.roadPoint((x+.5)/out.width,(y+.5)/out.height),sample=from.imagePoint(...uv),i=(y*out.width+x)*4;assert.ok(Math.abs(out.data[i]-sample[0]*255)<3);assert.ok(Math.abs(out.data[i+1]-sample[1]*255)<3);assert.equal(out.data[i+3],255);}return out;}
test('Road/image mappings round-trip at both ends, across the width and under reflection',()=>{
 for(const plan of[straight,curve,{...curve,reflectX:true},{...curve,angleDeg:180},{...curve,angleDeg:179.9}]){const m=A.mapping(plan);for(const u of[0,.25,.5,1])for(const v of[0,.5,1]){const uv=m.roadPoint(...m.imagePoint(u,v));assert.ok(uv);assert.ok(Math.abs(uv[0]-u)<1e-8);assert.ok(Math.abs(uv[1]-v)<1e-8);}}
});
test('Changing a 60-degree curve to 90 degrees reprojects the pictured ends onto the new magnets',()=>{
 const next={...curve,angleDeg:90},from=A.mapping(curve),to=A.mapping(next),def=F.validateDefinition({id:'ref:edited',name:'Edited',parameters:{type:'reference',...F.planningSize(next),planning:next}});
 for(const [i,u]of[[0,0],[1,1]]){const port=def.geometry.planningConnectors[i].position,normalized=[port[0]/def.parameters.lengthMm,port[1]/def.parameters.widthMm],uv=to.roadPoint(...normalized),original=from.imagePoint(...uv),expected=from.imagePoint(u,.5);assert.ok(F.dist(original,expected)<1e-9);}
 inspectTexture(curve,next);
});
test('Radius, road-width, reflection and straight/curve edits preserve the road texture coordinates',()=>{
 for(const next of[{...curve,innerRadiusMm:500},{...curve,widthMm:150},{...curve,reflectX:true},straight])inspectTexture(curve,next);inspectTexture(straight,{...curve,reflectX:true});
});
test('Reprojected images keep transparent surroundings and antialiased edges without dark fringes',()=>{
 const old=pixels();for(let i=0;i<old.data.length;i+=4){old.data[i]=255;old.data[i+1]=old.data[i+2]=0;}const out=A.remap(old,curve,{...curve,angleDeg:90},64);assert.equal(out.data[((out.height-1)*out.width)*4+3],0);let partial=0;for(let i=0;i<out.data.length;i+=4)if(out.data[i+3]){assert.equal(out.data[i],255);if(out.data[i+3]<255)partial++;}assert.ok(partial>0);
});
test('Unchanged embedded artwork is retained without decoding or recapturing',async()=>{
 const source={referenceImage:'original',parameters:{planning:curve}};assert.equal(await A.prepare(source,{...curve},{}),'original');assert.equal(A.needsRemap(curve,curve),false);
});
test('Missing optional artwork returns the fallback without requesting an undefined URL',async()=>{
 let calls=0;assert.equal(await A.prepare({parameters:{planning:curve}},straight,{load:()=>calls++}),undefined);assert.equal(calls,0);
});
test('Changed artwork is decoded, reprojected and encoded instead of returning the old image',async()=>{
 let encoded;const original=pixels();const result=await A.prepare({referenceImage:'original',parameters:{planning:curve}},{...curve,angleDeg:90},{load:async src=>{assert.equal(src,'original');return original;},pixels:x=>x,encode:x=>{encoded=x;return 'reshaped';},capture:()=>assert.fail('Must reshape')});assert.equal(result,'reshaped');assert.equal(encoded.width,512);assert.equal(encoded.height,512);
});
test('Cancellation after decoding skips rasterization and encoding',async()=>{
 const out=await A.prepare({asset:'local.svg'},straight,{load:async()=>({}),capture:()=>assert.fail('Cancelled'),pixels:()=>assert.fail('Cancelled'),encode:()=>assert.fail('Cancelled')},()=>false);assert.equal(out,undefined);
});
test('Request tokens reject cancelled and superseded operations',()=>{
 const guard=A.requestGuard(),first=guard.begin();assert.equal(guard.current(first),true);guard.cancel();assert.equal(guard.current(first),false);const second=guard.begin(),third=guard.begin();assert.equal(guard.current(second),false);assert.equal(guard.current(third),true);assert.equal(guard.current(null),false);
});
test('Invalid image buffers, resolutions and planning dimensions fail before rasterization',()=>{
 for(const image of[null,{width:0,height:1,data:[]},{width:5000,height:1,data:[]},{width:2,height:2,data:new Uint8Array(3)}])assert.throws(()=>A.remap(image,curve,straight));for(const max of[0,15,1025,Infinity,1.5])assert.throws(()=>A.remap(pixels(),curve,straight,max));assert.throws(()=>A.remap(pixels(),curve,{...curve,angleDeg:0}));
});
