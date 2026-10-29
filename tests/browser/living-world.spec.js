import {test,expect} from '@playwright/test';

async function start(page,stage){
 await page.addInitScript(()=>{Element.prototype.requestFullscreen=()=>Promise.resolve();});
 await page.goto('/');
 await page.waitForFunction(()=>window.__LTN__?.game.scene.getScene('run')?.mode==='ready');
 if(await page.locator('#skip-boot').isVisible())await page.locator('#skip-boot').click();
 await expect(page.locator('#boot-screen')).toBeHidden({timeout:20000});
 await page.locator(`[data-stage="${stage}"]`).click();await page.locator('#play').click();
}

for(const [zone,stage]of ['snow','volcano','mafate','coast'].entries()){
 test(`${stage}: background moves at rest and freezes on pause`,async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await start(page,stage);
  const first=await page.evaluate(zone=>{
   const s=window.__LTN__.game.scene.getScene('run');return{x:s.runner.x,sample:s.backdropLife.layers[zone].sample,alphas:s.backgrounds.map(b=>b.alpha)};
  },zone);
  const canvas=page.locator('#game canvas'),bounds=await canvas.boundingBox();
  const clip={x:bounds.x+bounds.width*.15,y:bounds.y+bounds.height*.2,width:bounds.width*.7,height:bounds.height*.3};
  const image=await page.screenshot({clip});
  await page.waitForTimeout(800);
  const next=await page.evaluate(zone=>{
   const s=window.__LTN__.game.scene.getScene('run');return{x:s.runner.x,sample:s.backdropLife.layers[zone].sample};
  },zone);
  expect(first.alphas).toEqual([0,1,2,3].map(i=>Number(i===zone)));
  expect(next.x).toBe(first.x);expect(next.sample.time).toBeGreaterThan(first.sample.time);expect(next.sample.weight).toBe(1);
  expect(image.equals(await page.screenshot({clip}))).toBe(false);
  await page.screenshot({path:`.local/living-${stage}.png`});
  await page.locator('#pause').click();
  const paused=await page.evaluate(()=>window.__LTN__.game.scene.getScene('run').visualClock);
  await page.waitForTimeout(250);expect(await page.evaluate(()=>window.__LTN__.game.scene.getScene('run').visualClock)).toBe(paused);
  expect(errors).toEqual([]);
 });
}

test('rolling cycles all four ball poses while the runner moves',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await start(page,'snow');
 await page.evaluate(()=>{
  const s=window.__LTN__.game.scene.getScene('run');window.__rollFrames=[];
  s.game.events.on('postrender',()=>{if(s.runner.sliding&&s.mascot.texture.key==='mascot-extras')window.__rollFrames.push(s.mascot.frame.name);});
 });
 await page.keyboard.down('ArrowRight');await page.waitForTimeout(250);await page.keyboard.down('ArrowDown');await page.waitForTimeout(1400);
 await page.keyboard.up('ArrowDown');await page.keyboard.up('ArrowRight');
 const frames=await page.evaluate(()=>[...new Set(window.__rollFrames)]);
 expect(frames.sort()).toEqual([0,1,2,3]);expect(await page.evaluate(()=>window.__LTN__.state.x)).toBeGreaterThan(200);
 expect(errors).toEqual([]);
});

test('reduced motion holds background atmosphere still',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await start(page,'coast');
 const first=await page.evaluate(()=>window.__LTN__.game.scene.getScene('run').backdropLife.layers[3].sample);
 await page.waitForTimeout(250);
 expect(await page.evaluate(()=>window.__LTN__.game.scene.getScene('run').backdropLife.layers[3].sample)).toEqual(first);
});
