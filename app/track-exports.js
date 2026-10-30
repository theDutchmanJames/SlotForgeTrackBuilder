(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./core.js'),require('./integration.js'));else root.TrackExports=factory(root.Forge,root.SlotForgeIntegration);})(typeof globalThis!=='undefined'?globalThis:this,function(F,I){
'use strict';
function build(raw){const layout=I.prepare(raw),clean=F.validateLayout(layout),pieces=clean.pieces,definitions=clean.definitions,inventory=new Map();let roads=0,borders=0,references=0,length=0;
 for(const p of pieces){const d=definitions[p.definitionId];if(!inventory.has(d.id))inventory.set(d.id,{d,count:0});inventory.get(d.id).count++;if(d.geometry.lanePaths.length){roads++;length+=d.geometry.centrelineLengthMm;}else if(d.parameters.type==='reference')references++;else if(d.parameters.type.endsWith('border'))borders++;}
 return{layout,title:clean.title,pieces,definitions,network:I.network(pieces,definitions),inventory:[...inventory.values()],summary:{roads,borders,references,length,bounds:F.bounds(pieces,definitions)}};
}
async function resolveSource(choice,current,getSaved){if(choice==='current')return build(current());if(typeof choice==='string'&&choice.startsWith('saved:')&&choice.length>6){const record=await getSaved(choice.slice(6));if(!record?.layout)throw Error('The selected saved track is unavailable. Choose another track.');return build(record.layout);}throw Error('Choose a track to export.');}
function filename(title){return((title||'Track').replace(/[<>:"/\\|?*\x00-\x1f]/g,'-').slice(0,90)||'Track');}
function csv(model){const quote=s=>'"'+String(s).replaceAll('"','""')+'"',safe=s=>/^(?:\s*[=+@-]|[\t\r\n])/.test(String(s))?"'"+s:s;const rows=[['Piece','Product code','Pack','Quantity','Type','Centreline mm per piece','Measurement basis'],...model.inventory.map(({d,count})=>[safe(d.name),safe(d.sku||''),safe(d.pack),count,d.parameters.type,d.parameters.type==='reference'?'':d.geometry.centrelineLengthMm,d.status])];return '\uFEFF'+rows.map(r=>r.map(quote).join(',')).join('\r\n');}
return{build,resolveSource,filename,csv};
});
