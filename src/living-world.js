import {createAmbientLife,updateAmbientLife} from './ambient-life.js';
import {character} from './character.js';
import {GOAL_X} from './level.js';
import {createRavineArt,updateRavineArt} from './ravine-art.js';
import {createBackdropLife,updateBackdropLife} from './backdrop-life.js';

export function preloadAnimation(scene){
 scene.load.spritesheet('ravine-lava','/assets/ravines/lava-sheet.png',{frameWidth:128,frameHeight:32});
 for(const[key,file,w,h]of[['water-flow','water',128,224],['volcanic-fire','fire',96,128],['mascot-extras','cat',64,64]]){
  scene.load.spritesheet(key,key==='mascot-extras'?character.extras:`/assets/animation/${file}-sheet.png`,{frameWidth:w,frameHeight:h});
 }
 scene.load.spritesheet('snowflakes','/assets/snow/snowflakes.png',{frameWidth:12,frameHeight:12});
 scene.load.spritesheet('snowman','/assets/snow/snowman.png',{frameWidth:48,frameHeight:56});
 scene.load.spritesheet('snow-pine','/assets/snow/snow-pine.png',{frameWidth:64,frameHeight:96});
 scene.load.spritesheet('snow-spray','/assets/snow/snow-spray.png',{frameWidth:40,frameHeight:24});
 scene.load.spritesheet('snow-chunk','/assets/snow/snow-chunk.png',{frameWidth:24,frameHeight:24});
}

export function animationFrame(time,fps=10,count=8,phase=0){return(Math.floor(time*fps/1000)+phase)%count;}

export function createLivingWorld(scene){
 createRavineArt(scene);
 createBackdropLife(scene);
 const native=document.createElement('canvas');native.width=64;native.height=64;
 const ctx=native.getContext('2d'),gradient=ctx.createRadialGradient(32,32,0,32,32,32);
 gradient.addColorStop(0,'rgba(255,215,128,.8)');gradient.addColorStop(.3,'rgba(255,172,70,.25)');gradient.addColorStop(1,'rgba(255,172,70,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);scene.textures.addCanvas('warm-glow',native);
 const live=scene.liveWorld={props:[],sprites:[],glows:[],embers:[],graphics:scene.add.graphics().setDepth(0)};
 for(const item of [...scene.placedScenery,...(scene.extraProps||[])]){
  if(!item.sprite)continue;
  const phase=(item.x*.013)%6.28;
  if(['palm','tamarind','frangipani','plants','canopy','boat','neonarrow','surfboards','snowman','snow-pine'].includes(item.key)){
   live.props.push({sprite:item.sprite,key:item.key,x:item.sprite.x,y:item.sprite.y,angle:item.sprite.angle,phase});
  }
  if(item.key==='waterfall'){
   const sprite=scene.add.sprite(item.x,item.y-4,'water-flow',0).setOrigin(.5,1).setDepth(0).setDisplaySize(item.width*.36,item.height*.78).setAlpha(.75);
   live.sprites.push({sprite,key:'water',x:item.x,y:item.y,height:item.height,phase:Math.floor(item.x)%8});
  }
  if(item.key==='lavarocks'){
   const y=item.y-Math.min(item.height*.38,28);
   const glow=scene.add.image(item.x,y,'warm-glow').setDepth(-1).setScale(.7*item.scale);
   live.glows.push({sprite:glow,phase,key:'lavarocks'});
   live.embers.push({x:item.x,y,phase:Math.floor(item.x)%8});
  }
  if(['lantern','neonarrow','hut','kiosk','gameshop'].includes(item.key)){
   const glow=scene.add.image(item.x,item.y-item.height*.65,'warm-glow').setDepth(0).setScale(item.key==='neonarrow'?.9:.8);
   live.glows.push({sprite:glow,phase,key:item.key});
  }
 }
 live.crater=scene.add.sprite(684,205,'volcanic-fire',0).setScrollFactor(0).setOrigin(.5,1).setScale(.42).setDepth(-26).setAlpha(.55);
 live.sprites.push({sprite:live.crater,key:'fire',x:8480,y:205,phase:0,crater:true});
 live.barGlow=scene.add.image(GOAL_X,335,'warm-glow').setScale(3.2,2.2).setDepth(0).setAlpha(.15);

 if(scene.textures.exists('snowflakes')){
  const flakes=[];
  for(let i=0;i<65;i++){
   const type=i%4,frame=type*4;
   const sp=scene.add.sprite(0,0,'snowflakes',frame).setScrollFactor(0).setDepth(14).setAlpha(.7+(i%3)*.1);
   flakes.push({sprite:sp,x:(i*37)%1100,y:(i*23)%600,vx:-(40+(i%5)*25),vy:75+(i%7)*20,wobble:(i*13)%6.28,type,frame});
  }
  live.snowflakes=flakes;
 }
 scene.coins.forEach(coin=>coin.baseY=coin.y);createAmbientLife(scene);
}

export function updateLivingWorld(scene,reducedMotion){
 updateBackdropLife(scene,reducedMotion);
 updateRavineArt(scene,reducedMotion);
 const live=scene.liveWorld;if(!live)return;updateAmbientLife(scene,reducedMotion);
 const time=scene.visualClock||0,seconds=time/1000,camera=scene.cameras.main;
 const inView=x=>x>camera.scrollX-250&&x<camera.scrollX+scene.scale.width+250;
 for(const item of live.props){
  if(!inView(item.x))continue;
  const wave=reducedMotion?0:Math.sin(seconds*1.35+item.phase);
  if(item.key==='boat'){item.sprite.y=item.y+wave*2;item.sprite.angle=item.angle+wave*.6;}
  else if(item.key==='neonarrow')item.sprite.setAlpha(reducedMotion?1:.8+.2*Math.sin(seconds*3+item.phase)**2);
  else if(item.key==='snowman'){item.sprite.setFrame(Math.floor(seconds*3+item.phase)%4);item.sprite.y=item.y+wave*1.5;}
  else if(item.key==='snow-pine'){item.sprite.setFrame(Math.floor(seconds*2+item.phase)%4);item.sprite.angle=item.angle+wave*.5;}
  else item.sprite.angle=item.angle+wave*(item.key==='palm'?1.15:item.key==='canopy'?.35:.75);
 }
 live.graphics.clear();
 for(const ember of live.embers||[]){
  if(reducedMotion||!inView(ember.x))continue;
  const age=(seconds*.9+ember.phase*.2)%1,alpha=(1-age)*.42,x=ember.x+Math.sin(seconds*2+ember.phase)*8;
  const y=ember.y-age*28;live.graphics.fillStyle(0xff8d4d,alpha);live.graphics.fillRect(x,y,2,2);
 }
 for(const glow of live.glows||[]){
  if(!inView(glow.sprite.x))continue;
  const pulse=reducedMotion?1:.85+.15*Math.sin(seconds*2.2+glow.phase);
  glow.sprite.setAlpha(glow.key==='lavarocks'?.35*pulse:.22*pulse);
 }
 const volcanoAlpha=scene.backgrounds[1].alpha*(1-scene.backgrounds[2].alpha);
 live.crater.setPosition(((692-scene.backgrounds[1].tilePositionX)%1920+1920)%1920,193).setAlpha(.55*volcanoAlpha);
 for(const item of live.sprites||[]){
  if(!item.crater&&!inView(item.x))continue;
  item.sprite.setFrame(animationFrame(time,8,8,item.phase));
 }
 const snowAlpha=scene.backgrounds[0].alpha*(1-scene.backgrounds[1].alpha);
 if(live.snowflakes){
  const visible=!reducedMotion&&snowAlpha>0;
  for(const f of live.snowflakes){
   f.sprite.setVisible(visible);
   if(!visible)continue;
   const width=scene.scale.width+60,height=scene.scale.height+40;
   const x=((f.x+seconds*f.vx+Math.sin(seconds*2+f.wobble)*8)%width+width)%width-30;
   const y=((f.y+seconds*f.vy)%height+height)%height-20;
   f.sprite.setPosition(x,y);
   f.sprite.setAlpha(snowAlpha*(.7+(f.type%3)*.1));
   f.sprite.setFrame(f.frame+Math.floor(time*.005+f.wobble)%4);
  }
 }
}
