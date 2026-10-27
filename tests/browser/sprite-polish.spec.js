import {test,expect} from '@playwright/test';

test('pixel-art props animate, keep their anchors and freeze when paused',async({page})=>{
 const errors=[],missing=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().includes('/assets/')&&r.status()>=400)missing.push(r.url());});
 await page.addInitScript(()=>Element.prototype.requestFullscreen=()=>Promise.resolve());await page.emulateMedia({reducedMotion:'no-preference'});
 await page.goto('/');await page.bringToFront();await expect(page.locator('#boot-screen')).toBeHidden();await expect(page.locator('#play')).toBeEnabled();await page.locator('#play').click();
 const art=await page.evaluate(()=>{
  const s=window.__LTN__.game.scene.getScene('run');
  const inspect=key=>{const im=s.textures.get(key).getSourceImage(),c=document.createElement('canvas');c.width=im.width;c.height=im.height;const ctx=c.getContext('2d');ctx.drawImage(im,0,0);const d=ctx.getImageData(0,0,c.width,c.height).data,colors=new Set(),alpha=new Set();let bottom=-1,hash=2166136261;
   for(let i=0;i<d.length;i+=4){alpha.add(d[i+3]);if(d[i+3]){colors.add(`${d[i]},${d[i+1]},${d[i+2]}`);bottom=Math.max(bottom,Math.floor(i/4/c.width));}hash=Math.imul(hash^d[i],16777619);hash=Math.imul(hash^d[i+3],16777619);}
   return{key,width:c.width,height:c.height,colors:colors.size,alpha:[...alpha],bottom,hash};};
  return{drone:[0,1,2,3].map(i=>inspect(`v6-drone-${i}`)),spring:[0,1,2,3].map(i=>inspect(`polish-spring-${i}`)),flag:[0,1,2,3].map(i=>inspect(`polish-checkpoint-${i}`)),newFamilies:['v6-crab','v6-relic','v6-cache','v6-shield','polish-boost','polish-sign','polish-finish','polish-aura','polish-hit','guest-0','bird'].map(prefix=>[0,1,2,3].map(i=>inspect(`${prefix}-${i}`))),coin:inspect('token'),rocks:s.decorPlan.all.filter(p=>p.foundation).map(p=>p.foundation.variation)};
 });
 for(const frames of [art.drone,art.spring,art.flag,...art.newFamilies]){
  expect(new Set(frames.map(f=>f.hash)).size).toBe(4);
  for(const f of frames){expect(f.colors).toBeLessThanOrEqual(32);expect(f.alpha.every(a=>a===0||a===255)).toBe(true);}
 }
 for(const frames of [art.spring,art.flag])expect(Math.max(...frames.map(f=>f.bottom))-Math.min(...frames.map(f=>f.bottom))).toBeLessThanOrEqual(1);
 expect(art.coin.colors).toBeLessThanOrEqual(32);expect(art.rocks.every(v=>v<=8)).toBe(true);
 await page.evaluate(async()=>{const {groundAt,heightOn}=await import('/src/level.js'),{createRunner}=await import('/src/movement.js'),{snapCameraToRunner}=await import('/src/speed-feedback.js');const s=window.__LTN__.game.scene.getScene('run'),f=groundAt(s.level,3000);s.runner=createRunner(3000,heightOn(f,3000));s.runner.surfaceId=f.id;s.syncPlayer();snapCameraToRunner(s);});
 const flags=new Set(),drones=new Set(),coins=new Set();
 await expect.poll(async()=>{
  const sample=await page.evaluate(()=>{const s=window.__LTN__.game.scene.getScene('run');return{flag:s.checkpointArt[0].sprite.texture.key,drone:s.adventureArt.enemies.get('enemy-1').texture.key,coin:s.coins.find(c=>c.active&&Math.abs(c.x-s.runner.x)<350)?.texture.key};});
  flags.add(sample.flag);drones.add(sample.drone);coins.add(sample.coin);return Math.min(flags.size,drones.size,coins.size);
 },{timeout:4000,intervals:[100]}).toBeGreaterThan(2);
 await page.locator('#pause').click();
 const snap=()=>page.evaluate(()=>{const s=window.__LTN__.game.scene.getScene('run');return{time:s.visualClock,flag:s.checkpointArt[0].sprite.texture.key,drone:s.adventureArt.enemies.get('enemy-1').texture.key,coin:s.coins.find(c=>c.active&&Math.abs(c.x-s.runner.x)<350)?.texture.key};});
 const paused=await snap();await page.waitForTimeout(250);expect(await snap()).toEqual(paused);
 expect(errors).toEqual([]);expect(missing).toEqual([]);
});

test('spring animation reacts to the actual spring and preserves its ground contact',async({page})=>{
 await page.addInitScript(()=>Element.prototype.requestFullscreen=()=>Promise.resolve());await page.goto('/');await expect(page.locator('#boot-screen')).toBeHidden();await expect(page.locator('#play')).toBeEnabled();await page.locator('#play').click();
 const results=await page.evaluate(async()=>{
  const{groundAt,heightOn}=await import('/src/level.js'),{createRunner,stepRunner}=await import('/src/movement.js'),{updateAmbientLife}=await import('/src/ambient-life.js');
  const s=window.__LTN__.game.scene.getScene('run'),spring=s.level.springs[0],f=groundAt(s.level,spring.x),art=s.springArt.find(a=>a.x===spring.x);
  s.mode='paused';s.runner=createRunner(spring.x,heightOn(f,spring.x));s.runner.surfaceId=f.id;
  stepRunner(s.runner,{right:true},s.level,1/120);
  const frames=[],ys=[];
  for(const delta of [0,80,100,130]){s.visualClock+=delta;updateAmbientLife(s,false);frames.push(art.sprite.texture.key);ys.push(art.sprite.y);}
  return{cooldown:s.runner.springCooldown,vy:s.runner.vy,frames,ys};
 });
 expect(results.cooldown).toBeGreaterThan(.9);expect(results.vy).toBeLessThan(0);expect(new Set(results.frames).size).toBe(4);expect(new Set(results.ys).size).toBe(1);
});
