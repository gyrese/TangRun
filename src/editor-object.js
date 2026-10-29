import {groundAt,heightOn} from './level.js';

export function syncTerrainGaps(level){
 const sorted=[...(level.terrain||[])].filter(p=>Number.isFinite(p?.x)&&Number.isFinite(p?.w)&&p.w>0).sort((a,b)=>a.x-b.x);
 if(!sorted.length)return level.gaps;
 const spans=[];
 for(const p of sorted){
  const start=p.x,end=p.x+p.w;
  if(!spans.length||start>spans.at(-1)[1]+2)spans.push([start,end]);
  else spans.at(-1)[1]=Math.max(spans.at(-1)[1],end);
 }
 const gaps=[];
 for(let i=1;i<spans.length;i++){
  const left=Math.round(spans[i-1][1]),right=Math.round(spans[i][0]);
  if(right-left>=15)gaps.push([left,right]);
 }
 level.gaps=gaps;
 return gaps;
}

function closestSurface(level,x,targetY){
 const roofs=(level.platforms||[]).filter(s=>s.kind==='roof'&&x>=s.x&&x<=s.x+s.w);
 const ground=groundAt(level,x);
 const candidates=[...roofs,...(ground?[ground]:[])];
 if(!candidates.length)return null;
 if(!Number.isFinite(targetY))return ground??candidates[0];
 return candidates.sort((a,b)=>Math.abs(heightOn(a,x)-targetY)-Math.abs(heightOn(b,x)-targetY))[0];
}

// Update only the edited object's own attachment metadata.
export function syncEditorObject(level,key,p){
 if(key==='terrain'){p.y2??=p.y;p.slope=(p.y2-p.y)/p.w;p.h=Math.max(20,900-Math.min(p.y,p.y2));syncTerrainGaps(level);}
 if(key==='platforms'){if(p.kind==='beam'||p.kind==='crate'){p.y2=p.y;p.slope=0;}else{p.y2??=p.y;p.slope=(p.y2-p.y)/p.w;}}
 if(key==='movers'){p.y2=p.y;p.slope=0;}
 if(key==='adventure.relics')p.zone=Math.min(2,Math.floor(p.x/8400));
 if(key==='checkpoints'){
  const s=closestSurface(level,p.x,(p.y??430)+20);
  p.y=(s?heightOn(s,p.x):(p.y??430)+20)-20;
  if(s&&s.kind==='roof')p.surface=s.id;else delete p.surface;
 }
 if(key==='springs'){
  const s=closestSurface(level,p.x,p.y);
  p.y=s?heightOn(s,p.x):(p.y??450);
  if(s&&s.kind==='roof')p.surface=s.id;else delete p.surface;
 }
 if(key==='pads'){
  const walkable=[...(level.platforms||[]).filter(s=>s.kind==='roof'),...(level.terrain||[])];
  const prev=p.surface?walkable.find(s=>s.id===p.surface):null;
  const targetY=p.y??(prev?heightOn(prev,Math.max(prev.x,Math.min(prev.x+prev.w,p.x))):450);
  const surfaces=walkable.filter(s=>p.x>=s.x&&p.x<=s.x+s.w).sort((a,b)=>Math.abs(heightOn(a,p.x)-targetY)-Math.abs(heightOn(b,p.x)-targetY));
  if(surfaces[0]){p.surface=surfaces[0].id;if(p.y!==undefined)p.y=Math.round(heightOn(surfaces[0],p.x));}else delete p.surface;
 }
 if(key==='adventure.enemies'){
  if(p.kind==='crab'&&p.range>0){
   const s=closestSurface(level,p.x,p.y);
   const sample=(x,fallback)=>{const at=s&&x>=s.x&&x<=s.x+s.w?s:groundAt(level,x);return at?heightOn(at,x):fallback;};
   const center=sample(p.x,p.y),offset=p.y-center;
   p.ground=[sample(p.x-p.range,center)+offset,p.y,sample(p.x+p.range,center)+offset];
   if(s)p.surfaceId=s.id;
  }
  else delete p.ground;
 }
 return p;
}
