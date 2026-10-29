export const CHAPTERS=[
 {x:0,end:2635,name:'Le Belvédère des Neiges',hint:'Plonge dans les descentes vertigineuses et prends de l’élan',zone:0},
 {x:2635,end:5850,name:'Le Couloir Blanc',hint:'Enchaîne les pentes à 75 % et les grands sauts vers les réceptions en contrebas',zone:0},
 {x:5850,end:8400,name:'Le Grand Toboggan',hint:'Glisse à pleine vitesse vers la frontière volcanique',zone:0},
 {x:8400,end:11080,name:'La coulée ardente',hint:'Saute sur le balcon et son ressort pour la crête · ou dévale vers le looping',zone:1},
 {x:11080,end:14200,name:'Les orgues de basalte',hint:'Trois étages : canyon de lave, corniches médianes et crête basaltique',zone:1},
 {x:14200,end:16800,name:'Les terrasses de lave',hint:'Terrasses de récupération, ressort de remontée et dernier sommet de basalte',zone:1},
 {"x":16800,"end":18550,"name":"La porte du cirque","hint":"Pont de lianes ou saut de ravine, puis la pente et l’arche","zone":2},
 {"x":18550,"end":21100,"name":"La Rivière des Galets","hint":"Passerelle cassée, rivière, rocher de l’îlot flottant","zone":2},
 {"x":21100,"end":25200,"name":"Les étages de Trois-Roches","hint":"Roule dans le lacet pour le canal · rivière, passerelle, canal et arche","zone":2},
 {x:25200,end:28700,name:'La boucle du lagon',hint:'Passerelles du port ou grand looping côtier',zone:3},
 {x:28700,end:32100,name:'Les toits de Saint-Gilles',hint:'Trois emblèmes se cachent dans chaque région',zone:3},
 {x:32100,end:33600,name:'La dernière ligne droite',hint:'Cap sur Les Toiles Noires !',zone:3},
];

export function enrichAdventure(level,terrain){
 const SHIFT = 8400;
 const floor=x=>{const s=terrain.find(p=>x>=p.x&&x<=p.x+p.w);return s?s.y+(x-s.x)*s.slope:450;};
 const socket=x=>terrain.find(p=>x>=p.x&&x<=p.x+p.w).id;

 const branches=[
  // ZONE 1: Volcan
  {id:'cinder-entry',zone:1,style:'basalt',points:[[230+SHIFT,345,290]]},
  {id:'organs-entry',zone:1,style:'basalt',points:[[3200+SHIFT,370,200]]},
  {id:'terrace-entry',zone:1,style:'basalt',points:[[5150+SHIFT,345,200],[5420+SHIFT,410,140]]},
  {id:'volcano-mid',zone:1,style:'basalt',points:[[3560+SHIFT,445,190],[3830+SHIFT,415,190],[4100+SHIFT,435,190]]},
  {id:'lava-terrace',zone:1,style:'basalt',points:[[5620+SHIFT,445,185],[5880+SHIFT,420,550],[6500+SHIFT,395,190],[6770+SHIFT,345,175]]},
  // ZONE 3: Saint-Gilles
  {id:'promenade',zone:3,style:'comics',points:[[22360+SHIFT,485,185],[22620+SHIFT,425,185],[22880+SHIFT,370,210]]},
 ];
 for(const b of branches)for(const [i,[x,y,w]]of b.points.entries())level.platforms.push({id:`${b.id}-${i}`,kind:'roof',route:b.id,style:b.style,x,y,y2:y,w,h:22,slope:0});
 const findPlat=(route,x)=>level.platforms.find(p=>p.route===route&&x>=p.x&&x<=p.x+p.w);
 const rail=(route,x)=>{const p=findPlat(route,x);return p?p.y+(x-p.x)*p.slope:null;};

 level.springs.push(
  {x:420+SHIFT,y:345,surface:'cinder-entry-0',power:760,boost:420},
  {x:3925+SHIFT,y:415,surface:'volcano-mid-1',power:1450,boost:420,cooldown:.45},
  {x:6320+SHIFT,y:420,surface:'lava-terrace-1',power:880,boost:420,cooldown:.45},
  // Mafate v3 : ressorts sur rochers facultatifs, sorties des deux biefs de rivière.
  {x:20130,y:rail("mafate-ledge",20130),surface:findPlat("mafate-ledge",20130).id,power:900,boost:420,cooldown:.45},
  {x:20020,power:900,boost:420},
  {x:23230,y:rail("mafate-ledge2",23230),surface:findPlat("mafate-ledge2",23230).id,power:900,boost:420,cooldown:.45},
  {x:24430,power:900,boost:420}
 );

 level.loops.push(
  {id:'ember-loop',x:1460+SHIFT,baseY:680,radius:115,minSpeed:590},
  {id:"canal-loop",x:23050,baseY:300,radius:115,minSpeed:590,surface:findPlat("mafate-crest",23064).id}
 );

 level.pads.push(
  {x:1280+SHIFT,surface:socket(1280+SHIFT),speed:740},
  {x:24000+SHIFT,surface:socket(24000+SHIFT),speed:820}
 );

 level.movers.push(
  {id:'moving-volcano-0',kind:'roof',style:'basalt',x:4410+SHIFT,y:425,w:125,h:22,slope:0,motion:{axis:'y',amplitude:45,period:3.4}},
  {id:'moving-volcano-1',kind:'roof',style:'basalt',x:6640+SHIFT,y:390,w:130,h:22,slope:0,motion:{axis:'x',amplitude:55,period:3.6}},
  {id:'moving-lagoon',kind:'roof',style:'comics',x:20020+SHIFT,y:340,w:135,h:22,slope:0,motion:{axis:'y',amplitude:45,period:3.4}},
  {id:'moving-city-roof',kind:'roof',style:'comics',x:23150+SHIFT,y:370,w:130,h:22,slope:0,motion:{axis:'x',amplitude:50,period:3.1}}
 );

 const relics=[
  // Zone 0: Piton des Neiges
  [1100,floor(1100)-48],[4900,floor(4900)-48],[7200,floor(7200)-48],
  // Zone 1: Volcan
  [1700+SHIFT,rail('cinder-ridge',1700+SHIFT)-48],[4500+SHIFT,rail('volcano',4500+SHIFT)-48],[7400+SHIFT,rail('volcano',7400+SHIFT)-48],
  // Zone 2: Mafate
  [19200,floor(19200)-55],[20660,rail("mafate-sky",20660)-50],[23800,rail("mafate-arch",23800)-48],
  // Zone 3: Saint-Gilles
  [18750+SHIFT,level.loops[0].baseY-2*level.loops[0].radius-22],[22985+SHIFT,320],[24160+SHIFT,floor(24160+SHIFT)-55],
 ].map(([x,y],i)=>({id:`relic-${i}`,x,y,zone:Math.floor(i/3)}));

 const enemySockets=[
  900+SHIFT,3280+SHIFT,1920+SHIFT,4020+SHIFT,4950+SHIFT,6050+SHIFT,6950+SHIFT,8320+SHIFT,17550,21700,22250,20330,22080,17850+SHIFT,19950+SHIFT,21000+SHIFT,23900+SHIFT
 ];
 const enemies=enemySockets.map((x,i)=>({id:`enemy-${i}`,x,y:floor(x)-18,kind:i%3===1?'drone':'crab',range:i%3===1?65:42,phase:i*.7,surfaceId:socket(x),ground:[floor(x-42)-18,floor(x)-18,floor(x+42)-18]}));

 const sentrySockets=[
  ['volcano',4150+SHIFT,'crab'],['volcano',6150+SHIFT,'drone'],
  ["mafate",20100,"crab"],["mafate-trois",23150,"crab"],["mafate-crest",23650,"crab"],["mafate-trois",23800,"drone"],
  ['city',22400+SHIFT,'crab'],['city',23600+SHIFT,'drone']
 ];
 for(const [i,[route,x,kind]]of sentrySockets.entries()){
  const p=findPlat(route,x);
  if(p){const y=p.y+(x-p.x)*p.slope-18;enemies.push({id:`sentry-${i}`,x,y,kind,range:kind==='drone'?50:36,phase:i*.8,surfaceId:p.id,route,ground:[y,y,y]});}
 }

 const monitors=[
  650+SHIFT,2850+SHIFT,5050+SHIFT,6460+SHIFT,18350,23700,16980+SHIFT,20850+SHIFT,23850+SHIFT
 ].map((x,i)=>({id:`monitor-${i}`,x,y:floor(x)-22,type:i%2?'shield':'cache'}));

 for(const m of monitors){
  for(const offset of [0,...Array.from({length:36},(_,i)=>[(i+1)*40,-(i+1)*40]).flat()]){
   const x=m.x+offset,s=terrain.find(p=>x>=p.x&&x<=p.x+p.w);
   if(x<Math.floor(m.x/8400)*8400+100||x>Math.min(32800,(Math.floor(m.x/8400)+1)*8400-150))continue;
   if(!s||Math.abs(s.slope)>.12)continue;
   if(!terrain.some(p=>x-30>=p.x&&x-30<=p.x+p.w)||!terrain.some(p=>x+30>=p.x&&x+30<=p.x+p.w))continue;
   if(level.gaps.some(([a,b])=>x>a-170&&x<b+140))continue;
   if(enemies.some(e=>Math.abs(e.x-x)<e.range+80))continue;
   if([...level.checkpoints,...level.springs,...level.pads].some(p=>Math.abs(p.x-x)<95))continue;
   if(level.platforms.some(p=>['beam','crate'].includes(p.kind)&&x>p.x-80&&x<p.x+p.w+80))continue;
   if(level.loops.some(l=>Math.abs(x-l.x)<l.radius+80))continue;
   m.x=x;m.y=floor(x)-22;break;
  }
 }

 const vents=[
  ['cinder-ridge',1400+SHIFT],['volcano',4820+SHIFT],['lava-terrace',5960+SHIFT],
  ["mafate-crest",23450],["mafate-crest",24250],['city',23650+SHIFT]
 ].map(([route,x],i)=>{
  const y=rail(route,x);return y!==null?{id:`vent-${i}`,x,y,phase:i*1.1}:null;
 }).filter(Boolean);

 const landmarks=[
  ['lava',15900,floor(15900),1.15],
  ["tamarin",17800,floor(17800),0.8],["case-creole",21250,floor(21250),0.6],["fern",21500,floor(21500),0.6],
  ['vacoa',17600+SHIFT,floor(17600+SHIFT),.9],['pirogue',18320+SHIFT,floor(18320+SHIFT),.75],['case-creole',20420+SHIFT,390,.75],['vacoa',23560+SHIFT,floor(23560+SHIFT),.7],
 ].map(([key,x,y,scale])=>({key,x,y,scale}));

 return{chapters:CHAPTERS,branches,relics,enemies,monitors,vents,landmarks};
}
