(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./core.js'));else root.ReferenceArtwork=factory(root.Forge);})(typeof globalThis!=='undefined'?globalThis:this,function(F){
'use strict';
// A dialog request may outlive the dialog itself. Only its current token may
// commit a result or update its controls after asynchronous image decoding.
function requestGuard(){let current=null;return{begin(){return current={};},cancel(){current=null;},current:token=>token!==null&&token===current};}
function mapping(raw){
 const plan=F.validatePlanning(raw),bounds=F.G.derive({...plan,laneCount:1,laneSpacingMm:0}).boundsMm,pad=plan.artworkPaddingMm,width=bounds[2]+2*pad,height=bounds[3]+2*pad,angle=F.rad(plan.angleDeg||0);
 function imagePoint(u,v){let x,y;if(plan.type==='straight'){x=u*plan.lengthMm;y=v*plan.widthMm;}else{const radius=plan.innerRadiusMm+v*plan.widthMm;x=radius*Math.sin(u*angle);y=-radius*Math.cos(u*angle);}if(plan.reflectX)x=2*bounds[0]+bounds[2]-x;return[(x-bounds[0]+pad)/width,(y-bounds[1]+pad)/height];}
 function roadPoint(nx,ny){let x=nx*width+bounds[0]-pad;const y=ny*height+bounds[1]-pad;if(plan.reflectX)x=2*bounds[0]+bounds[2]-x;let u,v;if(plan.type==='straight'){u=x/plan.lengthMm;v=y/plan.widthMm;}else{let a=Math.atan2(x,-y);if(a< -1e-10)a+=Math.PI*2;u=a/angle;v=(Math.hypot(x,y)-plan.innerRadiusMm)/plan.widthMm;}if(u< -1e-8||u>1+1e-8||v< -1e-8||v>1+1e-8)return null;return[Math.max(0,Math.min(1,u)),Math.max(0,Math.min(1,v))];}
 return{plan,imagePoint,roadPoint};
}
function needsRemap(previous,next){return!!previous&&!!next&&JSON.stringify(F.validatePlanning(previous))!==JSON.stringify(F.validatePlanning(next));}
// Reproject the original road texture by distance along the road and across
// its width. This preserves its markings while the bend angle/radius changes.
// Normalized coordinates also support imported, stretched reference images.
function remap(image,previous,next,maxDimension=512){
 if(!image||!Number.isInteger(image.width)||!Number.isInteger(image.height)||image.width<1||image.height<1||image.width>2048||image.height>2048||!image.data||image.data.length!==image.width*image.height*4)throw Error('Invalid reference image pixels.');
 if(!Number.isInteger(maxDimension)||maxDimension<16||maxDimension>1024)throw Error('Invalid reference image resolution.');
 const from=mapping(previous),to=mapping(next),size=F.planningSize(to.plan),scale=maxDimension/Math.max(size.lengthMm,size.widthMm),width=Math.max(1,Math.round(size.lengthMm*scale)),height=Math.max(1,Math.round(size.widthMm*scale)),data=new Uint8ClampedArray(width*height*4);
 function sample(nx,ny){const x=Math.max(0,Math.min(image.width-1,nx*image.width-.5)),y=Math.max(0,Math.min(image.height-1,ny*image.height-.5)),x0=Math.floor(x),y0=Math.floor(y),fx=x-x0,fy=y-y0;let alpha=0,red=0,green=0,blue=0;
  for(const[px,py,weight]of[[x0,y0,(1-fx)*(1-fy)],[Math.min(x0+1,image.width-1),y0,fx*(1-fy)],[x0,Math.min(y0+1,image.height-1),(1-fx)*fy],[Math.min(x0+1,image.width-1),Math.min(y0+1,image.height-1),fx*fy]]){const i=(py*image.width+px)*4,a=image.data[i+3]/255*weight;alpha+=a;red+=image.data[i]*a;green+=image.data[i+1]*a;blue+=image.data[i+2]*a;}return[red,green,blue,alpha];
 }
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){let alpha=0,red=0,green=0,blue=0;
  // Four subpixel samples keep new curved edges smooth and transparent.
  for(const dx of[.25,.75])for(const dy of[.25,.75]){const uv=to.roadPoint((x+dx)/width,(y+dy)/height);if(!uv)continue;const sampleAt=from.imagePoint(...uv),c=sample(...sampleAt);red+=c[0];green+=c[1];blue+=c[2];alpha+=c[3];}
  const i=(y*width+x)*4;if(alpha){data[i]=red/alpha;data[i+1]=green/alpha;data[i+2]=blue/alpha;data[i+3]=alpha/4*255;}
 }
 return{width,height,data};
}
// Adapter callbacks keep DOM/canvas concerns outside the geometry and tests.
async function prepare(source,next,{load,capture,pixels,encode},stillCurrent=()=>true){
 const previous=source.parameters?.planning||source.referencePlan;
 if(!source.referenceImage&&!source.asset)return undefined;
 const reshape=needsRemap(previous,next);
 if(source.referenceImage&&!reshape)return source.referenceImage;
 const image=await load(source.referenceImage||source.asset);
 if(!stillCurrent())return undefined;
 return reshape?encode(remap(pixels(image),previous,next)):capture(image);
}
return{requestGuard,mapping,needsRemap,remap,prepare};
});
