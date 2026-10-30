// One header template for the editor and every generated catalogue page.
const fs=require('node:fs'),path=require('node:path');
function header(appPath,packsPath,active='packs'){
 const links=[['builder','Track Builder',appPath+'#builder'],['library','Track Library',appPath+'#library'],['packs','Track Packs',packsPath],['custom','Custom Track',appPath+'#custom'],['plugins','Plugins',appPath+'#plugins'],['export','Export',appPath+'#export']];
 return `<header class="sf-header"><a class="sf-brand" href="${appPath}#builder" aria-label="SlotForge Track Builder"><svg width="34" height="28" viewBox="0 0 34 28" aria-hidden="true"><rect x="2" y="3" width="30" height="22" rx="11" fill="none" stroke="#e5484d" stroke-width="3"/><rect x="8" y="9" width="18" height="10" rx="5" fill="none" stroke="#e8e6e1" stroke-width="2"/></svg><span><strong>SlotForge</strong><small>TRACK BUILDER</small></span></a><nav aria-label="Main navigation">${links.map(([id,label,url])=>`<a class="sf-nav-link" data-section="${id}" href="${url}"${id===active?' aria-current="page"':''}>${label}</a>`).join('')}</nav><span class="sf-version">v0.3.2</span></header>`;
}
function install(directory){
 const file=path.join(directory,'index.html'),app=path.relative(directory,path.resolve(__dirname,'../../app')).replaceAll('\\','/'),packs=path.relative(directory,path.resolve(__dirname,'..')).replaceAll('\\','/');
 let html=fs.readFileSync(file,'utf8').replace(/<header\b[^>]*>[\s\S]*?<\/header>/,header(app+'/index.html',(packs?packs+'/':'')+'index.html'));
 if(!html.includes('rel="icon"'))html=html.replace('</head>',`<link rel="icon" type="image/svg+xml" href="${app}/icon.svg"></head>`);
 if(!html.includes('navigation.css'))html=html.replace('<main>',`<link rel="stylesheet" href="${app}/navigation.css"><main>`);
 fs.writeFileSync(file,html);
}
module.exports=install;module.exports.header=header;
