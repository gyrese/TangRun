import {GROUND_Y,GOAL_X,ZONES,STAGES,groundAt,heightOn} from './level.js';
import {drawCheckpoint,drawSpring,drawBoost,drawRouteSign,drawStageFlag} from './prop-art.js';
export const V3_KEYS=['pier','rocks','boat','bench','bollards','surfboards','kiosk','comics','gameshop','footbridge','neonarrow','arch','plants','frangipani','lantern','terrace','speakers','canopy','lavarocks','basaltarch','tamarind','hut','ropebridge','waterfall'];
const WIDE_STRUCTURES=new Set(['hut','kiosk','bench','surfboards','terrace','bollards','arch','comics','gameshop']);
const RIGID_ROCKS=new Set(['basaltarch','lavarocks','v6-lava']);
export const decorOverlap=(a,b,gap=0)=>a.left<b.right+gap&&a.right>b.left-gap&&a.top<b.bottom+gap&&a.bottom>b.top-gap;
export function planScenery(level,measure){
 const accepted=[],landmarks=[];
 if(level.editorLayoutVersion===1){
  for(const [key,landmark]of [['scenery',false],['landmarks',true]]){
   const items=landmark?level.adventure.landmarks:level.scenery;
   for(const [sourceIndex,item]of items.entries()){
    if(item.editorHidden)continue;
    const texture=landmark?`v6-${item.key}`:item.key,size=measure(texture);if(!size)continue;
    const width=size.width*item.scale,height=size.height*item.scale;
    const placed={...item,key:texture,landmark,sourceIndex,width,height,bounds:{left:item.x-width/2,right:item.x+width/2,top:item.y-height,bottom:item.y}};
    accepted.push(placed);if(landmark)landmarks.push(placed);
   }
  }
  return{scenery:accepted.filter(p=>!p.landmark),landmarks,all:accepted};
 }
 const floor=x=>{const p=groundAt(level,x);return p?heightOn(p,x):450;};
 const protectedAreas=[
  {left:GOAL_X-400,right:GOAL_X+400,top:GROUND_Y-480,bottom:GROUND_Y+10},
  ...level.platforms.map(p=>({left:p.x-20,right:p.x+p.w+20,top:Math.min(p.y,p.y2)-35,bottom:Math.max(p.y,p.y2)+8})),
  ...level.loops.map(p=>({left:p.x-p.radius-35,right:p.x+p.radius+35,top:p.baseY-2*p.radius-20,bottom:p.baseY+8})),
  ...[...level.springs,...level.checkpoints,...(level.adventure?.monitors||[]),...(level.adventure?.enemies||[])].map(p=>({left:p.x-55-(p.range||0),right:p.x+55+(p.range||0),top:(p.y??floor(p.x))-90,bottom:Math.min(floor(p.x)+8,(p.y??floor(p.x))+36)})),
 ];
 const candidates=[...(level.adventure?.landmarks||[]).map((p,i)=>({...p,id:`landmark-${i}`,sourceIndex:i,key:`v6-${p.key}`,anchor:'absolute',landmark:true})),
  ...level.scenery.map((p,sourceIndex)=>({...p,sourceIndex})).filter(p=>!p.id.startsWith('path-cluster-')&&!p.id.startsWith('ledge-life-')&&(!p.id.startsWith('cluster-')||Number(p.id.split('-')[1])%3===0))];
 for(const item of candidates){
  const size=measure(item.key);if(!size)continue;
  const scale=item.authored?item.scale:Math.min(item.scale,220/size.width,165/size.height);
  const width=size.width*scale,height=size.height*scale;
  const p=item.authored?{...item,scale,y:item.y??floor(item.x)}:resolveScenery(level,{...item,scale},width);if(!p)continue;
  const bounds={left:p.x-width/2,right:p.x+width/2,top:p.y-height,bottom:p.y};
  if(!item.authored&&protectedAreas.some(b=>decorOverlap(bounds,b,12)))continue;
  if(!item.authored&&accepted.some(q=>decorOverlap(bounds,q.bounds,42)||Math.abs(q.x-p.x)<145&&Math.abs(q.y-p.y)<100))continue;
  const placed={...p,width,height,bounds};accepted.push(placed);if(item.landmark)landmarks.push(placed);
 }
 return{scenery:accepted.filter(p=>!p.landmark),landmarks,all:accepted};
}

export function resolveScenery(level,item,width){
 if(RIGID_ROCKS.has(item.key))return rockFoundation(level,item,width);
 if(item.anchor==='absolute')return{...item,y:item.y};
 const x=item.x,ground=groundAt(level,x);
 if(level.platforms.some(p=>(p.kind==='beam'||p.kind==='crate')&&x>p.x-width/2-35&&x<p.x+p.w+width/2+35))return null;
 if(!ground)return null;
 if(WIDE_STRUCTURES.has(item.key)){
  const left=groundAt(level,x-width/2),right=groundAt(level,x+width/2);
  if(!left||!right||Math.abs(heightOn(left,x-width/2)-heightOn(right,x+width/2))>2)return null;
 }
 // Trees/rocks sink slightly into slopes instead of balancing on a single pixel.
 const half=Math.min(width*.22,24),a=groundAt(level,x-half),b=groundAt(level,x+half);
 const y=heightOn(ground,x);
 return {...item,x,y:y+(WIDE_STRUCTURES.has(item.key)?0:Math.min(8,Math.abs((a?heightOn(a,x-half):y)-(b?heightOn(b,x+half):y))*.25))};
}

// Rigid arches have two feet; centering one on a slope leaves the uphill foot
// buried and the downhill foot in the air. Use a nearby level socket instead.
function rockFoundation(level,item,width){
 const half=width*(item.key==='basaltarch'?.42:.34),zone=Math.floor(item.x/8400);
 const roof=item.anchor==='absolute'?level.platforms.find(p=>p.kind==='roof'&&item.x>=p.x&&item.x<=p.x+p.w&&Math.abs(heightOn(p,item.x)-item.y)<12):null;
 if(item.anchor==='absolute'&&!roof){const g=groundAt(level,item.x);if(!g||Math.abs(heightOn(g,item.x)-item.y)>24)return null;}
 const offsets=[0,...Array.from({length:25},(_,i)=>[(i+1)*24,-(i+1)*24]).flat()];
 for(const offset of offsets){
  const x=item.x+offset;if(Math.floor(x/8400)!==zone)continue;
  const a=roof||groundAt(level,x-half),b=roof||groundAt(level,x+half),center=roof||groundAt(level,x);
  if(!a||!b||!center||roof&&(x-half<roof.x||x+half>roof.x+roof.w))continue;
  if(level.gaps.some(([left,right])=>x+half>left-35&&x-half<right+35))continue;
  if(level.platforms.some(p=>['beam','crate'].includes(p.kind)&&x+width/2>p.x-25&&x-width/2<p.x+p.w+25))continue;
  if([...level.springs,...level.pads,...level.checkpoints].some(p=>Math.abs(x-p.x)<half+60))continue;
  const ys=[heightOn(a,x-half),heightOn(center,x),heightOn(b,x+half)];
  if(Math.max(...ys)-Math.min(...ys)>(item.key==='basaltarch'?2:8))continue;
  const base=Math.max(...ys),height=width*(item.key==='basaltarch'?.59:item.key==='v6-lava'?.54:.36);
  if([...(level.adventure?.monitors||[]),...(level.adventure?.enemies||[])].some(p=>Math.abs(x-p.x)<width/2+70+(p.range||0)&&p.y+36>base-height-12&&p.y-90<base+12))continue;
  return{...item,x,y:Math.min(Math.max(...ys)+1,ys[1]+8),foundation:{left:x-half,right:x+half,variation:Math.max(...ys)-Math.min(...ys)}};
 }
 return null;
}

export function drawScenery(scene){
 const level=scene.level;
 const floor=x=>{const s=groundAt(level,x);return s?heightOn(s,x):null;};
 scene.placedScenery=[];scene.extraProps=[];
 scene.decorPlan=planScenery(level,key=>{if(!scene.textures.exists(key))return null;const source=scene.textures.get(key).getSourceImage();return{width:source.width,height:source.height};});
 for(const placement of scene.decorPlan.scenery){
  const sprite=scene.add.image(placement.x,placement.y,placement.key).setOrigin(.5,1).setScale(placement.scale).setDepth(1);
  scene.placedScenery.push({...placement,sprite});
 }
 // Route guidance uses arrows and flags; no floating text boards.
 for(const checkpoint of level.checkpoints.slice(1))drawCheckpoint(scene,checkpoint.x,floor(checkpoint.x));
 // Shared visual grammar: ember = jump/bonus, mint = recovery, blue = finish.
 scene.stageGates=[];
 for(const stage of STAGES)scene.stageGates.push(drawStageFlag(scene,stage.end,floor(stage.end)));
 for(const [a]of level.gaps)drawRouteSign(scene,a-60,floor(a-60));
 for(const pad of level.pads)drawBoost(scene,pad,[...level.platforms,...level.terrain].find(s=>s.id===pad.surface));
 for(const spring of level.springs)drawSpring(scene,spring,floor(spring.x));
 const building=scene.add.image(GOAL_X,GROUND_Y,'qg').setOrigin(.5,1).setDepth(1),signY=GROUND_Y-building.height+101;
 scene.add.image(GOAL_X-137,signY,'barLogo').setDisplaySize(30,30*745/701).setDepth(2);
 scene.add.text(GOAL_X+17,signY,'LES TOILES NOIRES',{fontFamily:'monospace',fontSize:'20px',fontStyle:'bold',color:'#ffce94',stroke:'#6d4430',strokeThickness:2}).setOrigin(.5).setDepth(2);

}
