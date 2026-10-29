import {GROUND_Y,GOAL_X,ZONES,STAGES,groundAt,heightOn} from './level.js';
import {drawCheckpoint,drawSpring,drawBoost,drawRouteSign,drawStageFlag} from './prop-art.js';
import {createBar} from './bar-arrival.js';
export const V3_KEYS=['pier','rocks','boat','bench','bollards','surfboards','kiosk','comics','gameshop','footbridge','neonarrow','arch','plants','frangipani','lantern','terrace','speakers','canopy','lavarocks','basaltarch','tamarind','hut','ropebridge','waterfall','snowman','snow-pine','snow-chunk'];
export const VENUE_KEYS=['etiquette','choka-bleu','le-qg'];
const WIDE_STRUCTURES=new Set(['hut','kiosk','bench','surfboards','terrace','bollards','arch','comics','gameshop','v6-case-creole','v6-pirogue',...VENUE_KEYS]);
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
 const candidates=[...(level.adventure?.landmarks||[]).map((p,i)=>({...p,id:p.id??`landmark-${i}`,sourceIndex:i,key:`v6-${p.key}`,anchor:p.authored?'absolute':'ground',landmark:true})),
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
 if(RIGID_ROCKS.has(item.key)){
  const rock=rockFoundation(level,item,width);
  if(rock||!item.id?.startsWith('path-cluster-'))return rock;
 }
 if(WIDE_STRUCTURES.has(item.key))return wideFoundation(level,item,width);
 const s=groundAt(level,item.x);
 if(!s||Math.abs(s.slope)>.45)return null;
 return{...item,x:item.x,y:heightOn(s,item.x)};
}

function wideFoundation(level,item,width){
 const half=width/2,zone=Math.floor(item.x/8400);
 for(const offset of [0,-18,18,-36,36,-64,64,-100,100,-150,150,-220,220,-300,300,-420,420,-550,550]){
  const x=item.x+offset;if(Math.floor(x/8400)!==zone)continue;
  const left=groundAt(level,x-half),right=groundAt(level,x+half);
  if(!left||!right||left.slope!==0||right.slope!==0||Math.abs(left.y-right.y)>1)continue;
  if(level.gaps.some(([a,b])=>x+half>a&&x-half<b))continue;
  return{...item,x,y:left.y,foundation:{variation:0}};
 }
 return null;
}

function rockFoundation(level,item,width){
 const half=width*(item.key==='basaltarch'?.42:.34),zone=Math.floor(item.x/8400);
 let best=null,minDiff=Infinity;
 for(const offset of [0,-24,24,-50,50,-85,85,-130,130,-190,190,-260,260,-350,350,-460,460]){
  const x=item.x+offset;if(Math.floor(x/8400)!==zone)continue;
  const left=groundAt(level,x-half),right=groundAt(level,x+half);
  if(!left||!right||level.gaps.some(([a,b])=>x+half>a&&x-half<b))continue;
  const diff=Math.abs(heightOn(left,x-half)-heightOn(right,x+half));
  if(diff<minDiff){minDiff=diff;best={...item,x,y:Math.max(heightOn(left,x-half),heightOn(right,x+half)),foundation:{variation:diff}};}
  if(diff<=3)break;
 }
 return minDiff<=8?best:null;
}

export function drawScenery(scene,level){
 const floor=x=>{const s=groundAt(level,x);return s?heightOn(s,x):null;};
 scene.placedScenery=[];scene.extraProps=[];
 scene.decorPlan=planScenery(level,key=>{if(!scene.textures.exists(key))return null;const source=scene.textures.get(key).getSourceImage();return{width:source.width,height:source.height};});
 for(const [i,placement]of scene.decorPlan.scenery.entries()){
  const tint=placement.x<ZONES[1].x?0xc2daf8:placement.x<ZONES[2].x?0xc2a69c:placement.x<ZONES[3].x?0xa8bfa8:0xb0c2c8;
  const flip=!WIDE_STRUCTURES.has(placement.key)&&i%2===1;
  const sprite=scene.add.image(placement.x,placement.y,placement.key).setOrigin(.5,1).setScale(placement.scale).setFlipX(flip).setDepth(-1).setAlpha(.92).setTint(tint);
  if(VENUE_KEYS.includes(placement.key)||placement.key.startsWith('snow'))sprite.clearTint().setAlpha(1);
  scene.placedScenery.push({...placement,sprite});
 }
 for(const checkpoint of level.checkpoints.slice(1))drawCheckpoint(scene,checkpoint.x,checkpoint.surface&&Number.isFinite(checkpoint.y)?checkpoint.y+20:floor(checkpoint.x));
 scene.stageGates=[];
 for(const stage of STAGES)scene.stageGates.push(drawStageFlag(scene,stage.end,floor(stage.end)));
 for(const [a]of level.gaps)drawRouteSign(scene,a-60,floor(a-60));
 for(const pad of level.pads)drawBoost(scene,pad,[...level.platforms,...level.terrain].find(s=>s.id===pad.surface));
 for(const spring of level.springs)drawSpring(scene,spring,spring.surface&&Number.isFinite(spring.y)?spring.y:floor(spring.x));
 createBar(scene);
}
