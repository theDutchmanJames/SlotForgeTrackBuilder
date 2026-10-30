const F=require('./core.js'),I=require('./integration.js');
function oval(lanes=2){
 const width=lanes*100,definitions=[{id:'test:straight',name:'Straight',family:'test',color:'#343a40',parameters:{type:'straight',lengthMm:345,widthMm:width,laneCount:lanes,laneSpacingMm:100}},{id:'test:curve',name:'Curve',family:'test',color:'#343a40',parameters:{type:'curve',innerRadiusMm:400,widthMm:width,laneCount:lanes,laneSpacingMm:100,angleDeg:30}}].map(F.validateDefinition),defs=Object.fromEntries(definitions.map(d=>[d.id,d])),pieces=[];
 for(const d of [...Array(3).fill(definitions[0]),...Array(6).fill(definitions[1]),...Array(3).fill(definitions[0]),...Array(6).fill(definitions[1])]){let p={...F.pose(d),id:'piece-'+String(pieces.length).padStart(2,'0')};if(pieces.length)p=F.join(p,d,0,F.ports(pieces.at(-1),defs)[1]);pieces.push(p);}
 const raw={format:'slotforge.layout',version:1,title:lanes+' lane oval',pieces,definitions,profile:F.presets.Balanced},state={...I.newState(),designId:'fixture-'+lanes,startFinish:{pieceId:'piece-05',fraction:.37}};
 return I.prepare(raw,state);
}
module.exports={oval};
