// Colour validation and preferences following SlotForge Timing's App Theme.
// Preset colours remain in slotforge-reference.css.
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;else root.AppThemeModel=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const THEMES=[['dark','Dark'],['light','Light'],['midnight','Midnight blue'],['forest','Forest green'],['sunset','Sunset orange'],['violet','Violet'],['carbon','Carbon and yellow'],['ocean','Ocean (light)'],['custom','Custom (your own colours)']];
  const COLORS=[['bg','Background','The page and drawing canvas'],['panel','Panels','The header, cards and dialogs'],['ink','Text','Headings and normal text'],['muted','Quiet text','Labels, hints and inactive tabs'],['line','Lines','Borders, dividers and the grid'],['accent','Accent','Main buttons, selections and active tabs']];
  const DEFAULT={bg:'#171b21',panel:'#222831',ink:'#e8e6e1',muted:'#98a0ab',line:'#343b47',accent:'#e5484d'};
  const validTheme=value=>THEMES.some(([key])=>key===value);
  function hex(value){
    if(typeof value!=='string')return '';
    const match=/^#([\da-f]{3}|[\da-f]{6})$/i.exec(value.trim());if(!match)return '';
    const digits=match[1].toLowerCase();return '#'+(digits.length===3?[...digits].map(c=>c+c).join(''):digits);
  }
  function colors(value){return Object.fromEntries(COLORS.map(([key])=>[key,hex(value?.[key])||DEFAULT[key]]));}
  function read(value){
    if(typeof value==='string'){
      if(validTheme(value))return{theme:value,customColors:null};
      try{value=JSON.parse(value);}catch{return{theme:'dark',customColors:null};}
    }
    if(!value||typeof value!=='object'||Array.isArray(value))return{theme:'dark',customColors:null};
    return{theme:validTheme(value.theme)?value.theme:'dark',customColors:value.customColors&&typeof value.customColors==='object'&&!Array.isArray(value.customColors)?colors(value.customColors):null};
  }
  const luminance=value=>{
    const [r,g,b]=[1,3,5].map(i=>parseInt(value.slice(i,i+2),16)/255).map(v=>v<=.03928?v/12.92:((v+.055)/1.055)**2.4);
    return .2126*r+.7152*g+.0722*b;
  };
  const ratio=(a,b)=>{const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
  const isLight=value=>luminance(hex(value)||DEFAULT.panel)>.35;
  const onAccent=value=>ratio(hex(value)||DEFAULT.accent,'#ffffff')>=3.7?'#ffffff':'#000000';
  function problems(value){
    const c=colors(value),out=[];
    if(Math.min(ratio(c.ink,c.bg),ratio(c.ink,c.panel))<3)out.push('Text is too close to the background or panels. Choose more contrasting colours.');
    if(Math.min(ratio(c.muted,c.bg),ratio(c.muted,c.panel))<2)out.push('Quiet text may be hard to read against the background or panels.');
    if(ratio(c.accent,c.bg)<2)out.push('The accent is close to the background, so selected items may be hard to see.');
    return out;
  }
  function fromURL(url){
    const theme=url.searchParams.get('sfTheme');if(!validTheme(theme))return null;
    const raw=url.searchParams.get('sfColors');
    if(raw===null)return theme==='custom'?null:{theme};
    const parts=raw.split(',');
    if(parts.length!==COLORS.length||parts.some(part=>!hex('#'+part)))return theme==='custom'?null:{theme};
    return{theme,customColors:Object.fromEntries(COLORS.map(([key],i)=>[key,hex('#'+parts[i])]))};
  }
  function toURL(url,value){
    const state=read(value);url.searchParams.set('sfTheme',state.theme);
    // Retain custom colours when visiting another file while a preset is active.
    if(state.customColors)url.searchParams.set('sfColors',COLORS.map(([key])=>state.customColors[key].slice(1)).join(','));
    else url.searchParams.delete('sfColors');return url;
  }
  return{THEMES,COLORS,DEFAULT,hex,colors,read,validTheme,isLight,onAccent,problems,fromURL,toURL};
});
