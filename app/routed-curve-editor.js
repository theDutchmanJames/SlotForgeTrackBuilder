(function(root){'use strict';
function init({change}){
 const R=root.RoutedTracks,S=R.Spline,$=id=>document.getElementById(id),form=$('routed-section-form'),f=form.elements;
 const option=document.createElement('option');option.value=S.TYPE;option.textContent='Flowing curve / S-bend';f.shape.append(option);
 const fields=document.createElement('div');fields.id='routed-flowing-fields';fields.hidden=true;
 fields.innerHTML=`<div class="routed-preset-row"><label class="field">Starting shape<select name="flowPreset"><option value="custom">Custom / converted curve</option><option value="bend">Sweeping bend</option><option value="s-bend">S-bend</option><option value="transition">Straight transition</option></select></label><button class="btn small" id="routed-use-preset" type="button">Use shape</button></div>
 <p class="fine" id="routed-handle-help">Drag the coloured handles in the preview. The square moves the end. Start stays anchored when you apply an edit.</p>
 <label class="check"><input name="lockTangents" type="checkbox" checked> Keep start and end directions</label>
 <div class="form-grid"><label>Start direction · °<input name="startDirection" type="number" min="-360" max="360" step="any"></label><label>End direction · °<input name="endDirection" type="number" min="-360" max="360" step="any"></label></div>
 <details class="routed-coordinates"><summary>Exact handle coordinates · mm</summary><div class="form-grid">${[['endX','End X'],['endY','End Y'],['handle1X','Start handle X'],['handle1Y','Start handle Y'],['handle2X','End handle X'],['handle2Y','End handle Y']].map(([key,label])=>`<label>${label}<input name="${key}" type="number" min="-10000" max="10000" step="any" required></label>`).join('')}</div></details>`;
 $('routed-curve-fields').after(fields);
 const convert=document.createElement('button');convert.type='button';convert.className='btn small';convert.textContent='Convert to flowing curve';$('routed-curve-fields').append(convert);
 let profile=R.settings(),svg=null,drag=null,view=null,fixed=false,directions={},cancelDrag=()=>{},lastShape=null,conversionError=null;
 root.addEventListener('blur',()=>cancelDrag());
 const mirrorSign=()=>f.turn.value==='left'?-1:1;
 const direction=key=>{const value=number(key),old=directions[key];return old&&old.shown===value?old.exact:value;};
 const number=key=>f[key].value.trim()===''?NaN:Number(f[key].value),round=v=>Math.round(v*10)/10;
 function write(points,angles=true){
  for(const[key,value]of Object.entries({handle1X:points[1][0],handle1Y:points[1][1],handle2X:points[2][0],handle2Y:points[2][1],endX:points[3][0],endY:points[3][1]}))f[key].value=Number(value.toFixed(6));
  if(angles){for(const [key,value]of [['startDirection',Math.atan2(points[1][1],points[1][0])*180/Math.PI],['endDirection',Math.atan2(points[3][1]-points[2][1],points[3][0]-points[2][0])*180/Math.PI]]){const exact=Math.abs(value)<1e-9?0:value*mirrorSign(),shown=Number(exact.toFixed(4));directions[key]={exact,shown};f[key].value=shown;}}
 }
 function read(){
  if(conversionError)throw conversionError;
  const p=[[0,0],[number('handle1X'),number('handle1Y')],[number('handle2X'),number('handle2Y')],[number('endX'),number('endY')]];
  if(f.lockTangents.checked&&p.flat().every(Number.isFinite)){
   const a=direction('startDirection')*mirrorSign()*Math.PI/180,b=direction('endDirection')*mirrorSign()*Math.PI/180;if(!Number.isFinite(a)||!Number.isFinite(b))throw Error('Enter both tangent directions.');
   const changed=key=>directions[key]&&number(key)!==directions[key].shown, h1=Math.max(1,changed('startDirection')?Math.hypot(...p[1]):p[1][0]*Math.cos(a)+p[1][1]*Math.sin(a)),h2=Math.max(1,changed('endDirection')?Math.hypot(p[3][0]-p[2][0],p[3][1]-p[2][1]):(p[3][0]-p[2][0])*Math.cos(b)+(p[3][1]-p[2][1])*Math.sin(b));
   p[1]=[h1*Math.cos(a),h1*Math.sin(a)];p[2]=[p[3][0]-h2*Math.cos(b),p[3][1]-h2*Math.sin(b)];
  }
  return{type:S.TYPE,controlPointsMm:S.curve(p)};
 }
 function activate(){profile=R.settings({...profile,...(f.constructionMode?{constructionMode:f.constructionMode.value}:{})});const next=f.shape.value;if(lastShape==='curve'&&next===S.TYPE){conversionError=null;try{const converted=R.flowingFromCurve(profile,{type:'curve',slotRadiusMm:number('slotRadiusMm'),angleDeg:number('angleDeg')},f.turn.value==='left');f.turn.value=converted.flip?'left':'right';write(converted.shape.controlPointsMm);f.flowPreset.value='custom';view=null;}catch(e){conversionError=e;}}else if(lastShape===S.TYPE&&next==='curve'){try{const k=S.evaluate(read().controlPointsMm,.5).curvature*mirrorSign();if(Math.abs(k)>1e-9)f.turn.value=k>0?'right':'left';}catch{}conversionError=null;}lastShape=next;const active=f.shape.value===S.TYPE;fields.hidden=!active;for(const input of fields.querySelectorAll('input,select'))input.disabled=!active||fixed&&['lockTangents','flowPreset'].includes(input.name);$('routed-use-preset').disabled=fixed||f.flowPreset.value==='custom';fields.querySelector('.routed-preset-row').hidden=fixed;return active;}
 function open(shape,s,fixEnds=false){profile=s;drag=null;view=null;fixed=fixEnds;$('routed-handle-help').textContent=fixed?'Drag the coloured handles to adjust the curve. Both endpoints and their directions stay fixed to the track.':'Drag the coloured handles in the preview. The square moves the end. Start stays anchored when you apply an edit.';lastShape=f.shape.value;conversionError=null;for(const key of ['startDirection','endDirection','endX','endY'])f[key].readOnly=fixed;f.lockTangents.checked=true;f.flowPreset.value=shape?.type===S.TYPE?'custom':'bend';write(shape?.type===S.TYPE?shape.controlPointsMm:S.preset('bend',s));activate();}
 function move(index,q){conversionError=null;if(fixed&&index===3)return;
  let p;try{p=read().controlPointsMm;}catch{p=[[0,0],[number('handle1X'),number('handle1Y')],[number('handle2X'),number('handle2Y')],[number('endX'),number('endY')]];if(!p.flat().every(Number.isFinite))return;}
  q=q.map(v=>round(Math.max(-10000,Math.min(10000,v))));if(index===3){const dx=q[0]-p[3][0],dy=q[1]-p[3][1];p[2]=[p[2][0]+dx,p[2][1]+dy];}p[index]=q;write(p,!f.lockTangents.checked);if(f.lockTangents.checked){try{write(read().controlPointsMm,false);}catch{}}change();
 }
 function attach(){
  svg.addEventListener('pointerdown',e=>{const index=Number(e.target.dataset.handle);if(![1,2,3].includes(index)||e.button!==0)return;e.preventDefault();drag={index,id:e.pointerId,before:Object.fromEntries(['handle1X','handle1Y','handle2X','handle2Y','endX','endY','startDirection','endDirection'].map(key=>[key,f[key].value])),directions:structuredClone(directions)};svg.setPointerCapture(e.pointerId);});
  svg.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;const pt=new DOMPoint(e.clientX,e.clientY).matrixTransform(svg.getScreenCTM().inverse());move(drag.index,[pt.x,pt.y*(f.turn.value==='left'?-1:1)]);});
  const finish=(cancel=false)=>{if(!drag)return;const previous=drag;drag=null;if(cancel){for(const[key,value]of Object.entries(previous.before))f[key].value=value;directions=previous.directions;}if(svg.hasPointerCapture(previous.id))svg.releasePointerCapture(previous.id);view=null;change();};svg.addEventListener('pointerup',()=>finish());svg.addEventListener('pointercancel',()=>finish(true));svg.addEventListener('lostpointercapture',()=>finish(true));cancelDrag=()=>finish(true);
  svg.addEventListener('keydown',e=>{const index=Number(e.target.dataset.handle),delta={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];if(!delta||![1,2,3].includes(index))return;e.preventDefault();let p;try{p=read().controlPointsMm[index];}catch{return;}const step=e.shiftKey?10:1;move(index,[p[0]+delta[0]*step,p[1]+delta[1]*step*(f.turn.value==='left'?-1:1)]);svg.querySelector('[data-handle="'+index+'"]')?.focus();});
 }
 function render(draft){
  activate();if(f.shape.value!==S.TYPE)return;
  const host=$('routed-section-preview');if(!svg||!host.contains(svg)){host.replaceChildren();svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('role','group');svg.setAttribute('aria-label','Flowing curve preview; use the handles or exact coordinates to edit');svg.classList.add('routed-handle-preview');host.append(svg);attach();}
  let c;try{c=read().controlPointsMm;}catch{c=[[0,0],[number('handle1X'),number('handle1Y')],[number('handle2X'),number('handle2Y')],[number('endX'),number('endY')]];if(!c.flat().every(Number.isFinite)){svg.innerHTML='';return;}}
  const flip=f.turn.value==='left',sign=flip?-1:1,bounds=draft?.geometry.boundsMm,all=[...c,...(bounds?[[bounds[0],bounds[1]],[bounds[0]+bounds[2],bounds[1]+bounds[3]]]:[])],xs=all.map(p=>p[0]),ys=all.map(p=>p[1]*sign),size=Math.max(Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys),100),pad=size*.12;
  if(!drag||!view)view=[Math.min(...xs)-pad,Math.min(...ys)-pad,Math.max(...xs)-Math.min(...xs)+pad*2,Math.max(...ys)-Math.min(...ys)+pad*2];svg.setAttribute('viewBox',view.join(' '));
  const radius=size*.016,body=draft?R.draw(draft):`<path d="M 0 0 C ${c[1]} ${c[2]} ${c[3]}" fill="none" stroke="var(--ui-error)" stroke-width="${radius/2}"/>`;
  let tight='';if(draft)for(const l of draft.geometry.lanePaths){const s=l.segments[0];for(let i=1;i<s.points.length;i++)if(Math.max(Math.abs(s.curvaturesPerMm[i-1]),Math.abs(s.curvaturesPerMm[i]))>1/profile.minRadiusMm)tight+=`<path d="M ${s.points[i-1]} L ${s.points[i]}" fill="none" stroke="#d24e4e" stroke-width="${radius*.55}"/>`;}
  svg.innerHTML=`<g transform="scale(1 ${sign})">${body}${tight}<path d="M 0 0 L ${c[1]} M ${c[3]} L ${c[2]}" fill="none" stroke="var(--muted)" stroke-width="${radius*.18}" stroke-dasharray="${radius*.8} ${radius*.4}"/><circle cx="0" cy="0" r="${radius*.6}" fill="var(--muted)"/>${[1,2].map(i=>`<circle role="button" tabindex="0" aria-label="${i===1?'Start':'End'} direction handle; arrow keys move 1 mm, Shift moves 10 mm" data-handle="${i}" cx="${c[i][0]}" cy="${c[i][1]}" r="${radius}" fill="var(--accent)" stroke="var(--panel)" stroke-width="${radius*.15}"/>`).join('')}<rect ${fixed?'role="img" aria-label="Fixed curve end"':'role="button" tabindex="0" aria-label="Curve end; arrow keys move 1 mm, Shift moves 10 mm" data-handle="3"'} x="${c[3][0]-radius}" y="${c[3][1]-radius}" width="${radius*2}" height="${radius*2}" fill="#327faa" stroke="var(--panel)" stroke-width="${radius*.15}"/></g>`;
 }
 $('routed-use-preset').onclick=()=>{conversionError=null;write(S.preset(f.flowPreset.value,profile));f.lockTangents.checked=true;view=null;change();};
 convert.onclick=()=>{f.shape.value=S.TYPE;activate();view=null;change();};
 for(const key of ['handle1X','handle1Y','handle2X','handle2Y','endX','endY','startDirection','endDirection'])f[key].addEventListener('change',()=>{conversionError=null;try{write(read().controlPointsMm,true);}catch{}change();});
 f.lockTangents.onchange=()=>{const checked=f.lockTangents.checked;f.lockTangents.checked=!checked;try{write(read().controlPointsMm,true);}catch{}finally{f.lockTangents.checked=checked;}change();};
 return{open,activate,read,render};
}
root.RoutedCurveEditor={init};
})(window);
