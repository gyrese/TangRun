import {test,expect} from '@playwright/test';

async function start(page,stage='coast'){
 await page.addInitScript(()=>{Element.prototype.requestFullscreen=()=>Promise.resolve();});
 await page.goto('/');await expect(page.locator('#boot-screen')).toBeHidden({timeout:20000});
 await expect(page.locator('#play')).toBeEnabled();
 await page.locator(`[data-stage="${stage}"]`).click();await page.locator('#play').click();
}
async function reachFinish(page){
 await page.evaluate(async()=>{
  const s=window.__LTN__.game.scene.getScene('run');
  const {createRunner}=await import('/src/movement.js');
  const {groundAt,heightOn}=await import('/src/level.js');
  const x=s.runEnd-2,floor=groundAt(s.level,x);
  s.runner=createRunner(x,heightOn(floor,x));s.runner.surfaceId=floor.id;s.runner.vx=330;s.elapsed=42000;
  s.syncPlayer(1);s.cameras.main.centerOn(x+60,s.runner.feet-100);
 });
}

test('bar entrance opens, welcomes the runner, freezes timing and resets on replay',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await start(page);await reachFinish(page);
 await expect.poll(()=>page.evaluate(()=>window.__LTN__.state.mode)).toBe('arriving');
 const time=await page.evaluate(()=>window.__LTN__.state.elapsed);
 await expect(page.locator('#overlay')).toBeHidden();await expect(page.locator('#pause')).toBeDisabled();
 await expect(page.locator('#announcer')).toHaveText('Bienvenue à Les Toiles Noires');
 await expect.poll(()=>page.evaluate(()=>window.__LTN__.game.scene.getScene('run').bar.welcome.alpha)).toBe(1);
 const entrance=await page.evaluate(()=>{
  const s=window.__LTN__.game.scene.getScene('run');
  return{door:s.bar.doors[0].scaleX,alpha:s.mascot.alpha,guests:s.ambientLife.guests.length,elapsed:s.elapsed};
 });
 expect(entrance.door).toBeCloseTo(.12);expect(entrance.alpha).toBeLessThan(.1);expect(entrance.guests).toBeGreaterThanOrEqual(3);expect(entrance.elapsed).toBe(time);
 await page.screenshot({path:'.local/bar-arrival-welcome.png'});
 await expect.poll(()=>page.evaluate(()=>window.__LTN__.state.mode)).toBe('finished');
 await expect(page.locator('#overlay-title')).toContainText('Les Toiles Noires');
 expect(await page.evaluate(()=>window.__LTN__.state.elapsed)).toBe(time);
 await page.locator('#play').click();
 const replay=await page.evaluate(()=>{const s=window.__LTN__.game.scene.getScene('run');return{mode:s.mode,alpha:s.mascot.alpha,door:s.bar.doors[0].scaleX,message:s.bar.welcome.alpha};});
 expect(replay).toEqual({mode:'running',alpha:1,door:1,message:0});expect(errors).toEqual([]);
});

test('reduced motion entrance works on a phone and restarting cancels the sequence',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:844,height:390});
 await start(page);await reachFinish(page);
 await expect.poll(()=>page.evaluate(()=>window.__LTN__.state.mode)).toBe('arriving');
 expect(await page.evaluate(()=>window.__LTN__.game.scene.getScene('run').bar.welcome.alpha)).toBe(1);
 await page.locator('#game').focus();
 await page.keyboard.press('r');
 await expect.poll(()=>page.evaluate(()=>window.__LTN__.state.mode)).toBe('running');
 await page.waitForTimeout(1100);await expect(page.locator('#overlay')).toBeHidden();
 expect(await page.evaluate(()=>window.__LTN__.state.mode)).toBe('running');
 await reachFinish(page);await expect.poll(()=>page.evaluate(()=>window.__LTN__.state.mode)).toBe('finished');
 await expect(page.locator('#overlay-title')).toContainText('Les Toiles Noires');
 await page.screenshot({path:'.local/bar-arrival-mobile.png'});
});

test('intermediate stages keep their immediate results',async({page})=>{
 await start(page,'volcano');await reachFinish(page);
 await expect.poll(()=>page.evaluate(()=>window.__LTN__.state.mode)).toBe('finished');
 await expect(page.locator('#next-stage')).toBeVisible();
 expect(await page.evaluate(()=>window.__LTN__.game.scene.getScene('run').arrival)).toBeNull();
});

test('bar has its official sign and live interior that respects pause and reduced motion',async({page})=>{
 await start(page);
 const snapshot=()=>page.evaluate(()=>{
  const b=window.__LTN__.game.scene.getScene('run').bar;
  return{frame:b.activity.frame,patrons:b.activity.patrons.map(p=>[p.sprite.x,p.sprite.y,p.sprite.texture.key]),name:b.sign.text,logo:b.logo.texture.key,facade:{key:b.facade.texture.key,width:b.facade.width,displayWidth:b.facade.displayWidth,visible:b.facade.visible,alpha:b.facade.alpha}};
 });
 const first=await snapshot();
 expect(first.name).toBe('LES TOILES NOIRES');expect(first.logo).toBe('barLogo');expect(first.patrons).toHaveLength(5);
 expect(first.facade.key).toBe('toiles-noires-facade');expect(first.facade.width).toBeGreaterThan(1000);
 expect(first.facade.displayWidth).toBeGreaterThan(500);expect(first.facade.visible).toBe(true);expect(first.facade.alpha).toBe(1);
 await expect.poll(async()=>JSON.stringify(await snapshot())!==JSON.stringify(first)).toBe(true);
 await page.locator('#pause').click();const paused=await snapshot();
 await page.waitForTimeout(400);expect(await snapshot()).toEqual(paused);
 await page.emulateMedia({reducedMotion:'reduce'});await page.reload();
 await expect(page.locator('#boot-screen')).toBeHidden({timeout:20000});await expect(page.locator('#play')).toBeEnabled();
 const reduced=await snapshot();await page.waitForTimeout(400);
 expect(reduced.frame).toBe(0);expect(await snapshot()).toEqual(reduced);
});
