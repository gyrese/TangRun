import {test,expect} from '@playwright/test';

test('complete route with keyboard, pause, restart and persistent record',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{Element.prototype.requestFullscreen=()=>Promise.resolve();});
  await page.goto('/');await expect(page.locator('#play')).toBeEnabled();
  await page.screenshot({path:'.local/desktop-ready.png',fullPage:true});
  await page.locator('#play').click();
  await expect(page.locator('#overlay')).toBeHidden();
  await page.waitForTimeout(200);
  expect((await page.evaluate(()=>window.__LTN__.state)).elapsed).toBe(0);
  await page.keyboard.down('ArrowRight');await page.waitForTimeout(500);await page.keyboard.up('ArrowRight');
  await page.keyboard.press('p');await expect.poll(()=>page.evaluate(()=>window.__LTN__.state.mode)).toBe('paused');const paused=await page.evaluate(()=>window.__LTN__.state);
  expect(paused.mode).toBe('paused');await page.waitForTimeout(250);
  expect((await page.evaluate(()=>window.__LTN__.state)).elapsed).toBe(paused.elapsed);
  await page.locator('#play').click();await page.keyboard.press('r');
  expect((await page.evaluate(()=>window.__LTN__.state)).elapsed).toBe(0);
  // Drive the actual keyboard interface. Anticipate the next physical obstruction.
  await page.evaluate(async()=>{
    const {buildLevel}=await import('/src/level.js');
    const {gaps,platforms}=buildLevel();
    const target=document.getElementById('game');
    const send=(type,key,code)=>target.dispatchEvent(new KeyboardEvent(type,{key,code,keyCode:code==='ArrowRight'?39:32,which:code==='ArrowRight'?39:32,bubbles:true}));
    send('keydown','ArrowRight','ArrowRight');
    let held=false,lastJump=0;
    window.__autoplay=setInterval(()=>{
      const s=window.__LTN__.state;
      if(s.mode!=='running'){send('keyup','ArrowRight','ArrowRight');send('keyup',' ','Space');clearInterval(window.__autoplay);return;}
      const now=performance.now();
      if(held&&now-lastJump>390){send('keyup',' ','Space');held=false;}
      if(!s.grounded||held)return;
      const gap=gaps.some(([a,b])=>s.x<a&&a-s.x<Math.max(55,s.vx*.17)&&s.x<b);
      const box=platforms.some(p=>(p.kind==='crate'||p.kind==='beam')&&p.x>s.x&&p.x-s.x<Math.max(90,s.vx*.22)&&p.y<s.feet);
      if(gap||box){send('keydown',' ','Space');held=true;lastJump=now;}
    },16);
  });
  await expect.poll(async()=> {const s=await page.evaluate(()=>window.__LTN__.state);return s.mode==='finished'?'finished':`${s.mode} x=${Math.round(s.x)} y=${Math.round(s.y)} falls=${s.falls}`;},{timeout:65000}).toBe('finished');
  const end=await page.evaluate(()=>window.__LTN__.state);
  expect(end.zone).toBe(2);expect(end.elapsed).toBeGreaterThan(18000);expect(end.best).toBeGreaterThan(0);expect(end.falls).toBe(0);expect(end.maxSpeed).toBeGreaterThan(600);
  expect(end.backgroundOffset).toBeGreaterThan(300);expect(end.backgroundOffset).toBeLessThan(end.cameraX*.1);
  await page.screenshot({path:'.local/desktop-finish.png',fullPage:true});
  await page.reload();await expect(page.locator('#best')).not.toContainText('—');
  expect(errors).toEqual([]);
});

test('mobile controls move and jump without overflow',async({page})=>{
  await page.addInitScript(()=>{Element.prototype.requestFullscreen=()=>Promise.resolve();});
  await page.setViewportSize({width:844,height:390});await page.goto('/');
  await expect(page.locator('#play')).toBeEnabled();
  await page.screenshot({path:'.local/mobile-ready.png',fullPage:true});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.locator('#play').click();
  const finger={x:135,y:240,id:1},right={x:195,y:240,id:1};
  const cdp=await page.context().newCDPSession(page);
  await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:2});
  await expect(page.locator('body')).toHaveClass(/phone-mode/);
  const jump=await page.locator('[data-control="jump"]').boundingBox();
  const slide=await page.locator('[data-control="slide"]').boundingBox();
  const point=(box,id)=>({x:box.x+box.width/2,y:box.y+box.height/2,id});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[finger]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[right]});await page.waitForTimeout(500);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[right,point(slide,2)]});await page.waitForTimeout(150);
  expect((await page.evaluate(()=>window.__LTN__.state)).sliding).toBe(true);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[right]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[right,point(jump,3)]});await page.waitForTimeout(150);
  const s=await page.evaluate(()=>window.__LTN__.state);
  expect(s.x).toBeGreaterThan(130);expect(s.y).toBeLessThan(420);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await page.locator('#pause').click();await expect(page.locator('#overlay')).toBeVisible();
  await page.screenshot({path:'.local/mobile-pause.png',fullPage:true});
});

test('environment sprites animate while ready and freeze when paused',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await expect(page.locator('#play')).toBeEnabled();
 const samples=[];
 for(let i=0;i<4;i++){
  samples.push(await page.evaluate(()=>{const s=window.__LTN__.game.scene.getScene('run');return{frame:s.liveWorld.sprites.find(a=>a.key==='fire').sprite.frame.name,time:s.visualClock,elapsed:s.elapsed,x:s.runner.x,bird:s.ambientLife.birds[0].texture.key,clusters:s.placedScenery.filter(p=>p.id.startsWith('cluster-')).length};}));
  await page.waitForTimeout(130);
 }
 expect(new Set(samples.map(s=>s.frame)).size).toBeGreaterThan(1);
 expect(samples.every(s=>s.elapsed===0&&s.x===80)).toBe(true);
 expect(new Set(samples.map(s=>s.bird)).size).toBeGreaterThan(1);expect(samples[0].clusters).toBeGreaterThan(35);
 await page.locator('#play').click();await page.locator('#pause').click();
 const paused=await page.evaluate(()=>window.__LTN__.game.scene.getScene('run').visualClock);
 await page.waitForTimeout(250);
 expect(await page.evaluate(()=>window.__LTN__.game.scene.getScene('run').visualClock)).toBe(paused);
 expect(errors).toEqual([]);
 await page.emulateMedia({reducedMotion:'reduce'});await page.reload();await expect(page.locator('#play')).toBeEnabled();
 await page.waitForTimeout(200);
 expect(await page.evaluate(()=>window.__LTN__.game.scene.getScene('run').liveWorld.sprites.find(a=>a.key==='fire').sprite.frame.name)).toBe(0);
});

test('lagoon loop rotates the mascot and returns to the main track',async({page})=>{
 await page.goto('/');await expect(page.locator('#play')).toBeEnabled();await page.locator('#play').click();
 await page.evaluate(async()=>{
  const{createRunner}=await import('/src/movement.js');const{groundAt,heightOn}=await import('/src/level.js');
  const scene=window.__LTN__.game.scene.getScene('run'),floor=groundAt(scene.level,18260);
  scene.runner=createRunner(18260,heightOn(floor,18260));scene.runner.surfaceId=floor.id;scene.runner.vx=700;scene.runner.rolling=true;
  window.__loopSeen={entered:false,top:1000,angles:new Set()};
  window.__loopSample=setInterval(()=>{const p=scene.runner;if(p.loop){window.__loopSeen.entered=true;window.__loopSeen.top=Math.min(window.__loopSeen.top,p.feet);window.__loopSeen.angles.add(Math.round(scene.mascot.angle/30));}},16);
 });
 await page.keyboard.down('ArrowRight');await page.waitForTimeout(3200);await page.keyboard.up('ArrowRight');
 const result=await page.evaluate(()=>{clearInterval(window.__loopSample);return{...window.__LTN__.state,entered:window.__loopSeen.entered,top:window.__loopSeen.top,angles:window.__loopSeen.angles.size};});
 expect(result.entered).toBe(true);expect(result.top).toBeLessThan(310);expect(result.angles).toBeGreaterThan(7);expect(result.loop).toBeNull();expect(result.x).toBeGreaterThan(18750);expect(result.falls).toBe(0);
});
