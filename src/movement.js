import {SPEED,MAX_SPEED,JUMP_SPEED,GRAVITY,WORLD_WIDTH,heightOn,surfaceAt,movingSurfaces} from './level.js';
const approach=(v,target,step)=>v<target?Math.min(target,v+step):Math.max(target,v-step);
export function createRunner(x=80,feet=420){
 return{x,feet,vx:0,vy:0,grounded:true,surfaceId:'ground-0',slope:0,sliding:false,rolling:false,angle:0,coyote:0,buffer:0,lastJump:false,airTime:0,padCooldown:0,springCooldown:0,maxSpeed:0,simTime:0,loop:null,loopCooldown:0};
}
// Fixed-step slope controller: images and render frame rate never drive collisions.
export function stepRunner(p,input,level,dt){
 p.simTime=(p.simTime||0)+dt;p.loopCooldown=Math.max(0,(p.loopCooldown||0)-dt);
 const moving=movingSurfaces(level,p.simTime),oldMoving=movingSurfaces(level,p.simTime-dt);
 if(p.grounded&&p.surfaceId?.startsWith('moving')){
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
 const previousX=p.x,previousFeet=p.feet,wasGrounded=p.grounded;
 const surface=surfaceAt(level,p.x,p.surfaceId,p.simTime),direction=Number(!!input.right)-Number(!!input.left);
 p.padCooldown=Math.max(0,p.padCooldown-dt);
 p.springCooldown=Math.max(0,p.springCooldown-dt);
 if(input.jump&&!p.lastJump)p.buffer=.13;else p.buffer=Math.max(0,p.buffer-dt);
 p.coyote=p.grounded?.1:Math.max(0,p.coyote-dt);
 p.slope=p.grounded&&surface?surface.slope:0;
 const downhill=p.slope*Math.sign(p.vx)>.10&&Math.abs(p.vx)>110;
 const braking=direction&&Math.sign(p.vx)!==direction;
 p.rolling=p.grounded&&!braking&&((input.slide&&Math.abs(p.vx)>45)||downhill||(p.rolling&&Math.abs(p.vx)>220));
 p.sliding=p.rolling||(p.grounded&&!!input.slide);
 // Recover traction on a steep ascent even if the player keeps crouch held.
 // Otherwise rolling acceleration loses to gravity and can trap a novice in a valley.
 if(p.grounded&&direction&&p.slope*direction<-.1&&Math.abs(p.vx)<SPEED*.65){p.rolling=false;p.sliding=false;}
 const oldSlope=p.slope;
 if(p.grounded){
  p.vx+=GRAVITY*p.slope/(1+p.slope*p.slope)*(p.sliding?1.14:.72)*dt;
  if(direction){
   if(Math.sign(p.vx)!==direction)p.vx=approach(p.vx,direction*SPEED,(p.sliding?600:2100)*dt);
   else if(Math.abs(p.vx)<SPEED)p.vx=approach(p.vx,direction*SPEED,(p.sliding?340:1650)*dt);
   else if(!p.sliding)p.vx=approach(p.vx,direction*SPEED,65*dt);
  }else p.vx=approach(p.vx,0,(p.sliding?45:950)*dt);
  if(p.buffer>0&&p.coyote>0){p.vy=Math.max(-760,-JUMP_SPEED+Math.min(0,p.vx*p.slope*.5));p.grounded=false;p.surfaceId=null;p.coyote=0;p.buffer=0;p.sliding=false;p.rolling=false;}
 }else{
  if(direction&&Math.abs(p.vx)<SPEED)p.vx=approach(p.vx,direction*SPEED,650*dt);
  else if(direction&&Math.sign(p.vx)!==direction)p.vx=approach(p.vx,direction*SPEED,900*dt);
  if(p.buffer>0&&p.coyote>0){p.vy=-JUMP_SPEED;p.coyote=0;p.buffer=0;}
 }
 if(!input.jump&&p.lastJump&&p.vy<0)p.vy*=.52;
 p.lastJump=!!input.jump;
 p.vx=Math.max(-MAX_SPEED,Math.min(MAX_SPEED,p.vx));
 p.x=Math.max(14,Math.min(WORLD_WIDTH-14,p.x+p.vx*dt));
 if(p.x===14&&p.vx<0)p.vx=0;
 if(p.grounded){
  const next=surfaceAt(level,p.x,p.surfaceId,p.simTime);
  if(next){
   if(oldSlope<-.22&&next.slope>oldSlope+.2&&p.vx>480){p.grounded=false;p.surfaceId=null;p.vy=Math.max(-570,p.vx*oldSlope*.85);}
   else{p.feet=heightOn(next,p.x);p.slope=next.slope;p.surfaceId=next.id;p.vy=0;}
  }else{p.grounded=false;p.surfaceId=null;p.vy=p.vx*oldSlope;}
 }
 if(!p.grounded){
  p.vy=Math.min(1100,p.vy+GRAVITY*dt);p.feet+=p.vy*dt;p.airTime+=dt;
  // Swept foot sensor; one-way ledges only catch a crossing from above.
  let landing=null,landingY=Infinity;
  for(const s of [...level.terrain,...level.platforms,...moving]){
   if(p.x<s.x||p.x>s.x+s.w)continue;
   const y=heightOn(s,p.x),oldY=heightOn(s,Math.max(s.x,Math.min(s.x+s.w,previousX)));
   if(previousFeet<=oldY+2&&p.feet>=y&&p.vy-p.vx*s.slope>=0&&y<landingY){landing=s;landingY=y;}
  }
  if(landing){p.feet=landingY;p.vy=0;p.grounded=true;p.surfaceId=landing.id;p.slope=landing.slope;p.airTime=0;}
 }
 for(const crate of level.platforms.filter(s=>s.kind==='crate'||s.kind==='beam')){
  if(p.feet<=crate.y+2||p.feet-(p.sliding?22:34)>=crate.y+crate.h)continue;
  if(previousX+11<=crate.x&&p.x+11>crate.x){p.x=crate.x-11;p.vx=0;}
  else if(previousX-11>=crate.x+crate.w&&p.x-11<crate.x+crate.w){p.x=crate.x+crate.w+11;p.vx=0;}
 }
 if(p.grounded&&p.padCooldown===0){const pad=level.pads.find(q=>q.surface===p.surfaceId&&Math.abs(p.x-q.x)<45);if(pad){p.vx=Math.max(p.vx,pad.speed);p.padCooldown=.6;}}
 if(p.grounded&&p.surfaceId?.startsWith('ground')&&p.springCooldown===0){const spring=(level.springs||[]).find(s=>Math.abs(p.x-s.x)<20);if(spring){p.vy=-spring.power;p.grounded=false;p.sliding=false;p.rolling=false;p.surfaceId=null;p.springCooldown=1;p.coyote=0;}}
 if(p.grounded&&p.loopCooldown===0&&p.vx>0){const l=(level.loops||[]).find(l=>previousX<=l.x&&p.x>=l.x&&p.vx>=l.minSpeed);if(l){p.loop={...l,angle:0,entry:p.vx};p.grounded=false;p.surfaceId=null;p.sliding=true;}}
 p.angle=p.grounded?Math.atan(p.slope):0;p.maxSpeed=Math.max(p.maxSpeed,Math.abs(p.vx));
 return{jumped:wasGrounded&&!p.grounded&&p.vy< -300,landed:!wasGrounded&&p.grounded};
}
