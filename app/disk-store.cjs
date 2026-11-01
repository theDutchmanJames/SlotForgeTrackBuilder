// User data is separate from app versions. A complete, validated workspace is
// replaced atomically; older versions and deleted designs remain recoverable.
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),I=require('./integration.js'),CP=require('./custom-packs.js'),DL=require('./design-library.js');
const NO_WRITE=Symbol('no-write'),MAX=50*1024*1024,clone=x=>structuredClone(x),revision=()=>crypto.randomUUID();
// Circuit retains the original installation path so upgrades find saved work.
function home(platform=process.platform,env=process.env,user=os.homedir()){if(env.SLOTFORGE_HOME)return path.resolve(env.SLOTFORGE_HOME);return platform==='win32'?path.join(env.LOCALAPPDATA||path.join(user,'AppData','Local'),'SlotForgeTrackBuilder'):platform==='darwin'?path.join(user,'Library','Application Support','SlotForgeTrackBuilder'):path.join(env.XDG_DATA_HOME||path.join(user,'.local','share'),'SlotForgeTrackBuilder');}
function error(message,status=400){const e=Error(message);e.status=status;return e;}
function cleanLayout(raw){if(Buffer.byteLength(JSON.stringify(raw))>5*1024*1024)throw error('A layout exceeds the 5 MiB limit.');return I.prepare(raw,undefined,false);}
function layoutSignature(value){const t=value.timing||{};return I.hash(I.canonical({title:value.title,pieces:value.pieces,definitions:value.definitions,profile:value.profile,workspace:value.workspace||null,timing:{startFinish:t.startFinish||null,direction:t.direction||1,routeLabels:t.routeLabels||{}}}));}
function packSignature(value){return I.hash(I.canonical({...value,pieces:value.pieces.map(({id,...rest})=>rest)}));}
function validate(state){if(state?.format!=='slotforge.disk-workspace'||state.version!==1||!Array.isArray(state.designs)||state.designs.length>200||!Array.isArray(state.trash))throw error('Invalid workspace file. The original has been retained.',500);const ids=new Set();for(const r of state.designs){if(!r||typeof r.id!=='string'||ids.has(r.id)||typeof r.revision!=='string'||r.layout?.design?.id!==r.id)throw error('Invalid saved track record.',500);ids.add(r.id);cleanLayout(r.layout);}if(state.current)cleanLayout(state.current.data);if(state.packs)CP.read(state.packs.data);return state;}
class DiskStore{
 constructor(directory){this.directory=path.resolve(directory);this.file=path.join(this.directory,'workspace.json');this.queue=Promise.resolve();}
 async init(){await fs.mkdir(this.directory,{recursive:true,mode:0o700});if((await fs.lstat(this.directory)).isSymbolicLink())throw error('The data directory must not be a symbolic link.',500);await fs.mkdir(path.join(this.directory,'backups'),{mode:0o700,recursive:true});await fs.writeFile(path.join(this.directory,'ABOUT-YOUR-DATA.txt'),'SlotForge Circuit user data\nworkspace.json holds autosave, saved tracks and custom packs.\nbackups/ retains the 20 previous successful workspace versions.\nThe app never replaces an unreadable workspace with an empty one.\nStop all SlotForge launchers before restoring a backup as workspace.json.\nApp updates use a separate app/ folder and do not replace this directory.\nBack up this entire data folder to another disk for protection against disk loss.\n',{mode:0o600});return this;}
 async read(){try{const stat=await fs.lstat(this.file);if(!stat.isFile()||stat.isSymbolicLink()||stat.size>MAX)throw error('Workspace file is invalid or too large. Original retained.',500);return validate(JSON.parse(await fs.readFile(this.file,'utf8')));}catch(e){if(e.code==='ENOENT')return{format:'slotforge.disk-workspace',version:1,revision:revision(),current:null,packs:null,designs:[],trash:[]};if(e.status)throw e;throw error('Cannot read workspace.json. Original retained; restore a copy from backups.',500);}}
 async lock(){
  const file=path.join(this.directory,'.write-lock'),token=revision();
  for(let i=0;i<100;i++){
   let acquired=false;
   try{
    const handle=await fs.open(file,'wx',0o600);acquired=true;
    try{await handle.writeFile(JSON.stringify({pid:process.pid,token}));}finally{await handle.close();}
    return async()=>{try{const value=JSON.parse(await fs.readFile(file,'utf8'));if(value.token===token)await fs.unlink(file);}catch{}};
   }catch(e){
    if(acquired){await fs.unlink(file).catch(()=>{});throw e;}
    if(e.code!=='EEXIST')throw e;
    try{
     const before=await fs.lstat(file),text=await fs.readFile(file,'utf8');let value;
     try{value=JSON.parse(text);}catch{}
     let abandoned=false;
     if(Number.isInteger(value?.pid)&&value.pid>0){try{process.kill(value.pid,0);}catch(check){abandoned=check.code==='ESRCH';}}
     // A crash between creating and filling the lock can leave an empty or
     // partial file. Allow time for a live writer to finish before recovery.
     else abandoned=before.isFile()&&Date.now()-before.mtimeMs>30000;
     if(abandoned){const after=await fs.lstat(file);if(before.dev===after.dev&&before.ino===after.ino&&before.mtimeMs===after.mtimeMs&&before.size===after.size&&text===await fs.readFile(file,'utf8')){await fs.unlink(file);continue;}}
    }catch{}
    await new Promise(r=>setTimeout(r,25));
   }
  }
  throw error('Another SlotForge window is writing files. Please retry.',409);
 }
 mutate(fn){const run=async()=>{const release=await this.lock();try{const state=await this.read(),result=await fn(state);if(result?.[NO_WRITE])return clone(result.value);state.revision=revision();state.trash=state.trash.slice(-20);let text=JSON.stringify(state,null,2)+'\n';while(Buffer.byteLength(text)>MAX&&state.trash.length){state.trash.shift();text=JSON.stringify(state,null,2)+'\n';}if(Buffer.byteLength(text)>MAX)throw error('The workspace exceeds 50 MiB. Export or remove some library tracks.');const temp=path.join(this.directory,'.workspace-'+revision()+'.tmp');let backup;try{try{backup=path.join(this.directory,'backups',Date.now()+'-'+revision()+'.json');await fs.copyFile(this.file,backup);}catch(e){if(e.code!=='ENOENT')throw e;}const handle=await fs.open(temp,'wx',0o600);try{await handle.writeFile(text);await handle.sync();}finally{await handle.close();}await fs.rename(temp,this.file);try{const dir=await fs.open(this.directory,'r');try{await dir.sync();}finally{await dir.close();}}catch{}const names=(await fs.readdir(path.join(this.directory,'backups'))).filter(n=>/^\d+-[\w-]+\.json$/.test(n)).sort();for(const name of names.slice(0,-20))await fs.unlink(path.join(this.directory,'backups',name)).catch(()=>{});return clone(result);}catch(e){await fs.unlink(temp).catch(()=>{});throw e;}}finally{await release();}};const next=this.queue.then(run,run);this.queue=next.catch(()=>{});return next;}
 check(record,expected){if((record?.revision||null)!==(expected??null))throw error('This file changed in another window. Reload before saving, or export your current work as JSON.',409);}
 async current(){return clone((await this.read()).current);}
 async packs(){return clone((await this.read()).packs);}
 async list(){return clone((await this.read()).designs).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));}
 async get(id){const r=(await this.read()).designs.find(r=>r.id===id);if(!r)throw error('This track is no longer in the library.',404);return clone(r);}
 async putCurrent(raw,expected,librarySource=null){const data=cleanLayout(raw),source=DL.validateSource(librarySource,data.design.id);return this.mutate(s=>{if(s.current&&I.canonical(s.current.data)===I.canonical(data)&&I.canonical(s.current.librarySource||null)===I.canonical(source))return{[NO_WRITE]:true,value:s.current};this.check(s.current,expected);return s.current={revision:revision(),updatedAt:new Date().toISOString(),data,...(source?{librarySource:source}:{})};});}
 async putPacks(raw,expected){const data=CP.serialize(CP.read(raw));return this.mutate(s=>{if(s.packs&&I.canonical(s.packs.data)===I.canonical(data))return{[NO_WRITE]:true,value:s.packs};this.check(s.packs,expected);return s.packs={revision:revision(),updatedAt:new Date().toISOString(),data};});}
 async putDesign(raw,expected){const layout=cleanLayout(raw),id=layout.design.id;return this.mutate(s=>{const index=s.designs.findIndex(r=>r.id===id);this.check(s.designs[index],expected);if(index<0&&s.designs.length>=200)throw error('The Track Library supports 200 saved tracks.');const r={id,revision:revision(),updatedAt:new Date().toISOString(),layout};if(index<0)s.designs.push(r);else s.designs[index]=r;return r;});}
 remove(id,expected){return this.mutate(s=>{const i=s.designs.findIndex(r=>r.id===id);if(i<0)throw error('This track is no longer in the library.',404);this.check(s.designs[i],expected);s.trash.push({...s.designs[i],deletedAt:new Date().toISOString()});s.designs.splice(i,1);return{removed:true};});}
 async exportBundle(){const s=await this.read();return{format:'slotforge.workspace-transfer',version:1,createdAt:new Date().toISOString(),current:s.current?.data||null,customLibrary:s.packs?.data||CP.serialize(CP.empty()),designs:s.designs.map(r=>r.layout)};}
 async importBundle(raw){if(raw?.format!=='slotforge.workspace-transfer'||raw.version!==1||!Array.isArray(raw.designs)||raw.designs.length>200)throw error('Choose a SlotForge workspace-transfer JSON file.');const imported=raw.designs.map(cleanLayout),current=raw.current?cleanLayout(raw.current):null,packs=CP.read(raw.customLibrary);return this.mutate(s=>{let added=0,skipped=0,packCount=0;for(const layout of [...imported,...(current?[current]:[])]){const signature=layoutSignature(layout);if(s.designs.some(r=>r.importSignature===signature||layoutSignature(r.layout)===signature)){skipped++;continue;}let value=layout;if(s.designs.some(r=>r.id===value.design.id))value=DL.prepare(value,value.title.slice(0,89)+' (imported)',true);if(s.designs.length>=200)throw error('Import would exceed 200 saved tracks. No changes were written.');s.designs.push({id:value.design.id,revision:revision(),updatedAt:new Date().toISOString(),layout:value,importSignature:signature});added++;}const target=CP.read(s.packs?.data);for(const p of packs.packs){const pack=CP.exportPack(p);if(target.packs.some(t=>packSignature(CP.exportPack(t))===packSignature(pack)))continue;target.packs.push({...CP.importPack(pack,target),inLibrary:p.inLibrary});packCount++;}if(packCount)s.packs={revision:revision(),updatedAt:new Date().toISOString(),data:CP.serialize(target)};return{tracksAdded:added,tracksSkipped:skipped,packsAdded:packCount};});}
}
module.exports={DiskStore,home,MAX};
