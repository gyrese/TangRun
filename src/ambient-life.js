import {GOAL_X,groundAt,heightOn} from './level.js';
import {updateBarActivity} from './bar-arrival.js';

// Three sparse background birds: distant silhouettes are smaller, fainter and slower.
const PAILLE_EN_QUEUE_PLAN=[
 {start:.18,y:146,scale:.34,alpha:.38,speed:5,parallax:.006,bob:3,phase:.7},
 {start:.52,y:104,scale:.5,alpha:.55,speed:8,parallax:.012,bob:5,phase:2.6},
 {start:.86,y:173,scale:.72,alpha:.72,speed:12,parallax:.02,bob:7,phase:4.3},
];

// Ambient motion uses the same paused visual clock as the character animations.
export function createAmbientLife(scene){
 const life=scene.ambientLife={sky:scene.add.graphics().setScrollFactor(0).setDepth(-24),air:scene.add.graphics().setDepth(2),birds:[],boats:[],guests:[]};
 // Paille-en-queue: anchor the body so the long white tail trails behind the flight path.
 for(const bird of PAILLE_EN_QUEUE_PLAN)life.birds.push(scene.add.image(scene.scale.width*bird.start,bird.y,'bird-0').setOrigin(34/48,24/36).setScrollFactor(0).setDepth(-22).setScale(bird.scale));
 for(let i=0;i<3;i++)life.boats.push(scene.add.image(180+i*370,455+i*16,'boat').setOrigin(.5,1).setScale(.28+i*.035).setScrollFactor(0).setDepth(-23));
 for(const [i,x]of [GOAL_X-210,GOAL_X+178,GOAL_X+265].entries()){
  const floor=groundAt(scene.level,x),y=floor?heightOn(floor,x):450,sprite=scene.add.image(x,y,`guest-${i}-0`).setOrigin(.5,1).setScale(1.15).setDepth(3);
  life.guests.push({sprite,x,y,i});
 }
 life.foliage=scene.placedScenery.filter(p=>['palm','plants','frangipani','tamarind'].includes(p.key));
 life.vents=scene.placedScenery.filter(p=>p.key==='lavarocks');
 life.poles=scene.level.checkpoints.slice(1).map(p=>{const floor=groundAt(scene.level,p.x);return{...p,y:floor?heightOn(floor,p.x):p.y};});
}
export function updateAmbientLife(scene,reduced){
 updateBarActivity(scene,reduced);
 const life=scene.ambientLife;if(!life)return;
 const time=reduced?0:scene.visualClock/1000,camera=scene.cameras.main,w=scene.scale.width;
 const coast=scene.backgrounds[3].alpha,forest=scene.backgrounds[2].alpha*(1-coast),volcano=scene.backgrounds[1].alpha*(1-scene.backgrounds[2].alpha);
 const visible=x=>x>camera.scrollX-180&&x<camera.scrollX+w+180;
 life.sky.clear();life.air.clear();
 // Slow surf lines on the water, beneath all terrain and foreground props.
 for(let row=0;row<7;row++)for(let i=0;i<8;i++){
  const x=((i*167+row*49+time*(5+row*2))%(w+180))-90,y=416+row*17+Math.sin(time*.8+i)*2;
  life.sky.fillStyle(0xb9d7cb,coast*(.1+row*.012));life.sky.fillRect(x,y,22+(i%3)*18,1);
 }
 // Wind-driven mist through Mafate, with no large opaque overlay.
 for(let i=0;i<6;i++){
  const x=((i*230+time*8)%(w+260))-160,y=285+i%3*40;
  life.sky.fillStyle(0xcfdfd2,forest*.055);life.sky.fillEllipse(x,y,210,20);
 }
 life.birds.forEach((bird,i)=>{
  const plan=PAILLE_EN_QUEUE_PLAN[i],span=w+140,offset=reduced?0:camera.scrollX*plan.parallax;
  const x=((plan.start*span+time*plan.speed-offset)%span+span)%span-70;
  bird.setPosition(x,plan.y+Math.sin(time*.45+plan.phase)*plan.bob).setTexture(`bird-${reduced?0:(Math.floor(time*9)+i*2)%8}`).setAlpha((forest*.6+coast*.85)*plan.alpha);
 });
 life.boats.forEach((boat,i)=>boat.setPosition(((180+i*370+time*(i%2?3:-2)-camera.scrollX*.04)%(w+200)+w+200)%(w+200)-100,455+i*16+Math.sin(time*1.3+i)*2).setAngle(reduced?0:Math.sin(time*.7+i)*1.3).setAlpha(coast*.85));
 // Leaves follow short arcs from the actual plants, never across the entire screen.
 for(const plant of life.foliage){if(!visible(plant.x))continue;for(let i=0;i<2;i++){
  const age=(time*.19+i*.5+plant.x*.003)%1,x=plant.x+age*65+Math.sin(age*12+i)*8,y=plant.y-plant.height*.65+age*plant.height*.75;
  life.air.fillStyle(plant.x<16800?0x96b67c:0xe5bc76,(1-age)*.6);life.air.fillRect(x,y,3,2);
 }}
 // Low plumes and rising cinders add depth to the volcanic flats, or light snow mist on Piton des Neiges.
 for(const vent of life.vents){if(!visible(vent.x))continue;for(let i=0;i<5;i++){
  const age=(time*.2+i*.2+vent.x*.001)%1,x=vent.x+Math.sin(age*5+i)*15+age*24,y=vent.y-20-age*115;
  life.air.fillStyle(0x9f9a91,(1-age)*.1*volcano);life.air.fillEllipse(x,y,12+age*26,6+age*12);
 }}
 if(volcano>0.05&&!reduced){
  for(let i=0;i<8;i++){
   const px=((i*180+time*35)%(w+240))-120+camera.scrollX*.05,py=180+(i*43)%260;
   life.air.fillStyle(0xdbe8f7,volcano*.18);
   life.air.fillEllipse(px,py+Math.sin(time*1.5+i)*12,38,8);
  }
 }
 for(const flag of scene.checkpointArt||[])flag.sprite.setVisible(visible(flag.x)).setTexture(`polish-checkpoint-${reduced?0:Math.floor(time*7+flag.x*.01)%4}`);
 for(const cap of scene.gateArt||[])cap.setTexture(`polish-gate-cap-${reduced?0:Math.floor(time*4)%4}`);
 for(const boost of scene.boostArt||[])boost.setTexture(`polish-boost-${reduced?0:Math.floor(time*8)%4}`);
 for(const sign of scene.signArt||[])sign.setTexture(`polish-sign-${reduced?0:Math.floor(time*5)%4}`);
 for(const flag of scene.finishArt||[])flag.setTexture(`polish-finish-${reduced?0:Math.floor(time*7)%4}`);
 for(const spring of scene.springArt||[]){
  const active=Math.abs(scene.runner.x-spring.x)<28&&scene.runner.springCooldown>.72;
  if(active&&!spring.active)spring.triggeredAt=scene.visualClock;
  spring.active=active;
  const age=(scene.visualClock-spring.triggeredAt)/1000,frame=reduced?0:age<.07?1:age<.16?2:age<.28?3:0;
  spring.sprite.setTexture(`polish-spring-${frame}`);
 }
 // Warm light strings at the bar, while the guests talk and occasionally wave.
 if(visible(GOAL_X)){
  for(let i=0;i<12;i++){life.air.fillStyle(i%2?0xffcc88:0xe8c38f,.55+Math.sin(time*2+i)*.15);life.air.fillRect(GOAL_X-285+i*48,GROUND_BAR_Y+Math.sin(i*.55)*5,3,4);}
 }
 for(const guest of life.guests){const frame=reduced?0:Math.floor(time*2+guest.i)%8;guest.sprite.setTexture(`guest-${guest.i}-${frame===7?3:frame%3}`).setPosition(guest.x+(reduced?0:Math.sin(time*.45+guest.i)*5),guest.y);}
}
const GROUND_BAR_Y=240;
