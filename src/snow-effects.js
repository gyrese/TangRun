import {groundAt,heightOn} from './level.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const onSnow=(scene,p)=>p.x<8400&&p.x>=0&&p.surfaceId?.startsWith('ground')&&!!groundAt(scene.level,p.x);
export function createSnowEffects(scene){
 scene.snowFX={particles:[],tracks:[],lastContact:null,lastStep:null,lastPowder:-Infinity,sequence:0,landings:0,
  marks:scene.add.graphics().setDepth(6),powder:scene.add.graphics().setDepth(9),
  splashes:Array.from({length:12},()=>({sprite:scene.add.sprite(0,0,'snow-spray',0).setOrigin(.5,1).setDepth(9).setVisible(false),born:-Infinity}))};
}
export function resetSnowEffects(scene){
 const f=scene.snowFX;if(!f)return;
 f.particles=[];f.tracks=[];f.lastContact=null;f.lastStep=null;f.lastPowder=-Infinity;f.landings=0;
 f.marks.clear();f.powder.clear();for(const b of f.splashes){b.born=-Infinity;b.sprite.setVisible(false);}
}
function random(f){return((++f.sequence*16807)%2147483647)%1000/1000;}
function spray(scene,p,count,power=1,bothSides=false){
 const f=scene.snowFX,a=Math.atan(p.slope||0),tx=Math.cos(a),ty=Math.sin(a),nx=ty,ny=-tx,dir=p.vx<0?-1:1;
 for(let i=0;i<count;i++){
  const r=random(f),side=bothSides?(i%2?-1:1):-dir;
  const along=side*(20+r*75+Math.abs(p.vx)*.10)*power,lift=(30+random(f)*95)*power;
  f.particles.push({x:p.x-dir*tx*8+nx*3,y:p.feet-dir*ty*8+ny*3,
   vx:tx*along+nx*lift,vy:ty*along+ny*lift,time:scene.visualClock,
   life:400+random(f)*380,size:i%5===0?3:2});
 }
 f.particles=f.particles.slice(-192);
}
function splash(scene,p,power=1){
 const f=scene.snowFX,b=f.splashes.find(b=>scene.visualClock-b.born>420)||f.splashes.reduce((a,b)=>a.born<b.born?a:b);
 b.born=scene.visualClock;b.power=power;
 b.sprite.setPosition(p.x,p.feet+1).setRotation(Math.atan(p.slope||0)).setScale(.85+power*.55).setFlipX(p.vx<0).setFrame(0).setAlpha(.8).setVisible(true);
}
export function landInSnow(scene,p,impactSpeed){
 const floor=groundAt(scene.level,p.x);
 if(!scene.snowFX||scene.reducedMotion||p.x>=8400||!floor||Math.abs(heightOn(floor,p.x)-p.feet)>5)return;
 const power=clamp(impactSpeed/650,.35,1.4);
 spray(scene,p,Math.round(14+power*16),power,true);splash(scene,p,power);scene.snowFX.landings++;
}
export function updateSnowEffects(scene,reduced=false){
 const f=scene.snowFX;if(!f)return;
 const p=scene.renderRunner??scene.runner,now=scene.visualClock;
 if(reduced||p.x>=8400){resetSnowEffects(scene);return;}
 f.marks.clear();f.powder.clear();
 const contact=p.grounded&&onSnow(scene,p),speed=Math.abs(p.vx);
 if(contact){
  if(p.sliding&&speed>130&&now-f.lastPowder>85){
   splash(scene,p,.35+speed/1500);f.lastPowder=now;
  }
  const last=f.lastContact,distance=last?Math.hypot(p.x-last.x,p.feet-last.y):Infinity;
  if(distance>=10){
   // Midpoint support excludes jump gaps and respawn teleports from the trail.
   if(last&&distance<65&&p.sliding){
    const middle=groundAt(scene.level,(last.x+p.x)/2);
    if(middle&&Math.abs(heightOn(middle,(last.x+p.x)/2)-(last.y+p.feet)/2)<3)
     f.tracks.push({x:last.x,y:last.y+2,x2:p.x,y2:p.feet+2,time:now,slide:true});
   }
   if(speed>90){spray(scene,p,p.sliding?3:1,p.sliding?1:.55);}
   f.lastContact={x:p.x,y:p.feet};
  }
  if(speed>35&&(!f.lastStep||Math.abs(p.x-f.lastStep)>38)){
   if(!p.sliding){
    const slope=p.slope||0,step=7;
    f.tracks.push({x:p.x-step/2,y:p.feet-step*slope/2+2,x2:p.x+step/2,y2:p.feet+step*slope/2+2,time:now,slide:false});
   }
   f.lastStep=p.x;
  }
 }else{f.lastContact=null;f.lastStep=null;}
 f.tracks=f.tracks.filter(t=>now-t.time<2300).slice(-180);
 for(const t of f.tracks){
  const fade=1-(now-t.time)/2300;
  f.marks.lineStyle(t.slide?3:2,0x7398ba,fade*.55);f.marks.lineBetween(t.x,t.y,t.x2,t.y2);
  if(t.slide){f.marks.lineStyle(1,0xf4fbff,fade*.6);f.marks.lineBetween(t.x,t.y-3,t.x2,t.y2-3);}
 }
 f.particles=f.particles.filter(q=>now-q.time<q.life);
 for(const q of f.particles){
  const age=(now-q.time)/1000,x=q.x+q.vx*age,y=q.y+q.vy*age+160*age*age;
  const floor=groundAt(scene.level,x);if(floor&&y>heightOn(floor,x)+2)continue;
  const fade=1-(now-q.time)/q.life;
  f.powder.fillStyle(q.size===3?0xcce6fa:0xf1faff,fade*.85);f.powder.fillRect(Math.round(x),Math.round(y),q.size,q.size===3?2:1);
 }
 for(const b of f.splashes){
  const age=now-b.born,visible=age>=0&&age<420;
  b.sprite.setVisible(visible);
  if(visible)b.sprite.setFrame(Math.min(5,Math.floor(age/70))).setAlpha((1-age/420)*.8);
 }
}
