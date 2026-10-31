(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.CatalogueFolders=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const names=['Straights','Corners','Digital pieces','Extras'],collator=new Intl.Collator('en',{numeric:true,sensitivity:'base'});
function category(d){const p=d.parameters||{},name=d.name||'',cat=d.category||'',text=cat+' '+name;
 if(p.type?.endsWith('border')||/border|shoulder|barrier|guardrail|accessor|support|clip|wall|gantry|tower/i.test(text))return 'Extras';
 if(/passive crossover|analogue crossover|fixed lane crossover/i.test(name))return 'Extras';
 if(p.laneChange||/digital|oXigen|advance|lane chang|pit[- ]lane|pit stop|control unit|black box|check lane|multistart|single-lane adapter unit/i.test(text))return 'Digital pieces';
 if(/power|timing|lap counter|trackside|adapter|converter/i.test(text))return 'Extras';
 if(p.type==='routed-spline'||p.type==='curve'||/curve|corner|hairpin|\bR\d+\b/i.test(name)||cat==='Curves')return 'Corners';
 if(p.type==='straight'||/straight/i.test(name)||cat==='Straights')return 'Straights';
 return 'Extras';
}
function length(d){return d.parameters?.lengthMm??Number(d.name?.match(/(\d+(?:\.\d+)?)\s*mm\b/i)?.[1]||0);}
function compare(group,a,b){
 if(group==='Straights'){const delta=length(b)-length(a);if(delta)return delta;}
 if(group==='Corners'){const ra=a.name.match(/\bR(\d+)\b/i),rb=b.name.match(/\bR(\d+)\b/i);if(ra&&rb&&+ra[1]!==+rb[1])return +ra[1]-+rb[1];if(!!ra!==!!rb)return ra?-1:1;if(!ra&&!rb){const ar=a.parameters?.innerRadiusMm??Infinity,br=b.parameters?.innerRadiusMm??Infinity;if(ar!==br)return ar<br?-1:1;}}
 return collator.compare(a.name,b.name)||collator.compare(a.sku||'',b.sku||'')||collator.compare(a.id,b.id);
}
function group(pieces){return names.map(name=>({name,pieces:pieces.filter(d=>category(d)===name).slice().sort((a,b)=>compare(name,a,b))}));}
return{names,category,group};
});
