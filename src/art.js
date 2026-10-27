import {GROUND_Y,GOAL_X,WORLD_WIDTH,ZONES,groundAt,heightOn,movingSurfaces} from './level.js';
import {V3_KEYS,drawScenery} from './scenery.js';
import {preloadAnimation} from './living-world.js';
import {character} from './character.js';
import {advanceMascotCycle} from './mascot-animation.js';
import {preloadPropArt,drawLowGate,drawRockRail} from './prop-art.js';
export function preloadArt(scene){
 preloadPropArt(scene);
 preloadAnimation(scene);
 for(const key of ['ledge','bridge','loop','pinnacle'])scene.load.image(`island-${key}`,`/assets/v5/${key}.webp`);
 for(const [key,file]of Object.entries({coast:'v3/coast-wide.webp',qg:'qg-v1.webp',palm:'palm-v1.webp',arcade:'arcade-v1.webp',crate:'crate-v1.webp',planter:'planter-v1.webp',ground:'ground-v1.webp',barLogo:'logo-les-toiles-noires.png'}))scene.load.image(key,`/assets/${file}`);
 scene.load.spritesheet('mascot',character.run,{frameWidth:64,frameHeight:64});
 if(character.runCycle)scene.load.spritesheet('mascot-run-cycle',character.runCycle,{frameWidth:64,frameHeight:64});
 for(const key of V3_KEYS)scene.load.image(key,`/assets/v3/${key}.webp`);
 scene.load.image('volcano','/assets/v3/volcano.webp');scene.load.image('mafate','/assets/v3/mafate-remparts.webp');scene.load.image('beam','/assets/v3/beam.webp');
}
export function drawBackdrop(scene){
 // Bring the coastal horizon above the running surface; the original framing
 // buried the entire ocean behind the foreground when following the valley floor.
 const coast=scene.textures.get('coast').getSourceImage(),framed=scene.textures.createCanvas('coast-framed',coast.width,540),c=framed.context;
 c.imageSmoothingEnabled=false;c.drawImage(coast,0,0,coast.width,378);
 c.drawImage(coast,0,510,coast.width,30,0,378,coast.width,162);framed.refresh();
 scene.backgrounds=['volcano','mafate','coast-framed'].map((key,i)=>scene.add.tileSprite(0,0,scene.scale.width,540,key).setOrigin(0).setScrollFactor(0).setDepth(-30+i).setAlpha(i===0?1:0));
 scene.background=scene.backgrounds[0];
 const motes=scene.add.graphics().setScrollFactor(.12).setDepth(-10);
 for(let i=0;i<80;i++){motes.fillStyle(i%3?0xb9d49a:0xffbe77,.25);motes.fillRect((i*379+140)%3000,60+(i*53)%285,i%4?1:2,1);}
}
export function drawPlatformArt(scene,p){
 if(p.kind==='beam'){
  drawLowGate(scene,p);return;
 }
 if(p.kind==='crate'){scene.add.image(p.x+p.w/2,p.y+p.h/2,'crate').setScale(Math.min(p.w/63,p.h/64)).setDepth(5);return;}
 if(p.kind==='ground'){
  // Clip a tiled basalt face to the actual collision profile, including the slope.
  const minY=Math.floor(Math.min(p.y,p.y2)),bottom=1700,h=bottom-minY,key=`terrain-art-${p.id}`;
  const leftEdge=scene.level.gaps.some(([,b])=>Math.abs(b-p.x)<1),rightEdge=scene.level.gaps.some(([a])=>Math.abs(a-p.x-p.w)<1);
  const pad=18,t=scene.textures.createCanvas(key,Math.ceil(p.w)+1+pad*2,h),c=t.context; c.translate(pad,0);
  const basalt=document.createElement('canvas');basalt.width=340;basalt.height=700;
  const rock=basalt.getContext('2d'),material=scene.textures.get('island-pinnacle').getSourceImage();
  // Mirrored material meets at identical edge pixels, so there is no tile grid.
  for(let row=0;row<2;row++)for(let col=0;col<2;col++){rock.save();rock.translate(col?340:0,row?700:0);rock.scale(col?-1:1,row?-1:1);rock.drawImage(material,65,105,170,350,0,0,170,350);rock.restore();}
  c.imageSmoothingEnabled=false;c.beginPath();c.moveTo(0,p.y-minY);c.lineTo(p.w,p.y2-minY);
  if(rightEdge){c.quadraticCurveTo(p.w+14,p.y2-minY+3,p.w+14,p.y2-minY+24);for(let y=40;y<h;y+=12)c.lineTo(p.w+10+4*Math.sin(y*.08)+2*Math.sin(y*.21),y);}
  c.lineTo(p.w+(rightEdge?12:0),h);c.lineTo(leftEdge?-12:0,h);
  if(leftEdge){for(let y=h-12;y>24;y-=12)c.lineTo(-10-4*Math.sin(y*.08)-2*Math.sin(y*.21),y);c.quadraticCurveTo(-14,p.y-minY+3,0,p.y-minY);}
  c.closePath();c.save();c.clip();
  c.fillStyle='#202b2e';c.fillRect(-pad,0,p.w+1+pad*2,h);const pattern=c.createPattern(basalt,'repeat');pattern.setTransform(new DOMMatrix().translate(-p.x%340,-minY%700));c.fillStyle=pattern;c.globalAlpha=.32;c.fillRect(-pad,0,p.w+1+pad*2,h);c.globalAlpha=1;
  c.fillStyle=p.x<ZONES[1].x?'#2b161b':p.x<ZONES[2].x?'#183b2e':'#14282b';c.globalAlpha=.24;c.fillRect(-pad,0,p.w+1+pad*2,h);c.globalAlpha=1;
  c.strokeStyle=p.x<ZONES[1].x?'#804c42':p.x<ZONES[2].x?'#58764d':'#6b7357';c.lineWidth=9;c.beginPath();c.moveTo(0,p.y-minY+4);c.lineTo(p.w,p.y2-minY+4);c.stroke();
  c.strokeStyle=p.x<ZONES[1].x?'#99775c':p.x<ZONES[2].x?'#829064':'#a18d69';c.lineWidth=2;c.beginPath();c.moveTo(0,p.y-minY+1);c.lineTo(p.w,p.y2-minY+1);c.stroke();c.restore();t.refresh();
  scene.add.image(p.x-pad,minY,key).setOrigin(0).setDepth(4);return;
 }
 // Natural buttes and timber bridges replace suspended shop fronts and thin pillars.
 const bridge=p.style==='ropebridge'||p.style==='comics'||p.style==='gameshop';
 const route=scene.level.platforms.filter(q=>q.kind==='roof'&&q.route===p.route);
 const first=route[0]?.id===p.id,last=route.at(-1)?.id===p.id;
 const fixedSupports=Array.isArray(p.editorSupports);
 if(fixedSupports)for(const side of p.editorSupports){const x=side==='left'?p.x+8:side==='right'?p.x+p.w-8:p.x+p.w/2;drawRockSupport(scene,x,(p.rail&&side==='right'?p.y2:p.y)+(p.rail?10:4));}
 if(p.rail){
  drawRockRail(scene,p);
  const index=route.indexOf(p),next=route[index+1],previous=route[index-1];
  // Piliers aux extrémités de chaque tronçon et à intervalles réguliers.
  if(!fixedSupports&&(!previous||previous.x+previous.w<p.x-1||index%4===0))drawRockSupport(scene,p.x+8,p.y+10);
  if(!fixedSupports&&(!next||next.x>p.x+p.w+1))drawRockSupport(scene,p.x+p.w-8,p.y2+10);
  return;
 }
 if(bridge){
  if(!fixedSupports&&first)drawRockSupport(scene,p.x+8,p.y+4);
  if(!fixedSupports&&last)drawRockSupport(scene,p.x+p.w-8,p.y+4);
  const scale=p.w/683;
  scene.add.image(p.x,p.y-128*scale,'island-bridge').setOrigin(0).setScale(scale).setDepth(2);
 }else{
  if(!fixedSupports&&(first||last||route.indexOf(p)%3===0))drawRockSupport(scene,p.x+p.w/2,p.y+4);
  const scale=p.w/779;
  scene.add.image(p.x,p.y-27*scale,'island-ledge').setOrigin(0).setScale(scale).setDepth(3);
 }
}
function drawRockSupport(scene,x,top){
 const ground=groundAt(scene.level,x);if(!ground)return;
 const height=heightOn(ground,x)-top+28;if(height<25)return;
 const scale=height/548;
 scene.add.image(x,top-20*scale,'island-pinnacle').setOrigin(.5,0).setScale(scale).setDepth(0);
}

export function drawStreet(scene){drawScenery(scene);}
export function updateMascot(scene){
 if(!scene.mascot)return;const p=scene.runner;
 scene.mascot.setFlipX(!p.loop&&p.vx< -5);
 const visualTime=scene.visualClock||0;
 scene.mascotCycle=advanceMascotCycle(scene.mascotCycle,p,visualTime);
 const cycleFrame=Math.floor(scene.mascotCycle.phase);
 if(p.sliding){scene.mascot.setTexture('mascot-extras',cycleFrame).setOrigin(.5,.5).setScale(1).setAngle(p.angle*180/Math.PI).setPosition(p.x+4+(p.loop?-Math.sin(p.loop.angle)*19:0),p.feet-(p.loop?Math.cos(p.loop.angle)*19:19));}
 else{
  const idle=p.grounded&&Math.abs(p.vx)<=20;
  const landing=p.grounded&&visualTime-(scene.landedAt??-1000)<120;
  const special=scene.mode==='finished'?7:landing?6:idle?(visualTime%3800>3620?5:4):null;
  if(special!==null)scene.mascot.setTexture('mascot-extras',special);
  else if(p.grounded&&character.runCycle)scene.mascot.setTexture('mascot-run-cycle',Math.floor(scene.mascotCycle.phase*character.runFrames/4));
  else scene.mascot.setTexture('mascot',!p.grounded?5:1+cycleFrame);
  scene.mascot.setOrigin(.5,1).setScale(1,idle?1+Math.sin(visualTime*.003)*.012:1).setAngle(p.angle*180/Math.PI*.45).setPosition(p.x+4,p.feet+2);
 }
}

export function drawCourseMechanisms(scene){
 scene.movingArt=new Map();
 for(const p of movingSurfaces(scene.level,0)){
  const g=scene.add.container(p.x+p.w/2,p.y).setDepth(5),scale=p.w/779;
  g.add(scene.add.image(-p.w/2,-27*scale,'island-ledge').setOrigin(0).setScale(scale));scene.movingArt.set(p.id,g);

 }
 for(const l of scene.level.loops){
  const cy=l.baseY-l.radius,scale=l.radius/187;
  // The hollow aperture is registered to the circular foot path, not the outer bounds.
  scene.add.image(l.x,cy,'island-loop').setOrigin(338/677,282/543).setScale(scale).setDepth(3);

 }
}
export function updateCourseMechanisms(scene){for(const p of movingSurfaces(scene.level,scene.runner.simTime))scene.movingArt.get(p.id)?.setPosition(p.x+p.w/2,p.y);}
