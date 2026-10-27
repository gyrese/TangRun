import {groundAt,heightOn} from './level.js';

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
 const top=Math.floor(Math.min(p.y,p.y2))-2,depth=40,key=`natural-rail-${p.id}`;
 const width=Math.ceil(p.w)+2,height=Math.ceil(Math.abs(p.y2-p.y))+depth+10;
 const t=scene.textures.createCanvas(key,width,height),c=t.context;
 const tile=basaltTile(scene);
 const route=scene.level.platforms.filter(q=>q.rail&&q.route===p.route),leftEnd=!route.some(q=>q.id!==p.id&&Math.abs(q.x+q.w-p.x)<2),rightEnd=!route.some(q=>q.id!==p.id&&Math.abs(q.x-p.x-p.w)<2);
 c.beginPath();c.moveTo(0,p.y-top);c.lineTo(width,p.y2+(width-p.w)*p.slope-top);
 // Fractured lower edge. The same world-space profile joins neighboring spans.
 for(let x=width;x>=0;x-=4)c.lineTo(Math.max(leftEnd?12:0,Math.min(width-(rightEnd?12:0),x)),p.y+x*p.slope-top+depth+3*Math.sin((p.x+x)*.11)+2*Math.sin((p.x+x)*.039));
 c.lineTo(0,p.y-top+depth+3*Math.sin(p.x*.11)+2*Math.sin(p.x*.039));c.closePath();c.save();c.clip();
 c.fillStyle='#202a2e';c.fillRect(0,0,width,height);
 const pattern=c.createPattern(tile,'repeat');pattern.setTransform(new DOMMatrix().translate(-p.x%340,-top%700));
 c.fillStyle=pattern;c.globalAlpha=.95;c.fillRect(0,0,width,height);c.globalAlpha=1;
 const shade=c.createLinearGradient(0,0,0,height);shade.addColorStop(0,'rgba(213,198,165,.12)');shade.addColorStop(1,'rgba(4,15,24,.35)');c.fillStyle=shade;c.fillRect(0,0,width,height);
 c.lineWidth=2;c.strokeStyle=p.route==='mafate'?'#7f9171':'#8d938a';c.beginPath();c.moveTo(0,p.y-top+1);c.lineTo(width,p.y+width*p.slope-top+1);c.stroke();
 for(let x=Math.ceil(p.x/47)*47-p.x;x<width;x+=47){c.fillStyle='#3c5142';c.fillRect(x,p.y+x*p.slope-top+3,5,2);}
 c.restore();t.refresh();scene.add.image(p.x,top,key).setOrigin(0).setDepth(3);

}

function basaltTile(scene){
 if(scene.basaltRailTile)return scene.basaltRailTile;
 const tile=document.createElement('canvas');tile.width=340;tile.height=700;
 const c=tile.getContext('2d'),source=scene.textures.get('island-pinnacle').getSourceImage();
 for(let row=0;row<2;row++)for(let col=0;col<2;col++){c.save();c.translate(col?340:0,row?700:0);c.scale(col?-1:1,row?-1:1);c.drawImage(source,65,105,170,350,0,0,170,350);c.restore();}
 scene.basaltRailTile=tile;return tile;
}
