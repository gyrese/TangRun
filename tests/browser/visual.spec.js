import {test,expect} from '@playwright/test';

test('all regions render their assets and readable mechanisms',async({page})=>{
 const errors=[],missing=[];page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.url().includes('/assets/')&&r.status()>=400)missing.push(r.url());});
 await page.addInitScript(()=>{Element.prototype.requestFullscreen=()=>Promise.resolve();});
 await page.goto('/');await expect(page.locator('#play')).toBeEnabled();await expect(page.locator('#boot-screen')).toBeHidden();
 for(const [id,x]of [['volcano',2280],['mafate',12150],['coast',18750]]){
  await page.locator(`[data-stage="${id}"]`).click();await page.locator('#play').click();
  await page.evaluate(async x=>{
   const {createRunner}=await import('/src/movement.js'),{groundAt,heightOn}=await import('/src/level.js');
   const s=window.__LTN__.game.scene.getScene('run'),floor=groundAt(s.level,x);
   s.runner=createRunner(x,heightOn(floor,x));s.runner.surfaceId=floor.id;s.syncPlayer();
   s.cameras.main.stopFollow();s.cameras.main.setScroll(x-310,Math.max(0,s.runner.feet-370));
  },x);
  await page.waitForTimeout(120);await page.screenshot({path:`.local/review-v5/region-${id}.png`});
  await page.locator('#pause').click();
  // Return to selection through a completed practice segment.
  await page.locator('#play').click();await page.evaluate(()=>{const s=window.__LTN__.game.scene.getScene('run');s.runner.x=s.runEnd+1;});
  await expect(page.locator('#stage-picker')).toBeVisible();
 }
 expect(errors).toEqual([]);expect(missing).toEqual([]);
});
