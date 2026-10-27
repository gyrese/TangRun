import {enemyPosition,ventPhase} from './adventure.js';

export const LANDMARK_KEYS=['lava','tamarin','case-creole','fern','vacoa','pirogue'];
export function preloadAdventure(scene){for(const key of LANDMARK_KEYS)scene.load.image(`v6-${key}`,`/assets/v6/${key}.png`);}

// All interactive objects use the baked pixel-art animation atlas.
export function createAdventureArt(scene){
 const a=scene.adventureArt={enemies:new Map(),relics:new Map(),monitors:new Map(),vents:new Map(),landmarks:new Map(),scatter:[],chapter:-1,
  shield:scene.add.image(0,0,'polish-aura-0').setDepth(11).setVisible(false),
  invincible:scene.add.image(0,0,'polish-hit-0').setDepth(11).setVisible(false)};
 for(const vent of scene.level.adventure.vents){
  const base=scene.add.image(vent.x,vent.y+2,'v6-lava').setOrigin(.5,1).setDisplaySize(44,16).setDepth(7);
  const fire=scene.add.sprite(vent.x,vent.y-1,'volcanic-fire',0).setOrigin(.5,1).setDisplaySize(40,88).setDepth(8).setVisible(false);
  a.vents.set(vent.id,{base,fire});
 }

 for(const e of scene.level.adventure.enemies)a.enemies.set(e.id,scene.add.image(e.x,e.y,`v6-${e.kind}-0`).setDepth(8));
 for(const r of scene.level.adventure.relics)a.relics.set(r.id,scene.add.image(r.x,r.y,'v6-relic-0').setDepth(8));
 for(const m of scene.level.adventure.monitors)a.monitors.set(m.id,scene.add.image(m.x,m.y,`v6-${m.type}-0`).setDepth(7));
 for(const l of scene.decorPlan.landmarks)a.landmarks.set(l.id,scene.add.image(l.x,l.y,l.key).setOrigin(.5,1).setScale(l.scale).setDepth(1));

}
export function updateAdventureArt(scene,reduced=false){
 const a=scene.adventureArt,s=scene.adventure,p=scene.runner,t=s.time;
 const inView=x=>Math.abs(x-p.x)<scene.scale.width+250;
 for(const e of scene.level.adventure.enemies){
  const sprite=a.enemies.get(e.id),pos=enemyPosition(e,t);sprite.setVisible(!s.defeated.has(e.id)&&inView(pos.x));
  if(sprite.visible)sprite.setPosition(pos.x,pos.y).setTexture(`v6-${e.kind}-${reduced?0:Math.floor(t*(e.kind==='drone'?10:7))%4}`).setFlipX(Math.cos(t*1.5+e.phase)>0);
 }
 for(const r of scene.level.adventure.relics)a.relics.get(r.id).setVisible(!s.relics.has(r.id)).setTexture(`v6-relic-${reduced?0:Math.floor(t*6)%4}`).setY(r.y+(reduced?0:Math.sin(t*3+r.x)*5));
 for(const m of scene.level.adventure.monitors)a.monitors.get(m.id).setVisible(!s.opened.has(m.id)).setTexture(`v6-${m.type}-${reduced?0:Math.floor(t*5+m.x*.01)%4}`);
 for(const v of scene.level.adventure.vents){
  const art=a.vents.get(v.id),phase=ventPhase(v,t),active=phase==='active',warning=phase==='warning',visible=inView(v.x);
  art.base.setVisible(visible);art.fire.setVisible(visible&&(active||warning)).setFrame(reduced?0:Math.floor(t*12)%8).setDisplaySize(active?40:28,active?88:20).setAlpha(active?1:.5);
 }
 const auraFrame=reduced?0:Math.floor(t*8)%4;
 a.shield.setVisible(s.shield).setTexture(`polish-aura-${auraFrame}`).setPosition(p.x,p.feet-25);
 a.invincible.setVisible(s.invincible>0).setTexture(`polish-hit-${auraFrame}`).setPosition(p.x,p.feet-25).setAlpha(.7);
 scene.mascot.setAlpha(s.invincible>0&&!reduced?(Math.floor(t*12)%2?.45:1):1);
 while(a.scatter.length<s.scatter.length)a.scatter.push(scene.add.image(0,0,'token-spin-0').setDisplaySize(12,13).setDepth(11));
 for(let i=0;i<a.scatter.length;i++){
  const image=a.scatter[i],coin=s.scatter[i];image.setVisible(!!coin);
  if(coin)image.setPosition(coin.x,coin.y).setTexture(`token-spin-${reduced?0:Math.floor(t*10+i)%8}`).setAlpha(Math.min(1,4-coin.age));
 }
}
