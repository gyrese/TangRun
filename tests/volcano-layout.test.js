import test from 'node:test';
import assert from 'node:assert/strict';
import {buildLevel,groundAt,heightOn} from '../src/level.js';
import {createRunner,stepRunner} from '../src/movement.js';

const DT=1/120;
function traverse(level,start,speed,end,controls){
 const support=start.surface?level.platforms.find(p=>p.id===start.surface):groundAt(level,start.x);
 const p=createRunner(start.x,heightOn(support,start.x));p.surfaceId=support.id;p.vx=speed;
 const visited=new Set(),rewards=new Set();let peak=p.feet;
 for(let i=0;i<120*20&&p.x<end;i++){
  stepRunner(p,controls(p,i*DT),level,DT);
  if(p.grounded)visited.add(p.surfaceId);peak=Math.min(peak,p.feet);
  for(const r of level.adventure.relics)if(Math.abs(p.x-r.x)<28&&Math.abs(p.feet-20-r.y)<30)rewards.add(r.id);
  assert.ok(p.feet<1000,`Unsafe fall at ${p.x}`);
 }
 assert.ok(p.x>=end,`Route stalls at ${p.x}`);
 return{p,visited,rewards,peak};
}

test('first summit is reachable from the actual ground entry, at jogging and boosted speeds',()=>{
 const level=buildLevel();
 for(const speed of [330,590,740,850]){
  let held=false;
  const r=traverse(level,{x:8510},speed,11400,p=>{
   const jump=p.grounded&&p.x>=8550&&p.x<8630||held&&!p.grounded&&p.x<8700;
   if(jump)held=true;return{right:true,jump};
  });
  assert.ok(r.visited.has('cinder-ridge-0'));assert.equal(r.peak,-100);
  assert.ok(r.rewards.has('relic-3'),'The emblem is on the playable summit');
 }
});

test('organs spring reaches the second summit and continues over the third without extra jumps',()=>{
 const level=buildLevel();
 for(const speed of [330,590,740,850]){
  const r=traverse(level,{x:11460},speed,16400,()=>({right:true}));
  assert.ok(r.peak<-219);assert.ok(r.rewards.has('relic-4'));assert.ok(r.rewards.has('relic-5'));
  assert.ok(r.p.feet>260,'The summit route descends toward the ground exit');
 }
});

test('organs terrace relay can recover the high route from the intermediate floor',()=>{
 const level=buildLevel();
 for(const speed of [330,590,740,850]){
  const r=traverse(level,{x:12275,surface:'volcano-mid-1'},speed,16400,()=>({right:true}));
  assert.ok(r.peak<-250);assert.ok([...r.visited].some(id=>/^volcano-\d+$/.test(id)));
 }
});

test('volcanic rock undersides leave enough space for the full-size runner below',()=>{
 const level=buildLevel();
 for(const p of level.platforms.filter(p=>p.rail&&p.x>=8400&&p.x<16800)){
  for(const x of [p.x,p.x+p.w/2,p.x+p.w]){
   const floor=groundAt(level,x);
   if(floor)assert.ok(heightOn(floor,x)-heightOn(p,x)>=170,`${p.id}: rock volume must clear the low route`);
  }
 }
});

test('intermediate balconies are accessible from the ground and their relay returns to the summit',()=>{
 const level=buildLevel();
 for(const speed of [330,590,740,850]){
  let heldUntil=0;
  const r=traverse(level,{x:13500},speed,16400,(p,time)=>{
   if(p.grounded&&time>heldUntil){
    const roof=level.platforms.find(q=>q.id===p.surfaceId);
    const springAhead=level.springs.some(s=>s.surface===p.surfaceId&&s.x>=p.x);
    if(p.x<13550||roof&&!roof.rail&&!springAhead&&roof.x+roof.w-p.x<Math.max(70,p.vx*.2))heldUntil=time+.4;
   }
   return{right:true,jump:time<heldUntil};
  });
  assert.ok(r.visited.has('lava-terrace-1'));assert.ok(r.peak<-115);
  assert.ok(r.rewards.has('relic-5'));
 }
});

test('staying on the low route bypasses the optional first summit',()=>{
 const level=buildLevel();
 const r=traverse(level,{x:8480},330,10950,()=>({right:true,slide:true}));
 assert.ok(![...r.visited].some(id=>id?.startsWith('cinder')));
 assert.ok(r.p.grounded);assert.ok(r.peak>300);
});
