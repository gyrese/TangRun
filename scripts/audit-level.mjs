import fs from 'node:fs';
import {buildLevel,STAGES,SPEED,groundAt,heightOn,LEVEL_VERSION} from '../src/level.js';
import {createRunner,stepRunner} from '../src/movement.js';
import {resolveScenery} from '../src/scenery.js';
const level=buildLevel();
export function simulate(start,end,{slide=false,hold=.4}={}){
 const floor=groundAt(level,start),p=createRunner(start,heightOn(floor,start));p.surfaceId=floor.id;
 let heldUntil=0,stopped=0;
 for(let frame=0;frame<120*120;frame++){
  const time=frame/120;
  if(p.grounded&&time>heldUntil){
   const gap=level.gaps.some(([a])=>p.x<a&&a-p.x<Math.max(55,p.vx*.17));
   const obstacle=level.platforms.some(s=>(s.kind==='crate'||s.kind==='beam')&&s.x>p.x&&s.x-p.x<Math.max(90,p.vx*.22)&&s.y<p.feet);
   if(gap||obstacle)heldUntil=time+hold;
  }
  stepRunner(p,{right:true,jump:time<heldUntil,slide},level,1/120);
  if(p.feet>1050)return{ok:false,reason:'fall',x:Math.round(p.x)};
  if(p.vx===0)stopped++;
  if(p.x>=end)return{ok:true,seconds:+time.toFixed(2),maxSpeed:Math.round(p.maxSpeed),stoppedFrames:stopped};
 }
 return{ok:false,reason:'stuck',x:Math.round(p.x)};
}
const manifest=JSON.parse(fs.readFileSync(new URL('../assets/manifest-v3.json',import.meta.url)));
const missing=manifest.filter(a=>!fs.existsSync(new URL('../'+a.file,import.meta.url))).map(a=>a.file);
const scenery=level.scenery.map(item=>{
 const asset=manifest.find(a=>a.key===item.key),width=(asset?.size[0]||212)*item.scale;
 return{id:item.id,key:item.key,x:item.x,visible:!!resolveScenery(level,item,width)};
});
const report={version:LEVEL_VERSION,stages:STAGES.map(stage=>({...stage,simulation:simulate(stage.start,stage.end),rolling:simulate(stage.start,stage.end,{slide:true})})),campaign:simulate(80,24700),recovery:level.checkpoints.map(c=>({x:c.x,simulation:simulate(c.x,STAGES.find(s=>s.end>c.x).end)})),gaps:level.gaps.map(([a,b])=>({x:a,width:b-a,normalJumpRange:Math.round(SPEED*1100/1550)})),pickups:level.tokens.length,pathDetails:level.pathDetails?.length||0,checkpoints:level.checkpoints.length,scenery:{placed:scenery.filter(s=>s.visible).length,omitted:scenery.filter(s=>!s.visible)},missingAssets:missing};
fs.writeFileSync(new URL('../assets/level-audit-v5.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(missing.length||!report.campaign.ok||report.stages.some(s=>!s.simulation.ok||!s.rolling.ok)||report.recovery.some(c=>!c.simulation.ok))process.exitCode=1;
