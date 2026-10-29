export const LEVEL_VERSION='v9-volcano-summits';
export const BEST_KEY=`ltn-qg-best-${LEVEL_VERSION}${typeof location!=='undefined'&&new URLSearchParams(location.search).get('custom')==='1'?'-editor':''}`;
export const WORLD_WIDTH=33600,GOAL_X=33100,GROUND_Y=450,SPEED=330,MAX_SPEED=850,JUMP_SPEED=550,GRAVITY=1550;
export const ZONES=[
 {x:0,name:'Le Piton des Neiges',subtitle:'DESCENTES VERTIGINEUSES ET CHUTES DE NEIGE',checkpoint:{x:80,y:-5780}},
 {x:8400,name:'Le Piton de la Fournaise',subtitle:'DÉVALE LES COULÉES DE BASALTE',checkpoint:{x:8480,y:400}},
 {x:16800,name:'Les remparts de Mafate',subtitle:'CHOISIS TON SENTIER',checkpoint:{x:16880,y:400}},
 {x:25200,name:'Saint-Gilles · cap sur le bar',subtitle:'DE L’OCÉAN AU COMPTOIR',checkpoint:{x:25280,y:400}},
];
export const STAGES=[
 {id:'snow',name:'Le Piton des Neiges',focus:'Pentes à 75 %, grands sauts et descente sans remontée',difficulty:'Frissons',start:80,end:8315,zone:0,color:0x93c5fd},
 {id:'volcano',name:'Le Piton de la Fournaise',focus:'Trois sommets, balcons de basalte et remontées depuis les terrasses',difficulty:'Ascension',start:8480,end:16750,zone:1,color:0xed936c},
 {id:'mafate',name:'Les sentiers de Mafate',focus:'Choisir sa route et maîtriser les appuis',difficulty:'Précision',start:16880,end:25150,zone:2,color:0xbdd59d},
 {id:'coast',name:'Le sprint de Saint-Gilles',focus:'Enchaîner vitesse, looping et toits',difficulty:'Maîtrise',start:25280,end:GOAL_X,zone:3,color:0x9ed6db},
];
export const recordKey=(stageId='campaign')=>stageId==='campaign'?BEST_KEY:`${BEST_KEY}-${stageId}`;
import {COURSE} from './course-data.js';
import {buildRouteDressing} from './route-dressing.js';
import {enrichAdventure} from './adventure-level.js';

const SHIFT = 8400;

const STRIPS=[
 // A summit-to-valley descent: 6,180px of altitude loss, no uphill section.
 // Long 75% faces end in downhill takeoffs; the next shelf sits 750px lower.
 [[0,-5760],[240,-5760],[1700,-4665]],
 [[2180,-3915],[2400,-3915],[3650,-2977.5]],
 [[4170,-2227.5],[4390,-2227.5],[5600,-1320]],
 [[6120,-570],[6340,-570],[7500,300],[7900,420],[8400,420]],

 // ZONE 1: LE PITON DE LA FOURNAISE (8400 to 16800) - Original Volcano shifted +8400
 [[8400,420],[9050,420],[9650,680],[10050,680],[10650,450],[10980,450]],
 [[11080,450],[11600,450],[12200,700],[12600,700],[13100,420],[13600,420],[14250,710],[14650,710],[15250,420],[15650,420],[16035,420]],

 // ZONE 2: MAFATE v3 — porte, Rivière des Galets (bief 1), îlet et lacet, étages de Trois-Roches (bief 2).
 [[16150,450],[17160,450]],
 [[17285,450],[17400,450],[17700,500],[18550,500],[18550,660],[19500,660]],
 [[19635,660],[20220,660],[20220,500],[20300,500],[21000,230],[21400,230],[22250,286],[22400,286],[22400,660],[24100,660]],
 // Ravine 3 sits 550 px after the second breach landing, with a run-up arc.
 [[24245,660],[24550,660],[24550,500],[24750,420],[25200,420]],
 [[25200,420],[25900,420],[26500,600],[28100,600],[28700,390],[29200,390],[29690,390]],

 // ZONE 3: SAINT-GILLES · CAP SUR LE BAR (25200 to 33600) - Original Coast shifted +8400
 [[29845,420],[30400,420],[31000,700],[31450,700],[32100,450],[WORLD_WIDTH,450]],
];

const HIGH_ROUTES=[
 // Optional summit route: jump onto the low shelf, then take its relay spring.
 // The wide landing absorbs both jogging and full-speed approaches.
 {route:'cinder-ridge',style:'basalt',sections:[
  [[600+SHIFT,180],[1050+SHIFT,180],[1600+SHIFT,-100],[1800+SHIFT,-100],[2200+SHIFT,160],[2500+SHIFT,260]],
 ]},
 // Two more climbs, separated by a broad landing for the terrace relay below.
 {route:'volcano',style:'basalt',sections:[
  [[3310+SHIFT,300],[3680+SHIFT,150],[4080+SHIFT,-180],[4500+SHIFT,-220],[4950+SHIFT,-100],[5300+SHIFT,170],[5580+SHIFT,300],[5950+SHIFT,200],[6980+SHIFT,200],[7400+SHIFT,-120],[7600+SHIFT,80],[7900+SHIFT,260]],
 ]},
 // Mafate v3 : îlot flottant (jaune 1), canalisation (orange), arche de Trois-Roches (jaune 3).
 {route:"mafate-sky",style:'ropebridge',sections:[[[20300,200],[20680,200],[20720,210]]]},
 {route:"mafate-crest",style:'canal',sections:[[[22675,248],[22800,248],[22950,300],[23150,300],[23250,330],[24400,330],[24600,345],[24700,350]]]},
 {route:"mafate-arch",style:'ropebridge',sections:[[[23500,220],[24150,220],[24300,250]]]},
 // ZONE 3: SAINT-GILLES — Grimpe sur les hauts toits et redescend
 {route:'city',style:'comics',linear:true,sections:[
  [[21600+SHIFT,300],[21950+SHIFT,300],[22300+SHIFT,130],[22650+SHIFT,85],[23050+SHIFT,85],[23400+SHIFT,115],[23750+SHIFT,95],[24050+SHIFT,210],[24300+SHIFT,360]],
 ]},
];

const smooth=t=>t*t*(3-2*t);
function sampleProfile(points,ease,make,step=120){
 for(let i=1;i<points.length;i++){
  // Keep the entry ramp's landing footprint; refine the crests beyond it.
  const [start,y]=points[i-1],[end,y2]=points[i],count=y===y2?1:Math.ceil((end-start)/(i===1?120:step));
  for(let j=0;j<count;j++){
   const t=j/count,u=(j+1)/count,x=start+(end-start)*t,x2=start+(end-start)*u;
   const a=y+(y2-y)*ease(t),b=y+(y2-y)*ease(u);
   make(x,x2-x,a,b);
  }
 }
}

export function buildLevel(){
 const base=structuredClone(COURSE),terrain=[],tokens=[];
 const level={
  platforms:base.platforms.map(p=>({...p,x:p.x+SHIFT})),
  movers:base.movers.map(m=>({...m,x:m.x+SHIFT})),
  loops:base.loops.map(l=>({...l,x:l.x+SHIFT})),
  gaps:[],
  pads:[
   {x:650,speed:800},
   {x:2800,speed:840},
   {x:4800,speed:840},
   {x:6750,speed:840},
   ...base.pads.map(pad=>({...pad,x:pad.x+SHIFT}))
  ],
  springs:base.springs.map(s=>({...s,x:s.x+SHIFT})),
  signs:base.signs.map(s=>({...s,x:s.x+SHIFT})),
  scenery:base.scenery.map(s=>({...s,x:s.x+SHIFT})),
  checkpoints:[],
  chapters:[],
 };

 // Mafate is authored here and in adventure-level.js; drop the older course pieces.
 const inMafate=x=>x>=ZONES[2].x&&x<ZONES[3].x;
 level.platforms=level.platforms.filter(p=>!(inMafate(p.x)&&['beam','crate'].includes(p.kind)));
 for(const key of ['movers','pads','springs'])level[key]=level[key].filter(p=>!inMafate(p.x));
 level.signs=level.signs.filter(s=>!(inMafate(s.x)&&s.text.startsWith('Ravine')));
 level.scenery=level.scenery.filter(s=>!(inMafate(s.x)&&s.key==='waterfall'));
 for(const strip of STRIPS)sampleProfile(strip,strip[0][0]<SHIFT?t=>t:smooth,(x,w,a,b)=>terrain.push({id:`ground-${terrain.length}`,kind:'ground',x,w,y:a,y2:b,h:900-Math.min(a,b),slope:(b-a)/w}));
 level.platforms=level.platforms.filter(p=>!HIGH_ROUTES.some(r=>r.route===p.route)&&p.route!=='volcano'&&p.route!=='mafate'&&p.route!=='city');
 for(const {route,style,sections,linear}of HIGH_ROUTES){
  let index=0;
  // Short chords keep rounded basalt crests smooth in both art and collision.
  // At 120px, a short summit face becomes just two straight sides.
  for(const points of sections)sampleProfile(points,linear?t=>t:smooth,(x,w,a,b)=>level.platforms.push({id:`${route}-${index++}`,kind:'roof',rail:true,route,style,x,w,y:a,y2:b,h:22,slope:(b-a)/w}),style==='basalt'?24:120);
 }
 for(const pad of level.pads){
  const route=pad.surface?HIGH_ROUTES.find(r=>pad.surface.startsWith(r.route+'-'))?.route:null;
  if(route)pad.surface=level.platforms.find(p=>p.route===route&&pad.x>=p.x&&pad.x<=p.x+p.w)?.id;
 }
 level.gaps=STRIPS.slice(1).map((s,i)=>[STRIPS[i].at(-1)[0],s[0][0]]).filter(([a,b])=>b>a);
 const floorAt=x=>{const s=groundAt({terrain},x);return heightOn(s,x);};
 // Mafate v3 : pont de lianes, passerelles (brèches), rochers à ressort.
 level.platforms.push({"kind":"roof","slope":0,"h":22,"id":"mafate-gate-0","route":"mafate-gate","style":"basalt","x":16960,"y":370,"y2":370,"w":160});
 level.platforms.push({"kind":"roof","slope":0,"h":22,"id":"mafate-gate-1","route":"mafate-gate","style":"ropebridge","x":17120,"y":370,"y2":370,"w":210});
 level.platforms.push({"kind":"roof","slope":0,"h":22,"id":"mafate-0","route":"mafate","style":"ropebridge","x":18552,"y":500,"y2":500,"w":174});
 level.platforms.push({"kind":"roof","slope":0,"h":22,"id":"mafate-1","route":"mafate","style":"ropebridge","x":18726,"y":500,"y2":500,"w":174});
 level.platforms.push({"kind":"roof","slope":0,"h":22,"id":"mafate-2","route":"mafate","style":"ropebridge","x":19050,"y":500,"y2":500,"w":195});
 level.platforms.push({"kind":"roof","slope":0,"h":22,"id":"mafate-3","route":"mafate","style":"ropebridge","x":19245,"y":500,"y2":500,"w":195});
 level.platforms.push({"kind":"roof","slope":0,"h":22,"id":"mafate-4","route":"mafate","style":"ropebridge","x":19440,"y":500,"y2":500,"w":195});
 level.platforms.push({"kind":"roof","slope":0,"h":22,"id":"mafate-5","route":"mafate","style":"ropebridge","x":19635,"y":500,"y2":500,"w":195});
 level.platforms.push({"kind":"roof","slope":0,"h":22,"id":"mafate-6","route":"mafate","style":"ropebridge","x":19830,"y":500,"y2":500,"w":195});
 level.platforms.push({"kind":"roof","slope":0,"h":22,"id":"mafate-7","route":"mafate","style":"ropebridge","x":20025,"y":500,"y2":500,"w":195});
 level.platforms.push({"kind":"roof","slope":0,"h":22,"id":"mafate-ledge-0","route":"mafate-ledge","style":"basalt","x":19700,"y":420,"y2":420,"w":150});
 level.platforms.push({"kind":"roof","slope":0,"h":22,"id":"mafate-ledge-1","route":"mafate-ledge","style":"basalt","x":19850,"y":420,"y2":420,"w":150});
 level.platforms.push({"kind":"roof","slope":0,"h":22,"id":"mafate-ledge-2","route":"mafate-ledge","style":"basalt","x":20000,"y":420,"y2":420,"w":150});
 level.platforms.push({"kind":"roof","slope":0,"h":22,"id":"mafate-trois-0","route":"mafate-trois","style":"ropebridge","x":22402,"y":500,"y2":500,"w":190});
 level.platforms.push({"kind":"roof","slope":0,"h":22,"id":"mafate-trois-1","route":"mafate-trois","style":"ropebridge","x":22592,"y":500,"y2":500,"w":189});
 level.platforms.push({"kind":"roof","slope":0,"h":22,"id":"mafate-trois-2","route":"mafate-trois","style":"ropebridge","x":22781,"y":500,"y2":500,"w":190});
 level.platforms.push({"kind":"roof","slope":0,"h":22,"id":"mafate-trois-3","route":"mafate-trois","style":"ropebridge","x":22971,"y":500,"y2":500,"w":189});
 level.platforms.push({"kind":"roof","slope":0,"h":22,"id":"mafate-trois-4","route":"mafate-trois","style":"ropebridge","x":23160,"y":500,"y2":500,"w":190});
 level.platforms.push({"kind":"roof","slope":0,"h":22,"id":"mafate-trois-5","route":"mafate-trois","style":"ropebridge","x":23500,"y":500,"y2":500,"w":210});
 level.platforms.push({"kind":"roof","slope":0,"h":22,"id":"mafate-trois-6","route":"mafate-trois","style":"ropebridge","x":23710,"y":500,"y2":500,"w":210});
 level.platforms.push({"kind":"roof","slope":0,"h":22,"id":"mafate-trois-7","route":"mafate-trois","style":"ropebridge","x":23920,"y":500,"y2":500,"w":210});
 level.platforms.push({"kind":"roof","slope":0,"h":22,"id":"mafate-trois-8","route":"mafate-trois","style":"ropebridge","x":24130,"y":500,"y2":500,"w":210});
 level.platforms.push({"kind":"roof","slope":0,"h":22,"id":"mafate-trois-9","route":"mafate-trois","style":"ropebridge","x":24340,"y":500,"y2":500,"w":210});
 level.platforms.push({"kind":"roof","slope":0,"h":22,"id":"mafate-ledge2-0","route":"mafate-ledge2","style":"basalt","x":23000,"y":420,"y2":420,"w":125});
 level.platforms.push({"kind":"roof","slope":0,"h":22,"id":"mafate-ledge2-1","route":"mafate-ledge2","style":"basalt","x":23125,"y":420,"y2":420,"w":125});
 // River beds of the two Rivière des Galets reaches, drawn as pebbles and water.
 level.rivers=[[18550,20220],[22400,24550]];
 // Falls behind the Mafate paths: ravine falls run off screen, the others end on the floor.
 level.cascades=[[17222,64],[18975,48],[19567,64],[23425,48],[24172,120]].map(([x,width])=>{
  const gap=level.gaps.some(([a,b])=>x>a&&x<b);
  return{x,width,top:-180,bottom:gap?1720:floorAt(x)};
 });

 const sceneryFixes={'scenery-4':2720+SHIFT,'scenery-8':8050+SHIFT,'scenery-10':7480+SHIFT,'scenery-12':9570+SHIFT,'scenery-14':20900,'scenery-17':12750+SHIFT,'scenery-20':14780+SHIFT,'scenery-27':19350+SHIFT,'scenery-30':21900+SHIFT,'scenery-31':23150+SHIFT,'scenery-37':2080+SHIFT,'cluster-13':2770+SHIFT,'cluster-62':12300+SHIFT,'cluster-75':15200+SHIFT,'cluster-104':21000+SHIFT};
 for(const item of level.scenery){
  if(sceneryFixes[item.id]!==undefined)item.x=sceneryFixes[item.id];
  if(item.x>=ZONES[1].x&&item.x<ZONES[2].x&&(item.key==='rocks'||item.key==='plants'))item.key='lavarocks';
 }

 // Zone 0 snow decor
 level.scenery.push(
  {id:'snow-gite-summit',key:'snow-gite',x:850,y:-5380,scale:.10,anchor:'absolute',authored:true},
  {id:'snow-scenery-1',key:'snow-chunk',x:300,scale:.7,anchor:'ground',depth:1},
  {id:'snow-scenery-2',key:'snow-chunk',x:600,scale:.7,anchor:'ground',depth:1},
  {id:'snow-scenery-3',key:'snow-chunk',x:1900,scale:.8,anchor:'ground',depth:1},
  {id:'snow-scenery-4',key:'snow-chunk',x:2400,scale:.7,anchor:'ground',depth:1},
  {id:'snow-scenery-5',key:'snow-chunk',x:3300,scale:.75,anchor:'ground',depth:1},
  {id:'snow-scenery-6',key:'snow-chunk',x:4800,scale:.7,anchor:'ground',depth:1},
  {id:'snow-scenery-7',key:'snow-chunk',x:5400,scale:.8,anchor:'ground',depth:1},
  {id:'snow-scenery-8',key:'snow-chunk',x:6800,scale:.7,anchor:'ground',depth:1},
  {id:'snow-scenery-9',key:'snow-chunk',x:7800,scale:.75,anchor:'ground',depth:1}
 );

 const smallHut=level.scenery.find(s=>s.id==='scenery-14');if(smallHut)smallHut.scale=.5;
 for(const mover of level.movers)mover.style=mover.x<ZONES[2].x?'basalt':'ropebridge';
 for(const pad of level.pads)if(!pad.surface||pad.surface.startsWith('ground'))pad.surface=groundAt({terrain},pad.x)?.id;

 // Active rhythm obstacles
 level.platforms.push(
  {id:'beam-tutorial',kind:'beam',x:2360+SHIFT,y:400,y2:400,w:105,h:24,slope:0},
  {id:'beam-volcano-trench',kind:'beam',x:3960+SHIFT,y:650,y2:650,w:105,h:24,slope:0},
  {id:'crate-volcano-2',kind:'crate',x:5020+SHIFT,y:376,y2:376,w:48,h:44,slope:0}
 );
 for(const p of level.platforms){
  if(p.kind==='beam'){const y=Math.round(floorAt(p.x+p.w/2)-70);p.y=p.y2=y;}
  else if(p.kind==='crate'){const y=Math.round(floorAt(p.x+p.w/2)-p.h);p.y=p.y2=y;}
 }

 level.checkpoints=[80,2300,4290,6240,8000, 8400+80,8400+2250,8400+2850,8400+4800,8400+7250, 16900,17400,18450,21050,22320,24800, 8400+16900,8400+19700,8400+20850,8400+22000,8400+23900].map(x=>({x,y:floorAt(x)-20}));
 const adventure=enrichAdventure(level,terrain);
 level.signs=[
  {x:180,text:'→ Le Piton des Neiges · -5°C'},
  {x:650,text:'↓ Pente raide ! Glisse en boule pour foncer'},
  {x:1400,text:'↘ Grand saut · Réception beaucoup plus bas'},
  {x:3300,text:'↘ Garde ton élan · Plonge dans le couloir blanc'},
  {x:7900,text:'→ Fin du blizzard · Vers le Piton de la Fournaise'},
  {x:230+SHIFT,text:'→ Courir · Espace sauter'}, {x:700+SHIFT,text:'↓ Descendre en boule = élan'},
  {x:140+SHIFT,text:'↗ Saute sur le balcon · Ressort vers la crête'},
  {x:1980+SHIFT,text:'↓ Maintenir pour passer dessous'},
  {x:500+SHIFT,text:'Éclats = protection · caisse = bonus'},
  {x:790+SHIFT,text:'↓ Rouler ou sauter sur les sentinelles'},
  {x:5050+SHIFT,text:'↗ Balcons intermédiaires · Ressort vers le dernier sommet'},
  {"x":18350,"text":"Passerelle cassée ↗ saute · ou descends à la rivière ↓"},
  {"x":19600,"text":"↗ Rocher · îlot flottant"},
  {"x":19850,"text":"↑ Ressort · remonte au sentier"},
  {"x":21000,"text":"↓ Roule dans le lacet · élan pour le canal"},
  {"x":22150,"text":"Saute au bord ↗ si tu as l’élan"},
  {"x":22850,"text":"↗ Rocher · arche des Trois-Roches"},
  {"x":24300,"text":"↑ Ressort · rejoins la sortie"},
  {"x":24800,"text":"Sortie du cirque → Saint-Gilles"},
  {x:22220+SHIFT,text:'↗ Promenade haute · emblème bonus'},
  ...level.gaps.filter(([a,b])=>!level.platforms.some(p=>p.bridge&&p.x<=a+1&&p.x+p.w>=b-1)).map(([a])=>({x:a-300,text:a<SHIFT?'↘ Grand saut · Continue vers le bas':'Ravine ↗ · Maintenir le saut'})),
  ...level.springs.filter(s=>!s.surface&&!inMafate(s.x)).map(s=>({x:s.x-220,text:'↑ Ressort · route bonus'})),
  {x:17200+SHIFT,text:'04 · Saint-Gilles · Combine tes gestes'},
  {x:17800+SHIFT,text:'↓ Garde l’élan · boucle facultative'},
  {x:20100+SHIFT,text:'Reprends ton souffle · dernier quartier'},
  {x:23800+SHIFT,text:'Dernier sprint → Les Toiles Noires'},
 ];

 for(let x=350;x<GOAL_X-450;x+=180){
  const ground=groundAt({terrain},x);
  const riverBed=level.rivers.some(([a,b])=>x>a&&x<b)&&heightOn(ground??{y:0,x,slope:0},x)>=640;
  // Mafate river beds only carry shards around the first emblem.
  if(riverBed&&Math.abs(x-19200)>160)continue;
  if(ground&&!level.gaps.some(([a,b])=>x>a-210&&x<b+160)&&!level.platforms.some(p=>(p.kind==='beam'||p.kind==='crate')&&x>p.x-45&&x<p.x+p.w+45))tokens.push({x,y:heightOn(ground,x)-40});
 }
 for(const [a,b]of level.gaps)for(let i=0;i<=5;i++){
  const t=i/5,x=a-95+t*(b-a+190);tokens.push({x,y:floorAt(a-5)*(1-t)+floorAt(b+5)*t-42-Math.sin(t*Math.PI)*82});
 }
 for(const p of level.platforms.filter(p=>p.kind==='roof'&&!inMafate(p.x)))for(let x=p.x+55;x<p.x+p.w-25;x+=100)tokens.push({x,y:heightOn(p,x)-43});
 // Mafate: dense shards on the footbridges, sparse ones on the canal, none elsewhere.
 for(const [routes,step]of [[['mafate','mafate-trois','mafate-gate'],100],[['mafate-crest'],250]]){
  const deck=level.platforms.filter(p=>routes.includes(p.route));
  const start=Math.min(...deck.map(p=>p.x)),end=Math.max(...deck.map(p=>p.x+p.w));
  for(let x=start+55;x<end-25;x+=step){const p=deck.find(p=>x>=p.x&&x<=p.x+p.w);if(p)tokens.push({x,y:heightOn(p,x)-43});}
 }
 // Mafate guide arcs: each one shows a choice from the point where it is made.
 for(const [x,y]of [[16900,440],[16940,428],[16980,416],[17020,404],[17060,392],[17100,380],[18880,460],[18918,419],[18956,393],[18994,393],[19032,419],[19070,460],[19000,560],[19080,600],[19150,625],[19620,470],[19680,440],[20060,330],[20140,250],[20220,190],[22420,350],[22480,315],[22540,293],[22600,293],[22660,315],[22720,350],[22920,470],[22980,440],[23300,380],[23360,300],[23420,240],[23480,190],[23850,622],[23900,614],[23950,606],[24000,598]])tokens.push({x,y});
 for(const loop of level.loops)for(let i=1;i<12;i++){
  const angle=i*Math.PI*2/12;tokens.push({x:loop.x+Math.sin(angle)*(loop.radius-30),y:loop.baseY-loop.radius+Math.cos(angle)*(loop.radius-30)});
 }
 const dressing=buildRouteDressing(level,terrain);level.scenery.push(...dressing.scenery);
 return {...level,terrain,tokens,stages:STAGES,pathDetails:dressing.details,adventure};
}

export function movingSurfaces(level,time=0){
 return(level.movers||[]).map(p=>{
  const offset=Math.sin(time*2*Math.PI/p.motion.period)*p.motion.amplitude;
  return{...p,x:p.x+(p.motion.axis==='x'?offset:0),y:p.y+(p.motion.axis==='y'?offset:0),y2:p.y+(p.motion.axis==='y'?offset:0)};
 });
}
export function heightOn(s,x){return s.y+(x-s.x)*(s.slope||0);}
export function groundAt(level,x){return level.terrain.find(s=>x>=s.x&&x<=s.x+s.w)||null;}
export function surfaceAt(level,x,id,time=0){
 if(id?.startsWith('ground'))return groundAt(level,x);
 const surfaces=[...level.platforms,...movingSurfaces(level,time)],current=surfaces.find(s=>s.id===id);
 if(current&&x>=current.x&&x<=current.x+current.w)return current;
 return current?.rail?level.platforms.find(s=>s.rail&&s.route===current.route&&x>=s.x&&x<=s.x+s.w)||null:null;
}
export function formatTime(ms){const v=Math.max(0,Math.floor(ms));return `${String(Math.floor(v/60000)).padStart(2,'0')}:${String(Math.floor(v/1000)%60).padStart(2,'0')}.${String(v%1000).padStart(3,'0')}`;}
export function readBest(storage,key=BEST_KEY){try{const v=Number(storage.getItem(key));return Number.isFinite(v)&&v>0?v:null;}catch{return null;}}
