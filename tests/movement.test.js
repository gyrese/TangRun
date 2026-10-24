import test from 'node:test';
import assert from 'node:assert/strict';
import {createRunner,stepRunner} from '../src/movement.js';
import {buildLevel,SPEED,MAX_SPEED,GOAL_X,STAGES,groundAt,heightOn} from '../src/level.js';
const DT=1/120;
const surface=(id,x,w,y,y2)=>({id,kind:'ground',x,w,y,y2,slope:(y2-y)/w});
const run=(p,input,level,seconds)=>{for(let i=0;i<seconds*120;i++)stepRunner(p,input,level,DT);};

test('downhill automatically rolls, gains speed, follows the surface and coasts after release',()=>{
 const level={terrain:[surface('ground-0',0,600,300,540),surface('ground-1',600,3000,540,540)],platforms:[],pads:[]};
 const p=createRunner(80,332);p.vx=SPEED;
 run(p,{},level,1.2);
 assert.ok(p.sliding);assert.ok(p.vx>SPEED*1.7);assert.ok(p.grounded);
 const current=level.terrain.find(s=>p.x>=s.x&&p.x<=s.x+s.w);assert.ok(Math.abs(p.feet-heightOn(current,p.x))<.01);
 const speed=p.vx;run(p,{},level,.2);assert.ok(p.vx>speed-20,'Rolling runout does not use walking friction');
 const before=p.vx;run(p,{left:true},level,.2);assert.ok(p.vx<before-100,'Opposite direction brakes');
});

test('jump passes through a roof from below and lands on top',()=>{
 const roof={id:'roof-0',kind:'roof',x:0,w:500,y:370,y2:370,slope:0,h:22};
 const level={terrain:[surface('ground-0',0,2000,450,450)],platforms:[roof],pads:[]};
 const p=createRunner(100,450);let peak=p.feet;
 for(let i=0;i<120;i++){stepRunner(p,{jump:true},level,DT);peak=Math.min(peak,p.feet);}
 assert.ok(peak<370);assert.equal(p.surfaceId,'roof-0');assert.equal(p.feet,370);assert.ok(p.grounded);
});

test('high speed uphill exit launches and speed remains capped',()=>{
 const level={terrain:[surface('ground-0',0,600,650,410),surface('ground-1',600,2000,410,410)],platforms:[],pads:[]};
 const p=createRunner(580,418);p.vx=MAX_SPEED;p.rolling=true;
 run(p,{right:true,slide:true},level,.08);
 assert.ok(!p.grounded);assert.ok(p.vy< -100);assert.ok(p.vx<=MAX_SPEED);
});

test('authored full route can be completed without a fall with automatic downhill sliding',()=>{
 const level=buildLevel(),p=createRunner();let heldUntil=0,finished=false,airborne=0,rolled=0;
 for(let i=0;i<120*100;i++){
  const time=i/120;
  if(p.grounded&&time>heldUntil){
   const gap=level.gaps.some(([a])=>p.x<a&&a-p.x<Math.max(55,p.vx*.17));
   const crate=level.platforms.some(s=>(s.kind==='crate'||s.kind==='beam')&&s.x>p.x&&s.x-p.x<Math.max(90,p.vx*.22)&&s.y<p.feet);
   if(gap||crate)heldUntil=time+.4;
  }
  stepRunner(p,{right:true,jump:time<heldUntil},level,DT);
  assert.ok(p.feet<1050,`Fell at ${p.x}`);assert.ok(Math.abs(p.vx)<=MAX_SPEED);
  if(p.sliding)rolled++;if(!p.grounded)airborne++;
  if(p.x>=GOAL_X){finished=true;break;}
 }
 assert.ok(finished,`Stuck at ${p.x}`);assert.ok(p.maxSpeed>700);assert.ok(rolled>120);assert.ok(airborne>60);
});

test('all three upper paths can be entered by their spring and reward the climb',()=>{
 for(const [start,route]of [[3060,'volcano'],[8900,'mafate'],[21455,'city']]){
  const level=buildLevel(),floor=level.terrain.find(s=>start>=s.x&&start<=s.x+s.w),p=createRunner(start,heightOn(floor,start));p.surfaceId=floor.id;p.vx=SPEED;
  let heldUntil=0,visited=new Set();
  for(let i=0;i<120*10;i++){
   const time=i/120;
   if(p.grounded&&p.surfaceId?.startsWith(route)){
    visited.add(p.surfaceId);const roof=level.platforms.find(s=>s.id===p.surfaceId);
    if(time>heldUntil&&roof.x+roof.w-p.x<Math.max(65,p.vx*.18))heldUntil=time+.4;
   }
   stepRunner(p,{right:true,jump:time<heldUntil},level,DT);
  }
  assert.ok(visited.has(`${route}-0`),`${route}: entry reached`);assert.ok(visited.has(`${route}-3`),`${route}: chain reached`);assert.ok(p.maxSpeed>=740);
 }
});

test('a low gate can be crouched under even after stopping against it',()=>{
 const beam={id:'beam-0',kind:'beam',x:160,w:110,y:400,y2:400,h:24,slope:0};
 const level={terrain:[surface('ground-0',0,2000,450,450)],platforms:[beam],pads:[],springs:[]};
 const p=createRunner(100,450);p.vx=SPEED;run(p,{right:true},level,.4);
 assert.equal(p.x,149);assert.equal(p.vx,0);
 run(p,{right:true,slide:true},level,1.1);
 assert.ok(p.x>beam.x+beam.w,'Holding slide must escape a stopped gate');
});

test('spring reaches an otherwise inaccessible upper ledge',()=>{
 const roof={id:'roof-0',kind:'roof',x:300,w:350,y:250,y2:250,slope:0,h:22};
 const level={terrain:[surface('ground-0',0,2000,450,450)],platforms:[roof],pads:[],springs:[{x:120,power:840}]};
 const p=createRunner(80,450);p.vx=SPEED;let reached=false;
 for(let i=0;i<180;i++){stepRunner(p,{right:true},level,DT);if(p.surfaceId==='roof-0')reached=true;}
 assert.ok(reached,'Spring must grant enough height and range for the belvedere');
});

test('loop completes at speed and slower runners use the safe lower route',()=>{
 const level=buildLevel(),loop=level.loops[0];
 for(const speed of [330,820]){
  const p=createRunner(loop.x-8,loop.baseY);p.vx=speed;p.rolling=true;let entered=false,top=Infinity;
  for(let i=0;i<360;i++){stepRunner(p,{right:true,slide:true},level,DT);entered ||= !!p.loop;top=Math.min(top,p.feet);}
  assert.equal(entered,speed>=loop.minSpeed);assert.equal(p.loop,null);assert.ok(p.x>loop.x);assert.ok(p.feet<1050);
  if(entered)assert.ok(top<loop.baseY-loop.radius*1.9);
 }
});

test('moving platforms carry a stationary rider through a full cycle',()=>{
 const level=buildLevel(),platform=level.movers[0],p=createRunner(platform.x+platform.w/2,platform.y);p.surfaceId=platform.id;
 for(let i=0;i<456;i++){stepRunner(p,{},level,DT);assert.equal(p.surfaceId,platform.id);assert.ok(p.grounded);}
 assert.ok(Math.abs(p.feet-platform.y)<.01);assert.ok(Math.abs(p.x-platform.x-platform.w/2)<.01);
});

test('each level and every recovery can finish from rest, including held crouch',()=>{
 const level=buildLevel();
 const cases=[...STAGES.flatMap(s=>[{x:s.start,end:s.end,slide:false},{x:s.start,end:s.end,slide:true}]),...level.checkpoints.map(c=>({x:c.x,end:STAGES.find(s=>s.end>c.x).end,slide:false}))];
 for(const route of cases){
  const floor=groundAt(level,route.x),p=createRunner(route.x,heightOn(floor,route.x));p.surfaceId=floor.id;let heldUntil=0;
  for(let i=0;i<120*60&&p.x<route.end;i++){
   const time=i/120;
   if(p.grounded&&time>heldUntil){
    const gap=level.gaps.some(([a])=>p.x<a&&a-p.x<Math.max(55,p.vx*.17));
    const obstacle=level.platforms.some(s=>['crate','beam'].includes(s.kind)&&s.x>p.x&&s.x-p.x<Math.max(90,p.vx*.22)&&s.y<p.feet);
    if(gap||obstacle)heldUntil=time+.4;
   }
   stepRunner(p,{right:true,jump:time<heldUntil,slide:route.slide},level,DT);
   assert.ok(p.feet<1050,`Fall from recovery ${route.x} at ${p.x}`);
  }
  assert.ok(p.x>=route.end,`Stalled from ${route.x}, crouch=${route.slide}, at ${p.x}`);
 }
});
