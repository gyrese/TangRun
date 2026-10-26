// Verify the built game entirely from disk, without a local HTTP listener.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
const root=path.resolve('dist'),output=path.resolve('.local/review-v6');
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||undefined});
const errors=[],missing=[],report=[];
try{
 for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:mobile?{width:844,height:390}:{width:1440,height:900},hasTouch:mobile,isMobile:mobile});
  await context.route('**/*',async route=>{
   const url=new URL(route.request().url());
   if(url.hostname!=='ltn.test')return route.fulfill({body:'',contentType:'text/css'});
   const file=path.resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
   if(!file.startsWith(root+path.sep))return route.abort();
   try{await route.fulfill({body:await fs.readFile(file),contentType:({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream'});}
   catch{missing.push(file);await route.fulfill({status:404,body:''});}
  });
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{Element.prototype.requestFullscreen=()=>Promise.resolve();});
  await page.goto('http://ltn.test');
  await page.waitForFunction(()=>window.__LTN__?.state&&document.querySelector('#play').disabled===false);
  await page.locator('#skip-boot').click();
  await page.screenshot({path:path.join(output,`${mobile?'phone':'desktop'}-menu.png`)});
  await page.locator('#play').click();
  for(const [label,x]of [['volcano',1400],['mafate',9950],['coast',20750]]){
   await page.evaluate(x=>{
    const s=window.__LTN__.game.scene.getScene('run');const floor=s.level.terrain.find(p=>x>=p.x&&x<=p.x+p.w);
    Object.assign(s.runner,{x,feet:floor.y+(x-floor.x)*floor.slope,vx:0,vy:0,grounded:true,surfaceId:floor.id,loop:null});s.syncPlayer();
   },x);
   await page.waitForTimeout(600);
   const stats=await page.evaluate(()=>{const s=window.__LTN__.game.scene.getScene('run');return{mode:s.mode,zoom:s.cameras.main.zoom,landmarks:s.level.adventure.landmarks.length,enemies:s.level.adventure.enemies.length,loaded:['lava','tamarin','case-creole','fern','vacoa','pirogue'].every(k=>s.textures.exists('v6-'+k))};});
   assert.equal(stats.mode,'running');assert.equal(stats.loaded,true);assert.equal(stats.enemies,18);if(mobile)assert.ok(stats.zoom>=1.16);
   report.push({mobile,label,...stats});await page.screenshot({path:path.join(output,`${mobile?'phone':'desktop'}-${label}.png`)});
  }
  await page.locator('#pause').click();const before=await page.evaluate(()=>window.__LTN__.game.scene.getScene('run').adventure.time);await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>window.__LTN__.game.scene.getScene('run').adventure.time),before);
  await page.locator('#play').click();
  await page.evaluate(()=>{const s=window.__LTN__.game.scene.getScene('run');s.runner.x=s.runEnd+1;});
  await page.waitForFunction(()=>window.__LTN__.state.mode==='finished');assert.match(await page.locator('#overlay-copy').textContent(),/RANG/);
  await page.screenshot({path:path.join(output,`${mobile?'phone':'desktop'}-finish.png`)});
  const play=await page.locator('#play').boundingBox();assert.ok(play.y>=0&&play.y+play.height<=(mobile?390:900));
  await page.locator('#play').click();assert.equal(await page.evaluate(()=>window.__LTN__.game.scene.getScene('run').adventure.relics.size),0);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await context.close();
 }
 assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
 await fs.writeFile(path.join(output,'report.json'),JSON.stringify({report,errors,missing},null,2));console.log(JSON.stringify({report,errors,missing},null,2));
}finally{await browser.close();}
