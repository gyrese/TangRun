// Drive the stride by distance travelled, not wall-clock speed buckets. The
// four-phase contract maps evenly to both eight- and sixteen-frame sheets.
export function advanceMascotCycle(previous, runner, time, identity=runner) {
 const speed=Math.abs(runner.vx);
 const mode=runner.sliding&&speed>12?'roll':runner.grounded&&speed>20?'run':'still';
 const sameRunner=previous?.runner===identity;
 const dt=sameRunner?Math.max(0,Math.min(100,time-previous.time))/1000:0;
 const continuing=sameRunner&&previous.mode===mode;
 let distance=speed*dt;
 if(Number.isFinite(runner.x)&&Number.isFinite(previous?.x)){
  const dx=runner.x-previous.x,dy=runner.grounded&&previous.grounded?runner.feet-previous.feet:0;
  distance=Math.hypot(dx,Number.isFinite(dy)?dy:0);
  // Respawns and test teleports reset the cycle rather than spinning the feet.
  if(distance>120)distance=0;
 }
 const stride=mode==='roll'?96:144;
 return {runner:identity,time,mode,x:runner.x,feet:runner.feet,grounded:runner.grounded,
  phase:mode==='still'?0:((continuing?previous.phase:0)+(continuing&&dt>0?distance*4/stride:0))%4};
}
