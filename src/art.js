import {GROUND_Y,GOAL_X,WORLD_WIDTH,ZONES,groundAt,heightOn,movingSurfaces} from './level.js';
import {V3_KEYS,drawScenery} from './scenery.js';
import {preloadAnimation} from './living-world.js';
import {character} from './character.js';
import {contactPose,frameBounds} from './runner-pose.js';
import {advanceMascotCycle} from './mascot-animation.js';
import {preloadPropArt,drawLowGate,drawRockRail,basaltTile} from './prop-art.js';
import {prepareLoopArt,loopArtPose} from './loop-art.js';

export function preloadArt(scene){
 preloadPropArt(scene);
 preloadAnimation(scene);
 for(const key of ['ledge','bridge','loop','pinnacle'])scene.load.image(`island-${key}`,`/assets/v5/${key}.webp`);
 for(const key of ['ledge','loop','pinnacle'])scene.load.image(`volcano-${key}`,`/assets/v5/${key}-volcano.webp`);
 for(const [key,file]of Object.entries({coast:'v3/coast-wide.webp',qg:'qg-v1.webp',palm:'palm-v1.webp',arcade:'arcade-v1.webp',crate:'crate-v1.webp',planter:'planter-v1.webp',ground:'ground-v1.webp',barLogo:'logo-les-toiles-noires.png'}))scene.load.image(key,`/assets/${file}`);
 scene.load.spritesheet('mascot',character.run,{frameWidth:64,frameHeight:64});
 if(character.runCycle)scene.load.spritesheet('mascot-run-cycle',character.runCycle,{frameWidth:64,frameHeight:64});
 for(const key of V3_KEYS)if(!key.startsWith('snow')&&!scene.textures.exists(key))scene.load.image(key,`/assets/v3/${key}.webp`);
 scene.load.image('etiquette','/assets/v3/etiquette.png');
 scene.load.image('choka-bleu','/assets/v3/choka-bleu.png');
 scene.load.image('le-qg','/assets/v3/le-qg.png');
 scene.load.image('snow-bg','/assets/snow/piton-lagons-v2.png');
 scene.load.image('volcano','/assets/v3/volcano.webp');
 scene.load.image('mafate','/assets/v3/mafate-remparts.webp');
 scene.load.image('beam','/assets/v3/beam.webp');
}

export function drawBackdrop(scene){
 const coast=scene.textures.get('coast').getSourceImage(),framed=scene.textures.createCanvas('coast-framed',coast.width,540),c=framed.context;
 c.imageSmoothingEnabled=false;c.drawImage(coast,0,0,coast.width,378);
 c.drawImage(coast,0,510,coast.width,30,0,378,coast.width,162);framed.refresh();
 scene.backgrounds=['snow-bg','volcano','mafate','coast-framed'].map((key,i)=>scene.add.tileSprite(0,0,scene.scale.width,540,key).setOrigin(0).setScrollFactor(0).setDepth(-30+i).setAlpha(i===0?1:0));
 scene.background=scene.backgrounds[0];
 const motes=scene.add.graphics().setScrollFactor(.12).setDepth(-10);
 for(let i=0;i<80;i++){motes.fillStyle(i%3?0xe88b5a:0xffbe77,.25);motes.fillRect((i*379+140)%3000,60+(i*53)%285,i%4?1:2,1);}
}

export function drawPlatformArt(scene,p){
 if(p.kind==='beam'){
  drawLowGate(scene,p);return;
 }
 if(p.kind==='crate'){
  scene.crateArt??=new Map();
  const img=scene.add.image(p.x+p.w/2,p.y+p.h/2,'crate').setDisplaySize(p.w,p.h).setDepth(5);
  scene.crateArt.set(p.id,img);return;
 }
 if(p.kind==='ground'){
  const minY=Math.floor(Math.min(p.y,p.y2)),bottom=1120,h=bottom-minY,key=`terrain-art-${p.id}`;
  const leftEdge=scene.level.gaps.some(([,b])=>Math.abs(b-p.x)<1),rightEdge=scene.level.gaps.some(([a])=>Math.abs(a-p.x-p.w)<1);
  const pad=18,t=scene.textures.createCanvas(key,Math.ceil(p.w)+1+pad*2,h),c=t.context; c.translate(pad,0);
  const isSnow=p.x<ZONES[1].x,isVolcano=p.x>=ZONES[1].x&&p.x<ZONES[2].x,isMafate=p.x>=ZONES[2].x&&p.x<ZONES[3].x;
  const basalt=basaltTile(scene,isVolcano);
  c.imageSmoothingEnabled=false;c.beginPath();c.moveTo(0,p.y-minY);c.lineTo(p.w,p.y2-minY);
  if(rightEdge){c.quadraticCurveTo(p.w+14,p.y2-minY+3,p.w+14,p.y2-minY+24);for(let y=40;y<h;y+=12)c.lineTo(p.w+10+4*Math.sin(y*.08)+2*Math.sin(y*.21),y);}
  c.lineTo(p.w+(rightEdge?12:0),h);c.lineTo(leftEdge?-12:0,h);
  if(leftEdge){for(let y=h-12;y>24;y-=12)c.lineTo(-10-4*Math.sin(y*.08)-2*Math.sin(y*.21),y);c.quadraticCurveTo(-14,p.y-minY+3,0,p.y-minY);}
  c.closePath();c.save();c.clip();
  c.fillStyle=isSnow?'#1e2d42':isVolcano?'#202b2e':isMafate?'#1e2e24':'#1e2c32';c.fillRect(-pad,0,p.w+1+pad*2,h);
  const pattern=c.createPattern(basalt,'repeat');pattern.setTransform(new DOMMatrix().translate(-p.x%340,-minY%700));c.fillStyle=pattern;c.globalAlpha=isSnow?.28:isVolcano?.32:.22;c.fillRect(-pad,0,p.w+1+pad*2,h);c.globalAlpha=1;
  c.fillStyle=isSnow?'#2a3d58':isVolcano?'#2b161b':isMafate?'#183b2e':'#14282b';c.globalAlpha=.24;c.fillRect(-pad,0,p.w+1+pad*2,h);c.globalAlpha=1;
  c.strokeStyle=isSnow?'#93b4d8':isVolcano?'#804c42':isMafate?'#58764d':'#6b7357';c.lineWidth=10;c.beginPath();c.moveTo(0,p.y-minY+5);c.lineTo(p.w,p.y2-minY+5);c.stroke();
  c.strokeStyle=isSnow?'#f0f6ff':isVolcano?'#99775c':isMafate?'#96ba6e':'#c2ab78';c.lineWidth=3;c.beginPath();c.moveTo(0,p.y-minY+1.5);c.lineTo(p.w,p.y2-minY+1.5);c.stroke();c.restore();t.refresh();
  scene.add.image(p.x-pad,minY,key).setOrigin(0).setDepth(4);return;
 }
 const bridge=p.style==='ropebridge'||p.style==='comics'||p.style==='gameshop';
 const route=scene.level.platforms.filter(q=>q.kind==='roof'&&q.route===p.route);
 const index=route.indexOf(p),first=index===0,last=index===route.length-1;
 const fixedSupports=Array.isArray(p.editorSupports);
 if(fixedSupports)for(const side of p.editorSupports){const x=side==='left'?p.x+8:side==='right'?p.x+p.w-8:p.x+p.w/2;drawRockSupport(scene,x,(p.rail&&side==='right'?p.y2:p.y)+(p.rail?10:4));}
 if(p.rail){
  drawRockRail(scene,p);
  const previous=route[index-1],next=route[index+1];
  if(!fixedSupports&&(!previous||previous.x+previous.w<p.x-1||index%6===0))drawRockSupport(scene,p.x+12,p.y+10);
  if(!fixedSupports&&(!next||next.x>p.x+p.w+1))drawRockSupport(scene,p.x+p.w-12,p.y2+10);
  return;
 }
 if(bridge){
  if(!fixedSupports&&first)drawRockSupport(scene,p.x+8,p.y+4);
  if(!fixedSupports&&last)drawRockSupport(scene,p.x+p.w-8,p.y+4);
  const scale=p.w/683;
  scene.add.image(p.x,p.y-128*scale,'island-bridge').setOrigin(0).setScale(scale).setDepth(2);
 }else{
  if(!fixedSupports&&(first||last||index%3===0))drawRockSupport(scene,p.x+p.w/2,p.y+4);
  const scale=p.w/779,tex=p.x>=ZONES[1].x&&p.x<ZONES[2].x&&scene.textures.exists('volcano-ledge')?'volcano-ledge':'island-ledge';
  scene.add.image(p.x,p.y-27*scale,tex).setOrigin(0).setScale(scale).setDepth(3);
 }
}

function drawRockSupport(scene,x,y){
 const floor=groundAt(scene.level,x);if(!floor)return;
 const bottom=heightOn(floor,x),h=Math.max(24,bottom-y);
 const key=`support-${Math.round(x)}-${Math.round(y)}`,t=scene.textures.createCanvas(key,44,h),c=t.context;
 const volcanic=x>=ZONES[1].x&&x<ZONES[2].x;
 const source=basaltTile(scene,volcanic);
 c.imageSmoothingEnabled=false;
 // Repeat at native scale: stretching a short crop washed out tall pillars.
 c.fillStyle='#202932';c.fillRect(2,0,40,h);
 for(let y0=0;y0<h;y0+=112)c.drawImage(source,80+(Math.floor(x/40)%3)*46,40,40,Math.min(112,h-y0),2,y0,40,Math.min(112,h-y0));
 const shade=c.createLinearGradient(2,0,42,0);shade.addColorStop(0,'rgba(173,185,198,.2)');shade.addColorStop(.35,'rgba(0,0,0,0)');shade.addColorStop(1,'rgba(3,9,16,.65)');c.fillStyle=shade;c.fillRect(2,0,40,h);
 for(let y0=18;y0<h;y0+=37){
  c.strokeStyle='#101922';c.lineWidth=2;c.beginPath();c.moveTo(3,y0);c.lineTo(17,y0+4);c.lineTo(27,y0+1);c.lineTo(41,y0+6);c.stroke();
  c.fillStyle='#687580';c.fillRect(7,y0-2,7,1);
  if(volcanic&&Math.floor(y0/37)%3===0){
   c.beginPath();c.moveTo(26,y0-12);c.lineTo(22,y0-3);c.lineTo(27,y0+3);c.lineTo(24,y0+14);
   c.strokeStyle='#762c23';c.lineWidth=5;c.stroke();c.strokeStyle='#e65b2d';c.lineWidth=2;c.stroke();c.fillStyle='#ffba54';c.fillRect(24,y0+2,2,2);
  }
 }
 t.refresh();scene.add.image(x-22,y,key).setOrigin(0).setDepth(1);
}

export function drawStreet(scene){drawScenery(scene,scene.level);}

export function updateMascot(scene){
 const p=scene.renderRunner??scene.runner;
 scene.mascotCycle=advanceMascotCycle(scene.mascotCycle,p,scene.visualClock,scene.runner);
 const cycleFrame=Math.floor(scene.mascotCycle.phase);
 if(p.loop){
  scene.mascot.setTexture('mascot-extras',cycleFrame);
  placeMascotOnSurface(scene,p);
  return;
 }
 const visualTime=scene.visualClock;
 const idle=p.grounded&&Math.abs(p.vx)<20;
 if(p.sliding){
  scene.mascot.setTexture('mascot-extras',cycleFrame);
 }else{
  const landing=p.grounded&&visualTime-(scene.landedAt??-1000)<120;
  const special=scene.mode==='finished'?7:landing?6:idle?(visualTime%3800>3620?5:4):null;
  if(special!==null)scene.mascot.setTexture('mascot-extras',special);
  else if(p.grounded&&character.runCycle)scene.mascot.setTexture('mascot-run-cycle',Math.floor(scene.mascotCycle.phase*character.runFrames/4));
  else scene.mascot.setTexture('mascot',!p.grounded?5:1+cycleFrame);

 }
 placeMascotOnSurface(scene,p);
}

function placeMascotOnSurface(scene,p){
 const sprite=scene.mascot,frame=sprite.frame,key=`${sprite.texture.key}:${frame.name}`;
 scene.mascotBounds??=new Map();
 if(!scene.mascotBounds.has(key)){
  const canvas=document.createElement('canvas');canvas.width=frame.cutWidth;canvas.height=frame.cutHeight;
  const c=canvas.getContext('2d',{willReadFrequently:true});
  c.drawImage(frame.source.image,frame.cutX,frame.cutY,frame.cutWidth,frame.cutHeight,0,0,canvas.width,canvas.height);
  scene.mascotBounds.set(key,frameBounds(c.getImageData(0,0,canvas.width,canvas.height).data,canvas.width,canvas.height));
 }
 const pose=contactPose(p,scene.mascotBounds.get(key),frame.cutHeight);
 sprite.setOrigin(.5,pose.originY).setScale(pose.scale).setRotation(pose.rotation).setPosition(pose.x,pose.y);
}

export function drawCourseMechanisms(scene){
 scene.movingArt=new Map();
 for(const p of movingSurfaces(scene.level,0)){
  const g=scene.add.container(p.x+p.w/2,p.y).setDepth(5);
  if(p.x>=ZONES[3].x&&scene.textures.exists('footbridge')){
   g.add(scene.add.image(-p.w/2,-16,'footbridge').setOrigin(0).setDisplaySize(p.w,52));
  }else if(p.x>=ZONES[2].x&&scene.textures.exists('ropebridge')){
   g.add(scene.add.image(-p.w/2,-24,'ropebridge').setOrigin(0).setDisplaySize(p.w,54));
  }else{
   const scale=p.w/779,tex=p.x>=ZONES[1].x&&p.x<ZONES[2].x&&scene.textures.exists('volcano-ledge')?'volcano-ledge':'island-ledge';
   g.add(scene.add.image(-p.w/2,-27*scale,tex).setOrigin(0).setScale(scale));
  }
  scene.movingArt.set(p.id,g);
 }
 for(const l of scene.level.loops){
  const tex=l.x>=ZONES[1].x&&l.x<ZONES[2].x&&scene.textures.exists('volcano-loop')?'volcano-loop':'island-loop';
  const pose=loopArtPose(l);
  scene.add.image(pose.x,pose.y,prepareLoopArt(scene,tex)).setOrigin(pose.originX,pose.originY).setScale(pose.scale).setDepth(2);
 }
}

export function updateCourseMechanisms(scene){
 const time=scene.renderRunner?.simTime??scene.runner?.simTime??scene.clock/1000;
 for(const p of movingSurfaces(scene.level,time)){
  const g=scene.movingArt.get(p.id);if(g)g.setPosition(p.x+p.w/2,p.y);
 }
}
