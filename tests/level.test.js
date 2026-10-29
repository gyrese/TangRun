import test from 'node:test';
import assert from 'node:assert/strict';
import {buildLevel,formatTime,readBest,SPEED,MAX_SPEED,JUMP_SPEED,GRAVITY,GOAL_X,WORLD_WIDTH,ZONES,STAGES,recordKey,groundAt,heightOn,BEST_KEY} from '../src/level.js';

test('time formatting handles boundaries',()=>{
  assert.equal(formatTime(0),'00:00.000');assert.equal(formatTime(61234.8),'01:01.234');assert.equal(formatTime(-10),'00:00.000');
});
test('ground gaps fit their downhill or level jump envelope',()=>{
  const level=buildLevel(),{gaps,terrain}=level;const range=SPEED*2*JUMP_SPEED/GRAVITY;
  for(const [a,b] of gaps){
   const drop=heightOn(groundAt(level,b+1),b+1)-heightOn(groundAt(level,a-1),a-1);
   const reach=drop>0?(a<8400?MAX_SPEED:SPEED)*(JUMP_SPEED+Math.sqrt(JUMP_SPEED**2+2*GRAVITY*drop))/GRAVITY:range;
   assert.ok(b-a<reach*.85,`Unreachable gap ${a}`);
  }
  assert.equal(terrain.reduce((sum,p)=>sum+p.w,0)+gaps.reduce((sum,[a,b])=>sum+b-a,0),WORLD_WIDTH);
  assert.ok(GOAL_X<WORLD_WIDTH);
  for(const zone of ZONES){const floor=groundAt(level,zone.checkpoint.x);assert.ok(floor,'Checkpoint has safe floor');assert.equal(floor.slope,0);assert.ok(zone.checkpoint.y<heightOn(floor,zone.checkpoint.x));}
  assert.ok(BEST_KEY.includes('v9-volcano-summits'),'Redesigned volcano has separate records');
});
test('optional roof chain is reachable with full jumps',()=>{
  const roofs=buildLevel().platforms.filter(p=>p.kind==='roof');
  for(const route of new Set(roofs.map(r=>r.route))){
   const chain=roofs.filter(r=>r.route===route);
   for(let i=1;i<chain.length;i++){
    const prev=chain[i-1],next=chain[i],rise=prev.y-next.y;
    if(prev.rail&&next.rail&&Math.abs(prev.x+prev.w-next.x)<.01&&Math.abs(prev.y2-next.y)<.01)continue;
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
 for(const [a,b]of level.gaps.filter(([a])=>a>=8400)){assert.ok(b-a>width);width=b-a;}
 for(const c of level.checkpoints){
  assert.ok(groundAt(level,c.x-20)&&groundAt(level,c.x+40),`Unsafe recovery at ${c.x}`);
  assert.ok(!level.platforms.some(p=>['beam','crate'].includes(p.kind)&&c.x>p.x-25&&c.x<p.x+p.w+25));
 }
 for(const pad of level.pads){
  const surface=[...level.terrain,...level.platforms].find(p=>p.id===pad.surface);
  assert.ok(surface&&pad.x>=surface.x&&pad.x<=surface.x+surface.w,'Boost must sit on its actual surface');
 }
 for(const [a,b]of level.gaps)assert.ok(level.tokens.some(t=>t.x>a&&t.x<b),'A visible pickup arc must span every ravine');
 assert.equal(new Set(['campaign',...STAGES.map(s=>s.id)].map(recordKey)).size,5);
});

test('multi-tier routes leave readable vertical clearance and include active obstacles',()=>{
 const level=buildLevel(),roofs=level.platforms.filter(p=>p.kind==='roof');
 for(const p of roofs){
  for(const x of [p.x,p.x+p.w/2,p.x+p.w]){
   const floor=groundAt(level,x);
   if(floor)assert.ok(heightOn(floor,x)-heightOn(p,x)>=65,`${p.id}: enough room to run below at x=${x}`);
  }
  for(const q of roofs)if(p.route!==q.route&&p.x+p.w>q.x&&q.x+q.w>p.x){
   const overlapX=(Math.max(p.x,q.x)+Math.min(p.x+p.w,q.x+q.w))/2;
   assert.ok(Math.abs(heightOn(p,overlapX)-heightOn(q,overlapX))>=75,`Multi-tier routes ${p.id}/${q.id} need >=75px vertical separation`);
  }
 }
 assert.ok(level.platforms.some(p=>p.kind==='beam'),'Course includes low gates for rolling/sliding');
 assert.ok(level.platforms.some(p=>p.kind==='crate'),'Course includes crate obstacles');
});

test('ravine approaches and landings are clear of forced mechanisms and patrols',()=>{
 const level=buildLevel();
 for(const [a,b]of level.gaps){
  const corridor=[a-170,b+25];
  for(const p of [...level.springs,...level.pads,...level.adventure.monitors])
   assert.ok(p.x<corridor[0]||p.x>corridor[1],`Mechanism in landing corridor ${p.x}`);
  for(const e of level.adventure.enemies)
   assert.ok(e.x+e.range<corridor[0]||e.x-e.range>corridor[1],`Patrol in landing corridor ${e.id}`);
 }
 for(const p of level.pads.filter(p=>p.surface.startsWith('ground')))assert.ok(!level.gaps.some(([a])=>a>p.x&&a-p.x<450),'Ground boost needs a visible runout');
});

test('optional emblems sit at reachable heights above their actual support',()=>{
 const level=buildLevel();
 for(const relic of level.adventure.relics){
  const surfaces=[...level.terrain,...level.platforms].filter(p=>relic.x>=p.x&&relic.x<=p.x+p.w);
  const supported=surfaces.some(p=>{const clearance=heightOn(p,relic.x)-relic.y;return clearance>=35&&clearance<=75;});
  const loopCrown=level.loops.some(l=>Math.abs(relic.x-l.x)<1&&Math.abs(relic.y-(l.baseY-2*l.radius-22))<1);
  assert.ok(supported||loopCrown,`Unreachable emblem ${relic.id}`);
  assert.ok(!level.adventure.vents.some(v=>Math.abs(v.x-relic.x)<70),'Reward has its own safe space');
 }
});


test('Piton des Neiges only descends, with long 75 percent faces and deep jumps',()=>{
 const l=buildLevel(),snow=l.terrain.filter(p=>p.x<8400);
 assert.ok(snow.every(p=>p.slope>=0),'No uphill face in the snow stage');
 assert.ok(snow.filter(p=>Math.abs(p.slope-.75)<.001).reduce((sum,p)=>sum+p.w,0)>5000);
 assert.ok(heightOn(groundAt(l,8315),8315)-heightOn(groundAt(l,80),80)>5500);
 const gaps=l.gaps.filter(([a])=>a<8400);assert.equal(gaps.length,3);
 for(const [a,b]of gaps){assert.ok(b-a>=480);assert.ok(heightOn(groundAt(l,b+1),b+1)-heightOn(groundAt(l,a-1),a-1)>=550);}
 assert.ok(![...l.platforms,...l.movers,...l.springs,...l.loops].some(p=>p.x<8400),'Snow has its own downhill route, without volcano climbs');
});
