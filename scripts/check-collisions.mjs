import {chromium} from '@playwright/test';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5183','--strictPort'],{windowsHide:true,stdio:'pipe'});
let browser;
try{
 await new Promise((resolve,reject)=>{server.stdout.on('data',d=>{if(d.toString().includes('Local:'))resolve();});server.on('error',reject);server.on('exit',code=>reject(Error(`Server exited: ${code}`)));});
 browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{Element.prototype.requestFullscreen=()=>Promise.resolve();});
 await page.goto('http://127.0.0.1:5183/');
 await page.waitForFunction(()=>window.__LTN__?.game.scene.getScene('run')?.mode==='ready');
 if(await page.locator('#skip-boot').isVisible())await page.locator('#skip-boot').click();
 await page.locator('[data-stage="snow"]').click();await page.locator('#play').click();
 const result=await page.evaluate(async()=>{
  const {createRunner}=await import('/src/movement.js'),{groundAt,heightOn,movingSurfaces}=await import('/src/level.js'),{snapCameraToRunner}=await import('/src/speed-feedback.js');
  const s=window.__LTN__.game.scene.getScene('run');s.mode='paused';
  const checks=[];
  // A mismatched scene clock after a respawn must never displace moving art.
  s.clock=17000;
  for(const platform of movingSurfaces(s.level,2.1)){
   s.runner=createRunner(platform.x+platform.w/2,platform.y);s.runner.surfaceId=platform.id;s.runner.simTime=2.1;s.syncPlayer(1);
   const visual=s.movingArt.get(platform.id);
   checks.push({id:platform.id,error:Math.abs(visual.y-s.runner.feet)});
  }
  const floor=groundAt(s.level,1050);s.runner=createRunner(1050,heightOn(floor,1050));
  Object.assign(s.runner,{surfaceId:floor.id,sliding:true,rolling:true,vx:850,slope:floor.slope,angle:Math.atan(floor.slope)});
  s.syncPlayer(1);snapCameraToRunner(s);
  const sprite=s.mascot,bounds=s.mascotBounds.get(`${sprite.texture.key}:${sprite.frame.name}`);
  return{checks,roll:{height:(bounds.bottom-bounds.top)*sprite.scaleY,rotation:sprite.rotation,slope:s.runner.angle,feet:s.runner.feet,y:sprite.y,origin:sprite.originY,bottom:bounds.bottom/64}};
 });
 assert.ok(result.checks.length>=6);assert.ok(result.checks.every(c=>c.error<.001));
 assert.equal(result.roll.height,44);assert.ok(Math.abs(result.roll.rotation-result.roll.slope)<.001);assert.equal(result.roll.y,result.roll.feet+1);assert.equal(result.roll.origin,result.roll.bottom);
 await page.screenshot({path:'.local/collision-slope.png'});
 // Exercise real authored obstacles through the controller, then capture the
 // contact in the actual renderer rather than only checking a fabricated pose.
 for(const pose of ['arch-stop','arch-roll','crate-stop']){
  const contact=await page.evaluate(async(pose)=>{
   const {createRunner,stepRunner}=await import('/src/movement.js'),{groundAt,heightOn}=await import('/src/level.js'),{snapCameraToRunner}=await import('/src/speed-feedback.js');
   const s=window.__LTN__.game.scene.getScene('run');
   const obstacle=s.level.platforms.find(p=>p.id===(pose==='crate-stop'?'crate-volcano-2':'beam-tutorial'));
   const x=obstacle.x-95,floor=groundAt(s.level,x),p=createRunner(x,heightOn(floor,x));p.surfaceId=floor.id;
   s.runner=p;s.zone=1;s.backgrounds.forEach((b,i)=>b.setAlpha(i===1?1:0));
   for(let i=0;i<100;i++)stepRunner(p,{right:true},s.level,1/120);
   const stopped={x:p.x,feet:p.feet};
   if(pose==='arch-roll'){
    for(let i=0;i<180&&p.x<obstacle.x+obstacle.w/2;i++)stepRunner(p,{right:true,slide:true},s.level,1/120);
   }
   s.syncPlayer(1);snapCameraToRunner(s);
   const sprite=s.mascot,bounds=s.mascotBounds.get(`${sprite.texture.key}:${sprite.frame.name}`);
   return{stopped,obstacle:{x:obstacle.x,y:obstacle.y,w:obstacle.w,h:obstacle.h},x:p.x,feet:p.feet,sliding:p.sliding,visibleHeight:(bounds.bottom-bounds.top)*sprite.scaleY,crateDisplay:s.crateArt.get('crate-volcano-2').displayWidth};
  },pose);
  assert.equal(contact.stopped.x,contact.obstacle.x-20,pose+': walking stops at the actual edge');
  assert.equal(contact.crateDisplay,48,'Crate drawing has exactly the collision width');
  if(pose==='arch-roll'){
   assert.equal(contact.visibleHeight,44);assert.equal(contact.sliding,true);
   assert.ok(contact.x>contact.obstacle.x);assert.ok(contact.feet-44>=contact.obstacle.y+contact.obstacle.h);
  }
  await page.screenshot({path:'.local/'+pose+'.png'});
 }

 const loops=await page.evaluate(async()=>{
  const {createRunner}=await import('/src/movement.js'),{snapCameraToRunner}=await import('/src/speed-feedback.js');
  const {LOOP_ART}=await import('/src/loop-art.js');
  const s=window.__LTN__.game.scene.getScene('run'),checks=[];
  for(const l of s.level.loops){
   const image=s.children.list.find(o=>o.texture?.key.endsWith('loop-surface')&&o.x===l.x);
   const c=image.texture.context,{cx,cy,radius}=LOOP_ART;
   let inside=0,outside=0;
   for(let i=0;i<32;i++){
    const a=i*Math.PI/16;
    // Sample both sides of the actual rendered opening, around the entire rim.
    const alpha=r=>c.getImageData(Math.round(cx+Math.sin(a)*r),Math.round(cy+Math.cos(a)*r),1,1).data[3];
    inside=Math.max(inside,alpha(radius-3));outside=Math.min(i?outside:255,alpha(radius+3));
    s.runner=createRunner(l.x+Math.sin(a)*l.radius,l.baseY-l.radius+Math.cos(a)*l.radius);
    Object.assign(s.runner,{loop:{...l,angle:a,entry:820},angle:-a,grounded:false,sliding:true});
    s.syncPlayer(1);
    const distance=Math.hypot(s.mascot.x-l.x,s.mascot.y-(l.baseY-l.radius));
    if(Math.abs(distance-l.radius-1)>.001)throw Error('Loop sprite left the contact surface');
   }
   checks.push({id:l.id,inside,outside,radius:image.scaleX*radius,expected:l.radius});
  }
  const l=s.level.loops.find(l=>l.id==='ember-loop'),a=Math.PI*.8;
  s.runner=createRunner(l.x+Math.sin(a)*l.radius,l.baseY-l.radius+Math.cos(a)*l.radius);
  Object.assign(s.runner,{loop:{...l,angle:a,entry:820},angle:-a,grounded:false,sliding:true});
  s.syncPlayer(1);snapCameraToRunner(s);return checks;
 });
 for(const loop of loops){assert.equal(loop.inside,0,loop.id+': clear opening');assert.equal(loop.outside,255,loop.id+': solid visible rim');assert.equal(loop.radius,loop.expected);}
 await page.screenshot({path:'.local/collision-loop.png'});
 assert.deepEqual(errors,[]);
 console.log('Browser collision checks: moving platforms synchronized after clock reset; rolling contact, full slope rotation and loop contact aligned. No page errors.');
}finally{await browser?.close();server.kill();}
