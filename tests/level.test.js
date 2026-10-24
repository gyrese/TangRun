import test from 'node:test';
import assert from 'node:assert/strict';
import {buildLevel,formatTime,readBest,SPEED,JUMP_SPEED,GRAVITY,GOAL_X,WORLD_WIDTH,ZONES,STAGES,recordKey,groundAt,heightOn,BEST_KEY} from '../src/level.js';

test('time formatting handles boundaries',()=>{
  assert.equal(formatTime(0),'00:00.000');assert.equal(formatTime(61234.8),'01:01.234');assert.equal(formatTime(-10),'00:00.000');
});
test('safe ground gaps fit the full jump envelope',()=>{
  const level=buildLevel(),{gaps,terrain}=level;const range=SPEED*2*JUMP_SPEED/GRAVITY;
  for(const [a,b] of gaps)assert.ok(b-a<range*.7,`Unreachable gap ${a}`);
  assert.equal(terrain.reduce((sum,p)=>sum+p.w,0)+gaps.reduce((sum,[a,b])=>sum+b-a,0),WORLD_WIDTH);
  assert.ok(GOAL_X<WORLD_WIDTH);
  for(const zone of ZONES){const floor=groundAt(level,zone.checkpoint.x);assert.ok(floor,'Checkpoint has safe floor');assert.equal(floor.slope,0);assert.ok(zone.checkpoint.y<heightOn(floor,zone.checkpoint.x));}
  assert.ok(BEST_KEY.includes('v5-progression'),'New level has separate records');
});
test('optional roof chain is reachable with full jumps',()=>{
  const roofs=buildLevel().platforms.filter(p=>p.kind==='roof');
  for(const route of new Set(roofs.map(r=>r.route))){
   const chain=roofs.filter(r=>r.route===route);
   for(let i=1;i<chain.length;i++){
    const prev=chain[i-1],next=chain[i],rise=prev.y-next.y;
    const discriminant=JUMP_SPEED**2-2*GRAVITY*rise;assert.ok(discriminant>0);
    const reach=SPEED*(JUMP_SPEED+Math.sqrt(discriminant))/GRAVITY;
    assert.ok(next.x-prev.x-prev.w<reach*.7);
  }
  }
});
test('best time storage rejects corrupt or unavailable data',()=>{
  for(const value of [null,'','NaN','Infinity','-2','0'])assert.equal(readBest({getItem:()=>value}),null);
  assert.equal(readBest({getItem:()=> '34567'}),34567);
  assert.equal(readBest({getItem:()=>{throw new Error('blocked');}}),null);
});

test('progressive gaps, recovery shelves and boost sockets are physically valid',()=>{
 const level=buildLevel();let width=0;
 for(const [a,b]of level.gaps){assert.ok(b-a>width);width=b-a;}
 for(const c of level.checkpoints){
  assert.ok(groundAt(level,c.x-20)&&groundAt(level,c.x+40),`Unsafe recovery at ${c.x}`);
  assert.ok(!level.platforms.some(p=>['beam','crate'].includes(p.kind)&&c.x>p.x-25&&c.x<p.x+p.w+25));
 }
 for(const pad of level.pads){
  const surface=[...level.terrain,...level.platforms].find(p=>p.id===pad.surface);
  assert.ok(surface&&pad.x>=surface.x&&pad.x<=surface.x+surface.w,'Boost must sit on its actual surface');
 }
 for(const [a,b]of level.gaps)assert.ok(level.tokens.some(t=>t.x>a&&t.x<b),'A visible pickup arc must span every ravine');
 assert.equal(new Set(['campaign',...STAGES.map(s=>s.id)].map(recordKey)).size,4);
});
