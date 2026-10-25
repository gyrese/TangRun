import {test,expect} from '@playwright/test';

async function launchFast(page){
 await page.addInitScript(()=>{Element.prototype.requestFullscreen=()=>Promise.resolve();});
 await page.goto('/');await expect(page.locator('#play')).toBeEnabled();await expect(page.locator('#boot-screen')).toBeHidden();
 await page.locator('[data-stage="coast"]').click();await page.locator('#play').click();
 await page.evaluate(async()=>{
  const {createRunner}=await import('/src/movement.js'),{groundAt,heightOn}=await import('/src/level.js');
  const s=window.__LTN__.game.scene.getScene('run'),floor=groundAt(s.level,18200);
  s.runner=createRunner(18200,heightOn(floor,18200));s.runner.surfaceId=floor.id;s.runner.vx=820;s.runner.rolling=true;
  s.syncPlayer();s.cameras.main.scrollX=17900;s.cameras.main.scrollY=220;
 });
 await page.keyboard.down('ArrowRight');await page.keyboard.down('ArrowDown');await page.waitForTimeout(450);
}
const sample=page=>page.evaluate(()=>{
 const s=window.__LTN__.game.scene.getScene('run'),f=s.speedFeedback;
 return{zoom:s.cameras.main.zoom,intensity:f.intensity,streaks:f.streakCount,trail:f.trail.length,time:s.visualClock,props:s.placedScenery.filter(p=>p.id.startsWith('path-cluster-')).length,details:s.level.pathDetails.length};
});

test('boost framing, wind, path dressing, pause and restart work together',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await launchFast(page);
 const fast=await sample(page);expect(fast.zoom).toBeLessThan(.98);expect(fast.zoom).toBeGreaterThanOrEqual(.935);
 expect(fast.streaks).toBeGreaterThan(5);expect(fast.props).toBe(57);expect(fast.details).toBeGreaterThan(300);
 await page.screenshot({path:'.local/speed-update/coast-fast.png'});
 await page.keyboard.up('ArrowRight');await page.keyboard.up('ArrowDown');await page.locator('#pause').click();
 const paused=await sample(page);await page.waitForTimeout(200);expect(await sample(page)).toEqual(paused);
 await page.locator('#play').click();await page.keyboard.press('r');
 const reset=await sample(page);expect(reset.zoom).toBe(1);expect(reset.streaks).toBe(0);expect(reset.trail).toBe(0);
 expect(errors).toEqual([]);
});

test('reduced motion keeps the full-speed game free of camera zoom and wind streaks',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await launchFast(page);
 const fast=await sample(page);expect(fast.zoom).toBe(1);expect(fast.intensity).toBe(0);expect(fast.streaks).toBe(0);expect(fast.trail).toBe(0);
 await page.keyboard.up('ArrowRight');await page.keyboard.up('ArrowDown');
});

test('phone boost keeps the whole viewport covered through rotation',async({browser})=>{
 const context=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true}),page=await context.newPage();
 await launchFast(page);const fast=await sample(page);expect(fast.zoom).toBeLessThan(.98);
 await page.keyboard.up('ArrowRight');await page.keyboard.up('ArrowDown');
 const covered=()=>page.evaluate(()=>{
  const s=window.__LTN__.game.scene.getScene('run'),c=s.cameras.main;
  return s.backgrounds.every(b=>b.width>=c.width/c.zoom-.1&&b.height>=c.height/c.zoom-.1);
 });
 expect(await covered()).toBe(true);await page.screenshot({path:'.local/speed-update/phone-fast.png'});
 await page.setViewportSize({width:390,height:844});await expect.poll(()=>page.evaluate(()=>window.__LTN__.state.mode)).toBe('paused');
 await page.setViewportSize({width:844,height:390});await expect(page.locator('.rotate-phone')).toBeHidden();expect(await covered()).toBe(true);
 await context.close();
});
