import {GOAL_X,GROUND_Y,groundAt,heightOn} from './level.js';

// Pixel-art facade with separate blue door leaves for the arrival sequence.
export function createBar(scene){
 const support=groundAt(scene.level,GOAL_X),y=support?heightOn(support,GOAL_X):GROUND_Y;
 const x=GOAL_X+70,g=scene.add.graphics().setDepth(2);
 const rect=(color,a,b,w,h)=>{g.fillStyle(color);g.fillRect(x+a,y+b,w,h);};
 const facade=scene.add.image(x,y+25,'toiles-noires-facade').setOrigin(.5,1).setScale(.36).setDepth(1);
 const logo=scene.add.image(x-144,y-205,'barLogo').setDisplaySize(27,29).setDepth(2);
 const sign=scene.add.text(x+17,y-205,'LES TOILES NOIRES',{fontFamily:'monospace',fontSize:'20px',fontStyle:'bold',color:'#f9e8c6'}).setOrigin(.5).setDepth(2);
 // The blue transom and panelled leaves evoke a TARDIS and open independently.
 rect(0x132e4c,-67,-193,134,24);rect(0x41698a,-67,-193,134,3);
 rect(0x080f19,-61,-188,122,15);
 scene.add.text(x,y-181,'LES TOILES NOIRES',{fontFamily:'monospace',fontSize:'9px',color:'#e0e8e7'}).setOrigin(.5).setDepth(3);
 const doors=[];
 for(const side of [-1,1]){
  const hinge=x+side*59,door=scene.add.container(hinge,y).setDepth(3),panel=scene.add.graphics();
  const left=side===-1?0:-59;
  const r=(color,dx,dy,w,h)=>{panel.fillStyle(color);panel.fillRect(left+dx,dy,w,h);};
  r(0x204a73,0,-169,59,169);r(0x3c6c96,3,-167,3,165);r(0x102c4a,54,-169,5,169);
  r(0x0e2946,8,-158,43,55);
  for(let row=0;row<2;row++)for(let col=0;col<3;col++)r((row+col)%2?0xabb8b4:0x829699,11+col*13,-155+row*26,10,23);
  for(const [top,h]of [[-96,40],[-49,40]]){r(0x122f4c,8,top,43,h);r(0x2f5c83,11,top+4,36,h-7);r(0x426f92,11,top+h-4,36,2);}
  if(side===-1){r(0xe2dfcb,13,-89,23,28);r(0x5a6469,16,-84,17,2);r(0x5a6469,16,-79,17,2);r(0x5a6469,16,-66,17,2);}
  r(0xc3c9c7,side===-1?48:7,-72,3,18);
  door.add(panel);doors.push(door);
 }
 const glow=scene.add.graphics().setDepth(5).setAlpha(0);
 glow.fillStyle(0xffcc80,.14);glow.fillTriangle(x-57,y-5,x-100,y+10,x+100,y+10);
 const welcome=scene.add.text(x,y-339,'Bienvenue à Les Toiles Noires',{fontFamily:'monospace',fontSize:'20px',fontStyle:'bold',color:'#fff0ce',backgroundColor:'#101319',padding:{x:16,y:12},align:'center'}).setOrigin(.5).setDepth(20).setAlpha(0);
 scene.bar={x,y,facade,logo,sign,doors,glow,welcome};
 createBarActivity(scene);
}

function createBarActivity(scene){
 const {x,y}=scene.bar;
 // Sway and sprite sizes stay within the windows; blue leaves hide the doorway.
 const screens=scene.add.graphics().setDepth(2.1);
 const patrons=[[-190,-40,0,1.2],[-146,-40,1,1.05],[155,-40,2,1.1],[193,-40,0,1.25],[16,-37,1,.95]].map(([dx,dy,person,scale],i)=>{
  const sprite=scene.add.image(x+dx,y+dy,`guest-${person}-0`).setOrigin(.5,1).setScale(scale).setFlipX(i%2===1).setTint(0xa8a5a0).setDepth(2.2);
  return{sprite,dx,dy,person,i};
 });
 const light=scene.add.graphics().setDepth(2.3);
 scene.bar.activity={screens,patrons,light,frame:0};
 updateBarActivity(scene,true);
}

export function updateBarActivity(scene,reduced=false){
 const bar=scene.bar,activity=bar?.activity;if(!activity)return;
 const time=reduced?0:(scene.visualClock||0)/1000;
 const {x,y}=bar;
 activity.frame=Math.floor(time*4)%8;
 for(const guest of activity.patrons){
  const phase=time*.7+guest.i*1.8;
  const sway=reduced?0:Math.sin(phase)*3;
  const frame=reduced?0:(Math.floor(time*2+guest.i)%7===6?3:Math.floor(time*2+guest.i)%3);
  guest.sprite.setTexture(`guest-${guest.person}-${frame}`).setPosition(x+guest.dx+sway,y+guest.dy+(reduced?0:Math.round(Math.sin(phase*1.5))));
 }
 const g=activity.screens;g.clear();
 // Tiny games cycle on the screens; the counter keeps its calm amber light.
 for(const [i,dx,dy,w,h]of [[0,-196,-71,16,12],[1,-169,-59,18,12],[2,186,-64,24,15]]){
  g.fillStyle(i===1?0x34305c:0x14354d,.92);g.fillRect(x+dx,y+dy,w,h);
  g.fillStyle(0x80c2cb,.8);
  const frame=(activity.frame+i*2)%8;
  g.fillRect(x+dx+2+frame,y+dy+3,3,3);
  g.fillStyle(0xd89d65,.9);g.fillRect(x+dx+w-7,y+dy+h-4,5,2);
  g.fillStyle(0x5f99ad,.5);g.fillRect(x+dx+2,y+dy+h-2,w-4,1);
 }
 const light=activity.light;light.clear();
 for(const dx of [-170,170]){
  light.fillStyle(0xffba69,reduced ? .055 : .055+Math.sin(time*.8+dx)*.012);
  light.fillRect(x+dx-43,y-149,86,109);
 }
}

export function resetBarArrival(scene){
 scene.arrival=null;
 scene.bar.doors.forEach(door=>door.setScale(1,1));
 scene.bar.glow.setAlpha(0);scene.bar.welcome.setAlpha(0);
 scene.mascot.setAlpha(1).setVisible(true).setDepth(10);
 scene.cameras.main.startFollow(scene.player,false,scene.reducedMotion?1:.25,scene.reducedMotion?1:.3,-60,45);
}

export function beginBarArrival(scene){
 const {bar,runner:p}=scene;
 scene.mode='arriving';scene.arrival={time:0,startX:Math.min(p.x,bar.x-45),startY:p.feet};
 p.vx=0;p.vy=0;p.sliding=false;p.loop=null;p.angle=0;p.slope=0;
 scene.dust.clear();scene.speedFeedback.dust.clear();
 scene.cameras.main.stopFollow();
 if(scene.reducedMotion){
  p.x=bar.x;p.feet=bar.y;scene.syncPlayer(1);scene.mascot.setAlpha(0);
  bar.doors.forEach(door=>door.setScale(.12,1));bar.welcome.setAlpha(1);
 }
}

export function updateBarArrival(scene,delta){
 const a=scene.arrival,{bar,runner:p}=scene;
 a.time+=Math.min(delta,100);
 if(scene.reducedMotion)return a.time>=700;
 const clamp=v=>Math.max(0,Math.min(1,v));
 const open=clamp((a.time-180)/650),walk=clamp((a.time-500)/1150),enter=clamp((a.time-1550)/550);
 bar.doors.forEach(door=>door.setScale(1-open*.88,1));bar.glow.setAlpha(open);
 p.x=a.startX+(bar.x-a.startX)*walk;p.feet=a.startY+(bar.y-a.startY)*walk;
 p.vx=walk>0&&walk<1?70:0;p.grounded=true;
 scene.syncPlayer(1);
 scene.mascot.setScale(1-enter*.3).setAlpha(1-enter);
 // A gentle camera settle keeps the sign, doorway and people in the same shot.
 const camera=scene.cameras.main,blend=1-Math.exp(-Math.min(delta,100)/240);
 camera.centerOn(camera.midPoint.x+(bar.x-camera.midPoint.x)*blend,camera.midPoint.y+(bar.y-145-camera.midPoint.y)*blend);
 bar.welcome.setAlpha(clamp((a.time-1750)/350));
 return a.time>=3000;
}
