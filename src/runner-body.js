// Shared dimensions for visible poses and physical contacts (world pixels).
export const STANDING_HEIGHT=50,ROLL_DIAMETER=44,STANDING_HALF_WIDTH=20;
export const runnerHeight=p=>p.sliding||p.loop?ROLL_DIAMETER:STANDING_HEIGHT;
export const runnerHalfWidth=p=>STANDING_HALF_WIDTH;
export const isSolid=s=>s.kind==='crate'||s.kind==='beam'||s.kind==='roof'&&(s.solid===true);
