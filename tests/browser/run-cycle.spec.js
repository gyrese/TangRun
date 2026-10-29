import {test,expect} from '@playwright/test';

test('tangue uses sixteen distinct stride poses with a stable baseline and separate jump',async({page})=>{
 const errors=[],missing=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.url().includes('/assets/')&&r.status()>=400)missing.push(r.url());});
 await page.goto('/?perso=tangue');await page.waitForFunction(()=>window.__LTN__?.game.scene.getScene('run')?.mascot);await expect(page.locator('#play')).toBeEnabled();
 const result=await page.evaluate(()=>{
  const scene=window.__LTN__.game.scene.getScene('run'),p=scene.runner;
  p.grounded=true;p.sliding=false;p.vx=240;
  const frames=[];
  for(let i=0;i<16;i++){
   scene.mascotCycle={runner:p,time:scene.visualClock,mode:'run',phase:i/4};
   scene.syncPlayer(1);
   frames.push({texture:scene.mascot.texture.key,frame:scene.mascot.frame.name,x:scene.mascot.x,y:scene.mascot.y,originY:scene.mascot.originY});
  }
  p.vx=-240;scene.syncPlayer(1);const facingLeft=scene.mascot.flipX;
  p.vx=240;scene.syncPlayer(1);const facingRight=!scene.mascot.flipX;
  p.grounded=false;scene.syncPlayer(1);
  return {frames,facingLeft,facingRight,jump:{texture:scene.mascot.texture.key,frame:scene.mascot.frame.name}};
 });
 expect(result.frames.map(f=>Number(f.frame))).toEqual(Array.from({length:16},(_,i)=>i));
 expect(result.frames.every(f=>f.originY===62/64)).toBe(true);
 expect(result.frames.every(f=>f.texture==='mascot-run-cycle')).toBe(true);
 expect(new Set(result.frames.map(f=>`${f.x},${f.y}`)).size).toBe(1);
 expect(result.jump.texture).toBe('mascot');expect(Number(result.jump.frame)).toBe(5);
 expect(result.facingLeft&&result.facingRight).toBe(true);
 expect(errors).toEqual([]);expect(missing).toEqual([]);
});
