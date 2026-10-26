export const LEVEL_VERSION='v6-island-adventure';
export const BEST_KEY=`ltn-qg-best-${LEVEL_VERSION}`;
export const WORLD_WIDTH=25200,GOAL_X=24700,GROUND_Y=450,SPEED=330,MAX_SPEED=850,JUMP_SPEED=550,GRAVITY=1550;
export const ZONES=[
 {x:0,name:'Le Piton de la Fournaise',subtitle:'DÉVALE LES COULÉES DE BASALTE',checkpoint:{x:80,y:400}},
 {x:8400,name:'Les remparts de Mafate',subtitle:'CHOISIS TON SENTIER',checkpoint:{x:8500,y:400}},
 {x:16800,name:'Saint-Gilles · cap sur le bar',subtitle:'DE L’OCÉAN AU COMPTOIR',checkpoint:{x:16900,y:400}},
];
export const STAGES=[
 {id:'volcano',name:'Les coulées',focus:'Apprendre le saut et l’élan',difficulty:'Découverte',start:80,end:8350,zone:0,color:0xed936c},
 {id:'mafate',name:'Les sentiers de Mafate',focus:'Choisir sa route et maîtriser les appuis',difficulty:'Précision',start:8500,end:16750,zone:1,color:0xbdd59d},
 {id:'coast',name:'Le sprint de Saint-Gilles',focus:'Enchaîner vitesse, looping et toits',difficulty:'Maîtrise',start:16900,end:GOAL_X,zone:2,color:0x9ed6db},
];
export const recordKey=(stageId='campaign')=>stageId==='campaign'?BEST_KEY:`${BEST_KEY}-${stageId}`;
import {COURSE} from './course-data.js';
import {buildRouteDressing} from './route-dressing.js';
import {enrichAdventure} from './adventure-level.js';
const STRIPS=[
 [[0,420],[650,420],[1250,650],[1650,650],[2250,450],[2580,450]],
 [[2660,450],[3200,450],[3800,610],[4200,610],[4700,390],[5200,390],[5850,650],[6250,650],[6850,420],[7250,420],[7650,420]],
 [[7750,450],[8900,450],[9500,630],[10000,630],[10600,450],[11200,450]],
 [[11320,480],[11800,480],[12400,660],[12850,660],[13500,420],[14000,420],[14650,620],[15050,620],[15600,400],[15800,400]],
 [[15935,420],[17500,420],[18100,600],[19700,600],[20300,390],[20800,390],[21300,390]],
 [[21450,420],[22000,420],[22600,650],[23050,650],[23700,450],[WORLD_WIDTH,450]],
];
// Voies hautes façon Green Hill : une ligne continue en montagnes russes au-dessus
// de la voie médiane. Plus rapide et plus riche, mais une erreur fait retomber
// sur le sol, jamais dans le vide. Chaque tronçon est séparé par un court saut.
const HIGH_ROUTES=[
 // Volcan : relief naturel en vagues, la voie survole la ravine de 7650.
 {route:'volcano',style:'basalt',sections:[[[3310,300],[3620,250],[3980,320],[4450,235],[4900,305],[5300,250],[5700,325],[6100,270],[6450,290],[6850,255],[7250,330],[7600,350],[7900,350]]]},
 // Mafate : trois passerelles ondulées, sauts de précision entre elles.
 {route:'mafate',style:'ropebridge',sections:[
  [[9040,340],[9300,340],[9600,290],[9950,340],[10350,270],[10800,320],[11150,300]],
  [[11260,320],[11650,360],[12050,300],[12450,350],[12850,290],[13250,330]],
  [[13360,300],[13750,320],[14150,270],[14550,300],[14950,250],[15350,270],[15700,310],[16050,320]],
 ]},
 // Saint-Gilles : toits angulaires, rampes droites et terrasses plates.
 {route:'city',style:'comics',linear:true,sections:[[[21600,300],[21950,300],[22200,240],[22600,240],[22850,280],[23250,280],[23500,230],[23850,230],[24100,320],[24300,360]]]},
];
const smooth=t=>t*t*(3-2*t);
function sampleProfile(points,ease,make){
 for(let i=1;i<points.length;i++){
  const [start,y]=points[i-1],[end,y2]=points[i],count=y===y2?1:Math.ceil((end-start)/120);
  for(let j=0;j<count;j++){
   const t=j/count,u=(j+1)/count,x=start+(end-start)*t,x2=start+(end-start)*u;
   const a=y+(y2-y)*ease(t),b=y+(y2-y)*ease(u);
   make(x,x2-x,a,b);
  }
 }
}
export function buildLevel(){
 const level=structuredClone(COURSE),terrain=[],tokens=[];
 // Smooth sampled curves; broad flat shelves host landmarks and recovery points.
 for(const strip of STRIPS)sampleProfile(strip,smooth,(x,w,a,b)=>terrain.push({id:`ground-${terrain.length}`,kind:'ground',x,w,y:a,y2:b,h:900-Math.min(a,b),slope:(b-a)/w}));
 // Les anciennes chaînes de toits plats sont remplacées par les voies continues.
 level.platforms=level.platforms.filter(p=>!HIGH_ROUTES.some(r=>r.route===p.route));
 for(const {route,style,sections,linear}of HIGH_ROUTES){
  let index=0;
  for(const points of sections)sampleProfile(points,linear?t=>t:smooth,(x,w,a,b)=>level.platforms.push({id:`${route}-${index++}`,kind:'roof',rail:true,route,style,x,w,y:a,y2:b,h:22,slope:(b-a)/w}));
 }
 for(const pad of level.pads){
  const route=HIGH_ROUTES.find(r=>pad.surface.startsWith(r.route+'-'))?.route;
  if(route)pad.surface=level.platforms.find(p=>p.route===route&&pad.x>=p.x&&pad.x<=p.x+p.w).id;
 }
 // Learning -> repetition -> mastery. Upper routes remain optional throughout.
 level.gaps=STRIPS.slice(1).map((s,i)=>[STRIPS[i].at(-1)[0],s[0][0]]);
 const floorAt=x=>{const s=groundAt({terrain},x);return heightOn(s,x);};
 const sceneryFixes={'scenery-4':2720,'scenery-8':6330,'scenery-12':9570,'scenery-14':11100,'scenery-17':12750,'scenery-20':14780,'scenery-27':19350,'scenery-30':21900,'scenery-31':23150,'scenery-37':2080,'cluster-13':2770,'cluster-62':12300,'cluster-75':15200,'cluster-104':21000};
 for(const item of level.scenery)if(sceneryFixes[item.id]!==undefined)item.x=sceneryFixes[item.id];
 const smallHut=level.scenery.find(s=>s.id==='scenery-14');smallHut.scale=.5;
 for(const mover of level.movers)mover.style='ropebridge';
 // Resolve semantic ground sockets after sampling; numeric ground IDs are not stable.
 for(const pad of level.pads)if(pad.surface.startsWith('ground'))pad.surface=groundAt({terrain},pad.x).id;
 // First crouch lesson sits on a safe shelf before the first ravine.
 level.platforms.push({id:'beam-tutorial',kind:'beam',x:2360,y:400,y2:400,w:105,h:24,slope:0});
 level.checkpoints=[80,2250,2850,4800,7250,8500,10800,11800,13900,15650,16900,19700,20850,22000,23900].map(x=>({x,y:floorAt(x)-20}));
 const adventure=enrichAdventure(level,terrain);
 level.signs=[
  {x:230,text:'→ Courir · Espace sauter'}, {x:700,text:'↓ Descendre en boule = élan'},
  {x:1980,text:'↓ Maintenir pour passer dessous'},
  {x:500,text:'Éclats = protection · caisse = bonus'},
  {x:790,text:'↓ Rouler ou sauter sur les sentinelles'},
  {x:5630,text:'↗ Terrasses de lave · emblème caché'},
  {x:14200,text:'↗ Cascade · appuis vers le sommet'},
  {x:22220,text:'↗ Promenade haute · emblème bonus'},
  ...level.gaps.map(([a])=>({x:a-300,text:'Ravine ↗ · Maintenir le saut'})),
  ...level.springs.map(s=>({x:s.x-220,text:'↑ Ressort · route bonus'})),
  {x:11550,text:'Appuis mobiles · chemin bas libre'},
  {x:17200,text:'03 · Saint-Gilles · Combine tes gestes'},
  {x:17800,text:'↓ Garde l’élan · boucle facultative'},
  {x:20100,text:'Reprends ton souffle · dernier quartier'},
  {x:23800,text:'Dernier sprint → Les Toiles Noires'},
 ];
 // Pickups teach trajectories, rather than leading into holes and solid obstacles.
 for(let x=350;x<GOAL_X-450;x+=180){const ground=groundAt({terrain},x);
  if(ground&&!level.gaps.some(([a,b])=>x>a-210&&x<b+160)&&!level.platforms.some(p=>(p.kind==='beam'||p.kind==='crate')&&x>p.x-45&&x<p.x+p.w+45))tokens.push({x,y:heightOn(ground,x)-40});}
 for(const [a,b]of level.gaps)for(let i=0;i<=5;i++){
  const t=i/5,x=a-95+t*(b-a+190);tokens.push({x,y:floorAt(a-5)*(1-t)+floorAt(b+5)*t-42-Math.sin(t*Math.PI)*82});
 }
 for(const p of level.platforms.filter(p=>p.kind==='roof'))for(let x=p.x+55;x<p.x+p.w-25;x+=100)tokens.push({x,y:heightOn(p,x)-43});
 for(const loop of level.loops)for(let i=1;i<12;i++){
  const angle=i*Math.PI*2/12;tokens.push({x:loop.x+Math.sin(angle)*(loop.radius-30),y:loop.baseY-loop.radius+Math.cos(angle)*(loop.radius-30)});
 }
 // Life on the elevated routes is anchored to their end abutments, not the valley floor.
 for(const ledge of level.platforms.filter(p=>p.kind==='roof'&&!p.rail)){
  const key=ledge.route==='mafate'?'plants':ledge.route==='city'?'lantern':'rocks';
  level.scenery.push({id:`ledge-life-${ledge.id}`,key,x:ledge.x+ledge.w-12,y:ledge.y+3,scale:key==='lantern'?.48:.3,anchor:'absolute',depth:1});
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
 // Une voie continue se suit d'un tronçon à l'autre comme le sol.
 return current?.rail?level.platforms.find(s=>s.rail&&s.route===current.route&&x>=s.x&&x<=s.x+s.w)||null:null;
}
export function formatTime(ms){const v=Math.max(0,Math.floor(ms));return `${String(Math.floor(v/60000)).padStart(2,'0')}:${String(Math.floor(v/1000)%60).padStart(2,'0')}.${String(v%1000).padStart(3,'0')}`;}
export function readBest(storage,key=BEST_KEY){try{const v=Number(storage.getItem(key));return Number.isFinite(v)&&v>0?v:null;}catch{return null;}}
