import {enemyPosition,ventPhase} from './adventure.js';
import {ZONES} from './level.js';

export const LANDMARK_KEYS=['lava','tamarin','case-creole','fern','vacoa','pirogue'];
export function preloadAdventure(scene){for(const key of LANDMARK_KEYS)scene.load.image(`v6-${key}`,`/assets/v6/${key}.png`);}

function ensureVentNozzleTexture(scene){
 if(scene.textures.exists('vent-nozzle'))return;
 const canvas=document.createElement('canvas');canvas.width=48;canvas.height=18;
 const c=canvas.getContext('2d');
 c.fillStyle='#1b0f12';c.beginPath();c.moveTo(2,18);c.lineTo(8,4);c.lineTo(40,4);c.lineTo(46,18);c.closePath();c.fill();
 c.strokeStyle='#ff9d5c';c.lineWidth=2;c.stroke();
 c.fillStyle='#ff5e36';c.fillRect(12,6,24,5);
 c.fillStyle='#ffe082';c.fillRect(16,7,16,3);
 for(const x of [10,18,26,34]){c.fillStyle='#ffb74d';c.fillRect(x,12,4,4);}
 scene.textures.addCanvas('vent-nozzle',canvas);
 // Mafate has no lava: its vents are stone valves that release a water jet.
 const valve=document.createElement('canvas');valve.width=48;valve.height=18;
 const v=valve.getContext('2d');
 v.fillStyle='#2a2f33';v.beginPath();v.moveTo(2,18);v.lineTo(8,4);v.lineTo(40,4);v.lineTo(46,18);v.closePath();v.fill();
 v.strokeStyle='#9fd3d6';v.lineWidth=2;v.stroke();
 v.fillStyle='#3e7f8f';v.fillRect(12,6,24,5);
 v.fillStyle='#c8f2ed';v.fillRect(16,7,16,3);
 for(const x of [10,18,26,34]){v.fillStyle='#6fb3bd';v.fillRect(x,12,4,4);}
 scene.textures.addCanvas('vent-valve',valve);
}
const isWaterVent=v=>v.x>=ZONES[2].x&&v.x<ZONES[3].x;

// All interactive objects use the baked pixel-art animation atlas.
export function createAdventureArt(scene){
 ensureVentNozzleTexture(scene);
 const a=scene.adventureArt={enemies:new Map(),relics:new Map(),monitors:new Map(),vents:new Map(),landmarks:new Map(),scatter:[],chapter:-1,effects:[],effectState:null,
  feedback:scene.add.graphics().setDepth(9),
  shield:scene.add.image(0,0,'polish-aura-0').setDepth(11).setVisible(false),
  invincible:scene.add.image(0,0,'polish-hit-0').setDepth(11).setVisible(false)};
 for(const vent of scene.level.adventure.vents){
  const water=isWaterVent(vent);
  const base=scene.add.image(vent.x,vent.y+2,water?'vent-valve':'vent-nozzle').setOrigin(.5,1).setDepth(7);
  const fire=scene.add.sprite(vent.x,vent.y-2,water?'water-flow':'volcanic-fire',0).setOrigin(.5,1).setDisplaySize(42,92).setDepth(8).setVisible(false);
  a.vents.set(vent.id,{base,fire,water});
 }

 for(const e of scene.level.adventure.enemies)a.enemies.set(e.id,scene.add.image(e.x,e.y,`v6-${e.kind}-0`).setDepth(8));
 for(const r of scene.level.adventure.relics)a.relics.set(r.id,scene.add.image(r.x,r.y,'v6-relic-0').setDepth(8));
 for(const m of scene.level.adventure.monitors)a.monitors.set(m.id,scene.add.image(m.x,m.y,`v6-${m.type}-0`).setDepth(7));
 for(const l of scene.decorPlan.landmarks){
  const tint=l.x<8400?0xb89a90:l.x<16800?0x9ab5a4:0xa4b8c2;
  a.landmarks.set(l.id,scene.add.image(l.x,l.y,l.key).setOrigin(.5,1).setScale(l.scale).setDepth(-2).setAlpha(.90).setTint(tint));
 }
}
export function updateAdventureArt(scene,reduced=false){
 const a=scene.adventureArt,s=scene.adventure,p=scene.renderRunner??scene.runner,t=s.time;
 const camera=scene.cameras.main,margin=120;
 const inView=x=>x>camera.worldView.x-margin&&x<camera.worldView.right+margin;
 if(a.effectState!==s){a.effectState=s;a.effects=[];a.seenDefeats=new Set(s.defeated);a.seenRelics=new Set(s.relics);a.seenMonitors=new Set(s.opened);}
 const burst=(x,y,color)=>{if(!reduced&&inView(x))a.effects.push({x,y,color,time:t});};
 for(const e of scene.level.adventure.enemies){
  const sprite=a.enemies.get(e.id),pos=enemyPosition(e,t);sprite.setVisible(!s.defeated.has(e.id)&&inView(pos.x));
  if(s.defeated.has(e.id)&&!a.seenDefeats.has(e.id)){a.seenDefeats.add(e.id);burst(pos.x,pos.y,0xf4c783);}
  if(sprite.visible)sprite.setPosition(pos.x,pos.y).setTexture(`v6-${e.kind}-${reduced?0:Math.floor(t*(e.kind==='drone'?10:7))%4}`).setFlipX(Math.cos(t*1.5+e.phase)>0);
 }
 for(const r of scene.level.adventure.relics){
  const sprite=a.relics.get(r.id),collected=s.relics.has(r.id);sprite.setVisible(!collected&&inView(r.x));
  if(collected&&!a.seenRelics.has(r.id)){a.seenRelics.add(r.id);burst(r.x,r.y,0xffdc85);}
  if(sprite.visible)sprite.setTexture(`v6-relic-${reduced?0:Math.floor(t*6)%4}`).setY(r.y+(reduced?0:Math.sin(t*2+r.x)*2.5));
 }
 for(const m of scene.level.adventure.monitors){
  const sprite=a.monitors.get(m.id),opened=s.opened.has(m.id);sprite.setVisible(!opened&&inView(m.x));
  if(opened&&!a.seenMonitors.has(m.id)){a.seenMonitors.add(m.id);burst(m.x,m.y,m.type==='shield'?0xa1e4d7:0xffd583);}
  if(sprite.visible)sprite.setTexture(`v6-${m.type}-${reduced?0:Math.floor(t*5+m.x*.01)%4}`);
 }
 for(const v of scene.level.adventure.vents){
  const art=a.vents.get(v.id),phase=ventPhase(v,t),active=phase==='active',warning=phase==='warning',visible=inView(v.x);
  art.base.setVisible(visible).setTint(art.water?(active?0x7fd6e0:warning?0xc8f2ed:0xb9c8c9):(active?0xff6d42:warning?0xffcc66:0xd8b09c));
  art.fire.setVisible(visible&&(active||warning)).setFrame(reduced?0:Math.floor(t*12)%8).setDisplaySize(active?42:30,active?92:24).setAlpha(active?1:.65);
 }
 const auraFrame=reduced?0:Math.floor(t*8)%4;
 a.shield.setVisible(s.shield).setTexture(`polish-aura-${auraFrame}`).setPosition(p.x,p.feet-25);
 a.invincible.setVisible(s.invincible>0).setTexture(`polish-hit-${auraFrame}`).setPosition(p.x,p.feet-25).setAlpha(.7);
 scene.mascot.setAlpha(s.invincible>0&&!reduced?.6+.4*Math.sin(t*12)**2:1);
 while(a.scatter.length<s.scatter.length)a.scatter.push(scene.add.image(0,0,'token-spin-0').setDisplaySize(12,13).setDepth(11));
 for(let i=0;i<a.scatter.length;i++){
  const image=a.scatter[i],coin=s.scatter[i];image.setVisible(!!coin);
  if(coin)image.setPosition(coin.x,coin.y).setTexture(`token-spin-${reduced?0:Math.floor(t*10+i)%8}`).setAlpha(Math.min(1,4-coin.age));
 }
 // Silent, local feedback replaces the previous stack of notification messages.
 a.feedback.clear();a.effects=a.effects.filter(e=>t-e.time<.38);
 for(const effect of a.effects){
  const age=(t-effect.time)/.38;
  for(let i=0;i<8;i++){
   const angle=i*Math.PI/4,radius=9+age*29;
   a.feedback.fillStyle(effect.color,(1-age)*.85);
   a.feedback.fillRect(effect.x+Math.cos(angle)*radius-1,effect.y+Math.sin(angle)*radius-age*9-1,age<.45?3:2,age<.45?3:2);
  }
 }
}
