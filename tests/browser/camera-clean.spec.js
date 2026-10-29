import {test,expect} from '@playwright/test';
test('clean world has no route text boards and camera follows the actual runner in the loop',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{Element.prototype.requestFullscreen=()=>Promise.resolve();});
 await page.goto('/');await page.waitForFunction(()=>window.__LTN__?.game.scene.getScene('run')?.level);if(await page.locator('#boot-screen').isVisible())await page.locator('#skip-boot').click();await expect(page.locator('#play')).toBeEnabled();await expect(page.locator('#boot-screen')).toBeHidden();
 const count=await page.evaluate(()=>{const s=window.__LTN__.game.scene.getScene('run');return{props:s.decorPlan.all.length,boards:s.children.list.filter(p=>p.type==='Text'&&/Ravine|Courir|Maintenir|Ressort|sentier|Saint-Gilles/.test(p.text)).length};});
 expect(count.props).toBeLessThan(70);expect(count.boards).toBe(0);
 await page.locator('[data-stage="coast"]').click();await page.locator('#play').click();
 await page.evaluate(async()=>{
  const {createRunner}=await import('/src/movement.js'),{groundAt,heightOn}=await import('/src/level.js'),{snapCameraToRunner}=await import('/src/speed-feedback.js');
  const s=window.__LTN__.game.scene.getScene('run'),floor=groundAt(s.level,18260);
  s.runner=createRunner(18260,heightOn(floor,18260));s.runner.surfaceId=floor.id;s.runner.vx=750;s.runner.rolling=true;s.syncPlayer();snapCameraToRunner(s);
  window.__cameraSamples=[];
  s.game.events.on('postrender',()=>{if(s.mode!=='running')return;const p=s.runner,c=s.cameras.main;window.__cameraSamples.push({loop:!!p.loop,x:(p.x-c.worldView.x)*c.zoom,y:(p.feet-20-c.worldView.y)*c.zoom,proxyX:s.player.x,runnerX:p.x,zoom:c.zoom});});
 });
 await page.keyboard.down('ArrowRight');await page.keyboard.down('ArrowDown');await page.waitForTimeout(2600);
 await page.keyboard.up('ArrowRight');await page.keyboard.up('ArrowDown');
 const samples=await page.evaluate(()=>window.__cameraSamples.slice(3)),loop=samples.filter(p=>p.loop);
 expect(loop.length).toBeGreaterThan(8);
 for(const p of loop){expect(Math.abs(p.proxyX-p.runnerX)).toBeLessThanOrEqual(850/120+1);expect(p.x).toBeGreaterThan(80);expect(p.x).toBeLessThan(850);expect(p.y).toBeGreaterThan(65);expect(p.y).toBeLessThan(465);expect(p.zoom).toBe(1);}
 await page.evaluate(async()=>{
  const {createRunner}=await import('/src/movement.js'),{groundAt,heightOn}=await import('/src/level.js'),{snapCameraToRunner}=await import('/src/speed-feedback.js');
  const s=window.__LTN__.game.scene.getScene('run'),floor=groundAt(s.level,3060);
  s.runner=createRunner(3060,heightOn(floor,3060));s.runner.surfaceId=floor.id;s.runner.vx=330;s.syncPlayer();snapCameraToRunner(s);window.__cameraSamples=[];
 });
 await page.keyboard.down('ArrowRight');await page.waitForTimeout(1600);await page.keyboard.up('ArrowRight');
 await page.keyboard.down('ArrowLeft');await page.waitForTimeout(1000);await page.keyboard.up('ArrowLeft');
 const jumpAndTurn=await page.evaluate(()=>window.__cameraSamples.slice(3));
 expect(jumpAndTurn.length).toBeGreaterThan(20);
 for(const p of jumpAndTurn){expect(p.x).toBeGreaterThan(80);expect(p.x).toBeLessThan(880);expect(p.y).toBeGreaterThan(65);expect(p.y).toBeLessThan(475);}
 await page.screenshot({path:'.local/declutter/coast.png'});expect(errors).toEqual([]);
});
