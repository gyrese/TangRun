import {GOAL_X,groundAt,heightOn} from './level.js';

// Ambient motion uses the same paused visual clock as the character animations.
export function createAmbientLife(scene){
 const life=scene.ambientLife={sky:scene.add.graphics().setScrollFactor(0).setDepth(-24),air:scene.add.graphics().setDepth(2),flags:scene.add.graphics().setDepth(3),birds:[],boats:[],guests:[]};
 // Eight wing positions, snapped to whole pixels rather than rotating a still image.
 for(let frame=0;frame<8;frame++){
  const texture=scene.textures.createCanvas(`bird-${frame}`,24,16),c=texture.context,wing=[-5,-3,0,3,5,3,0,-3][frame];
  c.strokeStyle='#e2dcc7';c.lineWidth=2;c.beginPath();c.moveTo(2,8+wing);c.lineTo(7,7+Math.round(wing/2));c.lineTo(12,9);c.lineTo(17,7+Math.round(wing/2));c.lineTo(22,8+wing);c.stroke();c.fillStyle='#dfdccb';c.fillRect(10,8,5,2);texture.refresh();
 }
 for(let i=0;i<9;i++)life.birds.push(scene.add.image(i*147,100+i%3*34,'bird-0').setScrollFactor(0).setDepth(-22).setScale(i%3===0?.7:1));
 for(let i=0;i<3;i++)life.boats.push(scene.add.image(180+i*370,455+i*16,'boat').setOrigin(.5,1).setScale(.28+i*.035).setScrollFactor(0).setDepth(-23));
 // Small original pixel characters animate at the terrace; no duplicate player mascot.
 const palettes=[['#a6bcb4','#b77450'],['#dcc592','#597b76'],['#bc947c','#a2916c']];
 for(let person=0;person<3;person++)for(let frame=0;frame<4;frame++){
  const texture=scene.textures.createCanvas(`guest-${person}-${frame}`,20,36),c=texture.context,[skin,shirt]=palettes[person];
  c.fillStyle='#23343a';c.fillRect(5,3,10,8);c.fillStyle=skin;c.fillRect(7,6,8,8);c.fillStyle='#2c2728';c.fillRect(13,8,2,2);c.fillStyle=shirt;c.fillRect(5,15,11,12);
  c.fillStyle=skin;c.fillRect(3,17,3,9);c.fillRect(16,frame===3?9:17,3,frame===3?10:9);c.fillStyle='#253b43';c.fillRect(6,26,4,8);c.fillRect(12,26,4,frame%2?6:8);c.fillStyle='#a8aaa0';c.fillRect(5,33,6,2);c.fillRect(12,frame%2?31:33,6,2);texture.refresh();
 }
 for(const [i,x]of [GOAL_X-210,GOAL_X+178,GOAL_X+265].entries()){
  const floor=groundAt(scene.level,x),y=heightOn(floor,x),sprite=scene.add.image(x,y,`guest-${i}-0`).setOrigin(.5,1).setScale(1.15).setDepth(3);
  life.guests.push({sprite,x,y,i});
 }
 life.foliage=scene.placedScenery.filter(p=>['palm','plants','frangipani','tamarind'].includes(p.key));
 life.vents=scene.placedScenery.filter(p=>p.key==='lavarocks');
 life.poles=scene.level.checkpoints.slice(1).map(p=>({...p,y:heightOn(groundAt(scene.level,p.x),p.x)}));
}
export function updateAmbientLife(scene,reduced){
 const life=scene.ambientLife;if(!life)return;
 const time=reduced?0:scene.visualClock/1000,camera=scene.cameras.main,w=scene.scale.width;
 const coast=scene.backgrounds[2].alpha,forest=scene.backgrounds[1].alpha*(1-coast),volcano=1-scene.backgrounds[1].alpha;
 const visible=x=>x>camera.scrollX-180&&x<camera.scrollX+w+180;
 life.sky.clear();life.air.clear();life.flags.clear();
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
  const x=((i*149+time*(14+i%3*5)-camera.scrollX*.025)%(w+140)+w+140)%(w+140)-70;
  bird.setPosition(x,105+i%3*37+Math.sin(time*.7+i)*12).setTexture(`bird-${reduced?0:(Math.floor(time*9)+i)%8}`).setAlpha((forest*.6+coast*.85)*(i<6?1:.65));
 });
 life.boats.forEach((boat,i)=>boat.setPosition(((180+i*370+time*(i%2?3:-2)-camera.scrollX*.04)%(w+200)+w+200)%(w+200)-100,455+i*16+Math.sin(time*1.3+i)*2).setAngle(reduced?0:Math.sin(time*.7+i)*1.3).setAlpha(coast*.85));
 // Leaves follow short arcs from the actual plants, never across the entire screen.
 for(const plant of life.foliage){if(!visible(plant.x))continue;for(let i=0;i<2;i++){
  const age=(time*.19+i*.5+plant.x*.003)%1,x=plant.x+age*65+Math.sin(age*12+i)*8,y=plant.y-plant.height*.65+age*plant.height*.75;
  life.air.fillStyle(plant.x<16800?0x96b67c:0xe5bc76,(1-age)*.6);life.air.fillRect(x,y,3,2);
 }}
 // Low plumes and rising cinders add depth to the volcanic flats.
 for(const vent of life.vents){if(!visible(vent.x))continue;for(let i=0;i<5;i++){
  const age=(time*.2+i*.2+vent.x*.001)%1,x=vent.x+Math.sin(age*5+i)*15+age*24,y=vent.y-20-age*115;
  life.air.fillStyle(0x9f9a91,(1-age)*.1*volcano);life.air.fillEllipse(x,y,12+age*26,6+age*12);
 }}
 for(const pole of life.poles){if(!visible(pole.x))continue;const flutter=Math.sin(time*5+pole.x)*3;
  life.flags.fillStyle(0x92ac7d);life.flags.fillTriangle(pole.x+3,pole.y-70,pole.x+34,pole.y-59+flutter,pole.x+3,pole.y-47);life.flags.lineStyle(1,0xc2c8a0,.6);life.flags.lineBetween(pole.x+3,pole.y-70,pole.x+34,pole.y-59+flutter);
 }
 // Warm light strings at the bar, while the guests talk and occasionally wave.
 if(visible(GOAL_X)){
  for(let i=0;i<12;i++){life.air.fillStyle(i%2?0xffcc88:0xe8c38f,.55+Math.sin(time*2+i)*.15);life.air.fillRect(GOAL_X-285+i*48,GROUND_BAR_Y+Math.sin(i*.55)*5,3,4);}
 }
 for(const guest of life.guests){const frame=reduced?0:Math.floor(time*2+guest.i)%8;guest.sprite.setTexture(`guest-${guest.i}-${frame===7?3:frame%3}`).setPosition(guest.x+(reduced?0:Math.sin(time*.45+guest.i)*5),guest.y);}
}
const GROUND_BAR_Y=240;
