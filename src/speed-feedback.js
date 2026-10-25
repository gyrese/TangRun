const clamp=v=>Math.max(0,Math.min(1,v));
export function speedProfile(velocity,reduced=false){
 const intensity=reduced?0:clamp((Math.abs(velocity)-360)/490);
 return{intensity,zoom:1-intensity*.065,lookAhead:(velocity< -30?-1:1)*(140+intensity*115)};
}
export function createSpeedFeedback(scene){
 scene.speedFeedback={intensity:0,streakCount:0,trail:[],lastEmission:-Infinity,
  wind:scene.add.graphics().setScrollFactor(0).setDepth(15),dust:scene.add.graphics().setDepth(9)};
}
export function resetSpeedFeedback(scene){
 const f=scene.speedFeedback;if(!f)return;
 f.intensity=0;f.streakCount=0;f.trail=[];f.lastEmission=-Infinity;f.wind.clear();f.dust.clear();
 scene.cameras.main.setZoom(1);
}
export function fitSpeedBackdrop(scene){
 const width=scene.scale.width,height=scene.scale.height,zoom=scene.cameras.main.zoom;
 const left=(width-width/zoom)/2,top=(height-height/zoom)/2;
 for(const background of scene.backgrounds)background.setPosition(left,top).setSize(width/zoom,height/zoom);
 scene.speedFeedback?.wind.setPosition(left,top).setScale(1/zoom);
}
export function updateSpeedFeedback(scene,delta,reduced=false){
 const f=scene.speedFeedback,p=scene.runner,camera=scene.cameras.main;
 const velocity=p.loop?p.loop.entry:p.vx,profile=speedProfile(velocity,reduced);
 const blend=1-Math.exp(-Math.min(delta,100)/220);
 f.intensity+= (profile.intensity-f.intensity)*blend;
 if(reduced)f.intensity=0;
 camera.setZoom(reduced?1:camera.zoom+(profile.zoom-camera.zoom)*blend);
 camera.setFollowOffset(-profile.lookAhead,110);
 // Compensate fixed scenery for the expanded camera view, including phone ratios.
 const width=scene.scale.width,height=scene.scale.height;
 fitSpeedBackdrop(scene);f.wind.clear();f.dust.clear();
 f.streakCount=0;
 if(reduced){f.trail=[];return;}
 // Lines stay in the upper sky and bottom margin, away from the landing corridor.
 const time=scene.visualClock/1000,direction=velocity<0?-1:1;
 const count=Math.floor(f.intensity*15);
 for(let i=0;i<count;i++){
  const phase=((i*.173+time*(.42+f.intensity*.7))%1),x=direction>0?width*(1-phase):width*phase;
  const y=i%3===0?height-22-(i%4)*9:82+(i*37)%100;
  const length=12+f.intensity*(22+i%4*12);
  f.wind.lineStyle(i%4===0?2:1,0xe0e7ce,.08+f.intensity*.12);
  f.wind.lineBetween(x,y,x-direction*length,y);f.streakCount++;
 }
 if(p.grounded&&Math.abs(p.vx)>300&&scene.visualClock-f.lastEmission>24){
  f.trail.push({x:p.x-direction*10,y:p.feet-3,time:scene.visualClock,velocity:p.vx,zone:scene.zone});
  f.lastEmission=scene.visualClock;
 }
 f.trail=f.trail.filter(t=>scene.visualClock-t.time<300).slice(-16);
 for(const t of f.trail){
  const age=(scene.visualClock-t.time)/300,alpha=(1-age)*(.2+f.intensity*.23);
  const x=t.x-Math.sign(t.velocity)*age*20,y=t.y-age*12;
  f.dust.fillStyle([0xe8aa78,0xb8d496,0xd1c796][t.zone]||0xd1c796,alpha);
  f.dust.fillRect(x-4,y,5+(1-age)*f.intensity*11,2);
  f.dust.fillRect(x+Math.sign(t.velocity)*7,y+3,3,2);
 }
}
