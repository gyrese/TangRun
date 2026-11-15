import {test,expect} from '@playwright/test';

test('phone can start and restart without fullscreen or growing texture allocations',async({browser})=>{
 const context=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.fullscreenRequests=0;Element.prototype.requestFullscreen=()=>{window.fullscreenRequests++;return Promise.resolve();};});
 await page.goto('/');
 await page.waitForFunction(()=>window.__LTN__?.game.scene.getScene('run')?.level);
 await expect(page.locator('#boot-screen')).toBeHidden({timeout:15000});
 await expect(page.locator('#play')).toBeEnabled();
 const textures=()=>page.evaluate(()=>{
  const s=window.__LTN__.game.scene.getScene('run');
  return Object.keys(s.textures.list).length;
 });
 await page.locator('#play').click();
 await expect.poll(()=>page.evaluate(()=>window.__LTN__.state.mode)).toBe('running');
 const initial=await textures();
 for(let i=0;i<5;i++){
  await page.locator('#pause').click();
  await page.locator('#restart').click();
  await expect.poll(()=>page.evaluate(()=>window.__LTN__.state.mode)).toBe('running');
 }
 expect(await textures()).toBe(initial);
 expect(await page.evaluate(()=>window.fullscreenRequests)).toBe(0);
 const cdp=await context.newCDPSession(page);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:120,y:260,id:1}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:180,y:260,id:1}]});
 await expect(page.locator('#joystick')).toBeVisible();
 await page.evaluate(()=>{
  window.dispatchEvent(new Event('resize'));
  const s=window.__LTN__.game.scene.getScene('run');
  window.backdropResizes=0;
  for(const bg of s.backgrounds){const original=bg.setSize;bg.setSize=function(...args){window.backdropResizes++;return original.apply(this,args);};}
 });
 await expect(page.locator('#joystick')).toBeVisible();
 await expect.poll(()=>page.evaluate(()=>window.__LTN__.state.vx)).toBeGreaterThan(100);
 await page.waitForTimeout(600);
 expect(await page.evaluate(()=>window.backdropResizes)).toBe(0);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 expect(errors).toEqual([]);
 await page.screenshot({path:'.local/mobile-start.png'});
 await context.close();
});
