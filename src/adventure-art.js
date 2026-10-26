import {enemyPosition,ventPhase} from './adventure.js';

export const LANDMARK_KEYS=['lava','tamarin','case-creole','fern','vacoa','pirogue'];
export function preloadAdventure(scene){for(const key of LANDMARK_KEYS)scene.load.image(`v6-${key}`,`/assets/v6/${key}.png`);}

// Gameplay silhouettes are code-native sprites: collision-sized, sharp at any
// zoom, and distinct from the generated environmental paintings.
function makeSprite(scene,key,width,height,paint){
 const t=scene.textures.createCanvas(key,width,height),c=t.context;c.imageSmoothingEnabled=false;paint(c);t.refresh();
}
export function createAdventureArt(scene){
 const pixel=(c,color,x,y,w,h)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
 for(const kind of ['crab','drone'])for(let frame=0;frame<2;frame++)makeSprite(scene,`v6-${kind}-${frame}`,48,40,c=>{
  const r=(color,x,y,w,h)=>pixel(c,color,x,y,w,h),body=kind==='crab'?'#e96948':'#65d9ca';
  r('#081b2a',8,12,32,20);r(body,10,10,28,18);r('#ffe0a0',12,10,24,4);r('#9b393b',10,26,28,5);
  r('#0b2035',15,16,19,8);r('#fff4b9',18,17,5,4);r('#fff4b9',28,17,4,4);
  if(kind==='crab'){
   for(const x of [6,16,30,39]){r('#15293b',x,29,4,5+frame*3);r('#ffbc72',x-2,32+frame*3,7,3);}
   r(body,1,15+frame*2,8,11);r(body,39,15+frame*2,8,11);r('#ffbc72',0,12+frame*2,4,5);r('#ffbc72',44,12+frame*2,4,5);
  }else{
   r('#163c53',20,3,8,7);r('#c1fff0',frame?2:8,2,frame?44:32,3);r('#ffbc72',14,32,7,4+frame*3);r('#ffbc72',29,32,7,4+frame*3);
  }
 });
 makeSprite(scene,'v6-relic',34,40,c=>{
  c.fillStyle='#182b4f';c.beginPath();c.moveTo(17,0);c.lineTo(34,20);c.lineTo(17,40);c.lineTo(0,20);c.fill();
  c.fillStyle='#ffca63';c.beginPath();c.moveTo(17,4);c.lineTo(29,20);c.lineTo(17,35);c.lineTo(5,20);c.fill();
  pixel(c,'#ff825e',12,13,10,14);pixel(c,'#fff6c8',13,7,5,9);pixel(c,'#fff6c8',7,18,4,4);
 });
 for(const type of ['shield','cache'])makeSprite(scene,`v6-${type}`,42,44,c=>{
  const r=(color,x,y,w,h)=>pixel(c,color,x,y,w,h);
  r('#0a1d30',2,4,38,38);r('#6e8f9e',4,6,34,31);r('#ccd9c0',6,6,30,3);r('#123244',8,11,26,21);r('#365361',0,39,42,5);
  if(type==='shield'){c.strokeStyle='#8df7eb';c.lineWidth=3;c.beginPath();c.arc(21,21,8,0,Math.PI*2);c.stroke();r('#edffc4',19,16,4,10);}
  else{r('#ffd275',13,15,6,13);r('#ffd275',23,15,6,13);r('#fff5d3',13,15,3,5);}
 });
 const a=scene.adventureArt={enemies:new Map(),relics:new Map(),monitors:new Map(),effects:scene.add.graphics().setDepth(11),vents:scene.add.graphics().setDepth(7),chapter:-1};
 for(const e of scene.level.adventure.enemies)a.enemies.set(e.id,scene.add.image(e.x,e.y,`v6-${e.kind}-0`).setDepth(8));
 for(const r of scene.level.adventure.relics)a.relics.set(r.id,scene.add.image(r.x,r.y,'v6-relic').setDepth(8));
 for(const m of scene.level.adventure.monitors)a.monitors.set(m.id,scene.add.image(m.x,m.y,`v6-${m.type}`).setDepth(7));
 for(const l of scene.decorPlan.landmarks)scene.add.image(l.x,l.y,l.key).setOrigin(.5,1).setScale(l.scale).setDepth(1);

}
export function updateAdventureArt(scene,reduced=false){
 const a=scene.adventureArt,s=scene.adventure,p=scene.runner,t=s.time;
 const inView=x=>Math.abs(x-p.x)<scene.scale.width+250;
 for(const e of scene.level.adventure.enemies){const sprite=a.enemies.get(e.id),pos=enemyPosition(e,t);sprite.setVisible(!s.defeated.has(e.id)&&inView(pos.x));if(sprite.visible)sprite.setPosition(pos.x,pos.y).setTexture(`v6-${e.kind}-${reduced?0:Math.floor(t*7)%2}`).setFlipX(Math.cos(t*1.5+e.phase)>0);}
 for(const r of scene.level.adventure.relics)a.relics.get(r.id).setVisible(!s.relics.has(r.id)).setY(r.y+(reduced?0:Math.sin(t*3+r.x)*5));
 for(const m of scene.level.adventure.monitors)a.monitors.get(m.id).setVisible(!s.opened.has(m.id));
 a.vents.clear();
 for(const v of scene.level.adventure.vents){
  if(!inView(v.x))continue;const phase=ventPhase(v,t),active=phase==='active';
  a.vents.fillStyle(0x243c45).fillRect(v.x-24,v.y-6,48,6);
  for(let i=0;i<5;i++)a.vents.fillStyle(phase==='idle'?0x839a8c:0xffb860).fillRect(v.x-20+i*9,v.y-8,5,4);
  if(active){a.vents.fillStyle(0xff6b43,.9).fillTriangle(v.x-20,v.y-8,v.x+20,v.y-8,v.x,v.y-88);a.vents.fillStyle(0xffefb0).fillTriangle(v.x-9,v.y-8,v.x+9,v.y-8,v.x,v.y-64);}
  if(phase==='warning'){a.vents.lineStyle(2,0xffc76b,.9).strokeCircle(v.x,v.y-30,14);}
 }
 a.effects.clear();
 if(s.shield)a.effects.lineStyle(2,0x8df7eb,.8).strokeCircle(p.x,p.feet-25,34);
 if(s.invincible>0)a.effects.lineStyle(2,0xffe7a0,.65).strokeCircle(p.x,p.feet-25,29);
 scene.mascot.setAlpha(s.invincible>0&&!reduced?(Math.floor(t*12)%2?.45:1):1);
 for(const r of s.scatter)a.effects.fillStyle(0xffd37c,Math.min(1,4-r.age)).fillRect(r.x-4,r.y-5,8,10);
}
