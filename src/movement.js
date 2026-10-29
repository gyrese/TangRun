import {SPEED,MAX_SPEED,JUMP_SPEED,GRAVITY,WORLD_WIDTH,heightOn,surfaceAt,movingSurfaces} from './level.js';
import {STANDING_HEIGHT,STANDING_HALF_WIDTH,ROLL_DIAMETER,runnerHeight,runnerHalfWidth,isSolid} from './runner-body.js';
export {STANDING_HEIGHT} from './runner-body.js';
export const RUNNER_HALF_WIDTH=STANDING_HALF_WIDTH,CROUCH_HEIGHT=ROLL_DIAMETER;
const solids=(level,time)=>[...level.platforms,...movingSurfaces(level,time)].filter(isSolid);
// Follow only surfaces joined at the same physical edge, never a distant floor
// returned by an X lookup after crossing a ledge or a discontinuous edit.
function connectedSupport(level,current,x,time){
 if(!current)return null;
 const surfaces=current.kind==='ground'?level.terrain:[...level.platforms,...movingSurfaces(level,time)];
 let support=current;
 for(let i=0;i<surfaces.length;i++){
  if(x>=support.x&&x<=support.x+support.w)return support;
  const right=x>support.x+support.w,edge=right?support.x+support.w:support.x;
  const next=surfaces.find(s=>s.id!==support.id&&s.kind===support.kind
   &&(support.kind==='ground'||s.route&&s.route===support.route)
   &&Math.abs((right?s.x:s.x+s.w)-edge)<.01
   &&Math.abs(heightOn(s,edge)-heightOn(support,edge))<2);
  if(!next)return null;
  support=next;
 }
 return null;
}
const approach=(v,target,step)=>v<target?Math.min(target,v+step):Math.max(target,v-step);
export function createRunner(x=80,feet=420){
 return{x,feet,vx:0,vy:0,grounded:true,surfaceId:'ground-0',slope:0,sliding:false,rolling:false,angle:0,coyote:0,buffer:0,lastJump:false,airTime:0,padCooldown:0,springCooldown:0,maxSpeed:0,simTime:0,loop:null,loopCooldown:0,previous:null,brokenCrates:new Set()};
}
const pose=p=>({x:p.x,feet:p.feet,angle:p.angle,grounded:p.grounded,surfaceId:p.surfaceId,simTime:p.simTime});
export function resetRunnerInterpolation(p){p.previous=pose(p);}
// Rendering trails the simulation by at most one 120 Hz step. A grounded pose
// follows its actual support, so interpolating across a slope seam cannot float.
export function sampleRunner(p,alpha=1,level){
 const previous=p.previous;
 if(!previous||Math.abs(previous.x-p.x)>80||Math.abs(previous.feet-p.feet)>80)return{...p};
 const t=Math.max(0,Math.min(1,alpha)),lerp=(a,b)=>a+(b-a)*t;
 const sample={...p,x:lerp(previous.x,p.x),feet:lerp(previous.feet,p.feet),simTime:lerp(previous.simTime,p.simTime)};
 sample.angle=previous.angle+Math.atan2(Math.sin(p.angle-previous.angle),Math.cos(p.angle-previous.angle))*t;
 if(level&&p.grounded&&previous.grounded){
  const support=surfaceAt(level,sample.x,previous.surfaceId,sample.simTime)||surfaceAt(level,sample.x,p.surfaceId,sample.simTime);
  if(support){sample.feet=heightOn(support,sample.x);sample.slope=support.slope;sample.angle=Math.atan(support.slope);}
 }
 return sample;
}
// Fixed-step slope controller: images and render frame rate never drive collisions.
export function stepRunner(p,input,level,dt){
 p.previous=pose(p);
 p.simTime=(p.simTime||0)+dt;p.loopCooldown=Math.max(0,(p.loopCooldown||0)-dt);
 const moving=movingSurfaces(level,p.simTime),oldMoving=movingSurfaces(level,p.simTime-dt);
 if(p.grounded&&p.surfaceId){
  const a=oldMoving.find(s=>s.id===p.surfaceId),b=moving.find(s=>s.id===p.surfaceId);
  if(a&&b){p.x+=b.x-a.x;p.feet+=b.y-a.y;}
 }
 if(p.loop){
  const l=p.loop,previous=l.angle,speed=Math.sqrt(Math.max(90000,l.entry*l.entry-2*GRAVITY*.32*l.radius*(1-Math.cos(previous))));
  l.angle+=speed/l.radius*dt;const a=Math.min(Math.PI*2,l.angle);
  p.x=l.x+Math.sin(a)*l.radius;p.feet=l.baseY-l.radius+Math.cos(a)*l.radius;
  p.vx=Math.cos(a)*speed;p.vy=-Math.sin(a)*speed;p.angle=-a;p.sliding=true;p.grounded=false;p.lastJump=!!input.jump;
  if(l.angle>=Math.PI*2){p.loop=null;p.loopCooldown=3;p.x=l.x+14;p.feet=l.baseY;p.grounded=true;p.surfaceId=surfaceAt(level,p.x,'ground-0')?.id;p.vx=l.entry;p.vy=0;p.angle=0;}
  return{jumped:false,landed:false};
 }
 const previousX=p.x,previousFeet=p.feet,wasGrounded=p.grounded,wasSliding=p.sliding,wasRolling=p.rolling;
 const obstacles=solids(level,p.simTime).filter(s=>!p.brokenCrates?.has(s.id));
 let jumped=false,landed=false;
 const surface=surfaceAt(level,p.x,p.surfaceId,p.simTime),direction=Number(!!input.right)-Number(!!input.left);
 p.padCooldown=Math.max(0,p.padCooldown-dt);
 p.springCooldown=Math.max(0,p.springCooldown-dt);
 if(input.jump&&!p.lastJump)p.buffer=.14;else p.buffer=Math.max(0,p.buffer-dt);
 p.coyote=p.grounded?.11:Math.max(0,p.coyote-dt);
 p.slope=p.grounded&&surface?surface.slope:0;
 const downhill=p.slope*Math.sign(p.vx)>.10&&Math.abs(p.vx)>110;
 const braking=direction&&Math.sign(p.vx)!==direction;
 p.rolling=p.grounded?!braking&&((input.slide&&Math.abs(p.vx)>45)||downhill||(wasRolling&&Math.abs(p.vx)>220)):wasRolling;
 p.sliding=p.rolling||(p.grounded?!!input.slide:wasSliding);
 // Recover traction on a steep ascent even if the player keeps crouch held.
 // Otherwise rolling acceleration loses to gravity and can trap a novice in a valley.
 if(p.grounded&&direction&&p.slope*direction<-.1&&Math.abs(p.vx)<SPEED*.65){p.rolling=false;p.sliding=false;}
 // Releasing crouch under a low gate must not expand the body into its cap.
 if(p.grounded&&!p.sliding&&obstacles.some(s=>p.x+runnerHalfWidth(p)>s.x&&p.x-runnerHalfWidth(p)<s.x+s.w&&p.feet>s.y+2&&p.feet-CROUCH_HEIGHT>=s.y+s.h-.01&&p.feet-STANDING_HEIGHT<s.y+s.h))p.sliding=true;
 const halfWidth=runnerHalfWidth(p);
 const oldSlope=p.slope;
 if(p.grounded){
  p.vx+=GRAVITY*p.slope/(1+p.slope*p.slope)*(p.x<8400&&p.sliding&&p.slope>0?1.5:(p.sliding?1.14:.72))*dt;
  if(direction){
   if(Math.sign(p.vx)!==direction)p.vx=approach(p.vx,direction*SPEED,(p.sliding?600:2100)*dt);
   else if(Math.abs(p.vx)<SPEED)p.vx=approach(p.vx,direction*SPEED,(p.sliding?(p.x<8400?700:340):1650)*dt);
   else if(!p.sliding)p.vx=approach(p.vx,direction*SPEED,65*dt);
  }else p.vx=approach(p.vx,0,(p.sliding?45:950)*dt);
  if(p.buffer>0&&p.coyote>0){p.vy=Math.max(-650,-JUMP_SPEED+Math.min(0,p.vx*p.slope*.25));p.grounded=false;p.surfaceId=null;p.coyote=0;p.buffer=0;p.sliding=wasSliding;p.rolling=wasRolling;jumped=true;}
 }else{
  if(direction&&Math.abs(p.vx)<SPEED)p.vx=approach(p.vx,direction*SPEED,650*dt);
  else if(direction&&Math.sign(p.vx)!==direction)p.vx=approach(p.vx,direction*SPEED,900*dt);
  if(p.buffer>0&&p.coyote>0){p.vy=-JUMP_SPEED;p.coyote=0;p.buffer=0;p.sliding=wasSliding;p.rolling=wasRolling;jumped=true;}
 }
 if(!input.jump&&p.lastJump&&p.vy<0)p.vy*=.52;
 p.lastJump=!!input.jump;
 p.vx=Math.max(-MAX_SPEED,Math.min(MAX_SPEED,p.vx));
 p.x=Math.max(14,Math.min(WORLD_WIDTH-14,p.x+p.vx*dt));
 if(p.x===14&&p.vx<0)p.vx=0;
 if(p.grounded){
  let next=connectedSupport(level,surface,p.x,p.simTime);
  if(surface?.kind==='ground'&&p.vx!==0){
   const probe=p.x+Math.sign(p.vx)*halfWidth;
   const target=level.terrain.find(s=>s.id!==surface.id&&probe>=s.x&&probe<=s.x+s.w);
   const edge=p.vx>=0?surface.x+surface.w:surface.x;
   if(target&&Math.abs((p.vx>0?target.x:target.x+target.w)-edge)<.01&&heightOn(target,edge)<heightOn(surface,edge)-2){
    p.x=Math.max(surface.x,Math.min(surface.x+surface.w,edge-Math.sign(p.vx)*halfWidth));
    p.vx=0;next=surface;
   }
  }
  if(next){
   // A smooth crest is still a path. Only the physical end of a ramp launches
   // the runner; a sampled slope changing its angle must never trigger a jump.
   p.feet=heightOn(next,p.x);p.slope=next.slope;p.surfaceId=next.id;p.vy=0;
  }else{p.grounded=false;p.surfaceId=null;p.vy=p.vx*oldSlope;}
 }
 if(!p.grounded){
  p.vy=Math.min(1100,p.vy+GRAVITY*dt);p.feet+=p.vy*dt;p.airTime+=dt;
  // Swept foot sensor; one-way ledges only catch a crossing from above.
  let landing=null,landingY=Infinity;
  for(const s of [...level.terrain,...level.platforms,...moving]){
   if(s.kind==='crate'&&p.brokenCrates?.has(s.id))continue;
   if(p.x<s.x||p.x>s.x+s.w)continue;
   const y=heightOn(s,p.x),oldY=heightOn(s,Math.max(s.x,Math.min(s.x+s.w,previousX)));
   if(previousFeet<=oldY+2&&p.feet>=y&&p.vy-p.vx*s.slope>=0&&y<landingY){landing=s;landingY=y;}
  }
  if(landing){p.feet=landingY;p.vy=0;p.grounded=true;p.surfaceId=landing.id;p.slope=landing.slope;p.airTime=0;landed=true;
   // Consume an early press at the contact itself, including a short tap that
   // was released before touchdown, instead of adding a frame of input lag.
   if(p.buffer>0){p.vy=-JUMP_SPEED*(input.jump?1:.62);p.grounded=false;p.surfaceId=null;p.buffer=0;p.coyote=0;jumped=true;}
  }
 }
 // Crates, caps and explicitly solid surfaces block the body on every side.
 const bodyHeight=runnerHeight(p);
 for(const crate of obstacles){
  if(crate.kind==='crate'&&p.brokenCrates?.has(crate.id))continue;
  if(p.surfaceId===crate.id&&p.grounded)continue;
  const dx=p.x-previousX,dy=p.feet-previousFeet;
  const topAt=x=>heightOn(crate,Math.max(crate.x,Math.min(crate.x+crate.w,x)));
  const bottom=topAt(p.x)+crate.h,oldBottom=topAt(previousX)+crate.h;
  // Sweep the head against an underside rather than testing only the final pose.
  const relativeDy=dy-(bottom-oldBottom);
  if(relativeDy<0&&previousFeet-bodyHeight>=oldBottom-.01&&p.feet-bodyHeight<bottom){
   const t=(oldBottom+bodyHeight-previousFeet)/relativeDy,x=previousX+dx*t;
   if(x+halfWidth>crate.x&&x-halfWidth<crate.x+crate.w){
    p.feet=bottom+bodyHeight;p.vy=0;p.coyote=0;p.grounded=false;p.surfaceId=null;
   }
  }
  let wallX=null;
  if(dx>=0&&previousX<crate.x&&p.x+halfWidth>crate.x&&p.x-halfWidth<crate.x+crate.w)wallX=crate.x-halfWidth;
  if(dx<=0&&previousX>crate.x+crate.w&&p.x-halfWidth<crate.x+crate.w&&p.x+halfWidth>crate.x)wallX=crate.x+crate.w+halfWidth;
  if(wallX===null)continue;
  const t=dx?Math.max(0,Math.min(1,(wallX-previousX)/dx)):0;
  // Grounded feet travel along their slope, including at the instant of impact.
  const feet=p.grounded?heightOn(surfaceAt(level,wallX,p.surfaceId,p.simTime)||surface,wallX):previousFeet+(p.feet-previousFeet)*t;
  const impactX=dx>0?crate.x:crate.x+crate.w,impactTop=topAt(impactX);
  if(feet<=impactTop+.01||feet-bodyHeight>=impactTop+crate.h-.01)continue;
  if(crate.kind==='crate'&&p.sliding&&Math.abs(p.vx)>=180){
   p.brokenCrates??=new Set();p.brokenCrates.add(crate.id);p.vx*=.95;continue;
  }
  p.x=wallX;p.vx=0;
  if(p.grounded){
   const support=surfaceAt(level,p.x,p.surfaceId,p.simTime);
   if(support){p.feet=heightOn(support,p.x);p.slope=support.slope;}
  }
 }
 const crossed=(x,radius)=>x>=Math.min(previousX,p.x)-radius&&x<=Math.max(previousX,p.x)+radius;
 if(p.grounded&&p.padCooldown===0){const pad=(level.pads||[]).find(q=>q.surface===p.surfaceId&&crossed(q.x,24));if(pad&&p.vx>=0){p.vx=Math.max(p.vx,pad.speed);p.padCooldown=.6;}}
 if(p.grounded&&p.springCooldown===0){const spring=(level.springs||[]).find(s=>(s.surface?s.surface===p.surfaceId:p.surfaceId?.startsWith('ground'))&&crossed(s.x,16));if(spring){p.vy=-spring.power;if(spring.boost)p.vx=Math.max(p.vx,spring.boost);p.grounded=false;p.sliding=false;p.rolling=false;p.surfaceId=null;p.springCooldown=spring.cooldown??1;p.coyote=0;jumped=true;}}
 if(p.grounded&&p.loopCooldown===0&&p.vx>0){const l=(level.loops||[]).find(l=>previousX<=l.x&&p.x>=l.x&&p.vx>=l.minSpeed&&Math.abs(p.feet-l.baseY)<2);if(l){p.loop={...l,angle:0,entry:p.vx};p.x=l.x;p.feet=l.baseY;p.grounded=false;p.surfaceId=null;p.sliding=true;}}
 p.angle=p.grounded?Math.atan(p.slope):0;p.maxSpeed=Math.max(p.maxSpeed,Math.abs(p.vx));
 return{jumped,landed:landed||!wasGrounded&&p.grounded};
}
