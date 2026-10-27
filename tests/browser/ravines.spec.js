import {test,expect} from '@playwright/test';
test('volcanic ravines contain animated lava and Mafate has a tall waterfall',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>Element.prototype.requestFullscreen=()=>Promise.resolve());await page.goto('/');await page.waitForFunction(()=>window.__LTN__?.state);await page.locator('#skip-boot').click();await expect(page.locator('#boot-screen')).toBeHidden();await page.locator('#play').click();
 const details=await page.evaluate(async()=>{
  const s=window.__LTN__.game.scene.getScene('run'),{updateRavineArt,touchesLava}=await import('/src/ravine-art.js');s.mode='paused';
  const frames=[];for(const time of [0,200,400,600]){s.visualClock=time;updateRavineArt(s,false);frames.push(s.ravineArt.lava[0].surface.frame.name);}
  const l=s.ravineArt.lava[0];s.runner.x=(l.left+l.right)/2;s.runner.feet=l.y-5;const above=touchesLava(s);s.runner.feet=l.y+20;const inside=touchesLava(s);
  return{lava:s.ravineArt.lava.length,fall:s.ravineArt.water.map(w=>({x:w.x,height:w.height,impacts:w.impacts.length})),frames,above,inside};
 });
 expect(details.lava).toBe(2);expect(details.fall).toHaveLength(1);expect(details.fall[0].impacts).toBeGreaterThan(0);expect(details.fall[0].height).toBeGreaterThan(1100);expect(new Set(details.frames).size).toBe(4);expect(details.above).toBe(false);expect(details.inside).toBe(true);
 for(const [x,y,name]of [[2620,520,'lava'],[11260,540,'cascade'],[11260,950,'fall']]){
  await page.evaluate(async([x,y])=>{const s=window.__LTN__.game.scene.getScene('run');s.runner.x=x-90;s.runner.feet=y-70;s.syncPlayer();s.cameras.main.stopFollow();s.cameras.main.centerOn(x,y);const {updateLivingWorld}=await import('/src/living-world.js');updateLivingWorld(s,false);},[x,y]);await page.waitForTimeout(100);await page.screenshot({path:`assets/ravine-${name}-gameplay.png`});
 }
 expect(errors).toEqual([]);
});


