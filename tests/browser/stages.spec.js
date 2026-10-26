import {test,expect} from '@playwright/test';

test('level selection, independent records, next level and recovery',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{Element.prototype.requestFullscreen=()=>Promise.resolve();});
 await page.goto('/');await expect(page.locator('#play')).toBeEnabled();await expect(page.locator('#boot-screen')).toBeHidden();
 await page.screenshot({path:'.local/review-v5/selection-desktop.png'});
 for(const [id,zone,start,end]of [['volcano',0,80,8350],['mafate',1,8500,16750],['coast',2,16900,24700]]){
  await page.locator(`[data-stage="${id}"]`).click();await page.locator('#play').click();
  const state=await page.evaluate(()=>window.__LTN__.state);
  expect(state.stage).toBe(id);expect(state.zone).toBe(zone);expect(state.x).toBe(start);expect(state.runEnd).toBe(end);expect(state.elapsed).toBe(0);
  await page.keyboard.down('ArrowRight');await page.waitForTimeout(180);await page.keyboard.up('ArrowRight');
  await page.evaluate(()=>{const s=window.__LTN__.game.scene.getScene('run');s.runner.feet=1100;s.runner.grounded=false;s.runner.surfaceId=null;});
  await expect.poll(()=>page.evaluate(()=>window.__LTN__.state.falls)).toBe(1);
  expect((await page.evaluate(()=>window.__LTN__.state)).checkpoint).toBe(start);
  await page.evaluate(()=>{const s=window.__LTN__.game.scene.getScene('run');s.runner.x=s.runEnd+1;});
  await expect.poll(()=>page.evaluate(()=>window.__LTN__.state.mode)).toBe('finished');
  await expect(page.locator('#split-results')).toContainText(':');
  if(zone<2){await expect(page.locator('#next-stage')).toBeVisible();}else{await expect(page.locator('#next-stage')).toBeHidden();}
 }
 const records=await page.evaluate(()=>Object.keys(localStorage).filter(k=>k.includes('v6-island-adventure')));expect(records).toHaveLength(3);
 await page.locator('[data-stage="campaign"]').click();await expect(page.locator('#best')).toContainText('—');
 await page.locator('[data-stage="volcano"]').click();await page.locator('#play').click();
 await page.evaluate(()=>{const s=window.__LTN__.game.scene.getScene('run');s.runner.x=s.runEnd+1;});
 await expect(page.locator('#next-stage')).toBeVisible();await page.locator('#next-stage').click();
 expect((await page.evaluate(()=>window.__LTN__.state)).stage).toBe('mafate');
 await page.locator('#pause').click();await expect(page.locator('#stage-picker')).toBeHidden();
 expect(errors).toEqual([]);
});

test('landscape selection fits on a phone and has visible keyboard focus',async({page})=>{
 await page.setViewportSize({width:844,height:390});await page.goto('/');await expect(page.locator('#boot-screen')).toBeHidden();
 for(const id of ['campaign','volcano','mafate','coast']){
  const b=page.locator(`[data-stage="${id}"]`);await b.focus();
  const rect=await b.boundingBox();expect(rect.y).toBeGreaterThanOrEqual(0);expect(rect.y+rect.height).toBeLessThanOrEqual(390);expect(rect.height).toBeGreaterThanOrEqual(44);
 }
 const play=await page.locator('#play').boundingBox();expect(play.y+play.height).toBeLessThanOrEqual(390);
 await page.screenshot({path:'.local/review-v5/selection-phone.png'});
});

test('phone finish keeps replay and next level accessible',async({browser})=>{
 const context=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true}),page=await context.newPage();
 await page.addInitScript(()=>{Element.prototype.requestFullscreen=()=>Promise.resolve();});
 await page.goto('/');await expect(page.locator('#boot-screen')).toBeHidden();await expect(page.locator('#play')).toBeEnabled();
 await page.locator('[data-stage="volcano"]').click();await page.locator('#play').click();
 await page.evaluate(()=>{const s=window.__LTN__.game.scene.getScene('run');s.elapsed=19000;s.runner.x=s.runEnd+1;});
 await expect(page.locator('#next-stage')).toBeVisible();
 await page.screenshot({path:'.local/review-v5/finish-phone.png'});
 for(const id of ['play','next-stage']){const rect=await page.locator(`#${id}`).boundingBox();expect(rect.y).toBeGreaterThanOrEqual(0);expect(rect.y+rect.height).toBeLessThanOrEqual(390);}
 await context.close();
});
