import {DEBUG} from './debug-flags.js';
import {createSnowEffects,resetSnowEffects,updateSnowEffects} from './snow-effects.js';
const clamp=v=>Math.max(0,Math.min(1,v));
// À pleine vitesse, la caméra recule de 15 % et regarde plus loin devant,
// pour laisser le temps de voir arriver sentinelles, évents et réceptions.
export const SPEED_WIDEN=.15,SPEED_LOOK_AHEAD=100;
export function speedProfile(velocity,reduced=false){
 const intensity=reduced?0:clamp((Math.abs(velocity)-360)/490);
 return{intensity,zoom:1,lookAhead:(velocity< -30?-1:1)*(60+intensity*40)};
}
export function createSpeedFeedback(scene){
 createSnowEffects(scene);
 scene.speedFeedback={intensity:0,lookAhead:24,facing:1,focusFeet:scene.runner.feet,streakCount:0,trail:[],lastEmission:-Infinity,
  wind:scene.add.graphics().setScrollFactor(0).setDepth(15),dust:scene.add.graphics().setDepth(9)};
}
export function resetSpeedFeedback(scene){
 resetSnowEffects(scene);
 const f=scene.speedFeedback;if(!f)return;
 f.zoomVelocity=0;f.zoomHoldUntil=-Infinity;f.heldZoom=null;f.snowLeadVelocity=0;f.verticalLead=0;f.verticalLeadVelocity=0;
 f.intensity=0;f.lookAhead=24;f.snowLead=-25;f.zoom=scene.baseZoom??1;f.facing=1;f.focusFeet=scene.runner.feet;f.streakCount=0;f.trail=[];f.lastEmission=-Infinity;f.wind.clear();f.dust.clear();
 scene.cameras.main.setZoom(scene.baseZoom??1);
}
// Keep the runner prominent even above deep drops. Terrain anticipation is
// deliberately small so a landing cannot pull the camera away from the player.
export function snowCameraPlan(p,level,height=540){
 if(p.x<0||p.x>=8400||p.loop)return null;
 return{zoom:1,lookAhead:(p.vx< -30?-1:1)*24,lead:-25,vertical:0,gap:false};
}
// Exact critically damped motion: value and velocity stay continuous even
// when a new slope or landing changes the desired camera framing.
export function dampCameraValue(value,velocity,target,dt,omega){
 const error=value-target,decay=Math.exp(-omega*dt),carry=velocity+omega*error;
 return{value:target+(error+carry*dt)*decay,velocity:(velocity-omega*carry*dt)*decay};
}
export function cameraZoom(f,plan,baseZoom,delta,now,reduced=false){
 let target=(plan?.zoom??1)*baseZoom;
 if(plan?.gap){
  f.heldZoom=f.heldZoom==null?target:Math.min(f.heldZoom,target);
  f.zoomHoldUntil=now+550;
 }
 if(plan&&now<(f.zoomHoldUntil??-Infinity))target=Math.min(target,f.heldZoom??target);
 else f.heldZoom=null;
 f.zoom??=target;f.zoomVelocity??=0;
 if(reduced){f.zoom=target;f.zoomVelocity=0;return f.zoom;}
 const next=dampCameraValue(f.zoom,f.zoomVelocity,target,Math.min(delta,100)/1000,target<f.zoom?8:4);
 f.zoom=next.value;f.zoomVelocity=next.velocity;
 return f.zoom;
}
export function snapCameraToRunner(scene){
 const p=scene.runner,c=scene.cameras.main;
 const f=scene.speedFeedback,plan=snowCameraPlan(p,scene.level,scene.scale.height);
 if(f){f.zoomVelocity=0;f.zoomHoldUntil=-Infinity;f.heldZoom=null;f.snowLeadVelocity=0;f.verticalLead=0;f.verticalLeadVelocity=0;f.focusFeet=p.feet;f.snowLead=plan?.lead??-25;f.lookAhead=plan?.lookAhead??24;f.zoom=(plan?.zoom??1)*(scene.baseZoom??1);}
 c.setZoom((plan?.zoom??1)*(scene.baseZoom??1));
 const x=p.x+(f?.lookAhead??24),y=p.feet+(plan?.lead??-25);
 c.setFollowOffset(scene.player.x-x,scene.player.y-y);c.centerOn(x,y);
}
export function cameraFocus(feedback,p,delta,reduced=false,plan=null){
 const dt=Math.max(0,Math.min(delta,100)),velocity=p.loop?p.loop.entry:p.vx;
 if(Math.abs(velocity)>60)feedback.facing=Math.sign(velocity);
 const profile=speedProfile(velocity,reduced),target=plan?.lookAhead??feedback.facing*(24+profile.intensity*SPEED_LOOK_AHEAD);
 feedback.lookAhead+=(target-feedback.lookAhead)*(1-Math.exp(-dt/240));
 if(!Number.isFinite(feedback.focusFeet))feedback.focusFeet=p.feet;
 if(p.loop){
  // Frame the ring as one space; chasing the whole orbit makes the scenery spin.
  // Follow 40% of the vertical motion so the close-up still keeps the runner in view.
  const center=p.loop.baseY-p.loop.radius;
  feedback.focusFeet=p.feet;
  return{x:p.loop.x+feedback.lookAhead*.2,y:center+(p.feet-center)*.4};
 }
 if(plan){
  if(!Number.isFinite(feedback.snowLead))feedback.snowLead=plan.lead;
  const lead=plan.lead>0?plan.lead*plan.zoom/(feedback.zoom??plan.zoom):plan.lead;
  const next=dampCameraValue(feedback.snowLead,feedback.snowLeadVelocity??0,lead,dt/1000,9);
  feedback.snowLead=reduced?lead:next.value;feedback.snowLeadVelocity=reduced?0:next.velocity;
  const falling=dampCameraValue(feedback.verticalLead??0,feedback.verticalLeadVelocity??0,plan.vertical*.045,dt/1000,9);
  feedback.verticalLead=reduced?0:falling.value;feedback.verticalLeadVelocity=reduced?0:falling.velocity;
  if(p.grounded||p.vy>=0)feedback.focusFeet=p.feet;
  else feedback.focusFeet=Math.max(p.feet-85,Math.min(p.feet+105,feedback.focusFeet));
  return{x:p.x+feedback.lookAhead,y:feedback.focusFeet+feedback.snowLead+feedback.verticalLead};
 }
 // Hold the horizon on small jumps, otherwise the whole screen bobs.
 if(p.grounded)feedback.focusFeet=p.feet;
 else feedback.focusFeet=Math.max(p.feet-85,Math.min(p.feet+105,feedback.focusFeet));
 return{x:p.x+feedback.lookAhead,y:feedback.focusFeet-25};
}
export function fitSpeedBackdrop(scene){
 const width=scene.scale.width,height=scene.scale.height,zoom=scene.cameras.main.zoom;
 // Les fonds sont dimensionnés une seule fois, pour le recul maximal de la caméra.
 // Redimensionner une TileSprite réalloue sa texture : le faire à chaque image
 // pendant le recul de vitesse faisait saccader les téléphones.
 const minZoom=(scene.baseZoom??zoom)*(1-SPEED_WIDEN);
 const previous=scene.backdropFit;
 if(previous?.width!==width||previous.height!==height||previous.minZoom!==minZoom){
  scene.backdropFit={width,height,minZoom};
  // Canvas dimensions must be integers, otherwise Canvas rendering reallocates
  // the backing store every frame when comparing it with a fractional size.
  for(const background of scene.backgrounds)background.setSize(Math.ceil(width/minZoom),Math.ceil(height/minZoom));
  const snow=scene.backgrounds[0],source=snow.texture?.getSourceImage();
  if(source){snow.setTileScale(Math.max(snow.width/source.width,snow.height/source.height));}
 }
 // À chaque image, seule une mise à l'échelle (gratuite) suit le zoom courant.
 const left=(width-width/zoom)/2,top=(height-height/zoom)/2,scale=minZoom/zoom;
 for(const background of scene.backgrounds)background.setPosition(left,top).setScale(scale);
 scene.speedFeedback?.wind.setPosition(left,top).setScale(1/zoom);
}
export function updateSpeedFeedback(scene,delta,reduced=false){
 const f=scene.speedFeedback,p=scene.renderRunner??scene.runner,camera=scene.cameras.main;
 const velocity=p.loop?p.loop.entry:p.vx,profile=speedProfile(velocity,reduced);
 const blend=1-Math.exp(-Math.min(delta,100)/220);
 f.intensity+= (profile.intensity-f.intensity)*blend;
 if(reduced)f.intensity=0;
 const baseZoom=scene.baseZoom??1;
 const plan=snowCameraPlan(p,scene.level,scene.scale.height);
 f.zoom??=camera.zoom;
 // L'intensité est déjà lissée : le recul suit l'élan sans pomper à chaque appui.
 const widen=reduced||DEBUG.has('nowiden')?1:1-SPEED_WIDEN*f.intensity;
 camera.setZoom(cameraZoom(f,plan,baseZoom*widen,delta,scene.visualClock,reduced));
 const focus=cameraFocus(f,p,delta,reduced,plan);
 camera.setFollowOffset(scene.player.x-focus.x,scene.player.y-focus.y);
 camera.setLerp(reduced?1:1-Math.exp(-Math.min(delta,100)/70),reduced?1:1-Math.exp(-Math.min(delta,100)/(plan?45:100)));
 // Compensate fixed scenery for the expanded camera view, including phone ratios.
 const width=scene.scale.width,height=scene.scale.height;
 fitSpeedBackdrop(scene);f.wind.clear();f.dust.clear();
 updateSnowEffects(scene,reduced);
 f.streakCount=0;
 if(reduced){f.trail=[];return;}
 // Lines stay in the upper sky and bottom margin, away from the landing corridor.
 const time=scene.visualClock/1000,direction=velocity<0?-1:1;
 const count=Math.floor(f.intensity*8);
 for(let i=0;i<count;i++){
  const phase=((i*.173+time*(.42+f.intensity*.7))%1),x=direction>0?width*(1-phase):width*phase;
  const y=i%3===0?height-22-(i%4)*9:82+(i*37)%100;
  const length=12+f.intensity*(22+i%4*12);
  f.wind.lineStyle(i%4===0?2:1,0xe0e7ce,.08+f.intensity*.12);
  f.wind.lineBetween(x,y,x-direction*length,y);f.streakCount++;
 }
 if(scene.zone!==0&&p.grounded&&Math.abs(p.vx)>300&&scene.visualClock-f.lastEmission>24){
  f.trail.push({x:p.x-direction*10,y:p.feet-3,time:scene.visualClock,velocity:p.vx,zone:scene.zone});
  f.lastEmission=scene.visualClock;
 }
 f.trail=f.trail.filter(t=>scene.visualClock-t.time<300).slice(-16);
 for(const t of f.trail){
  const age=(scene.visualClock-t.time)/300,alpha=(1-age)*(.2+f.intensity*.23);
  const x=t.x-Math.sign(t.velocity)*age*20,y=t.y-age*12;
  f.dust.fillStyle([0xe0f2fe,0xc28d68,0xb8d496,0xd1c796][t.zone]||0xd1c796,alpha);
  f.dust.fillRect(x-4,y,5+(1-age)*f.intensity*11,2);
  f.dust.fillRect(x+Math.sign(t.velocity)*7,y+3,3,2);
 }
}
