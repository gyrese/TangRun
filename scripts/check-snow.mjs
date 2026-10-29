import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';

const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5182','--strictPort'],{windowsHide:true,stdio:'pipe'});
let browser;
try{
 await new Promise((resolve,reject)=>{server.stdout.on('data',d=>{if(d.toString().includes('Local:'))resolve();});server.on('error',reject);server.on('exit',code=>reject(new Error(`Server exited: ${code}`)));});
 browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],missing=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400)missing.push(`${r.status()} ${r.url()}`);});
 await page.addInitScript(()=>{Element.prototype.requestFullscreen=()=>Promise.resolve();});
 await page.goto('http://127.0.0.1:5182/');
 await page.waitForFunction(()=>window.__LTN__?.game.scene.getScene('run')?.mode==='ready');
 if(await page.locator('#skip-boot').isVisible())await page.locator('#skip-boot').click();
 await page.locator('[data-stage="snow"]').click();await page.locator('#play').click();
 await page.waitForFunction(()=>window.__LTN__.state.mode==='running');
 const snow=await page.evaluate(()=>{const s=window.__LTN__.game.scene.getScene('run');return{backgrounds:s.backgrounds.map(b=>({key:b.texture.key,alpha:b.alpha})),lava:s.ravineArt.lava.map(l=>l.left),flakes:s.liveWorld.snowflakes.length};});
 assert.equal(snow.backgrounds[0].alpha,1);assert.equal(snow.backgrounds[3].alpha,0);assert.ok(snow.lava.every(x=>x>=8400&&x<16800));assert.ok(snow.flakes>0);
 await page.screenshot({path:'.local/snow-fixed.png'});
 await page.keyboard.down('ArrowRight');
 await page.waitForTimeout(500);
 const running=await page.evaluate(()=>{const s=window.__LTN__.game.scene.getScene('run');return{x:s.runner.x,frame:s.mascot.frame.name,texture:s.mascot.texture.key,phase:s.mascotCycle.phase};});
 assert.ok(running.x>80);assert.equal(running.texture,'mascot-run-cycle');assert.ok(Number.isFinite(running.phase));
 await page.waitForTimeout(500);
 assert.ok((await page.evaluate(()=>window.__LTN__.state.x))>running.x,'Running must continue without freezing');
 await page.keyboard.press('Space');await page.waitForTimeout(500);
 await page.keyboard.down('ArrowDown');await page.waitForTimeout(1000);await page.keyboard.up('ArrowDown');await page.keyboard.up('ArrowRight');
 // Run the full snow descent with right held: the downhill takeoffs must
 // cross all three deep ravines, and the camera must follow below the summit.
 await page.locator('#pause').click();await page.locator('#restart').click();
 await page.keyboard.down('ArrowRight');
 await page.waitForFunction(()=>window.__LTN__.state.x>4300,{},{timeout:20000});
 const descent=await page.evaluate(()=>{const s=window.__LTN__.game.scene.getScene('run');return{feet:s.runner.feet,cameraY:s.cameras.main.scrollY,falls:s.falls,snow:{particles:s.snowFX.particles.length,tracks:s.snowFX.tracks.length,landings:s.snowFX.landings}};});
 assert.equal(descent.falls,0);assert.ok(Math.abs(descent.cameraY-descent.feet)<600);
 assert.ok(descent.snow.particles>0&&descent.snow.particles<=192,'Visible powder is bounded');
 assert.ok(descent.snow.tracks>0&&descent.snow.tracks<=180,'Sliding leaves a bounded snow trail');
 assert.ok(descent.snow.landings>=2,'Deep landings emit snow bursts');
 await page.locator('#pause').click();
 const frozen=await page.evaluate(()=>{const s=window.__LTN__.game.scene.getScene('run');return{time:s.visualClock,particles:JSON.stringify(s.snowFX.particles),tracks:JSON.stringify(s.snowFX.tracks)};});
 await page.waitForTimeout(150);
 assert.deepEqual(await page.evaluate(()=>{const s=window.__LTN__.game.scene.getScene('run');return{time:s.visualClock,particles:JSON.stringify(s.snowFX.particles),tracks:JSON.stringify(s.snowFX.tracks)};}),frozen,'Pause freezes snow effects');
 await page.locator('#play').click();await page.keyboard.up('ArrowRight');await page.keyboard.down('ArrowRight');
 await page.screenshot({path:'.local/snow-descent.png'});
 await page.waitForFunction(()=>window.__LTN__.state.mode==='finished',{},{timeout:20000});
 await page.keyboard.up('ArrowRight');assert.equal((await page.evaluate(()=>window.__LTN__.state.falls)),0);
 assert.deepEqual(errors,[]);
 await page.locator('#play').click();
 for(const [stage,zone]of [['volcano',1],['mafate',2],['coast',3],['snow',0]]){
  await page.locator('#pause').click();await page.evaluate(()=>{document.querySelector('#stage-picker').hidden=false;});
  await page.locator(`[data-stage="${stage}"]`).click();await page.locator('#restart').click();
  await page.waitForTimeout(80);
  const state=await page.evaluate(()=>{const s=window.__LTN__.game.scene.getScene('run');return{zone:s.zone,backgrounds:s.backgrounds.map(b=>b.alpha)};});
  assert.equal(state.zone,zone);assert.ok(state.backgrounds[zone]>.5);assert.equal(state.backgrounds.slice(zone+1).some(a=>a>0),false);
 }
 const cleared=await page.evaluate(async()=>{
  const {updateSnowEffects}=await import('/src/snow-effects.js'),s=window.__LTN__.game.scene.getScene('run');
  updateSnowEffects(s,true);return{s:s.snowFX.particles.length,t:s.snowFX.tracks.length,visible:s.snowFX.splashes.some(b=>b.sprite.visible)};
 });assert.deepEqual(cleared,{s:0,t:0,visible:false},'Reduced motion clears snow effects');
 await page.goto('http://127.0.0.1:5182/?admin');await page.waitForFunction(()=>window.__LTN_EDITOR__?.ready);
 for(const [region,index]of [['0',0],['8400',1],['16800',2],['25200',3]]){
  await page.locator('#region').selectOption(region);await page.waitForTimeout(120);
  const backgrounds=await page.evaluate(()=>window.__LTN_EDITOR__.backgrounds);
  assert.equal(backgrounds[index].alpha,1);assert.equal(backgrounds.filter(b=>b.alpha>0).length,1);
 }
 assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
 console.log('Powder, downhill tracks, landing bursts, pause, bounded pools, snow movement, four stage backgrounds, editor regions: OK. No browser errors or missing assets.');
}finally{await browser?.close();server.kill();}
