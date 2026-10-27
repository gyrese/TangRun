import {groundAt,heightOn} from './level.js';

// Update only the edited object's own attachment metadata.
export function syncEditorObject(level,key,p){
 const height=(x,fallback)=>{const s=groundAt(level,x);return s?heightOn(s,x):fallback;};
 if(key==='checkpoints')p.y=height(p.x,(p.y??430)+20)-20;
 if(key==='springs')p.y=height(p.x,p.y??450);
 if(key==='pads'){
  const surfaces=[...level.platforms,...level.terrain].filter(s=>p.x>=s.x&&p.x<=s.x+s.w);
  surfaces.sort((a,b)=>Math.abs(heightOn(a,p.x)-(p.y??450))-Math.abs(heightOn(b,p.x)-(p.y??450)));
  if(surfaces[0])p.surface=surfaces[0].id;else delete p.surface;
 }
 if(key==='adventure.enemies'){
  if(p.kind==='crab'&&p.range>0){const center=height(p.x,p.y),offset=p.y-center;p.ground=[height(p.x-p.range,center)+offset,p.y,height(p.x+p.range,center)+offset];}
  else delete p.ground;
 }
 return p;
}
