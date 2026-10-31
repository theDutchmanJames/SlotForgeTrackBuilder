// Produce a portable app archive with Python's standard library, or use this
// inventory from another ZIP tool. Kept separate from the research-pack bundles.
const fs=require('node:fs'),path=require('node:path');const root=path.resolve(__dirname,'..');
const files=['SlotForge Circuit.html','SlotForge Track Builder.html','index.html','README.txt','PROJECT-PLAN.txt','LICENSE','THIRD-PARTY-NOTICES.txt','designs/slotforge-reference.css'];
for(const folder of ['app','track-packs'])walk(folder);
function walk(folder){for(const entry of fs.readdirSync(path.join(root,folder),{withFileTypes:true})){const name=folder+'/'+entry.name;if(entry.isDirectory())walk(name);else if((!name.endsWith('.zip')||name.endsWith('slotforge-six-track-packs.zip'))&&!name.endsWith('.pdf'))files.push(name);}}
fs.writeFileSync(path.join(__dirname,'package-files.json'),JSON.stringify([...new Set(files)].filter(f=>!f.endsWith('package-files.json')),null,2));console.log(files.length+' portable app files listed');
