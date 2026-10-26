import {test,expect} from '@playwright/test';

test('tangue uses all eight dedicated stride poses and keeps its jump pose separate',async({page})=>{
 const errors=[],missing=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.url().includes('/assets/')&&r.status()>=400)missing.push(r.url());});
 await page.goto('/?perso=tangue');await expect(page.locator('#play')).toBeEnabled();
 const result=await page.evaluate(()=>{
  const scene=window.__LTN__.game.scene.getScene('run'),p=scene.runner;
  p.grounded=true;p.sliding=false;p.vx=240;
  const frames=[];
  for(let i=0;i<8;i++){
   scene.mascotCycle={runner:p,time:scene.visualClock,mode:'run',phase:i/2};
   scene.syncPlayer();
   frames.push({texture:scene.mascot.texture.key,frame:scene.mascot.frame.name,x:scene.mascot.x,y:scene.mascot.y});
  }
  p.grounded=false;scene.syncPlayer();
  return {frames,jump:{texture:scene.mascot.texture.key,frame:scene.mascot.frame.name}};
 });
 expect(result.frames.map(f=>Number(f.frame))).toEqual([0,1,2,3,4,5,6,7]);
 expect(result.frames.every(f=>f.texture==='mascot-run-cycle')).toBe(true);
 expect(new Set(result.frames.map(f=>`${f.x},${f.y}`)).size).toBe(1);
 expect(result.jump.texture).toBe('mascot');expect(Number(result.jump.frame)).toBe(5);
 expect(errors).toEqual([]);expect(missing).toEqual([]);
});
