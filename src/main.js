import Phaser from 'phaser';
import {touchesLava} from './ravine-art.js';
import {loadPlayableLevel} from './editor-store.js';
import './style.css';
import './title-screen.css';
import {preloadArt,drawBackdrop,drawStreet,drawPlatformArt,updateMascot,drawCourseMechanisms,updateCourseMechanisms} from './art.js';
import {buildLevel,formatTime,readBest,WORLD_WIDTH,GOAL_X,SPEED,MAX_SPEED,ZONES,STAGES,recordKey,groundAt,heightOn} from './level.js';
import {landInSnow} from './snow-effects.js';
import {createRunner,stepRunner,sampleRunner} from './movement.js';
import {createLivingWorld,updateLivingWorld} from './living-world.js';
import {drawPathDetails} from './route-dressing.js';
import {createSpeedFeedback,resetSpeedFeedback,updateSpeedFeedback,fitSpeedBackdrop,snapCameraToRunner} from './speed-feedback.js';
import {createAdventureState,stepAdventure,adventureRank} from './adventure.js';
import {preloadAdventure,createAdventureArt,updateAdventureArt} from './adventure-art.js';
import {preparePropArt} from './prop-art.js';
import {resetBarArrival,beginBarArrival,updateBarArrival} from './bar-arrival.js';
const $=id=>document.getElementById(id),reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const touch={left:false,right:false,jump:false,slide:false};let gameScene,best=null,selectedStage='campaign';
try{best=readBest(localStorage);}catch{}
$('best').textContent=best?formatTime(best):'— — : — —';
const audio={enabled:false,context:null,
 unlock(){try{this.context??=new(window.AudioContext||window.webkitAudioContext)();this.context.resume().catch(()=>{});}catch{this.enabled=false;}},
 tone(hz,seconds=.1){if(!this.enabled||!this.context)return;try{const o=this.context.createOscillator(),g=this.context.createGain(),t=this.context.currentTime;o.type='triangle';o.frequency.setValueAtTime(hz,t);o.frequency.exponentialRampToValueAtTime(hz*.65,t+seconds);g.gain.setValueAtTime(.045,t);g.gain.exponentialRampToValueAtTime(.001,t+seconds);o.connect(g);g.connect(this.context.destination);o.start();o.stop(t+seconds);}catch{}}
};
function overlay({kicker='',title,copy='',button}){$('overlay-kicker').textContent=kicker;$('overlay-title').innerHTML=title;$('overlay-copy').textContent=copy;$('play').textContent=button;$('overlay').hidden=false;$('stage-picker').hidden=gameScene?.mode==='paused';$('restart').hidden=gameScene?.mode!=='paused';}
function clearControls(){resetStick();Object.keys(touch).forEach(k=>touch[k]=false);document.querySelectorAll('[data-control]').forEach(b=>b.classList.remove('pressed'));}

class RunScene extends Phaser.Scene{
 constructor(){super('run');}
 preload(){this.load.on('progress',v=>$('play').textContent=`CHARGEMENT ${Math.round(v*100)} %`);preloadArt(this);preloadAdventure(this);}
 create(){
  gameScene=this;this.reducedMotion=reducedMotion;this.level=loadPlayableLevel(buildLevel);this.mode='ready';this.runner=createRunner();this.elapsed=0;this.count=0;this.falls=0;this.zone=0;this.checkpoint=ZONES[0].checkpoint;this.runStart=80;this.runEnd=GOAL_X;this.splits=[];this.splitStarted=0;this.clock=0;this.accumulator=0;this.lastHud=0;this.trails=[];
  preparePropArt(this);
  drawBackdrop(this);
  for(const p of [...this.level.terrain,...this.level.platforms])drawPlatformArt(this,p);
  drawStreet(this);drawCourseMechanisms(this);drawPathDetails(this);
  this.coins=this.level.tokens.map(t=>this.add.image(t.x,t.y,'token').setDepth(6));
  this.player=this.add.rectangle(80,400,22,34,0xffffff,0);
  this.mascot=this.add.sprite(84,422,'mascot',0).setOrigin(.5,1).setDepth(10);
  this.visualClock=0;this.landedAt=-1000;createLivingWorld(this);
  this.dust=this.add.graphics().setDepth(9);createSpeedFeedback(this);updateMascot(this);
  const cameraTop=Math.min(-360,...this.level.terrain.map(p=>Math.min(p.y,p.y2)-500));
  this.cameras.main.setBounds(0,cameraTop,WORLD_WIDTH,1120-cameraTop);
  this.cameras.main.startFollow(this.player,false,reducedMotion?1:.25,reducedMotion?1:.3,-60,45);
  this.cameras.main.setDeadzone();
  this.adventure=createAdventureState();createAdventureArt(this);updateAdventureArt(this,reducedMotion);
  fitGameViewport();
  this.keys=this.input.keyboard.addKeys('LEFT,RIGHT,UP,DOWN,SPACE,A,D,Q,W,Z,S,SHIFT,R,P,ESC');
  this.input.keyboard.addCapture(['SPACE','UP','DOWN','LEFT','RIGHT']);
  // Listen to native keydown once: resetting Phaser keys during pause can replay
  // its queued shortcut event and immediately resume the game.
  $('game').addEventListener('keydown',e=>{
   if(e.repeat)return;
   if(e.code==='KeyR'){e.preventDefault();this.startRun();}
   else if(e.code==='KeyP'){e.preventDefault();this.togglePause();}
   else if(e.code==='Escape'&&this.mode==='running'){e.preventDefault();this.togglePause();}
  });
  this.game.events.on('blur',()=>{if(this.mode==='running')this.togglePause();clearControls();});
  this.updateHud();$('play').disabled=false;$('play').textContent='JOUER';
 }
 startRun(){
  resetBarArrival(this);
  this.adventure=createAdventureState();this.adventureArt.chapter=-1;
  clearControls();resetSpeedFeedback(this);this.input.keyboard.resetKeys();this.mode='running';document.body.classList.add('is-playing');this.runner=createRunner();this.elapsed=0;this.count=0;this.falls=0;this.zone=0;this.clock=0;this.accumulator=0;this.lastHud=0;this.trails=[];this.checkpoint=ZONES[0].checkpoint;
  const stage=STAGES.find(s=>s.id===selectedStage);this.activeStage=stage??null;this.runStart=stage?.start??80;this.runEnd=stage?.end??GOAL_X;this.zone=stage?.zone??0;this.splits=[];this.splitStarted=0;
  const params=new URLSearchParams(location.search),testStart=Number(params.get('spawn')),spawnSurfaceId=params.get('surface'),spawnVx=Number(params.get('vx'));
  const customTest=!stage&&params.get('custom')==='1';
  const customPlatform=customTest&&spawnSurfaceId?this.level.platforms.find(p=>p.id===spawnSurfaceId&&testStart>=p.x&&testStart<=p.x+p.w):null;
  if(customTest&&params.has('spawn')&&Number.isFinite(testStart)&&testStart>=80&&testStart<GOAL_X&&(customPlatform||groundAt(this.level,testStart))){this.runStart=testStart;this.zone=Math.min(3,Math.floor(testStart/8400));}
  const spawnSupport=customPlatform||groundAt(this.level,this.runStart);
  this.checkpoint={x:this.runStart,surface:customPlatform?.id};this.runner=createRunner(this.runStart,heightOn(spawnSupport,this.runStart));this.runner.surfaceId=spawnSupport.id;
  if(customTest&&Number.isFinite(spawnVx)&&spawnVx>0)this.runner.vx=Math.min(MAX_SPEED,spawnVx);
  this.telemetry=customTest?{points:[[Math.round(this.runner.x),Math.round(this.runner.feet),Math.round(this.runner.vx),0]],events:[]}:null;
  this.lastTelemetry=0;
  try{best=readBest(localStorage,recordKey(selectedStage));}catch{best=null;}
  $('best').textContent=best?formatTime(best):'— — : — —';$('next-stage').hidden=true;$('restart').hidden=true;$('split-results').textContent='';$('share').textContent='Copier mon résultat ↗';
  document.querySelectorAll('.progress-track>i').forEach(marker=>marker.hidden=!!stage);
  for(const coin of this.coins)coin.setActive(true).setVisible(true);
  this.syncPlayer(1);snapCameraToRunner(this);this.dust.clear();
  updateAdventureArt(this,reducedMotion);
  this.backgrounds.forEach((background,i)=>{background.tilePositionX=0;background.setAlpha(i===this.zone?1:0);});
  document.body.classList.add('has-started');$('overlay').hidden=true;$('finish-share').hidden=true;$('pause').disabled=false;$('pause').textContent='Ⅱ';$('pause').setAttribute('aria-label','Mettre en pause');
  audio.unlock();audio.tone(440);this.updateHud();$('game').focus({preventScroll:true});
 }
 togglePause(){
  if(this.mode==='running'){
   this.mode='paused';document.body.classList.remove('is-playing');this.accumulator=0;clearControls();this.input.keyboard.resetKeys();this.runner.lastJump=false;
   overlay({title:'PAUSE',button:'REPRENDRE'});$('next-stage').hidden=true;
   $('pause').textContent='▶';$('pause').setAttribute('aria-label','Reprendre');
  }else if(this.mode==='paused'){
   this.mode='running';document.body.classList.add('is-playing');$('overlay').hidden=true;$('pause').textContent='Ⅱ';$('pause').setAttribute('aria-label','Mettre en pause');$('game').focus({preventScroll:true});
  }
 }
 respawn(){
  if(this.telemetry){this.telemetry.events.push({x:Math.round(this.runner.x),y:Math.round(Math.min(900,this.runner.feet)),type:'respawn'});try{sessionStorage.setItem('ltn-editor-telemetry-v1',JSON.stringify(this.telemetry));}catch{}}
  this.adventure.invincible=2.2;this.adventure.shield=false;this.adventure.scatter=[];this.adventure.combo=0;this.count=0;
  resetSpeedFeedback(this);
  this.falls++;
  const platformSupport=this.checkpoint.surface?this.level.platforms.find(p=>p.id===this.checkpoint.surface&&this.checkpoint.x>=p.x&&this.checkpoint.x<=p.x+p.w):null;
  const floor=platformSupport||groundAt(this.level,this.checkpoint.x);this.runner=createRunner(this.checkpoint.x,heightOn(floor,this.checkpoint.x));this.runner.surfaceId=floor.id;this.trails=[];audio.tone(150,.16);
  if(!reducedMotion)this.cameras.main.flash(100,255,128,93,false);
  this.accumulator=0;this.syncPlayer(1);snapCameraToRunner(this);
 }
 syncPlayer(alpha=this.mode==='running'?this.accumulator*120:1){const p=this.renderRunner=sampleRunner(this.runner,alpha,this.level);this.player.setPosition(p.x,p.feet-20);updateMascot(this);updateCourseMechanisms(this);}
 finish(){
  if(this.mode!=='running')return;
  this.speedFeedback.wind.clear();this.speedFeedback.streakCount=0;
  this.splits.push({zone:this.zone,ms:this.elapsed-this.splitStarted});this.mode='finished';document.body.classList.remove('is-playing');$('pause').disabled=true;const newBest=!best||this.elapsed<best;
  updateMascot(this);
  if(newBest){best=Math.floor(this.elapsed);try{localStorage.setItem(recordKey(selectedStage),String(best));}catch{}}
  $('best').textContent=formatTime(best);
  if(this.runEnd===GOAL_X){
   clearControls();this.input.keyboard.resetKeys();this.arrivalNewBest=newBest;beginBarArrival(this);
   this.updateHud();$('progress').style.width='100%';$('announcer').textContent='Bienvenue à Les Toiles Noires';
   return;
  }
  this.showFinish(newBest);
 }
 showFinish(newBest){
  this.mode='finished';
  const atBar=this.runEnd===GOAL_X;
  overlay({kicker:atBar?`${newBest?'RECORD PERSONNEL · ':''}${formatTime(this.elapsed)}`:newBest?'RECORD PERSONNEL':this.activeStage?.name??'LES TOILES NOIRES',title:atBar?'Bienvenue à<br><em>Les Toiles Noires</em>':`${formatTime(this.elapsed)}<br><em>ARRIVÉE</em>`,button:'REJOUER'});
  $('split-results').textContent=this.splits.map(s=>`${STAGES[s.zone].name} : ${formatTime(s.ms)}`).join(' · ');
  const rating=adventureRank(this.adventure,this.falls,this.elapsed/1000,this.adventure.relics.size);
  $('overlay-copy').textContent=`RANG ${rating.rank} · ${rating.total.toLocaleString('fr-FR')} pts · ${this.adventure.relics.size}/${this.activeStage?3:12} emblèmes · ${this.adventure.defeated.size} sentinelles · ${this.falls} reprises`;
  $('next-stage').hidden=!this.activeStage||this.zone===3;$('stage-picker').hidden=false;
  $('finish-share').hidden=false;this.updateHud();$('progress').style.width='100%';$('announcer').textContent=`${this.activeStage?'Niveau terminé':'Arrivée au bar'} en ${formatTime(this.elapsed)}.`;audio.tone(1046,.25);$('play').focus({preventScroll:true});
 }
 updateHud(){
  $('timer').textContent=formatTime(this.elapsed);$('zone-number').textContent=String(this.zone+1).padStart(2,'0');$('zone-name').textContent=ZONES[this.zone].name;
  $('progress').style.width=`${Math.max(0,Math.min(100,(this.runner.x-this.runStart)/(this.runEnd-this.runStart)*100))}%`;
  const momentum=Math.abs(this.runner.vx)/SPEED;
  $('speed-value').textContent=`×${momentum.toFixed(1)}`;$('speed-fill').style.width=`${Math.min(100,Math.abs(this.runner.vx)/MAX_SPEED*100)}%`;
  $('speed-meter').classList.toggle('boosted',momentum>1.3);
  $('shard-count').textContent=String(this.count).padStart(2,'0');
  $('relic-count').textContent=`${this.adventure?.relics.size??0}/${this.activeStage?3:9}`;
  $('shield-state').textContent=this.adventure?.shield?'BOUCLIER':'ÉCLATS';
 }
 update(_,delta){
  if(this.mode==='arriving'){
   this.visualClock+=Math.min(delta,100);updateLivingWorld(this,reducedMotion);
   if(updateBarArrival(this,delta))this.showFinish(this.arrivalNewBest);
   return;
  }
  if(this.mode==='running'||this.mode==='ready'){this.visualClock+=Math.min(delta,100);updateLivingWorld(this,reducedMotion);if(this.mode==='ready')updateMascot(this);}
  this.backgrounds.forEach(background=>background.tilePositionX=reducedMotion?0:this.cameras.main.scrollX*.045);
  const snow=this.backgrounds[0],snowSource=snow.texture.getSourceImage();
  snow.tilePositionX=reducedMotion?0:Math.min(Math.max(0,this.cameras.main.scrollX*.025),Math.max(0,snowSource.width-snow.width/snow.tileScaleX));
  // The coast is a framed panorama, not a seamless tile: pan from its own zone
  // and stop before either edge can wrap a cropped palm into the middle of the sky.
  const coast=this.backgrounds[3],coastWidth=this.textures.get('coast-framed').getSourceImage().width;
   coast.tilePositionX=reducedMotion?0:Math.min(Math.max(0,(this.cameras.main.scrollX-ZONES[3].x)*.045),Math.max(0,coastWidth-coast.width));
  this.backgrounds.forEach((background,i)=>background.setAlpha(this.activeStage?Number(i===this.zone):i===0?1:Phaser.Math.Clamp((this.runner.x-ZONES[i].x+250)/500,0,1)));
  if(this.mode!=='running')return;
  const k=this.keys,input={left:k.LEFT.isDown||k.A.isDown||k.Q.isDown||touch.left,right:k.RIGHT.isDown||k.D.isDown||touch.right,jump:k.SPACE.isDown||k.UP.isDown||k.W.isDown||k.Z.isDown||touch.jump,slide:k.DOWN.isDown||k.S.isDown||k.SHIFT.isDown||touch.slide};
  const frameDelta=Math.min(delta,100);
  if(this.elapsed>0||Object.values(input).some(Boolean))this.elapsed+=frameDelta;
  this.clock+=delta;this.accumulator+=Math.min(delta/1000,.1);
  while(this.accumulator>=1/120){
   const impactVy=this.runner.vy;
   const event=stepRunner(this.runner,input,this.level,1/120);this.accumulator-=1/120;
   if(event.jumped)audio.tone(540);
   if(event.landed){this.landedAt=this.visualClock;landInSnow(this,this.runner,Math.max(0,impactVy-this.runner.vx*this.runner.slope));}
   for(const coin of this.coins)if(coin.active&&Math.abs(coin.x-this.runner.x)<23&&Math.abs(coin.y-(this.runner.feet-25))<32){coin.setActive(false).setVisible(false);this.count++;audio.tone(880,.06);}
   const encounter=stepAdventure(this.adventure,this.runner,this.level.adventure,1/120,this.count);this.count=encounter.balance;
   let hitRespawn=false;
   for(const e of encounter.events){
    if(e.type==='respawn'){this.respawn();hitRespawn=true;break;}
    if(e.type==='relic')audio.tone(1320,.2);
    else if(e.type==='shield')audio.tone(1046,.12);
    else if(e.type==='cache')audio.tone(880);
    else if(e.type==='hurt'||e.type==='shield-broken'){audio.tone(180,.15);if(this.telemetry)this.telemetry.events.push({x:Math.round(this.runner.x),y:Math.round(this.runner.feet),type:e.type});}
    else if(e.type==='defeat')audio.tone(650,.08);
   }
   if(hitRespawn)break;
   const snowFloor=this.runner.x<8400?(groundAt(this.level,this.runner.x)||this.level.terrain.find(p=>p.x>this.runner.x)):null;
   const fallLimit=snowFloor?heightOn(snowFloor,Math.max(snowFloor.x,this.runner.x))+650:1050;
   if(this.runner.feet>fallLimit||touchesLava(this)){this.respawn();break;}
  }
  this.syncPlayer();
  updateAdventureArt(this,reducedMotion);
  if(this.telemetry&&this.clock-this.lastTelemetry>80){
   this.lastTelemetry=this.clock;
   if(this.telemetry.points.length<900)this.telemetry.points.push([Math.round(this.runner.x),Math.round(this.runner.feet),Math.round(this.runner.vx),this.runner.sliding?1:0]);
   try{sessionStorage.setItem('ltn-editor-telemetry-v1',JSON.stringify(this.telemetry));}catch{}
   const backLink=document.querySelector('.admin-link');if(backLink)backLink.href=`/?admin&x=${Math.max(0,Math.round(this.runner.x-200))}`;
  }
  const zone=this.runner.x>=ZONES[3].x?3:this.runner.x>=ZONES[2].x?2:this.runner.x>=ZONES[1].x?1:0;
  if(zone>this.zone){this.splits.push({zone:this.zone,ms:this.elapsed-this.splitStarted});this.splitStarted=this.elapsed;this.zone=zone;this.checkpoint=ZONES[zone].checkpoint;audio.tone(700,.14);}
  let checkpoint=null;for(const c of this.level.checkpoints)if(c.x<=this.runner.x&&(!checkpoint||c.x>checkpoint.x))checkpoint=c;
  if(checkpoint&&checkpoint.x>this.checkpoint.x){this.checkpoint=checkpoint;}
  if(this.runner.x>=this.runEnd){this.finish();return;}
  updateSpeedFeedback(this,delta,reducedMotion);
  if(this.clock-this.lastHud>40){this.updateHud();this.lastHud=this.clock;}
 }
}
$('play').disabled=true;
function pressStart(){
 if(!document.fullscreenElement)document.documentElement.requestFullscreen?.({navigationUI:'hide'}).catch(()=>{});
 if(!bootFinished){finishBoot();return;}
 if(!gameScene)return;
 if(gameScene.mode==='arriving')return;
 gameScene.mode==='paused'?gameScene.togglePause():gameScene.startRun();
}
$('play').addEventListener('click',pressStart);
let bootFinished=false;
function finishBoot(){if(bootFinished)return;bootFinished=true;$('boot-screen').hidden=true;document.body.classList.remove('booting');$('play').focus({preventScroll:true});}
$('skip-boot').addEventListener('click',finishBoot);
window.addEventListener('keydown',e=>{if(e.code==='Enter'&&!e.repeat){e.preventDefault();if(!bootFinished)finishBoot();else if(gameScene?.mode!=='running')pressStart();}});
setTimeout(finishBoot,reducedMotion?700:3400);
const barLogo=new Image();barLogo.src='/assets/logo-les-toiles-noires.png';
barLogo.onload=()=>{for(const canvas of document.querySelectorAll('.pixel-logo')){const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.drawImage(barLogo,0,0,canvas.width,canvas.height);}};
$('restart').addEventListener('click',()=>gameScene?.startRun());$('pause').addEventListener('click',()=>gameScene?.togglePause());
$('sound').addEventListener('click',()=>{audio.enabled=!audio.enabled;if(audio.enabled)audio.unlock();$('sound-state').textContent=audio.enabled?'OUI':'NON';$('sound').setAttribute('aria-pressed',String(audio.enabled));$('sound').setAttribute('aria-label',audio.enabled?'Couper le son':'Activer le son');if(audio.enabled)audio.tone(660);});
$('menu-sound').addEventListener('click',()=>{$('sound').click();$('menu-sound').setAttribute('aria-pressed',String(audio.enabled));$('menu-sound').textContent=audio.enabled?'♪ SON : ON':'♪ SON : OFF';});
const phoneMedia=matchMedia('(pointer: coarse) and (max-width: 1400px)');
let stickPointer=null,stickOrigin={x:0,y:0};
const stickZone=$('joystick-zone'),stick=$('joystick'),knob=$('joystick-knob');
function resetStick(){stickPointer=null;touch.left=false;touch.right=false;touch.slide=false;stick.hidden=true;knob.style.transform='translate(0px,0px)';}
function moveStick(e){
 const dx=e.clientX-stickOrigin.x,dy=e.clientY-stickOrigin.y,distance=Math.hypot(dx,dy),radius=42;
 const factor=distance>radius?radius/distance:1;
 knob.style.transform=`translate(${dx*factor}px,${dy*factor}px)`;
 touch.left=dx< -10;touch.right=dx>10;touch.slide=dy>10;
}
stickZone.addEventListener('pointerdown',e=>{
 if(gameScene?.mode!=='running'||stickPointer!==null)return;
 e.preventDefault();stickPointer=e.pointerId;stickOrigin={x:e.clientX,y:e.clientY};
 const bounds=stickZone.getBoundingClientRect();stick.style.left=`${e.clientX-bounds.left}px`;stick.style.top=`${e.clientY-bounds.top}px`;
 stick.hidden=false;stickZone.setPointerCapture(e.pointerId);moveStick(e);
});
stickZone.addEventListener('pointermove',e=>{if(e.pointerId===stickPointer){e.preventDefault();moveStick(e);}});
for(const type of ['pointerup','pointercancel','lostpointercapture'])stickZone.addEventListener(type,e=>{if(e.pointerId===stickPointer)resetStick();});
function updatePhoneMode(){
 document.body.classList.toggle('phone-mode',phoneMedia.matches);clearControls();
 if(phoneMedia.matches&&innerHeight>innerWidth&&gameScene?.mode==='running')gameScene.togglePause();
}
phoneMedia.addEventListener('change',updatePhoneMode);window.addEventListener('resize',updatePhoneMode);updatePhoneMode();
for(const b of document.querySelectorAll('[data-control]')){
 const key=b.dataset.control;b.addEventListener('pointerdown',e=>{e.preventDefault();if(gameScene?.mode!=='running')return;b.setPointerCapture(e.pointerId);touch[key]=true;b.classList.add('pressed');});
 for(const type of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(type,()=>{touch[key]=false;b.classList.remove('pressed');});
}
window.addEventListener('blur',clearControls);document.addEventListener('visibilitychange',()=>{if(document.hidden&&gameScene?.mode==='running')gameScene.togglePause();});
$('share').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(`${gameScene.activeStage?gameScene.activeStage.name:'La traversée de La Réunion'} : ${formatTime(gameScene.elapsed)} · ${gameScene.falls} chute(s) ! #LesToilesNoires #LaReunion`);$('share').textContent='COPIÉ ✓';}catch{$('share').textContent=formatTime(gameScene.elapsed);}});
function selectStage(id){
 selectedStage=id;for(const button of document.querySelectorAll('[data-stage]'))button.setAttribute('aria-pressed',String(button.dataset.stage===id));
 try{best=readBest(localStorage,recordKey(id));}catch{best=null;}$('best').textContent=best?formatTime(best):'— — : — —';
}
for(const button of document.querySelectorAll('[data-stage]'))button.addEventListener('click',()=>selectStage(button.dataset.stage));
$('next-stage').addEventListener('click',()=>{selectStage(STAGES[gameScene.zone+1].id);gameScene.startRun();});
const game=new Phaser.Game({type:Phaser.AUTO,parent:'game',width:960,height:540,backgroundColor:'#20383f',pixelArt:true,roundPixels:false,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},input:{keyboard:{target:$('game')}},scene:[RunScene],render:{antialias:false},audio:{noAudio:true}});
function fitGameViewport(){
 const bounds=$('viewport').getBoundingClientRect();
 if(!bounds.width||!bounds.height)return;
 const width=phoneMedia.matches?Math.round(540*bounds.width/bounds.height):960;
 if(game.scale.gameSize.width!==width)game.scale.setGameSize(width,540);
 else game.scale.refresh();
 if(gameScene?.backgrounds){
  const baseZoom=phoneMedia.matches?1.25:1;
  const previousZoom=gameScene.baseZoom??1;
  gameScene.baseZoom=baseZoom;
  gameScene.cameras.main.setZoom(gameScene.cameras.main.zoom/previousZoom*baseZoom);
  fitSpeedBackdrop(gameScene);
 }
}
new ResizeObserver(fitGameViewport).observe($('viewport'));
window.addEventListener('resize',fitGameViewport);
window.__LTN__={get state(){const s=gameScene,p=s?.runner;return p?{mode:s.mode,x:p.x,y:p.feet-20,feet:p.feet,vx:p.vx,vy:p.vy,grounded:p.grounded,sliding:p.sliding,slope:p.slope,surface:p.surfaceId,loop:p.loop?.id??null,simTime:p.simTime,maxSpeed:p.maxSpeed,backgroundOffset:s.background.tilePositionX,cameraX:s.cameras.main.scrollX,elapsed:s.elapsed,zone:s.zone,falls:s.falls,count:s.count,best,stage:selectedStage,runEnd:s.runEnd,checkpoint:s.checkpoint.x,splits:s.splits}:null;},game};
