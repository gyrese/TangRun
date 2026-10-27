// Authored encounters: quiet runouts separate each challenge from its reward.
export const CHAPTERS=[
 {x:0,end:2660,name:'La coulée ardente',hint:'Prends de l’élan dans la descente',zone:0},
 {x:2660,end:5800,name:'Les orgues de basalte',hint:'Le ressort ouvre la route des sommets',zone:0},
 {x:5800,end:8400,name:'Les terrasses de lave',hint:'Explore les terrasses pour trouver un emblème',zone:0},
 {x:8400,end:11320,name:'La canopée',hint:'Les ponts hauts cachent des récompenses',zone:1},
 {x:11320,end:14000,name:'Le cirque suspendu',hint:'Saute sur les sentinelles pour rebondir',zone:1},
 {x:14000,end:16800,name:'La cascade des tamarins',hint:'Choisis les appuis ou la vallée',zone:1},
 {x:16800,end:20300,name:'La boucle du lagon',hint:'En boule, conserve ton élan',zone:2},
 {x:20300,end:23700,name:'Les toits de Saint-Gilles',hint:'Trois emblèmes se cachent dans chaque acte',zone:2},
 {x:23700,end:25200,name:'La dernière ligne droite',hint:'Cap sur Les Toiles Noires !',zone:2},
];

export function enrichAdventure(level,terrain){
 const floor=x=>{const s=terrain.find(p=>x>=p.x&&x<=p.x+p.w);return s? s.y+(x-s.x)*s.slope:450;};
 const socket=x=>terrain.find(p=>x>=p.x&&x<=p.x+p.w).id;
 // New intermediate routes are reached with normal jumps; the original high
 // routes stay spring-driven. All three rejoin a continuous recovery floor.
 const branches=[
  {id:'lava-terrace',zone:0,style:'basalt',points:[[5780,545,180],[6030,465,180],[6280,385,210]]},
  {id:'cascade',zone:1,style:'ropebridge',points:[[14370,490,190],[14640,410,190],[14910,330,230]]},
  {id:'promenade',zone:2,style:'ropebridge',points:[[22400,520,180],[22650,440,180],[22900,360,210]]},
 ];
 for(const b of branches)for(const [i,[x,y,w]]of b.points.entries())level.platforms.push({id:`${b.id}-${i}`,kind:'roof',route:b.id,style:b.style,x,y,y2:y,w,h:22,slope:0});
 // A second loop is a compact early lesson before the larger coastal loop.
 level.loops.push({id:'ember-loop',x:1460,baseY:650,radius:115,minSpeed:590});
 level.pads.push({x:1280,surface:socket(1280),speed:740},{x:16050,surface:socket(16050),speed:760},{x:24000,surface:socket(24000),speed:820});
 level.movers.push({id:'moving-cascade',kind:'roof',style:'ropebridge',x:15310,y:350,w:140,h:22,slope:0,motion:{axis:'x',amplitude:65,period:3.2}});
 const relics=[
  [2050,floor(2050)-75],[4480,190],[6385,335],
  [10350,230],[15025,280],[16200,floor(16200)-75],
  [18750,245],[23005,310],[24160,375],
 ].map(([x,y],i)=>({id:`relic-${i}`,x,y,zone:Math.floor(i/3)}));
 const enemySockets=[900,2790,4950,7000,8130,8700,11000,13650,15500,16450,17360,19950,21000,23900];
 const enemies=enemySockets.map((x,i)=>({id:`enemy-${i}`,x,y:floor(x)-18,kind:i%3===1?'drone':'crab',range:i%3===1?65:42,phase:i*.7,ground:[floor(x-42)-18,floor(x)-18,floor(x+42)-18]}));
 // Les voies hautes sont continues : on y place gardes et évents par position.
 const rail=(route,x)=>{const p=level.platforms.find(p=>p.route===route&&x>=p.x&&x<=p.x+p.w);return p?p.y+(x-p.x)*p.slope:null;};
 for(const [i,[route,x]]of [['volcano',4150],['mafate',10550],['mafate',12650],['city',22400]].entries()){
  const y=rail(route,x);if(y!==null)enemies.push({id:`sentry-${i}`,x,y:y-18,kind:'crab',range:40,phase:i});
 }
 const monitors=[650,2850,7250,8700,13900,16980,20850,23850].map((x,i)=>({id:`monitor-${i}`,x,y:floor(x)-22,type:i%2?'shield':'cache'}));
 // Bonus boxes get their own space, outside patrols, flags and spring approaches.
 for(const m of monitors){
  for(const offset of [0,...Array.from({length:32},(_,i)=>[(i+1)*40,-(i+1)*40]).flat()]){
   const x=m.x+offset,s=terrain.find(p=>x>=p.x&&x<=p.x+p.w);
   if(x<Math.floor(m.x/8400)*8400+100||x>Math.min(24400,(Math.floor(m.x/8400)+1)*8400-150))continue;
   if(!s||Math.abs(s.slope)>.12)continue;
   if(!terrain.some(p=>x-30>=p.x&&x-30<=p.x+p.w)||!terrain.some(p=>x+30>=p.x&&x+30<=p.x+p.w))continue;
   if(enemies.some(e=>Math.abs(e.x-x)<e.range+80))continue;
   if([...level.checkpoints,...level.springs].some(p=>Math.abs(p.x-x)<90))continue;
   if(level.platforms.some(p=>['beam','crate'].includes(p.kind)&&x>p.x-80&&x<p.x+p.w+80))continue;
   if(level.loops.some(l=>Math.abs(x-l.x)<l.radius+80))continue;
   m.x=x;m.y=floor(x)-22;break;
  }
 }
 // Timed vents live on optional ledges, never on a blind mandatory landing.
 const vents=[['volcano',5350],['mafate',13900],['city',23650]].map(([route,x],i)=>{
  const y=rail(route,x);return y!==null?{id:`vent-${i}`,x,y,phase:i*1.3}:null;
 }).filter(Boolean);
 const landmarks=[
  ['lava',930,floor(930),1.15],
  ['fern',9180,floor(9180),.95],['tamarin',9990,630,1],['fern',12000,floor(12000),.65],['tamarin',13220,floor(13220),.95],['case-creole',16220,420,.65],
  ['vacoa',17600,floor(17600),.9],['pirogue',19290,600,.75],['case-creole',20420,390,.75],['vacoa',23560,floor(23560),.7],
 ].map(([key,x,y,scale])=>({key,x,y,scale}));
 return{chapters:CHAPTERS,branches,relics,enemies,monitors,vents,landmarks};
}
