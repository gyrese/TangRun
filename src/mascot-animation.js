// Advance the cycle incrementally: changing speed must never rewind its phase.
export function advanceMascotCycle(previous, runner, time) {
 const mode=runner.sliding?'roll':runner.grounded&&Math.abs(runner.vx)>20?'run':'still';
 const sameRunner=previous?.runner===runner;
 const dt=sameRunner?Math.max(0,Math.min(100,time-previous.time))/1000:0;
 const continuing=sameRunner&&previous.mode===mode;
 const fps=mode==='roll'?Math.min(22,8+Math.abs(runner.vx)/70):Math.min(18,Math.max(6,Math.abs(runner.vx)/24));
 return {runner,time,mode,phase:mode==='still'?0:((continuing?previous.phase:0)+(continuing?dt*fps:0))%4};
}
