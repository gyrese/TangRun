import {groundAt,heightOn} from './level.js';
import {createSnowEffects,resetSnowEffects,updateSnowEffects} from './snow-effects.js';
const clamp=v=>Math.max(0,Math.min(1,v));
export function speedProfile(velocity,reduced=false){
 const intensity=reduced?0:clamp((Math.abs(velocity)-360)/490);
 return{intensity,zoom:1,lookAhead:(velocity< -30?-1:1)*(60+intensity*40)};
}
export function createSpeedFeedback(scene){
 createSnowEffects(scene);
 scene.speedFeedback={intensity:0,lookAhead:60,facing:1,focusFeet:scene.runner.feet,streakCount:0,trail:[],lastEmission:-Infinity,
  wind:scene.add.graphics().setScrollFactor(0).setDepth(15),dust:scene.add.graphics().setDepth(9)};
}
export function resetSpeedFeedback(scene){
 resetSnowEffects(scene);
 const f=scene.speedFeedback;if(!f)return;
 f.zoomVelocity=0;f.zoomHoldUntil=-Infinity;f.heldZoom=null;f.snowLeadVelocity=0;f.verticalLead=0;f.verticalLeadVelocity=0;
 f.intensity=0;f.lookAhead=60;f.snowLead=-65;f.zoom=scene.baseZoom??1;f.facing=1;f.focusFeet=scene.runner.feet;f.streakCount=0;f.trail=[];f.lastEmission=-Infinity;f.wind.clear();f.dust.clear();
 scene.cameras.main.setZoom(scene.baseZoom??1);
}
// Frame the downhill corridor, including the lower shelf across a deep jump.
export function snowCameraPlan(p,level,height=540){
 if(p.x<0||p.x>=8400||p.loop)return null;
 const speed=Math.abs(p.vx),vertical=p.grounded?Math.max(0,p.vx*(p.slope||0)):Math.max(0,p.vy);
 const gap=(level.gaps||[]).find(([a,b])=>a<8400&&p.x<b&&a-p.x<Math.max(300,speed*.85));
 const landing=gap?groundAt(level,gap[1]+1):null;
 const drop=landing?Math.max(0,heightOn(landing,gap[1]+1)-p.feet):0;
 const descending=vertical>100||!!gap;
 const zoom=drop>400?Math.max(.56,Math.min(.82,height/(drop+220))):descending?.82:1;
 const viewHeight=height/zoom;
 return{zoom,lookAhead:(p.vx< -30?-1:1)*(gap?260:descending?180:60),
  lead:gap&&drop>400?viewHeight*.30:descending?viewHeight*(p.grounded?.16:.23):-65,
  vertical,gap:!!gap};
}
// Exact critically damped motion: value and velocity stay continuous even
// when a new slope or landing changes the desired camera framing.
export function dampCameraValue(value,velocity,target,dt,omega){
 const error=value-target,decay=Math.exp(-omega*dt),carry=velocity+omega*error;
 return{value:target+(error+carry*dt)*decay,velocity:(velocity-omega*carry*dt)*decay};
}
export function cameraZoom(f,plan,baseZoom,delta,now,reduced=false){
 let target=plan?.zoom??baseZoom;
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
 if(f){f.zoomVelocity=0;f.zoomHoldUntil=-Infinity;f.heldZoom=null;f.snowLeadVelocity=0;f.verticalLead=0;f.verticalLeadVelocity=0;f.focusFeet=p.feet;f.snowLead=plan?.lead??-65;f.lookAhead=plan?.lookAhead??60;f.zoom=plan?.zoom??scene.baseZoom??1;}
 c.setZoom(plan?.zoom??scene.baseZoom??1);
 const x=p.x+(f?.lookAhead??60),y=p.feet+(plan?.lead??-65);
 c.setFollowOffset(scene.player.x-x,scene.player.y-y);c.centerOn(x,y);
}
export function cameraFocus(feedback,p,delta,reduced=false,plan=null){
 const dt=Math.max(0,Math.min(delta,100)),velocity=p.loop?p.loop.entry:p.vx;
 if(Math.abs(velocity)>60)feedback.facing=Math.sign(velocity);
 const profile=speedProfile(velocity,reduced),target=plan?.lookAhead??feedback.facing*(60+profile.intensity*40);
 feedback.lookAhead+=(target-feedback.lookAhead)*(1-Math.exp(-dt/240));
 if(!Number.isFinite(feedback.focusFeet))feedback.focusFeet=p.feet;
 if(p.loop){
  // Keep the whole ring readable; chasing the feet makes the scenery orbit.
  feedback.focusFeet=p.loop.baseY-p.loop.radius+65;
  return{x:p.loop.x+feedback.lookAhead*.2,y:feedback.focusFeet-65};
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
 if(p.grounded)feedback.focusFeet=p.feet;
 else feedback.focusFeet=Math.max(p.feet-85,Math.min(p.feet+105,feedback.focusFeet));
 return{x:p.x+feedback.lookAhead,y:feedback.focusFeet-65};
}
export function fitSpeedBackdrop(scene){
 const width=scene.scale.width,height=scene.scale.height,zoom=scene.cameras.main.zoom;
 const left=(width-width/zoom)/2,top=(height-height/zoom)/2;
 for(const background of scene.backgrounds)background.setPosition(left,top).setSize(width/zoom,height/zoom);
 const snow=scene.backgrounds[0],source=snow.texture?.getSourceImage();
 if(source){snow.setTileScale(Math.max(snow.width/source.width,snow.height/source.height));}
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
 camera.setZoom(cameraZoom(f,plan,baseZoom,delta,scene.visualClock,reduced));
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
