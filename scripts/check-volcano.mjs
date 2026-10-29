import {chromium} from '@playwright/test';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5184','--strictPort'],{windowsHide:true,stdio:'pipe'});
let browser;
try{
 await new Promise((resolve,reject)=>{server.stdout.on('data',d=>{if(d.toString().includes('Local:'))resolve();});server.on('error',reject);server.on('exit',code=>reject(Error(`Server exited: ${code}`)));});
 browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{Element.prototype.requestFullscreen=()=>Promise.resolve();});
 await page.goto('http://127.0.0.1:5184/');
 await page.waitForFunction(()=>window.__LTN__?.game.scene.getScene('run')?.mode==='ready');
 if(await page.locator('#skip-boot').isVisible())await page.locator('#skip-boot').click();
 if(await page.locator('[data-stage="volcano"]').count())await page.locator('[data-stage="volcano"]').click();
 await page.locator('#play').click();
 for(const section of ['cinder','organs','terraces']){
  const result=await page.evaluate(async section=>{
   const {createRunner,stepRunner}=await import('/src/movement.js');
   const {groundAt,heightOn}=await import('/src/level.js');
   const {snapCameraToRunner}=await import('/src/speed-feedback.js');
   const {updateLivingWorld}=await import('/src/living-world.js');
   const {updateSnowEffects}=await import('/src/snow-effects.js');
   const s=window.__LTN__.game.scene.getScene('run');s.mode='paused';
   const start=section==='cinder'?8510:section==='organs'?11460:13500;
   const end=section==='cinder'?10100:section==='organs'?12900:15800;
   const floor=groundAt(s.level,start),p=createRunner(start,heightOn(floor,start));p.surfaceId=floor.id;p.vx=330;
   let held=false,until=0,visited=new Set();
   for(let i=0;i<2400&&p.x<end;i++){
    let jump=false;const time=i/120;
    if(section==='cinder'){
     jump=p.grounded&&p.x>=8550&&p.x<8630||held&&!p.grounded&&p.x<8700;if(jump)held=true;
    }else if(section==='terraces'){
     if(p.grounded&&time>until){
      const roof=s.level.platforms.find(q=>q.id===p.surfaceId),spring=s.level.springs.some(q=>q.surface===p.surfaceId&&q.x>=p.x);
      if(p.x<13550||roof&&!roof.rail&&!spring&&roof.x+roof.w-p.x<Math.max(70,p.vx*.2))until=time+.4;
     }
     jump=time<until;
    }
    stepRunner(p,{right:true,jump},s.level,1/120);if(p.grounded)visited.add(p.surfaceId);
   }
   if(section==='cinder')s.volcanoCinderPreview=p;
   s.runner=p;s.visualClock=p.simTime*1000;s.zone=1;s.backgrounds.forEach((b,i)=>b.setAlpha(i===1?1:0));
   s.syncPlayer(1);snapCameraToRunner(s);updateLivingWorld(s,true);updateSnowEffects(s,true);s.updateHud();
   return{x:p.x,feet:p.feet,grounded:p.grounded,visited:[...visited]};
  },section);
  assert.ok(result.feet<0,`${section}: real traversal reaches the summit`);assert.ok(result.grounded);
  await page.screenshot({path:`.local/volcano-${section}-summit.png`});
 }
 await page.evaluate(async()=>{
  const {fitSpeedBackdrop}=await import('/src/speed-feedback.js');
  const s=window.__LTN__.game.scene.getScene('run');
  s.runner=s.volcanoCinderPreview;s.syncPlayer(1);
  s.cameras.main.stopFollow().setZoom(.48).centerOn(9750,250);fitSpeedBackdrop(s);
  for(const bg of s.backgrounds){
   const source=bg.texture.getSourceImage();bg.setTileScale(Math.max(bg.width/source.width,bg.height/source.height));
  }
 });
 await page.screenshot({path:'.local/volcano-vertical-overview.png'});
 assert.deepEqual(errors,[]);
 console.log('Volcano browser checks: three summits reached through real jumps, ramps and relays; no page errors.');
}finally{await browser?.close();server.kill();}
