import Phaser from 'phaser';
import './style.css';
import {preloadArt,drawBackdrop,drawStreet,drawPlatformArt,updateMascot,drawCourseMechanisms,updateCourseMechanisms} from './art.js';
import {buildLevel,formatTime,readBest,WORLD_WIDTH,GOAL_X,SPEED,MAX_SPEED,ZONES,STAGES,recordKey,groundAt,heightOn} from './level.js';
import {createRunner,stepRunner} from './movement.js';
import {createLivingWorld,updateLivingWorld} from './living-world.js';
const $=id=>document.getElementById(id),reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const touch={left:false,right:false,jump:false,slide:false};let gameScene,best=null,selectedStage='campaign';
try{best=readBest(localStorage);}catch{}
$('best').textContent=best?formatTime(best):'— — : — —';
const audio={enabled:false,context:null,
 unlock(){try{this.context??=new(window.AudioContext||window.webkitAudioContext)();this.context.resume().catch(()=>{});}catch{this.enabled=false;}},
 tone(hz,seconds=.1){if(!this.enabled||!this.context)return;try{const o=this.context.createOscillator(),g=this.context.createGain(),t=this.context.currentTime;o.type='triangle';o.frequency.setValueAtTime(hz,t);o.frequency.exponentialRampToValueAtTime(hz*.65,t+seconds);g.gain.setValueAtTime(.045,t);g.gain.exponentialRampToValueAtTime(.001,t+seconds);o.connect(g);g.connect(this.context.destination);o.start();o.stop(t+seconds);}catch{}}
};
function toast(message){$('toast').textContent=message;$('toast').classList.add('visible');clearTimeout(toast.timeout);toast.timeout=setTimeout(()=>$('toast').classList.remove('visible'),2400);}
function overlay({kicker,title,copy,button,hint=''}){$('overlay-kicker').textContent=kicker;$('overlay-title').innerHTML=title;$('overlay-copy').textContent=copy;$('play').innerHTML=`${button} <span>↗</span>`;$('overlay-hint').textContent=hint;$('overlay').hidden=false;$('stage-picker').hidden=gameScene?.mode==='paused';}
function clearControls(){resetStick();Object.keys(touch).forEach(k=>touch[k]=false);document.querySelectorAll('[data-control]').forEach(b=>b.classList.remove('pressed'));}

class RunScene extends Phaser.Scene{
 constructor(){super('run');}
 preload(){this.load.on('progress',v=>$('play').textContent=`CHARGEMENT ${Math.round(v*100)} %`);preloadArt(this);}
 create(){
  gameScene=this;this.level=buildLevel();this.mode='ready';this.runner=createRunner();this.elapsed=0;this.count=0;this.falls=0;this.zone=0;this.checkpoint=ZONES[0].checkpoint;this.runStart=80;this.runEnd=GOAL_X;this.splits=[];this.splitStarted=0;this.clock=0;this.accumulator=0;this.lastHud=0;this.trails=[];
  const texture=this.textures.createCanvas('token',18,22),ctx=texture.context;
  ctx.fillStyle='#5b9076';ctx.fillRect(4,2,10,18);ctx.fillStyle='#ccecb2';ctx.fillRect(2,5,14,12);ctx.fillStyle='#fff6be';ctx.fillRect(7,4,4,14);texture.refresh();
  drawBackdrop(this);
  for(const p of [...this.level.terrain,...this.level.platforms])drawPlatformArt(this,p);
  drawStreet(this);drawCourseMechanisms(this);
  this.coins=this.level.tokens.map(t=>this.add.image(t.x,t.y,'token').setDepth(6));
  this.player=this.add.rectangle(80,400,22,34,0xffffff,0);
  this.mascot=this.add.sprite(84,422,'mascot',0).setOrigin(.5,1).setDepth(10);
  this.visualClock=0;this.landedAt=-1000;createLivingWorld(this);
  this.dust=this.add.graphics().setDepth(9);updateMascot(this);
  this.cameras.main.setBounds(0,0,WORLD_WIDTH,1000);
  this.cameras.main.startFollow(this.player,true,reducedMotion?1:.12,reducedMotion?1:.1,-140,110);
  this.cameras.main.setDeadzone(90,80);
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
  this.updateHud();$('play').disabled=false;$('play').textContent='APPUYER SUR START';
 }
 startRun(){
  clearControls();this.input.keyboard.resetKeys();this.mode='running';document.body.classList.add('is-playing');this.runner=createRunner();this.elapsed=0;this.count=0;this.falls=0;this.zone=0;this.clock=0;this.accumulator=0;this.lastHud=0;this.trails=[];this.checkpoint=ZONES[0].checkpoint;
  const stage=STAGES.find(s=>s.id===selectedStage);this.activeStage=stage??null;this.runStart=stage?.start??80;this.runEnd=stage?.end??GOAL_X;this.zone=stage?.zone??0;this.splits=[];this.splitStarted=0;
  this.checkpoint={x:this.runStart};const floor=groundAt(this.level,this.runStart);this.runner=createRunner(this.runStart,heightOn(floor,this.runStart));this.runner.surfaceId=floor.id;
  try{best=readBest(localStorage,recordKey(selectedStage));}catch{best=null;}
  $('best').textContent=best?formatTime(best):'— — : — —';$('next-stage').hidden=true;$('split-results').textContent='';
  document.querySelectorAll('.progress-track>i').forEach(marker=>marker.hidden=!!stage);
  for(const coin of this.coins)coin.setActive(true).setVisible(true);
  this.syncPlayer();this.cameras.main.scrollX=Math.max(0,this.runStart-160);this.cameras.main.scrollY=0;this.dust.clear();
  this.backgrounds.forEach((background,i)=>{background.tilePositionX=0;background.setAlpha(i===this.zone?1:0);});
  document.body.classList.add('has-started');$('overlay').hidden=true;$('finish-share').hidden=true;$('pause').disabled=false;$('pause').textContent='Ⅱ';$('pause').setAttribute('aria-label','Mettre en pause');
  audio.unlock();audio.tone(440);this.updateHud();$('game').focus({preventScroll:true});
 }
 togglePause(){
  if(this.mode==='running'){
   this.mode='paused';document.body.classList.remove('is-playing');this.accumulator=0;clearControls();this.input.keyboard.resetKeys();this.runner.lastJump=false;
   overlay({kicker:'PAUSE',title:'On souffle.<br><em>Puis on repart.</em>',copy:'Le temps et le jeu sont en pause.',button:'REPRENDRE',hint:'P pour reprendre · R pour repartir de zéro'});
   $('pause').textContent='▶';$('pause').setAttribute('aria-label','Reprendre');$('run-state').innerHTML='<i></i> EN PAUSE';
  }else if(this.mode==='paused'){
   this.mode='running';document.body.classList.add('is-playing');$('overlay').hidden=true;$('pause').textContent='Ⅱ';$('pause').setAttribute('aria-label','Mettre en pause');$('game').focus({preventScroll:true});
  }
 }
 respawn(){
  this.falls++;const floor=groundAt(this.level,this.checkpoint.x);this.runner=createRunner(this.checkpoint.x,heightOn(floor,this.checkpoint.x));this.runner.surfaceId=floor.id;this.trails=[];audio.tone(150,.16);
  if(!reducedMotion)this.cameras.main.flash(100,255,128,93,false);
  this.syncPlayer();toast('Retour au dernier drapeau · le temps continue');
 }
 syncPlayer(){const p=this.runner;this.player.setPosition(p.loop?p.loop.x+100:p.x,p.loop?p.loop.baseY-140:p.feet-20);updateMascot(this);updateCourseMechanisms(this);}
 finish(){
  this.splits.push({zone:this.zone,ms:this.elapsed-this.splitStarted});this.mode='finished';document.body.classList.remove('is-playing');$('pause').disabled=true;const newBest=!best||this.elapsed<best;
  updateMascot(this);
  if(newBest){best=Math.floor(this.elapsed);try{localStorage.setItem(recordKey(selectedStage),String(best));}catch{toast('Record disponible pour cette session uniquement');}}
  $('best').textContent=formatTime(best);
  overlay({kicker:newBest?'NOUVEAU RECORD PERSONNEL':this.activeStage?this.activeStage.name:'BIENVENUE AUX TOILES NOIRES',title:`${formatTime(this.elapsed)}<br><em>${this.activeStage?'Niveau terminé.':'Bienvenue au bar.'}</em>`,copy:`${this.count} éclats · ${this.falls} chute${this.falls>1?'s':''} · Vitesse maximale ×${(this.runner.maxSpeed/SPEED).toFixed(1)}.`,button:'REJOUER',hint:'R pour recommencer · Ton record reste sur cet appareil'});
  $('split-results').textContent=this.splits.map(s=>`${STAGES[s.zone].name} : ${formatTime(s.ms)}`).join(' · ');
  $('next-stage').hidden=!this.activeStage||this.zone===2;$('stage-picker').hidden=false;
  $('finish-share').hidden=false;this.updateHud();$('progress').style.width='100%';$('run-state').innerHTML='<i></i> PARCOURS TERMINÉ';$('announcer').textContent=`${this.activeStage?'Niveau terminé':'Arrivée au bar'} en ${formatTime(this.elapsed)}.`;audio.tone(1046,.25);$('play').focus({preventScroll:true});
 }
 updateHud(){
  $('timer').textContent=formatTime(this.elapsed);$('zone-number').textContent=String(this.zone+1).padStart(2,'0');$('zone-name').textContent=ZONES[this.zone].name;
  $('progress').style.width=`${Math.max(0,Math.min(100,(this.runner.x-this.runStart)/(this.runEnd-this.runStart)*100))}%`;
  const momentum=Math.abs(this.runner.vx)/SPEED;
  $('speed-value').textContent=`×${momentum.toFixed(1)}`;$('speed-fill').style.width=`${Math.min(100,Math.abs(this.runner.vx)/MAX_SPEED*100)}%`;
  $('speed-meter').classList.toggle('boosted',momentum>1.3);
  if(this.mode==='running')$('run-state').innerHTML=`<i></i> ${this.runner.sliding?'GLISSADE':momentum>1.4?'PLEIN ÉLAN':'EN COURSE'}`;
 }
 update(_,delta){
  if(this.mode==='running'||this.mode==='ready'){this.visualClock+=Math.min(delta,100);updateLivingWorld(this,reducedMotion);if(this.mode==='ready')updateMascot(this);}
  this.backgrounds.forEach(background=>background.tilePositionX=reducedMotion?0:this.cameras.main.scrollX*.045);
  this.backgrounds[1].setAlpha(Phaser.Math.Clamp((this.runner.x-ZONES[1].x+250)/500,0,1));
  this.backgrounds[2].setAlpha(Phaser.Math.Clamp((this.runner.x-ZONES[2].x+250)/500,0,1));
  if(this.mode!=='running')return;
  const k=this.keys,input={left:k.LEFT.isDown||k.A.isDown||k.Q.isDown||touch.left,right:k.RIGHT.isDown||k.D.isDown||touch.right,jump:k.SPACE.isDown||k.UP.isDown||k.W.isDown||k.Z.isDown||touch.jump,slide:k.DOWN.isDown||k.S.isDown||k.SHIFT.isDown||touch.slide};
  if(this.elapsed>0||Object.values(input).some(Boolean))this.elapsed+=delta;
  this.clock+=delta;this.accumulator+=Math.min(delta/1000,.1);
  while(this.accumulator>=1/120){
   const event=stepRunner(this.runner,input,this.level,1/120);this.accumulator-=1/120;
   if(event.jumped)audio.tone(540);
   if(event.landed)this.landedAt=this.visualClock;
   for(const coin of this.coins)if(coin.active&&Math.abs(coin.x-this.runner.x)<23&&Math.abs(coin.y-(this.runner.feet-25))<32){coin.setActive(false).setVisible(false);this.count++;audio.tone(880,.06);}
   if(this.runner.feet>1050){this.respawn();break;}
  }
  this.syncPlayer();
  const zone=this.runner.x>=ZONES[2].x?2:this.runner.x>=ZONES[1].x?1:0;
  if(zone>this.zone){this.splits.push({zone:this.zone,ms:this.elapsed-this.splitStarted});this.splitStarted=this.elapsed;this.zone=zone;this.checkpoint=ZONES[zone].checkpoint;toast(`${ZONES[zone].name} · Nouvelle étape`);audio.tone(700,.14);}
  const checkpoint=[...this.level.checkpoints].reverse().find(c=>c.x<=this.runner.x);if(checkpoint&&checkpoint.x>this.checkpoint.x){this.checkpoint=checkpoint;toast('Drapeau atteint · nouveau point de reprise');}
  if(this.runner.x>=this.runEnd){this.finish();return;}
  this.cameras.main.setFollowOffset(-140-Math.min(90,Math.abs(this.runner.vx)*.1),110);
  if(!reducedMotion){
   this.dust.clear();this.trails=this.trails.filter(t=>this.clock-t.time<240);
   if(this.runner.sliding&&Math.abs(this.runner.vx)>250)this.trails.push({x:this.runner.x,y:this.runner.feet-5,time:this.clock});
   for(const t of this.trails){this.dust.fillStyle(0xffb777,(1-(this.clock-t.time)/240)*.5);this.dust.fillRect(t.x-5,t.y-3,7,3);}
  }
  if(this.clock-this.lastHud>40){this.updateHud();this.lastHud=this.clock;}
 }
}
$('play').disabled=true;
function pressStart(){
 if(!bootFinished){finishBoot();return;}
 if(!gameScene)return;
 if(gameScene.mode==='ready')document.documentElement.requestFullscreen?.().catch(()=>{});
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
const phoneMedia=matchMedia('(pointer: coarse) and (max-width: 1100px)');
let stickPointer=null,stickOrigin={x:0,y:0};
const stickZone=$('joystick-zone'),stick=$('joystick'),knob=$('joystick-knob');
function resetStick(){stickPointer=null;touch.left=false;touch.right=false;stick.hidden=true;knob.style.transform='translate(0px,0px)';}
function moveStick(e){
 const dx=e.clientX-stickOrigin.x,dy=e.clientY-stickOrigin.y,distance=Math.hypot(dx,dy),radius=42;
 const factor=distance>radius?radius/distance:1;
 knob.style.transform=`translate(${dx*factor}px,${dy*factor}px)`;
 touch.left=dx< -10;touch.right=dx>10;
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
$('share').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(`${gameScene.activeStage?gameScene.activeStage.name:'La traversée de La Réunion'} : ${formatTime(gameScene.elapsed)} · ${gameScene.falls} chute(s) ! #LesToilesNoires #LaReunion`);toast('Résultat copié. À tes amis de jouer !');}catch{toast(`Mon temps : ${formatTime(gameScene.elapsed)}`);}});
function selectStage(id){
 selectedStage=id;for(const button of document.querySelectorAll('[data-stage]'))button.setAttribute('aria-pressed',String(button.dataset.stage===id));
 const stage=STAGES.find(s=>s.id===id);$('stage-description').textContent=stage?`${stage.difficulty} · ${stage.focus}`:'Les trois niveaux enchaînés · un chrono pour toute la traversée';
 try{best=readBest(localStorage,recordKey(id));}catch{best=null;}$('best').textContent=best?formatTime(best):'— — : — —';
}
for(const button of document.querySelectorAll('[data-stage]'))button.addEventListener('click',()=>selectStage(button.dataset.stage));
$('next-stage').addEventListener('click',()=>{selectStage(STAGES[gameScene.zone+1].id);gameScene.startRun();});
const game=new Phaser.Game({type:Phaser.AUTO,parent:'game',width:960,height:540,backgroundColor:'#20383f',pixelArt:true,roundPixels:true,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},input:{keyboard:{target:$('game')}},scene:[RunScene],render:{antialias:false},audio:{noAudio:true}});
function fitGameViewport(){
 const bounds=$('viewport').getBoundingClientRect();
 if(!bounds.width||!bounds.height)return;
 const width=phoneMedia.matches?Math.round(540*bounds.width/bounds.height):960;
 if(game.scale.gameSize.width!==width)game.scale.setGameSize(width,540);
 else game.scale.refresh();
 for(const background of gameScene?.backgrounds||[])background.setSize(width,540);
}
new ResizeObserver(fitGameViewport).observe($('viewport'));
window.addEventListener('resize',fitGameViewport);
window.__LTN__={get state(){const s=gameScene,p=s?.runner;return p?{mode:s.mode,x:p.x,y:p.feet-20,feet:p.feet,vx:p.vx,vy:p.vy,grounded:p.grounded,sliding:p.sliding,slope:p.slope,surface:p.surfaceId,loop:p.loop?.id??null,simTime:p.simTime,maxSpeed:p.maxSpeed,backgroundOffset:s.background.tilePositionX,cameraX:s.cameras.main.scrollX,elapsed:s.elapsed,zone:s.zone,falls:s.falls,count:s.count,best,stage:selectedStage,runEnd:s.runEnd,checkpoint:s.checkpoint.x,splits:s.splits}:null;},game};
