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
 const isSnow=p.x<ZONES[1].x,isVolcano=p.x>=ZONES[1].x&&p.x<ZONES[2].x;
 const top=Math.floor(Math.min(p.y,p.y2))-2,depth=40,key=`natural-rail-${p.id}`;
 const width=Math.ceil(p.w)+2,height=Math.ceil(Math.abs(p.y2-p.y))+depth+10;
 const t=scene.textures.createCanvas(key,width,height),c=t.context;
 const tile=basaltTile(scene,isVolcano);
 const route=scene.level.platforms.filter(q=>q.rail&&q.route===p.route),leftEnd=!route.some(q=>q.id!==p.id&&Math.abs(q.x+q.w-p.x)<2),rightEnd=!route.some(q=>q.id!==p.id&&Math.abs(q.x-p.x-p.w)<2);
 c.beginPath();c.moveTo(0,p.y-top);c.lineTo(width,p.y2+(width-p.w)*p.slope-top);
 for(let x=width;x>=0;x-=4)c.lineTo(Math.max(leftEnd?12:0,Math.min(width-(rightEnd?12:0),x)),p.y+x*p.slope-top+depth+3*Math.sin((p.x+x)*.11)+2*Math.sin((p.x+x)*.039));
 c.lineTo(0,p.y-top+depth+3*Math.sin(p.x*.11)+2*Math.sin(p.x*.039));c.closePath();c.save();c.clip();
 c.fillStyle=isSnow?'#1a283a':isVolcano?'#202a2e':'#202a2e';c.fillRect(0,0,width,height);
 const pattern=c.createPattern(tile,'repeat');pattern.setTransform(new DOMMatrix().translate(-p.x%340,-top%700));
 c.fillStyle=pattern;c.globalAlpha=.95;c.fillRect(0,0,width,height);c.globalAlpha=1;
 // Short facets and chipped seams follow the slope instead of stretching one
 // large rock across the whole ledge. World coordinates keep segment joins quiet.
 for(let x=Math.floor(p.x/29)*29-p.x;x<width;x+=29){
  const y=p.y+x*p.slope-top,seed=Math.abs(Math.floor((p.x+x)/29));
  c.fillStyle=seed%2?'rgba(5,10,17,.28)':'rgba(143,158,169,.13)';
  c.beginPath();c.moveTo(x+2,y+5);c.lineTo(x+24,y+5+22*p.slope);c.lineTo(x+20,y+29+22*p.slope);c.lineTo(x+5,y+35);c.closePath();c.fill();
  c.strokeStyle='#172129';c.lineWidth=2;c.beginPath();c.moveTo(x,y+5);c.lineTo(x+5,y+15);c.lineTo(x+2,y+24);c.lineTo(x+8,y+42);c.stroke();
  c.fillStyle=isSnow?'#a5c1da':isVolcano?'#74818b':'#889482';c.fillRect(x+8,y+7,4,2);c.fillRect(x+17,y+19,2,2);
  if(isVolcano&&seed%3===0){
   c.beginPath();c.moveTo(x+1,y+3);c.lineTo(x+6,y+10);c.lineTo(x+3,y+18);c.lineTo(x+10,y+26);
   c.strokeStyle='#722b20';c.lineWidth=5;c.stroke();c.strokeStyle='#ef5428';c.lineWidth=2;c.stroke();
   c.fillStyle='#ffbd5a';c.fillRect(x+4,y+9,2,3);
  }
 }
 const shade=c.createLinearGradient(0,0,0,height);shade.addColorStop(0,isSnow?'rgba(147,197,253,.2)':isVolcano?'rgba(76,86,99,.12)':'rgba(213,198,165,.12)');shade.addColorStop(1,'rgba(4,15,24,.35)');c.fillStyle=shade;c.fillRect(0,0,width,height);
 c.lineWidth=2;c.strokeStyle=isSnow?'#93c5fd':isVolcano?'#89929b':p.route==='mafate'?'#7f9171':'#8d938a';c.beginPath();c.moveTo(0,p.y-top+1);c.lineTo(width,p.y+width*p.slope-top+1);c.stroke();
 for(let x=Math.ceil(p.x/47)*47-p.x;x<width;x+=47){c.fillStyle=isSnow?'#527ea8':isVolcano?'#d76536':'#3c5142';c.fillRect(x,p.y+x*p.slope-top+3,5,2);}
 c.restore();t.refresh();scene.add.image(p.x,top,key).setOrigin(0).setDepth(3);
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
