const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto'),os=require('node:os'),{spawnSync}=require('node:child_process');
const packageRoot=path.resolve(__dirname,'..');
async function atomic(file,value){const temp=file+'.'+crypto.randomUUID()+'.tmp',h=await fs.open(temp,'wx',0o600);try{await h.writeFile(value);await h.sync();}finally{await h.close();}await fs.rename(temp,file);}
const posix=require('./posix-start.cjs'),quoteShell=posix.quoteShell;
async function install(home,{shortcuts=true,open=true}={}){
 home=path.resolve(home);if(home===path.parse(home).root||home===os.homedir())throw Error('Choose a dedicated SlotForge folder, not your home or a drive root.');
 const manifest=JSON.parse(await fs.readFile(path.join(packageRoot,'PACKAGE-MANIFEST.json'),'utf8'));if(!/^\d+\.\d+\.\d+$/.test(manifest.version)||!manifest.sha256||typeof manifest.sha256!=='object')throw Error('Invalid app package manifest.');
 const entries=Object.entries(manifest.sha256);for(const[name,hash]of entries){const source=path.resolve(packageRoot,name);if(!source.startsWith(packageRoot+path.sep)||path.isAbsolute(name)||(await fs.lstat(source)).isSymbolicLink())throw Error('Invalid package path.');if(crypto.createHash('sha256').update(await fs.readFile(source)).digest('hex')!==hash)throw Error('Package file failed verification: '+name);}
 await fs.mkdir(home,{recursive:true,mode:0o700});if((await fs.lstat(home)).isSymbolicLink())throw Error('Install destination must not be a symbolic link.');const prior=await fs.readdir(home);if(!prior.includes('.slotforge-install.json')&&prior.some(n=>!['runtime','.setup-cache'].includes(n)))throw Error('The destination contains other files. Choose an empty folder or an existing SlotForge installation.');
 for(const child of ['app','runtime','data']){const p=path.join(home,child);try{if((await fs.lstat(p)).isSymbolicLink())throw Error('Install folders must not be symbolic links.');}catch(e){if(e.code!=='ENOENT')throw e;}}
 const build=crypto.createHash('sha256').update(JSON.stringify(manifest.sha256)).digest('hex').slice(0,12),relative='app/'+manifest.version+'-'+build,destination=path.join(home,relative);await fs.mkdir(destination,{recursive:true,mode:0o700});
 for(const[name]of entries){const target=path.resolve(destination,name);if(!target.startsWith(destination+path.sep))throw Error('Invalid install path.');await fs.mkdir(path.dirname(target),{recursive:true,mode:0o700});await fs.copyFile(path.join(packageRoot,name),target);}
 await atomic(path.join(destination,'.ready.json'),JSON.stringify({version:manifest.version,build}));
 const exe=process.platform==='win32'?'node.exe':'node',runtime=path.join(home,'runtime',process.version+'-'+process.arch,exe);await fs.mkdir(path.dirname(runtime),{recursive:true,mode:0o700});
 // Official bootstrap distributions already live inside home/runtime. Manual
 // Node installs get a private executable, so launch never depends on PATH.
 const executing=path.resolve(process.execPath);if(!executing.startsWith(path.join(home,'runtime')+path.sep)){let same=false;try{same=crypto.createHash('sha256').update(await fs.readFile(runtime)).digest('hex')===crypto.createHash('sha256').update(await fs.readFile(executing)).digest('hex');}catch{}if(!same)await fs.copyFile(executing,runtime);await fs.chmod(runtime,0o700);await fs.copyFile(path.join(__dirname,'NODE-LICENSE.txt'),path.join(path.dirname(runtime),'NODE-LICENSE.txt'));}
 const runtimePath=executing.startsWith(path.join(home,'runtime')+path.sep)?executing:runtime;
 await fs.copyFile(path.join(__dirname,'launcher.cjs'),path.join(home,'launcher.cjs'));await fs.copyFile(path.join(packageRoot,'app/icon.ico'),path.join(home,'icon.ico'));await fs.copyFile(path.join(packageRoot,'app/icon.png'),path.join(home,'icon.png'));
 const start=posix.start(runtimePath);
 await fs.mkdir(path.join(home,'data'),{recursive:true,mode:0o700});for(const name of ['Start SlotForge.sh','Start SlotForge.command']){await fs.writeFile(path.join(home,name),start);await fs.chmod(path.join(home,name),0o700);}
 const windowsStart=require('./windows-start.cjs');
 await fs.writeFile(path.join(home,'Start SlotForge.vbs'),Buffer.from('\ufeff'+windowsStart.vbs(runtimePath),'utf16le'));
 await fs.writeFile(path.join(home,'Start SlotForge.cmd'),windowsStart.batch());
 await fs.writeFile(path.join(home,'SlotForge Circuit.desktop'),posix.desktop(home));await fs.chmod(path.join(home,'SlotForge Circuit.desktop'),0o700);
 await atomic(path.join(home,'.slotforge-install.json'),JSON.stringify({format:'slotforge.installation',version:1,home}));await atomic(path.join(home,'active-app.json'),JSON.stringify({version:manifest.version,directory:relative,installedAt:new Date().toISOString()}));
 if(shortcuts&&process.platform==='win32'){const q=value=>"'"+value.replaceAll("'","''")+"'",code="$s=New-Object -ComObject WScript.Shell;$l=$s.CreateShortcut((Join-Path ($s.SpecialFolders('Desktop')) 'SlotForge Circuit.lnk'));$l.TargetPath="+q(path.join(process.env.SystemRoot||'C:\\Windows','System32','wscript.exe'))+";$l.Arguments="+q('"'+path.join(home,'Start SlotForge.vbs')+'"')+";$l.WindowStyle=7;$l.WorkingDirectory="+q(home)+";$l.IconLocation="+q(path.join(home,'icon.ico'))+";$l.Save()";const result=spawnSync('powershell.exe',['-NoProfile','-EncodedCommand',Buffer.from(code,'utf16le').toString('base64')],{windowsHide:true,stdio:'inherit'});if(result.status!==0)console.log('Use Start SlotForge.cmd in the app folder; desktop shortcut creation was unavailable.');}
 await fs.writeFile(path.join(home,'READ-ME.txt'),'SlotForge Circuit\nStart the app with Start SlotForge.cmd (Windows), Start SlotForge.command (macOS), or Start SlotForge.sh (Linux).\nThe browser is the interface; a private local process saves files in data/.\nUpdates replace the active app version and keep data/ and its backups.\nCopy data/ elsewhere for a backup or use Storage > Download workspace backup.\nStop the local app from its Storage dialog before copying/restoring live data.\n');
 console.log(JSON.stringify({installed:true,version:manifest.version,home,dataDirectory:path.join(home,'data')}));
 if(open)await require(path.join(home,'launcher.cjs')).launch(home);
 return{home,destination,dataDirectory:path.join(home,'data')};
}
if(require.main===module){const args=process.argv.slice(2),index=args.indexOf('--home'),home=index>=0?args[index+1]:require('../app/disk-store.cjs').home();install(home,{shortcuts:!args.includes('--no-shortcuts'),open:!args.includes('--no-open')}).catch(e=>{console.error(e.message);process.exitCode=1;});}
module.exports={install,quoteShell};
