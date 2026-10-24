import {createAmbientLife,updateAmbientLife} from './ambient-life.js';
import {character} from './character.js';
import {GOAL_X,ZONES} from './level.js';
export function preloadAnimation(scene){
 for(const[key,file,w,h]of[['water-flow','water',128,224],['volcanic-fire','fire',96,128],['mascot-extras','cat',64,64]]){
  scene.load.spritesheet(key,key==='mascot-extras'?character.extras:`/assets/animation/${file}-sheet.png`,{frameWidth:w,frameHeight:h});
 }
}

export function animationFrame(time,fps=10,count=8,phase=0){return(Math.floor(time*fps/1000)+phase)%count;}

export function createLivingWorld(scene){
 const native=document.createElement('canvas');native.width=64;native.height=64;
 const ctx=native.getContext('2d'),gradient=ctx.createRadialGradient(32,32,0,32,32,32);
 gradient.addColorStop(0,'rgba(255,215,128,.8)');gradient.addColorStop(.3,'rgba(255,172,70,.25)');gradient.addColorStop(1,'rgba(255,172,70,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);scene.textures.addCanvas('warm-glow',native);
 const live=scene.liveWorld={props:[],sprites:[],glows:[],graphics:scene.add.graphics().setDepth(3)};
 for(const item of [...scene.placedScenery,...(scene.extraProps||[])]){
  if(!item.sprite)continue;
  const phase=(item.x*.013)%6.28;
  if(['palm','tamarind','frangipani','plants','canopy','boat','neonarrow','surfboards'].includes(item.key)){
   live.props.push({sprite:item.sprite,key:item.key,x:item.sprite.x,y:item.sprite.y,angle:item.sprite.angle,phase});
  }
  if(item.key==='waterfall'){
   const sprite=scene.add.sprite(item.x,item.y-4,'water-flow',0).setOrigin(.5,1).setDepth(2).setDisplaySize(item.width*.36,item.height*.78).setAlpha(.85);
   live.sprites.push({sprite,key:'water',x:item.x,y:item.y,height:item.height,phase:Math.floor(item.x)%8});
  }
  if(item.key==='lavarocks'){
   const y=item.y-Math.min(item.height*.38,32);
   const sprite=scene.add.sprite(item.x,y,'volcanic-fire',0).setOrigin(.5,1).setDepth(2).setScale(.65*item.scale);
   live.sprites.push({sprite,key:'fire',x:item.x,y,phase:Math.floor(item.x)%8});
  }
  if(['lantern','neonarrow','hut','kiosk','gameshop'].includes(item.key)){
   const glow=scene.add.image(item.x,item.y-item.height*.65,'warm-glow').setDepth(2).setScale(item.key==='neonarrow'?.9:.8);
   live.glows.push({sprite:glow,phase,key:item.key});
  }
 }
 // Ambient smoke at the distant crater belongs to the background, not the ground.
 live.crater=scene.add.sprite(684,205,'volcanic-fire',0).setScrollFactor(0).setOrigin(.5,1).setScale(.42).setDepth(-26).setAlpha(.6);
 live.barGlow=scene.add.image(GOAL_X,335,'warm-glow').setScale(3.2,2.2).setDepth(2).setAlpha(.15);
 // Spinning pickups use eight precisely aligned, code-native frames.
 const source=scene.textures.get('token').getSourceImage();
 for(let frame=0;frame<8;frame++){
  const t=scene.textures.createCanvas(`token-spin-${frame}`,18,22),c=t.context;
  const width=Math.max(3,Math.round(16*Math.abs(Math.cos(frame*Math.PI/8))));
  c.imageSmoothingEnabled=false;c.drawImage(source,0,0,18,22,Math.floor((18-width)/2),0,width,22);t.refresh();
 }
 scene.coins.forEach(coin=>coin.baseY=coin.y);createAmbientLife(scene);
}

export function updateLivingWorld(scene,reducedMotion){
 const live=scene.liveWorld;if(!live)return;updateAmbientLife(scene,reducedMotion);
 const time=scene.visualClock||0,seconds=time/1000,camera=scene.cameras.main;
 const inView=x=>x>camera.scrollX-250&&x<camera.scrollX+scene.scale.width+250;
 for(const item of live.props){
  if(!inView(item.x))continue;
  const wave=reducedMotion?0:Math.sin(seconds*1.35+item.phase);
  if(item.key==='boat'){item.sprite.y=item.y+wave*2;item.sprite.angle=item.angle+wave*.6;}
  else if(item.key==='neonarrow')item.sprite.setAlpha(reducedMotion?1:.8+.2*Math.sin(seconds*3+item.phase)**2);
  else item.sprite.angle=item.angle+wave*(item.key==='palm'?1.15:item.key==='canopy'?.35:.75);
 }
 live.graphics.clear();
 for(const effect of live.sprites){
  const visible=inView(effect.x);effect.sprite.setVisible(visible);if(!visible)continue;
  effect.sprite.setFrame(reducedMotion?0:animationFrame(time,effect.key==='water'?12:10,8,effect.phase));
  if(reducedMotion)continue;
  if(effect.key==='fire'){
   for(let i=0;i<4;i++){
    const age=(seconds*.7+i*.27+effect.phase*.13)%1;
    live.graphics.fillStyle(i%2?0xffb96a:0xff7b4c,(1-age)*.65);
    live.graphics.fillRect(effect.x+Math.sin(age*5+i)*14,effect.y-age*90,2,2);
   }
  }else{
   for(let i=0;i<4;i++){
    const fall=(seconds*1.8+i*.23)%1;
    live.graphics.fillStyle(0xd5f5ee,.5);
    live.graphics.fillRect(effect.x-5+i*3,effect.y-effect.height*.78+fall*effect.height*.65,2,7);
   }
  }
 }
 live.crater.x=684-scene.background.tilePositionX;
 live.crater.setVisible(scene.runner.x<ZONES[1].x+250).setAlpha(.6*(1-scene.backgrounds[1].alpha)).setFrame(reducedMotion?0:animationFrame(time,8));
 for(const glow of live.glows)glow.sprite.setAlpha(reducedMotion?.15:.14+.06*Math.sin(seconds*2.2+glow.phase));
 live.barGlow.setAlpha(reducedMotion?.15:.16+.05*Math.sin(seconds*2.3));
 scene.coins.forEach((coin,i)=>{
  if(!coin.active||!inView(coin.x))return;
  coin.setTexture(`token-spin-${reducedMotion?0:animationFrame(time,9,8,i%8)}`);
  coin.y=coin.baseY+(reducedMotion?0:Math.sin(seconds*3+i*.7)*2);
 });
}
