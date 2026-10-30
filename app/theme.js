// Apply before drawing. Appearance belongs to this browser, not a track layout.
(function(){
  'use strict';
  const T=window.AppThemeModel,root=document.documentElement,key='slotforge.appearance.v1',legacyKey='slotforge.theme.v1';
  const fileMode=location.protocol==='file:',packageRoot=new URL('../',document.currentScript.src);
  let state=T.read(null),ready=false,storageOK=true,ui=null;
  try{state=T.read(localStorage.getItem(key)||localStorage.getItem(legacyKey));}catch{storageOK=false;}
  if(fileMode){const incoming=T.fromURL(new URL(location.href));if(incoming){state=T.read({...state,...incoming});save();}}
  function save(){
    try{localStorage.setItem(key,JSON.stringify(state));localStorage.setItem(legacyKey,state.theme);storageOK=true;}catch{storageOK=false;}
  }
  function updateLinks(){
    if(!fileMode)return;
    document.querySelectorAll('a[href]').forEach(link=>{
      const href=link.getAttribute('href');if(!href||href.startsWith('#')||link.hasAttribute('download'))return;
      let url;try{url=new URL(href,location.href);}catch{return;}
      if(url.protocol==='file:'&&url.href.startsWith(packageRoot.href)&&/\.html$/i.test(url.pathname))link.href=T.toURL(url,state).href;
    });
  }
  function palette(theme){
    // Read the actual CSS, also on gallery pages without the settings controls.
    const sample=document.createElement('span');sample.dataset.theme=theme;sample.hidden=true;document.body.append(sample);
    const css=getComputedStyle(sample),result=Object.fromEntries(T.COLORS.map(([k])=>[k,T.hex(css.getPropertyValue('--'+k))||T.DEFAULT[k]]));
    sample.remove();return result;
  }
  function customStyle(element,colors){
    for(const [k]of T.COLORS)element.style.setProperty('--'+k,colors[k]);
    element.style.setProperty('--on-accent',T.onAccent(colors.accent));
  }
  function apply(remember=false){
    root.dataset.theme=state.theme;
    const custom=state.theme==='custom',c=T.colors(state.customColors);
    for(const [k]of T.COLORS)root.style.setProperty('--'+k,custom?c[k]:'');
    root.style.setProperty('--on-accent',custom?T.onAccent(c.accent):'');
    const light=custom?T.isLight(c.panel):['light','ocean'].includes(state.theme);
    root.dataset.tone=light?'light':'dark';root.style.colorScheme=light?'light':'dark';
    if(remember){
      save();
      if(fileMode){try{history.replaceState(history.state,'',T.toURL(new URL(location.href),state).href);}catch{}}
    }
    if(ready){
      document.querySelectorAll('[data-theme-choice],[data-pick-theme]').forEach(button=>button.setAttribute('aria-pressed',String((button.dataset.themeChoice||button.dataset.pickTheme)===state.theme)));
      document.querySelectorAll('.theme-switch').forEach(group=>group.title='Current theme: '+T.THEMES.find(([k])=>k===state.theme)[1]);
      updateUI();updateLinks();
    }
  }
  function choose(theme){
    if(!T.validTheme(theme))return;
    if(theme==='custom'&&!state.customColors)state.customColors=palette(state.theme==='custom'?'dark':state.theme);
    state.theme=theme;apply(true);
  }
  function updateUI(){
    if(!ui)return;
    const c=T.colors(state.customColors);customStyle(ui.customTile,c);
    ui.inputs.forEach(({key,input,output})=>{if(document.activeElement!==input)input.value=c[key];output.textContent=c[key];});
    const warnings=state.theme==='custom'?T.problems(c):[];ui.warning.textContent=warnings.join(' ');ui.warning.hidden=!warnings.length;
    ui.status.textContent=storageOK?'Theme changes are saved automatically in this browser.':'Your theme is applied, but this browser is blocking preference saving.';
    ui.current.textContent=T.THEMES.find(([k])=>k===state.theme)[1];
  }
  function mount(){
    if(!document.getElementById('app-theme-settings'))return;
    const grid=document.getElementById('theme-presets');
    for(const [id,name]of T.THEMES){
      const button=document.createElement('button');button.type='button';button.className='theme-pick';button.dataset.pickTheme=id;button.dataset.theme=id;
      const swatches=document.createElement('span');swatches.className='theme-swatches';swatches.setAttribute('aria-hidden','true');
      for(let i=0;i<4;i++)swatches.append(document.createElement('i'));
      const label=document.createElement('span');label.className='theme-pick-label';label.textContent=name;
      button.append(swatches,label);button.addEventListener('click',()=>choose(id));grid.append(button);
    }
    const list=document.getElementById('theme-colors'),inputs=[];
    for(const [key,name,where]of T.COLORS){
      const label=document.createElement('label');label.className='theme-color-row';
      const input=document.createElement('input');input.type='color';input.dataset.themeColor=key;input.setAttribute('aria-label',name+' colour');
      const text=document.createElement('span'),title=document.createElement('strong'),hint=document.createElement('small'),output=document.createElement('output');
      title.textContent=name;hint.textContent=where;output.className='theme-hex';text.append(title,hint,output);label.append(input,text);list.append(label);inputs.push({key,input,output});
      const edit=()=>{
        if(!state.customColors)state.customColors=palette(state.theme==='custom'?'dark':state.theme);
        state.customColors[key]=T.hex(input.value)||state.customColors[key];state.theme='custom';apply(true);
      };
      input.addEventListener('input',edit);input.addEventListener('change',edit);
    }
    const from=document.getElementById('theme-copy-from');
    for(const [id,name]of T.THEMES.filter(([id])=>id!=='custom')){const option=document.createElement('option');option.value=id;option.textContent=name;from.append(option);}
    from.value=state.theme==='custom'?'dark':state.theme;
    document.getElementById('theme-copy').addEventListener('click',()=>{state.customColors=palette(from.value);state.theme='custom';apply(true);});
    ui={customTile:grid.querySelector('[data-pick-theme="custom"]'),inputs,warning:document.getElementById('theme-contrast'),status:document.getElementById('theme-save-status'),current:document.getElementById('theme-current')};
  }
  apply();
  document.addEventListener('DOMContentLoaded',()=>{
    ready=true;mount();document.querySelectorAll('[data-theme-choice]').forEach(button=>button.addEventListener('click',()=>choose(button.dataset.themeChoice)));
    apply();document.addEventListener('click',updateLinks,true);
  });
  window.addEventListener('storage',event=>{if(event.key===key){state=T.read(event.newValue);apply();}});
  window.addEventListener('pageshow',()=>{try{const saved=localStorage.getItem(key);if(saved){state=T.read(saved);apply();}}catch{}});
})();
