import test from 'node:test';
import assert from 'node:assert/strict';
import {buildLevel,groundAt,heightOn,GOAL_X} from '../src/level.js';
import {createRunner,stepRunner} from '../src/movement.js';
import {createAdventureState,stepAdventure,enemyPosition,ventPhase} from '../src/adventure.js';
const empty=()=>({enemies:[],vents:[],monitors:[],relics:[]});
test('damage spends shield first, scatters shards once, then allows recovery',()=>{
 const a=empty(),p=createRunner(100,450),s=createAdventureState();a.enemies=[{id:'e',x:100,y:430,range:0,phase:0,kind:'crab'}];
 s.shield=true;let r=stepAdventure(s,p,a,1/120,12);assert.equal(s.shield,false);assert.equal(r.balance,12);
 r=stepAdventure(s,p,a,1/120,12);assert.equal(s.hits,1);
 s.invincible=0;r=stepAdventure(s,p,a,1/120,12);assert.equal(r.balance,0);assert.equal(s.scatter.length,12);
 s.invincible=0;r=stepAdventure(s,p,a,1/120,0);assert.ok(r.events.some(e=>e.type==='respawn'));
});
test('rolling and descending attacks defeat sentinels; pickups cannot farm score',()=>{
 const a=empty(),p=createRunner(100,450),s=createAdventureState();a.enemies=[{id:'e',x:100,y:430,range:0,phase:0,kind:'crab'}];p.rolling=true;
 stepAdventure(s,p,a,1/120,0);assert.equal(s.defeated.size,1);assert.equal(s.hits,0);assert.equal(s.score,100);
 a.monitors=[{id:'m',x:100,y:430,type:'cache'}];a.relics=[{id:'r',x:100,y:430}];
 let r=stepAdventure(s,p,a,1/120,0);assert.equal(r.balance,10);assert.equal(s.score,1150);
 r=stepAdventure(s,p,a,1/120,10);assert.equal(r.balance,10);assert.equal(s.score,1150);
 const bounce=createRunner(100,425);bounce.grounded=false;bounce.vy=200;const fresh=createAdventureState();stepAdventure(fresh,bounce,a,1/120,0);assert.equal(fresh.defeated.size,1);assert.equal(bounce.vy,-420);
});
test('nine sections and rewards have safe sockets; hazards telegraph before activating',()=>{
 const l=buildLevel(),a=l.adventure;assert.equal(a.chapters.length,9);assert.equal(a.relics.length,9);assert.equal(l.loops.length,2);
 for(const m of a.monitors){const f=groundAt(l,m.x);assert.ok(f);assert.equal(m.y,heightOn(f,m.x)-22);}
 for(const e of a.enemies)assert.ok(Number.isFinite(enemyPosition(e,3).x));
 assert.equal(ventPhase({phase:0},1),'idle');assert.equal(ventPhase({phase:0},2.5),'warning');assert.equal(ventPhase({phase:0},3),'active');
});
test('full traversal with encounters remains survivable using movement and rolling',()=>{
 const l=buildLevel(),p=createRunner(),s=createAdventureState(),collected=new Set();let bank=0,heldUntil=0,finished=false;
 for(let i=0;i<120*120;i++){
  const time=i/120;
  if(p.grounded&&time>heldUntil){
   const gap=l.gaps.some(([a])=>p.x<a&&a-p.x<Math.max(55,p.vx*.17));
   const box=l.platforms.some(q=>['beam','crate'].includes(q.kind)&&q.x>p.x&&q.x-p.x<Math.max(90,p.vx*.22)&&q.y<p.feet);
   if(gap||box)heldUntil=time+.4;
  }
  stepRunner(p,{right:true,slide:true,jump:time<heldUntil},l,1/120);
  l.tokens.forEach((t,j)=>{if(!collected.has(j)&&Math.abs(t.x-p.x)<23&&Math.abs(t.y-(p.feet-25))<32){collected.add(j);bank++;}});
  const r=stepAdventure(s,p,l.adventure,1/120,bank);bank=r.balance;
  assert.ok(!r.events.some(e=>e.type==='respawn'),`Lethal encounter at ${p.x}`);assert.ok(p.feet<1050,`Fall at ${p.x}`);
  if(p.x>=GOAL_X){finished=true;break;}
 }
 assert.ok(finished);assert.ok(s.defeated.size>3);assert.ok(s.hits<=2,'The main path leaves room to recover from a missed attack');
});
