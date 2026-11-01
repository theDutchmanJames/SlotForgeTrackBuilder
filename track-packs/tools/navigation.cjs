// One header template for the editor and every generated catalogue page.
const fs=require('node:fs'),path=require('node:path');
function themeTools(appPath,active){return `<div class="sf-header-tools"><a class="sf-settings-link sf-nav-link" data-section="settings" href="${appPath}#settings" aria-label="Settings"${active==='settings'?' aria-current="page"':''}><span aria-hidden="true">⚙</span><span class="settings-label">Settings</span></a><div class="theme-switch" role="group" aria-label="Quick colour themes"><button type="button" data-theme-choice="light" aria-pressed="false"><span aria-hidden="true">☀</span> Light</button><button type="button" data-theme-choice="dark" aria-pressed="true"><span aria-hidden="true">☾</span> Dark</button></div><span class="sf-version">v0.3.16</span></div>`;}
function header(appPath,packsPath,active='packs'){
 const links=[['builder','Track Builder',appPath+'#builder'],['routed','Routed Wood',appPath+'#routed'],['freeform','FreeForm Drawing',appPath+'#freeform'],['library','Track Library',appPath+'#library'],['packs','Track Packs',packsPath],['custom','Custom Track',appPath+'#custom'],['plugins','Plugins',appPath+'#plugins'],['export','Export',appPath+'#export']];
 return `<header class="sf-header"><a class="sf-brand" href="${appPath}#builder" aria-label="SlotForge Circuit"><svg width="34" height="28" viewBox="0 0 34 28" aria-hidden="true"><rect x="2" y="3" width="30" height="22" rx="11" fill="none" stroke="#e5484d" stroke-width="3"/><rect x="8" y="9" width="18" height="10" rx="5" fill="none" stroke="#e8e6e1" stroke-width="2"/></svg><span><strong>SlotForge</strong><small>CIRCUIT</small></span></a><nav aria-label="Main navigation">${links.map(([id,label,url])=>`<a class="sf-nav-link" data-section="${id}" href="${url}"${id===active?' aria-current="page"':''}>${label}</a>`).join('')}</nav>${themeTools(appPath,active)}</header>`;
}
function install(directory){
 const file=path.join(directory,'index.html'),app=path.relative(directory,path.resolve(__dirname,'../../app')).replaceAll('\\','/'),packs=path.relative(directory,path.resolve(__dirname,'..')).replaceAll('\\','/');
 let html=fs.readFileSync(file,'utf8').replace(/<header\b[^>]*>[\s\S]*?<\/header>/,header(app+'/index.html',(packs?packs+'/':'')+'index.html'));
 if(!html.includes('rel="icon"'))html=html.replace('</head>',`<link rel="icon" type="image/svg+xml" href="${app}/icon.svg"></head>`);
 if(!html.includes('navigation.css'))html=html.replace('<main>',`<link rel="stylesheet" href="${app}/navigation.css"><main>`);
 html=themeAssets(html,app);
 fs.writeFileSync(file,html);
}
function themeAssets(html,app){
 if(!html.includes('data-theme-choice'))html=html.replace(/<span class="sf-version">[^<]*<\/span>/,themeTools(app+'/index.html'));
 if(!html.includes('/theme.js'))html=html.replace(/(<meta charset="utf-8">)/,`$1<script src="${app}/theme.js"></script>`);
 if(!html.includes('/theme-model.js'))html=html.replace(/<script src="[^"]*\/theme.js"><\/script>/,`<script src="${app}/theme-model.js"></script>$&`);
 if(!html.includes('/theme.css')){
  const css=`<link rel="stylesheet" href="${app}/theme.css">`;
  html=html.includes('</head>')?html.replace('</head>',css+'</head>'):html.replace('<header',css+'<header');
 }
 return html;
}
module.exports=install;module.exports.header=header;module.exports.themeAssets=themeAssets;
