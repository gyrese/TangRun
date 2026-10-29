import {chromium} from '@playwright/test';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5184','--strictPort'],{windowsHide:true,stdio:'pipe'});
let browser;
try{
 await new Promise((resolve,reject)=>{server.stdout.on('data',d=>{if(d.toString().includes('Local:'))resolve();});server.on('error',reject);server.on('exit',c=>reject(Error(`Server exited ${c}`)));});
 browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 for(const [name,viewport]of [['desktop',{width:1440,height:1000}],['phone',{width:844,height:390}]]){
  const page=await browser.newPage({viewport}),errors=[];page.on('pageerror',e=>{errors.push(e.message);console.log('PAGE ERROR: '+JSON.stringify({name:e.name,message:e.message,stack:e.stack}));});
  await page.addInitScript(()=>{Element.prototype.requestFullscreen=()=>Promise.resolve();});
  await page.goto('http://127.0.0.1:5184/');await page.waitForFunction(()=>window.__LTN__?.game.scene.getScene('run')?.mode==='ready');
  if(await page.locator('#skip-boot').isVisible())await page.locator('#skip-boot').click();
  await page.locator('[data-stage="snow"]').click();await page.locator('#play').click();
  await page.evaluate(()=>{
   const s=window.__LTN__.game.scene.getScene('run');window.__snowCamera=[];
   s.game.events.on('postrender',()=>{
    const p=s.runner,c=s.cameras.main;if(s.mode!=='running')return;
    const gap=s.level.gaps.find(([a,b])=>a<8400&&p.x>a&&p.x<b);
    const landing=gap?s.level.terrain.find(t=>t.x<=gap[1]+1&&t.x+t.w>=gap[1]+1):null;
    window.__snowCamera.push({x:p.x,grounded:p.grounded,slope:p.slope,vy:p.vy,
     y:(p.feet-c.worldView.y)*c.zoom/s.scale.height,
     landingY:landing?(landing.y-c.worldView.y)*c.zoom/s.scale.height:null,
     zoom:c.zoom,time:s.visualClock,falls:s.falls});
   });
  });
  await page.keyboard.down('ArrowRight');
  await page.waitForFunction(()=>window.__LTN__.state.x>1000,{},{timeout:20000});await page.screenshot({path:`.local/snow-camera-${name}-slope.png`});
  await page.waitForFunction(()=>window.__LTN__.state.x>1800,{},{timeout:20000});await page.screenshot({path:`.local/snow-camera-${name}-fall.png`});
  await page.waitForFunction(()=>window.__LTN__.state.mode==='finished',{},{timeout:30000});await page.keyboard.up('ArrowRight');
  const samples=await page.evaluate(()=>window.__snowCamera),downhill=samples.filter(p=>p.x>600&&p.x<7600&&(p.grounded&&p.slope>.3||!p.grounded&&p.vy>200));
  const landings=downhill.filter(p=>p.landingY!==null);
  const zoomRates=samples.slice(1).map((p,i)=>p.time>samples[i].time?Math.abs(p.zoom-samples[i].zoom)/((p.time-samples[i].time)/1000):0);
  const report={view:name,maxZoomRate:Math.max(...zoomRates),frames:downhill.length,minY:Math.min(...downhill.map(p=>p.y)),maxY:Math.max(...downhill.map(p=>p.y)),visibleLandings:landings.filter(p=>p.landingY>0&&p.landingY<.98).length/landings.length,falls:samples.at(-1).falls};console.log(JSON.stringify(report));
  assert.ok(report.maxZoomRate<1.6,'Zoom changes progressively, without a frame jump');assert.ok(downhill.length>40);assert.ok(report.minY>.07,'Runner stays below the top edge');assert.ok(report.maxY<.60,'Runner stays above the lower screen area during descent');
  assert.ok(report.visibleLandings>.8,'Most falling frames show the lower landing');assert.equal(report.falls,0);assert.deepEqual(errors,[]);
  await page.close();
 }
}finally{await browser?.close();server.kill();}
