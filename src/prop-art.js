import {ZONES,groundAt,heightOn} from './level.js';

// Runtime loads only the baked low-resolution atlas, not the large source art.
export function preloadPropArt(scene){
 scene.load.atlas('polish-pixel-atlas','/assets/pixel-props-v2/atlas.png','/assets/pixel-props-v2/atlas.json');
}
export function preparePropArt(scene){
 const atlas=scene.textures.get('polish-pixel-atlas'),source=atlas.getSourceImage();
 for(const key of atlas.getFrameNames()){
  const frame=atlas.get(key),t=scene.textures.createCanvas(key,frame.cutWidth,frame.cutHeight),c=t.context;
  c.imageSmoothingEnabled=false;c.drawImage(source,frame.cutX,frame.cutY,frame.cutWidth,frame.cutHeight,0,0,frame.cutWidth,frame.cutHeight);t.refresh();
 }
}

export function drawLowGate(scene,p){
 const floor=groundAt(scene.level,p.x+p.w/2),feet=floor?heightOn(floor,p.x+p.w/2):p.y+p.h,clearance=Math.max(1,feet-p.y-p.h);
 const cap=scene.add.image(p.x,p.y,'polish-gate-cap-0').setOrigin(0).setDisplaySize(p.w,p.h).setDepth(5);
 scene.gateArt??=[];scene.gateArt.push(cap);
 scene.add.image(p.x,p.y+p.h,'polish-gate-feet').setOrigin(0).setDisplaySize(p.w,clearance+1).setDepth(5);
}

export function drawSpring(scene,spring,y){
 const sprite=scene.add.image(spring.x,y+2,'polish-spring-0').setOrigin(.5,1).setDepth(6);
 scene.springArt??=[];scene.springArt.push({sprite,x:spring.x,y:y+2,triggeredAt:-Infinity,active:false});
}

export function drawCheckpoint(scene,x,y){
 const sprite=scene.add.image(x,y+2,'polish-checkpoint-0').setOrigin(14/64,1).setDepth(6);
 scene.checkpointArt??=[];scene.checkpointArt.push({sprite,x,y:y+2});
}

export function drawBoost(scene,pad,surface){
 const angle=Math.atan(surface.slope||0),y=heightOn(surface,pad.x);
 const sprite=scene.add.image(pad.x-2*Math.sin(angle),y+2*Math.cos(angle),'polish-boost-0').setOrigin(.5,1).setRotation(angle).setDepth(6);
 scene.boostArt??=[];scene.boostArt.push(sprite);
}

export function drawRouteSign(scene,x,y){
 const sprite=scene.add.image(x,y+2,'polish-sign-0').setOrigin(.5,1).setDepth(6);
 scene.signArt??=[];scene.signArt.push(sprite);return sprite;
}

export function drawStageFlag(scene,x,y){
 const scale=96/104,sprite=scene.add.image(x,y+2*scale,'polish-finish-0').setOrigin(14/64,1).setScale(scale).setDepth(6);
 scene.finishArt??=[];scene.finishArt.push(sprite);return{x,y,sprite};
}

export function drawRockRail(scene,p){
 if(p.style==='canal')return drawCanalRail(scene,p);
 const volcanic=p.x>=ZONES[1].x&&p.x<ZONES[2].x;
 const source=scene.textures.get(volcanic?'volcano-ledge':'island-ledge').getSourceImage();
 // Preserve the illustrated boulders and their transparent, overhanging edge.
 // Warp one narrow strip at a time along the physical slope, at a fixed scale.
 const scale=.72,contact=27,top=Math.floor(Math.min(p.y,p.y2))-2;
 const width=Math.ceil(p.w)+1,height=Math.ceil(Math.abs(p.y2-p.y))+(source.height-contact)*scale+5;
 const key=`natural-rail-${p.id}`,t=scene.textures.createCanvas(key,width,Math.ceil(height)),c=t.context;
 c.imageSmoothingEnabled=false;
 const period=(source.width-12)*scale;
 for(let x=0;x<width;x++){
  const sx=6+(((p.x+x)%period+period)%period)/scale;
  const y=p.y+x*p.slope-top;
  // The upper rock face meets the collision line; the entire underside retains
  // the original irregular silhouette rather than being cut into a thin slab.
  c.drawImage(source,sx,contact,1/scale,source.height-contact,x,y,1,(source.height-contact)*scale);
 }
 // Small, broken highlights describe the lip without outlining a straight box.
 for(let x=Math.ceil(p.x/19)*19-p.x;x<width;x+=19){
  const y=p.y+x*p.slope-top;
  c.fillStyle=volcanic?'#ab8a72':p.x<ZONES[1].x?'#bad3ec':'#a1aa87';
  c.fillRect(x,y,3+(Math.floor((p.x+x)/19)%4),1);
 }
 t.refresh();scene.add.image(p.x,top,key).setOrigin(0).setDepth(3);
}

// Orangers canal: wet, mossy basalt carrying a narrow ribbon of water.
function drawCanalRail(scene,p){
 const source=scene.textures.get('island-ledge').getSourceImage();
 const scale=.48,contact=27,rockHeight=(source.height-contact)*scale;
 const top=Math.floor(Math.min(p.y,p.y2))-2,width=Math.ceil(p.w)+1,height=Math.ceil(Math.abs(p.y2-p.y))+rockHeight+12;
 const key=`canal-rail-${p.id}`,t=scene.textures.createCanvas(key,width,height),c=t.context;
 c.imageSmoothingEnabled=false;
 const period=(source.width-12)*scale;
 for(let x=0;x<width;x++){
  const gx=Math.floor(p.x+x),y=Math.round(p.y+x*p.slope-top);
  const sx=6+((gx%period+period)%period)/scale;
  c.drawImage(source,sx,contact,1/scale,source.height-contact,x,y+9,1,rockHeight);
  // A damp shadow joins the water to the rock, without a straight coping line.
  c.fillStyle='#192f32';c.fillRect(x,y+7,1,3+(Math.sin(gx*.13)>0?1:0));
  for(let row=0;row<8;row++){
   const flow=Math.sin(gx*.047+row*.8)+Math.sin(gx*.119-row*.6)*.45;
   c.fillStyle=row<2?(flow>.6?'#72b7ac':'#468c8b'):row<5?(flow>.4?'#397e80':'#28646e'):(flow>.5?'#3c7d7b':'#234c59');
   c.fillRect(x,y+row,1,1);
  }
  // Short reflections follow the current; no repeated vertical grid marks.
  if(Math.sin(gx*.071)+Math.sin(gx*.173)>1.55){
   c.fillStyle='#a0d4c5';c.fillRect(x,y+2+Math.floor((1+Math.sin(gx*.021))*1.5),1,1);
  }
  if(Math.sin(gx*.093)+Math.sin(gx*.037)>1.45){
   c.fillStyle='#698253';c.fillRect(x,y+9,1,2+Math.floor(2+2*Math.sin(gx*.19)));
  }
 }
 t.refresh();scene.add.image(p.x,top,key).setOrigin(0).setDepth(3);
}

export function basaltTile(scene,volcanic=false){
 const cache=volcanic?'volcanicBasaltRailTile':'basaltRailTile';
 if(scene[cache])return scene[cache];
 const tile=document.createElement('canvas');tile.width=340;tile.height=700;
 const c=tile.getContext('2d'),source=scene.textures.get(volcanic?'volcano-pinnacle':'island-pinnacle').getSourceImage();
 c.imageSmoothingEnabled=false;c.fillStyle=volcanic?'#252d36':'#303b3b';c.fillRect(0,0,340,700);
 for(let row=0;row<2;row++)for(let col=0;col<2;col++){c.save();c.translate(col?340:0,row?700:0);c.scale(col?-1:1,row?-1:1);c.drawImage(source,65,105,170,350,0,0,170,350);c.restore();}
 // Fine mineral flecks remain readable in narrow strips and on tall supports.
 for(let y=4;y<700;y+=11)for(let x=3;x<340;x+=13){
  const n=(x*37+y*19)%97;
  c.fillStyle=n<48?'rgba(8,15,22,.32)':'rgba(158,169,178,.25)';
  c.fillRect(x+n%7,y+n%5,n%3+1,1+(n%2));
 }
 scene[cache]=tile;return tile;
}
