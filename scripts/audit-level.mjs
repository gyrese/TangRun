import fs from 'node:fs';
import {buildLevel,STAGES,ZONES,SPEED,GOAL_X,groundAt,heightOn,LEVEL_VERSION} from '../src/level.js';
import {createRunner,stepRunner} from '../src/movement.js';
import {createAdventureState,stepAdventure} from '../src/adventure.js';
import {resolveScenery} from '../src/scenery.js';
const level=buildLevel();
// Bassins de lave du volcan, calculés comme dans ravine-art.js.
const lava=level.gaps.filter(([a,b])=>a>=ZONES[1].x&&b<ZONES[2].x).map(([a,b])=>{
 const l=groundAt(level,a-1),r=groundAt(level,b+1);
 return{left:a,right:b,y:Math.max(l?heightOn(l,a-1):450,r?heightOn(r,b+1):450)+65};
});
// Mêmes règles d'échec que le jeu (main.js) : chute, lave, ou contact sans éclat.
function fallLimit(p){
 if(p.x>=ZONES[1].x)return 1050;
 const floor=groundAt(level,p.x)||level.terrain.find(s=>s.x>p.x);
 return floor?heightOn(floor,Math.max(floor.x,p.x))+650:1050;
}
export function simulate(start,end,{slide=false,hold=.4}={}){
 const floor=groundAt(level,start),p=createRunner(start,heightOn(floor,start));p.surfaceId=floor.id;
 const adventure=createAdventureState(),taken=new Set();
 let heldUntil=0,stopped=0,shards=0;
 for(let frame=0;frame<120*120;frame++){
  const time=frame/120;
  if(p.grounded&&time>heldUntil){
   const gap=level.gaps.some(([a])=>p.x<a&&a-p.x<Math.max(55,p.vx*.17));
   const obstacle=level.platforms.some(s=>(s.kind==='crate'||s.kind==='beam')&&s.x>p.x&&s.x-p.x<Math.max(90,p.vx*.22)&&s.y<p.feet);
   if(gap||obstacle)heldUntil=time+hold;
  }
  stepRunner(p,{right:true,jump:time<heldUntil,slide},level,1/120);
  for(const [i,t]of level.tokens.entries())if(!taken.has(i)&&Math.abs(t.x-p.x)<23&&Math.abs(t.y-(p.feet-25))<32){taken.add(i);shards++;}
  const encounter=stepAdventure(adventure,p,level.adventure,1/120,shards);shards=encounter.balance;
  const fail=reason=>({ok:false,reason,x:Math.round(p.x),hits:adventure.hits});
  if(encounter.events.some(e=>e.type==='respawn'))return fail('hit');
  if(p.feet>fallLimit(p))return fail('fall');
  if(lava.some(l=>p.x>l.left&&p.x<l.right&&p.feet>=l.y+14))return fail('lava');
  if(p.vx===0)stopped++;
  if(p.x>=end)return{ok:true,seconds:+time.toFixed(2),maxSpeed:Math.round(p.maxSpeed),stoppedFrames:stopped,hits:adventure.hits,defeated:adventure.defeated.size,relics:adventure.relics.size,shards};
 }
 return{ok:false,reason:'stuck',x:Math.round(p.x)};
}
const manifest=JSON.parse(fs.readFileSync(new URL('../assets/manifest-v3.json',import.meta.url)));
const missing=manifest.filter(a=>!fs.existsSync(new URL('../'+a.file,import.meta.url))).map(a=>a.file);
const scenery=level.scenery.map(item=>{
 const asset=manifest.find(a=>a.key===item.key),width=(asset?.size[0]||212)*item.scale;
 return{id:item.id,key:item.key,x:item.x,visible:!!resolveScenery(level,item,width)};
});
const report={version:LEVEL_VERSION,stages:STAGES.map(stage=>({...stage,simulation:simulate(stage.start,stage.end),rolling:simulate(stage.start,stage.end,{slide:true})})),campaign:simulate(80,GOAL_X),recovery:level.checkpoints.map(c=>({x:c.x,simulation:simulate(c.x,STAGES.find(s=>s.end>c.x).end)})),gaps:level.gaps.map(([a,b])=>({x:a,width:b-a,normalJumpRange:Math.round(SPEED*1100/1550)})),pickups:level.tokens.length,pathDetails:level.pathDetails?.length||0,checkpoints:level.checkpoints.length,scenery:{placed:scenery.filter(s=>s.visible).length,omitted:scenery.filter(s=>!s.visible)},missingAssets:missing};
fs.writeFileSync(new URL('../assets/level-audit-v5.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(missing.length||!report.campaign.ok||report.stages.some(s=>!s.simulation.ok||!s.rolling.ok)||report.recovery.some(c=>!c.simulation.ok))process.exitCode=1;
