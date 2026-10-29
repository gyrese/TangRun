import test from 'node:test';
import assert from 'node:assert/strict';
import {createRunner,stepRunner,sampleRunner,resetRunnerInterpolation} from '../src/movement.js';
import {buildLevel,SPEED,MAX_SPEED,GOAL_X,STAGES,groundAt,heightOn} from '../src/level.js';
import {STANDING_HEIGHT,ROLL_DIAMETER,STANDING_HALF_WIDTH} from '../src/runner-body.js';
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

test('a fast runner stays attached to a crest and launches only off a real ramp end',()=>{
 const level={terrain:[surface('ground-0',0,600,650,410),surface('ground-1',600,2000,410,410)],platforms:[],pads:[]};
 const p=createRunner(580,418);p.vx=MAX_SPEED;p.rolling=true;
 run(p,{right:true,slide:true},level,.08);
 assert.ok(p.grounded);assert.equal(p.feet,410);assert.ok(p.vx<=MAX_SPEED);
 const ramp={terrain:[surface('ground-0',0,600,650,410)],platforms:[],pads:[]};
 const airborne=createRunner(580,418);airborne.vx=MAX_SPEED;airborne.rolling=true;
 run(airborne,{right:true,slide:true},ramp,.08);
 assert.ok(!airborne.grounded);assert.ok(airborne.vy< -100);
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
 for(const [start,route]of [[3060+8400,'volcano'],[8900+8400,'mafate'],[21455+8400,'city']]){
  const level=buildLevel(),floor=level.terrain.find(s=>start>=s.x&&start<=s.x+s.w),p=createRunner(start,heightOn(floor,start));p.surfaceId=floor.id;p.vx=SPEED;
  let heldUntil=0,visited=new Set();
  for(let i=0;i<120*10;i++){
   const time=i/120;
   if(p.grounded&&p.surfaceId?.startsWith(route)){
    visited.add(p.surfaceId);const roof=level.platforms.find(s=>s.id===p.surfaceId);
    // Sur une voie continue, on ne saute qu'au bout d'une section.
    const continues=level.platforms.some(s=>s.route===roof.route&&Math.abs(s.x-roof.x-roof.w)<1);
    if(time>heldUntil&&!continues&&roof.x+roof.w-p.x<Math.max(65,p.vx*.18))heldUntil=time+.4;
   }
   stepRunner(p,{right:true,jump:time<heldUntil},level,DT);
  }
  assert.ok(visited.has(`${route}-0`),`${route}: entry reached`);assert.ok(visited.has(`${route}-3`),`${route}: chain reached`);
  assert.ok(level.tokens.some(t=>level.platforms.some(s=>visited.has(s.id)&&t.x>=s.x&&t.x<=s.x+s.w&&Math.abs(t.y-heightOn(s,t.x))<60)),`${route}: route rewards reached`);
 }
});

test('a low gate can be crouched under even after stopping against it',()=>{
 const beam={id:'beam-0',kind:'beam',x:160,w:110,y:380,y2:380,h:24,slope:0};
 const level={terrain:[surface('ground-0',0,2000,450,450)],platforms:[beam],pads:[],springs:[]};
 const p=createRunner(100,450);p.vx=SPEED;run(p,{right:true},level,.4);
 assert.equal(p.x,160-STANDING_HALF_WIDTH);assert.equal(p.vx,0);
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

test('crossing above a loop on another route cannot capture the runner',()=>{
 const l={id:'test-loop',x:500,baseY:450,radius:115,minSpeed:590};
 const roof={...surface('roof-0',0,1000,200,200),kind:'roof'};
 const level={terrain:[surface('ground-0',0,1000,450,450)],platforms:[roof],loops:[l]};
 const p=createRunner(498,200);Object.assign(p,{surfaceId:roof.id,vx:800});
 stepRunner(p,{right:true},level,DT);
 assert.equal(p.loop,null);assert.equal(p.feet,200);assert.ok(p.x>l.x);
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

test('a jump just after an edge works once and reports the jump event',()=>{
 const level={terrain:[surface('ground-0',0,200,450,450)],platforms:[],pads:[]};
 const p=createRunner(196,450);p.vx=330;
 run(p,{right:true},level,.05);assert.equal(p.grounded,false);
 const jump=stepRunner(p,{right:true,jump:true},level,DT);
 assert.equal(jump.jumped,true);assert.ok(p.vy< -500);assert.equal(p.coyote,0);
 stepRunner(p,{right:true,jump:false},level,DT);
 const before=p.vy,next=stepRunner(p,{right:true,jump:true},level,DT);
 assert.equal(next.jumped,false);assert.ok(p.vy>before,'Airborne repress cannot double jump');
});

test('a buffered short tap rebounds on the landing step without adding an idle frame',()=>{
 const level={terrain:[surface('ground-0',0,2000,450,450)],platforms:[],pads:[]};
 const p=createRunner(100,435);p.grounded=false;p.surfaceId=null;p.vy=320;
 stepRunner(p,{jump:true},level,DT);
 let contact;
 for(let i=0;i<15;i++){
  const event=stepRunner(p,{jump:false},level,DT);
  if(event.landed){contact=event;break;}
 }
 assert.ok(contact);assert.equal(contact.jumped,true);assert.equal(p.grounded,false);
 assert.equal(p.feet,450);assert.ok(p.vy< -300&&p.vy> -400,'A released buffered tap remains a short jump');
 assert.equal(p.buffer,0);
});

test('render interpolation stays on the support across a slope seam and resets after a respawn',()=>{
 const level={terrain:[surface('ground-0',0,100,400,420),surface('ground-1',100,100,420,430)],platforms:[],pads:[]};
 const p=createRunner(98,419.6);p.vx=400;
 stepRunner(p,{right:true},level,DT);
 const visual=sampleRunner(p,.5,level),floor=groundAt(level,visual.x);
 assert.ok(visual.x>p.previous.x&&visual.x<p.x);assert.equal(visual.feet,heightOn(floor,visual.x));
 assert.equal(p.x,sampleRunner(p,1,level).x);
 p.x=30;p.feet=406;resetRunnerInterpolation(p);
 assert.equal(sampleRunner(p,0,level).x,30);
});


test('snow downhill jumps land safely from every recovery without jumping or climbing',()=>{
 const l=buildLevel();
 for(const checkpoint of l.checkpoints.filter(c=>c.x<8315)){
  const floor=l.terrain.find(s=>checkpoint.x>=s.x&&checkpoint.x<=s.x+s.w),p=createRunner(checkpoint.x,heightOn(floor,checkpoint.x));p.surfaceId=floor.id;
  let jumps=0,air=0,longest=0;
  for(let i=0;i<120*40&&p.x<8315;i++){
   const wasGrounded=p.grounded;
   stepRunner(p,{right:true},l,DT);
   if(!p.grounded)air++;
   if(p.grounded&&!wasGrounded){jumps++;longest=Math.max(longest,air);air=0;}
   assert.ok(p.feet<1050,`Missed downhill landing from ${checkpoint.x} at ${p.x}`);
  }
  assert.ok(p.x>=8315,`Descent blocked from ${checkpoint.x}`);
  if(checkpoint.x===80){assert.equal(jumps,3);assert.ok(longest>60);assert.ok(p.maxSpeed>=800);}
 }
});


test('solid impact on a slope keeps feet on the corrected support in both directions',()=>{
 const floor=surface('ground-0',0,1200,400,640),crate={id:'wall',kind:'beam',x:300,w:48,y:360,y2:360,h:180,slope:0};
 const level={terrain:[floor],platforms:[crate]};
 for(const [x,vx,input,expected]of [[260,330,{right:true},300-STANDING_HALF_WIDTH],[390,-330,{left:true},348+STANDING_HALF_WIDTH]]){
  const p=createRunner(x,heightOn(floor,x));p.vx=vx;
  run(p,input,level,.4);
  assert.equal(p.x,expected);assert.equal(p.vx,0);assert.equal(p.feet,heightOn(floor,p.x));
  assert.ok(p.grounded);
 }
});

test('rolling breaks only the crate actually contacted',()=>{
 const floor=surface('ground-0',0,2000,450,450);
 const crates=[300,1000].map((x,i)=>({id:`crate-${i}`,kind:'crate',x,w:48,y:406,y2:406,h:44,slope:0}));
 const p=createRunner(250,450);p.vx=600;
 run(p,{right:true,slide:true},{terrain:[floor],platforms:crates},.2);
 assert.deepEqual([...p.brokenCrates],['crate-0']);
});

test('a jump hits a solid underside but still passes through a one-way roof',()=>{
 const cap={id:'cap',kind:'beam',x:50,w:150,y:350,y2:350,h:24,slope:0};
 const level={terrain:[surface('ground-0',0,1000,450,450)],platforms:[cap]};
 const p=createRunner(100,450);let peak=450,hit=false;
 for(let i=0;i<70;i++){
  stepRunner(p,{jump:true},level,DT);peak=Math.min(peak,p.feet);
  if(p.vy===0&&!p.grounded){hit=true;assert.equal(p.feet,374+STANDING_HEIGHT);}
 }
 assert.ok(hit);assert.ok(peak>=374+STANDING_HEIGHT);assert.ok(p.grounded);
});

test('releasing crouch inside a gate retains clearance until its exit',()=>{
 const gate={id:'gate',kind:'beam',x:160,w:150,y:380,y2:380,h:24,slope:0};
 const level={terrain:[surface('ground-0',0,1000,450,450)],platforms:[gate]},p=createRunner(220,450);
 stepRunner(p,{},level,DT);assert.ok(p.sliding);assert.equal(p.feet,450);
 run(p,{right:true},level,1);
 assert.ok(p.x>310+ROLL_DIAMETER/2);assert.equal(p.sliding,false);assert.equal(p.feet,450);
});

test('a discontinuous floor or roof never teleports the runner to a new height',()=>{
 for(const kind of ['ground','roof']){
  const chain=[surface('ground-0',0,200,400,400),surface('ground-1',200,600,550,550)].map(s=>({...s,kind,route:'test',rail:true}));
  const level={terrain:kind==='ground'?chain:[],platforms:kind==='roof'?chain:[]},p=createRunner(198,400);p.vx=600;
  stepRunner(p,{right:true},level,DT);
  assert.equal(p.grounded,false);assert.ok(p.feet<410,'Ledge departure keeps the current altitude');
 }
});


test('a raised floor edge blocks movement instead of passing through the terrain',()=>{
 const level={terrain:[surface('ground-0',0,200,450,450),surface('ground-1',200,500,350,350)],platforms:[]};
 const p=createRunner(188,450);p.vx=600;
 run(p,{right:true},level,.2);
 assert.equal(p.x,200-STANDING_HALF_WIDTH);assert.equal(p.feet,450);assert.equal(p.vx,0);assert.ok(p.grounded);
});


test('every authored arch blocks standing and lets the full-size roll pass from a stop',()=>{
 const l=buildLevel();
 for(const gate of l.platforms.filter(s=>s.kind==='beam')){
  const x=gate.x-90,floor=groundAt(l,x),p=createRunner(x,heightOn(floor,x));p.surfaceId=floor.id;
  run(p,{right:true},l,.65);
  assert.equal(p.x,gate.x-STANDING_HALF_WIDTH,gate.id+': standing contact matches the visible cap');
  assert.ok(p.grounded);assert.equal(p.feet,heightOn(groundAt(l,p.x),p.x));
  run(p,{right:true,slide:true},l,1.5);
  assert.ok(p.x>gate.x+gate.w+ROLL_DIAMETER/2,gate.id+': full-size roll clears the arch');
 }
});

test('jumping while crouched under an arch cannot grow through its cap',()=>{
 const gate={id:'gate',kind:'beam',x:160,w:150,y:380,y2:380,h:24,slope:0};
 const l={terrain:[surface('ground-0',0,1000,450,450)],platforms:[gate]},p=createRunner(220,450);
 p.sliding=true;
 for(let i=0;i<50;i++){
  stepRunner(p,{jump:true,slide:true},l,DT);
  assert.ok(p.feet-ROLL_DIAMETER>=404-.01,'Head stays below the underside');
  assert.ok(p.sliding);
 }
});

test('changing to a wide roll against a crate resolves the overlap before moving through',()=>{
 const crate={id:'crate',kind:'crate',x:300,w:48,y:406,y2:406,h:44,slope:0};
 const l={terrain:[surface('ground-0',0,1000,450,450)],platforms:[crate]},p=createRunner(283,450);
 p.sliding=true;p.rolling=true;p.vx=100;
 stepRunner(p,{right:true,slide:true},l,DT);
 assert.equal(p.x,300-STANDING_HALF_WIDTH);assert.equal(p.vx,0);assert.equal(p.brokenCrates.size,0);
});

test('each authored crate stops walking at its visible edge and breaks on actual rolling contact',()=>{
 const l=buildLevel();
 for(const crate of l.platforms.filter(s=>s.kind==='crate')){
  const x=crate.x-90,floor=groundAt(l,x),p=createRunner(x,heightOn(floor,x));p.surfaceId=floor.id;
  run(p,{right:true},l,.7);
  assert.equal(p.x,crate.x-STANDING_HALF_WIDTH,crate.id+': walking stops at the box');
  assert.ok(p.grounded);assert.equal(p.brokenCrates.size,0);
  const r=createRunner(x,heightOn(floor,x));r.surfaceId=floor.id;r.vx=600;r.rolling=true;r.sliding=true;
  for(let i=0;i<120&&!r.brokenCrates.has(crate.id);i++)stepRunner(r,{right:true,slide:true},l,DT);
  assert.ok(r.brokenCrates.has(crate.id),crate.id+': rolling impact breaks the box');
 }
});
