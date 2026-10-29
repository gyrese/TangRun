import Phaser from 'phaser';
import {preloadArt,drawBackdrop,drawPlatformArt,drawStreet,drawCourseMechanisms,updateCourseMechanisms} from './art.js';
import {preparePropArt} from './prop-art.js';
import {preloadAdventure,createAdventureArt,updateAdventureArt} from './adventure-art.js';
import {createAdventureState} from './adventure.js';
import {createLivingWorld,updateLivingWorld} from './living-world.js';
import {drawPathDetails} from './route-dressing.js';
import {groundAt,heightOn} from './level.js';
import {freezeEditorLayout} from './editor-layout.js';
import {collection} from './editor-store.js';

// The editor uses the game's own drawing functions and assets, not an imitation.
export function createEditorRenderer(parent,initialLevel,onReady,onError,onRender=()=>{}){
 let scene,level=initialLevel,pending=true,lastBuild=-Infinity,view={x:0,y:0,zoom:1},visuals=new Map(),editing=null,buildCount=0,previewCount=0,backdropView='',livePreview=false;
 const visibility=new Map(),thumbnailCache=new Map();
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 class EditorScene extends Phaser.Scene{
  constructor(){super('editor-world');}
  preload(){preloadArt(this);preloadAdventure(this);this.load.on('loaderror',file=>onError(`Ressource manquante : ${file.key}`));}
  create(){scene=this;preparePropArt(this);rebuild();onReady();}
  update(time,delta){
   if(pending&&time-lastBuild>100){rebuild();lastBuild=time;}
   this.runner.x=view.x+this.scale.width/(2*view.zoom);
   if(livePreview&&!editing){
    this.visualClock=(this.visualClock||0)+Math.min(delta,100);
    this.runner.simTime=this.visualClock/1000;
    this.adventure.time=this.visualClock/1000;
    updateLivingWorld(this,reduced);
    updateCourseMechanisms(this);
    updateAdventureArt(this,reduced);
    for(const [key,objects]of visuals)if(visibility.get(key.split(':')[0])===false)objects.forEach(p=>p?.setVisible(false));
   }else{
    this.visualClock=0;this.runner.simTime=0;this.adventure.time=0;
   }
   const zone=Math.max(0,Math.min(3,Math.floor(view.x/8400)));
   const nextBackdropView=`${view.x},${view.y},${view.zoom},${this.scale.width},${this.scale.height}`;
   if(nextBackdropView===backdropView)return;backdropView=nextBackdropView;
   this.backgrounds.forEach((bg,i)=>{
    const source=bg.texture.getSourceImage(),width=this.scale.width,height=this.scale.height;
    // Cover the viewport once. These panoramas have no seamless edges: never wrap.
    const cover=Math.max(width/source.width,height/source.height);
    bg.setAlpha(i===zone?1:0).setPosition(view.x,view.y).setScrollFactor(1).setScale(1/view.zoom).setSize(width,height).setTileScale(cover);
    bg.tilePositionY=0;
    bg.tilePositionX=reduced?0:Math.min(Math.max(0,(view.x-i*8400)*.045),Math.max(0,source.width-width/cover));
   });
   this.background=this.backgrounds[zone];
   // Editing is a stationary pose: no patrols, bobbing, culling or ambient drift.
  }
 }
 function capture(key,index,draw){const before=scene.children.list.length;draw();visuals.set(`${key}:${index}`,scene.children.list.slice(before));}
 function rebuild(){
  buildCount++;editing=null;backdropView='';
  freezeEditorLayout(level,measure);
  pending=false;scene.children.removeAll(true);visuals.clear();
  for(const key of scene.textures.getTextureKeys())if(key.startsWith('terrain-art-')||key.startsWith('natural-rail-')||['coast-framed','warm-glow'].includes(key))scene.textures.remove(key);
  scene.visualClock=0;scene.level=level;scene.gateArt=[];scene.signArt=[];scene.finishArt=[];scene.springArt=[];scene.boostArt=[];scene.checkpointArt=[];
  scene.runner={x:80,feet:450,simTime:0};scene.adventure=createAdventureState();
  drawBackdrop(scene);
  for(const key of ['terrain','platforms'])level[key].forEach((p,i)=>capture(key,i,()=>drawPlatformArt(scene,p)));
  // An unfinished edit may temporarily leave a boost without its support.
  const originalPads=level.pads;
  scene.level={...level,pads:originalPads.filter(p=>[...level.terrain,...level.platforms].some(s=>s.id===p.surface))};
  const visiblePads=scene.level.pads;drawStreet(scene);scene.level=level;
  for(const placed of scene.placedScenery){const index=placed.sourceIndex;if(index>=0)visuals.set(`scenery:${index}`,[placed.sprite,...(placed.supportArt?[placed.supportArt]:[])]);}
  scene.checkpointArt.forEach((p,i)=>visuals.set(`checkpoints:${i+1}`,[p.sprite]));
  scene.springArt.forEach((p,i)=>visuals.set(`springs:${i}`,[p.sprite]));
  level.pads.forEach((p,i)=>{const index=visiblePads.indexOf(p);if(scene.boostArt[index])visuals.set(`pads:${i}`,[scene.boostArt[index]]);else capture('pads',i,()=>scene.add.image(p.x,p.y??450,'polish-boost-0').setOrigin(.5,1).setDepth(6).setTint(0xff826e).setAlpha(.65));});
  drawCourseMechanisms(scene);
  level.movers.forEach((p,i)=>visuals.set(`movers:${i}`,[scene.movingArt.get(p.id)]));
  const loopImages=scene.children.list.filter(s=>['island-loop-surface','volcano-loop-surface'].includes(s.texture?.key));level.loops.forEach((p,i)=>visuals.set(`loops:${i}`,[loopImages[i]]));
  drawPathDetails(scene);
  scene.coins=level.tokens.map((p,i)=>{let image;capture('tokens',i,()=>image=scene.add.image(p.x,p.y,'token').setDepth(6));return image;});
  const floor=groundAt(level,80);scene.mascot=scene.add.sprite(84,floor?heightOn(floor,80)+2:450,'mascot-extras',4).setOrigin(.5,1).setDepth(10);
  createLivingWorld(scene);createAdventureArt(scene);
  for(const e of level.adventure.enemies)if(e.kind==='drone')scene.adventureArt.enemies.get(e.id).y=e.y-65;
  for(const [key,map]of [['adventure.enemies',scene.adventureArt.enemies],['adventure.relics',scene.adventureArt.relics],['adventure.monitors',scene.adventureArt.monitors]])level.adventure[key.split('.')[1]].forEach((p,i)=>visuals.set(`${key}:${i}`,[map.get(p.id)]));
  level.adventure.vents.forEach((p,i)=>visuals.set(`adventure.vents:${i}`,[scene.adventureArt.vents.get(p.id).base,scene.adventureArt.vents.get(p.id).fire]));
  for(const p of scene.decorPlan.landmarks){const image=scene.adventureArt.landmarks.get(p.id);if(image)visuals.set(`adventure.landmarks:${p.sourceIndex}`,[image]);}
  for(const [key,objects]of visuals)if(visibility.get(key.split(':')[0])===false)objects.forEach(p=>p?.setVisible(false));
  applyView();onRender();
 }
 function apiBounds(key){const objects=visuals.get(key)?.filter(p=>p?.active&&p.visible&&p.getBounds);if(!objects?.length)return null;const all=objects.map(p=>p.getBounds());const x=Math.min(...all.map(b=>b.x)),y=Math.min(...all.map(b=>b.y));return{x,y,w:Math.max(...all.map(b=>b.right))-x,h:Math.max(...all.map(b=>b.bottom))-y};}
 function measure(key){if(!scene.textures.exists(key))return null;const image=scene.textures.get(key).getSourceImage();return{width:image.width,height:image.height};}
 function resolveObjectY(p){
  if(!p)return 0;
  if(p.baseY!==undefined)return p.baseY;
  if(p.y!==undefined)return p.y;
  if(p.surface){const s=[...level.platforms,...level.terrain].find(s=>s.id===p.surface);if(s)return heightOn(s,p.x);}
  const g=groundAt(level,p.x);return g?heightOn(g,p.x):450;
 }
 function applyView(){if(!scene)return;scene.cameras.main.setOrigin(0,0).setZoom(view.zoom).setScroll(view.x,view.y);}
 const game=new Phaser.Game({type:Phaser.CANVAS,parent,width:parent.clientWidth,height:parent.clientHeight,backgroundColor:'#162326',pixelArt:true,roundPixels:true,audio:{noAudio:true},input:{keyboard:false,mouse:false,touch:false},scene:EditorScene,banner:false});
 return{
  beginEdit(key,index){if(!scene||pending)return;if(livePreview){livePreview=false;rebuild();}editing={key,index,last:structuredClone(collection(level,key)[index])};},
  previewObject(key,index,p,welded=null){
   if(!editing||editing.key!==key||editing.index!==index)return;
   previewCount++;const last=editing.last,objects=visuals.get(`${key}:${index}`)||[],dx=p.x-last.x,dy=resolveObjectY(p)-resolveObjectY(last);
   const surface=['terrain','platforms'].includes(key),reshape=surface&&(p.w!==last.w||((p.y2??p.y)-p.y)!==((last.y2??last.y)-last.y)||p.kind==='beam'&&(dx!==0||dy!==0));
   if(reshape){
    objects.forEach(object=>object?.destroy());
    for(const texture of [`terrain-art-${p.id}`,`natural-rail-${p.id}`])if(scene.textures.exists(texture))scene.textures.remove(texture);
    capture(key,index,()=>drawPlatformArt(scene,p));
   }else if(key==='movers'&&p.w!==last.w){
    const g=objects[0];
    if(g?.active){
     g.setPosition(p.x+p.w/2,p.y);
     const child=g.list?.[0];
     if(child){if(p.x>=8400)child.setPosition(-p.w/2,p.x>=16800?-24:-16).setDisplaySize(p.w,p.x>=16800?52:54);else{const scale=p.w/779;child.setPosition(-p.w/2,-27*scale).setScale(scale);}}
    }
   }else{
    const ratio=key==='loops'?p.radius/last.radius:p.scale&&last.scale?p.scale/last.scale:1;
    objects.forEach(object=>{if(!object?.active)return;object.x+=dx;object.y+=dy;if(ratio!==1)object.setScale(object.scaleX*ratio,object.scaleY*ratio);});
   }
   if(welded&&surface){
    const wObjects=visuals.get(`${key}:${welded.index}`)||[];
    wObjects.forEach(object=>object?.destroy());
    for(const texture of [`terrain-art-${welded.p.id}`,`natural-rail-${welded.p.id}`])if(scene.textures.exists(texture))scene.textures.remove(texture);
    capture(key,welded.index,()=>drawPlatformArt(scene,welded.p));
   }
   editing.last=structuredClone(p);onRender();
  },
  setLivePreview(next){const active=Boolean(next);if(livePreview===active)return;livePreview=active;if(!livePreview&&scene&&!pending)rebuild();},
  get livePreview(){return livePreview;},
  setLayerVisibility(key,visible){visibility.set(key,visible);for(const [id,objects]of visuals)if(id.startsWith(`${key}:`))objects.forEach(p=>p?.setVisible(visible));onRender();},
  setLevel(next){level=scene?freezeEditorLayout(next,measure):next;pending=true;},
  setView(next){view=next;applyView();},
  resize(w,h){if(w>0&&h>0)game.scale.resize(w,h);},
  depth(key,index){return Math.max(...(visuals.get(`${key}:${index}`)||[]).map(p=>p?.depth??0),0);},
  bounds(key,index){const objects=visuals.get(`${key}:${index}`)?.filter(p=>p?.active&&p.visible&&p.getBounds);if(!objects?.length)return null;const all=objects.map(p=>p.getBounds());const x=Math.min(...all.map(b=>b.x)),y=Math.min(...all.map(b=>b.y));return{x,y,w:Math.max(...all.map(b=>b.right))-x,h:Math.max(...all.map(b=>b.bottom))-y};},
  thumbnail(texture){if(thumbnailCache.has(texture))return thumbnailCache.get(texture);if(!scene?.textures.exists(texture))return '';const frame=scene.textures.getFrame(texture),source=frame.source.image,c=document.createElement('canvas');c.width=96;c.height=72;const ctx=c.getContext('2d'),scale=Math.min(88/frame.cutWidth,64/frame.cutHeight);ctx.imageSmoothingEnabled=false;ctx.drawImage(source,frame.cutX,frame.cutY,frame.cutWidth,frame.cutHeight,(96-frame.cutWidth*scale)/2,(72-frame.cutHeight*scale)/2,frame.cutWidth*scale,frame.cutHeight*scale);const data=c.toDataURL();thumbnailCache.set(texture,data);return data;},
  get objects(){return [...visuals].map(([key,objects])=>({key,bounds:apiBounds(key),objects:objects.filter(p=>p?.active).map(p=>({x:p.x,y:p.y,scaleX:p.scaleX,scaleY:p.scaleY,texture:p.texture?.key,visible:p.visible,depth:p.depth}))}));},
  get ready(){return !!scene;},
  get metrics(){return{builds:buildCount,previews:previewCount};},
  get backgrounds(){return scene?.backgrounds.map(bg=>({alpha:bg.alpha,x:bg.tilePositionX,y:bg.tilePositionY,width:bg.width,height:bg.height,scale:bg.tileScaleX,sourceWidth:bg.texture.getSourceImage().width,sourceHeight:bg.texture.getSourceImage().height}));},
  get pending(){return pending;}
 };
}
