import test from 'node:test';
import assert from 'node:assert/strict';
import {frameBounds,contactPose,pickupCenter} from '../src/runner-pose.js';
import {ROLL_DIAMETER} from '../src/runner-body.js';

test('animation padding never lifts the feet and rolling fits the crouched body',()=>{
 const rgba=new Uint8ClampedArray(64*64*4);
 for(let y=13;y<50;y++)for(let x=14;x<50;x++)rgba[(y*64+x)*4+3]=255;
 const bounds=frameBounds(rgba,64,64);assert.deepEqual(bounds,{top:13,bottom:50});
 const p={x:120,feet:450,angle:Math.atan(.75),grounded:true,sliding:true};
 const pose=contactPose(p,bounds);
 assert.equal(pose.originY,50/64);assert.equal(pose.scale*37,ROLL_DIAMETER);
 assert.equal(pose.rotation,p.angle);assert.equal(pose.y,451);assert.equal(pose.x,120);
 const loop=contactPose({...p,grounded:false,loop:{radius:115}},bounds);
 assert.equal(loop.y,450+Math.cos(p.angle));
 assert.equal(loop.x,120-Math.sin(p.angle));
 assert.equal(loop.rotation,p.angle);
});

test('loop contact inset follows the surface normal through the full turn',()=>{
 for(let i=0;i<16;i++){
  const a=i*Math.PI/8,r=115,cx=400,cy=300;
  const p={x:cx+Math.sin(a)*r,feet:cy+Math.cos(a)*r,angle:-a,loop:{radius:r}};
  const pose=contactPose(p,{top:10,bottom:54});
  assert.ok(Math.abs(Math.hypot(pose.x-cx,pose.y-cy)-(r+1))<1e-10);
 }
});

test('pickup centre stays inside the ring through the whole loop',()=>{
 const r=115,cx=400,cy=300;
 for(let i=0;i<16;i++){
  const a=i*Math.PI/8,p={x:cx+Math.sin(a)*r,feet:cy+Math.cos(a)*r,angle:-a,loop:{radius:r}};
  const c=pickupCenter(p);
  assert.ok(Math.abs(Math.hypot(c.x-cx,c.y-cy)-(r-25))<1e-9,'le corps est 25 px vers le centre');
 }
 assert.deepEqual(pickupCenter({x:10,feet:400,angle:.5}),{x:10,y:375},'hors looping : inchangé');
});

test('every loop coin can be collected at full speed',async()=>{
 const {buildLevel,groundAt,heightOn,MAX_SPEED}=await import('../src/level.js');
 const {createRunner,stepRunner}=await import('../src/movement.js');
 const level=buildLevel();
 for(const loop of level.loops){
  const ring=level.tokens.filter(t=>Math.hypot(t.x-loop.x,t.y-(loop.baseY-loop.radius))<loop.radius+5);
  const start=loop.x-60,surf=loop.surface?level.platforms.find(p=>p.id===loop.surface):groundAt(level,start);
  const p=createRunner(start,heightOn(surf,start));p.surfaceId=surf.id;p.vx=MAX_SPEED;
  const got=new Set();let entered=false;
  for(let f=0;f<480;f++){
   stepRunner(p,{right:true},level,1/120);if(p.loop)entered=true;
   const c=pickupCenter(p);
   ring.forEach((t,i)=>{if(Math.abs(t.x-c.x)<23&&Math.abs(t.y-c.y)<32)got.add(i);});
   if(entered&&!p.loop&&p.x>loop.x+80)break;
  }
  assert.ok(entered,`${loop.id} : entrée`);assert.equal(got.size,ring.length,`${loop.id} : toutes les pièces`);
 }
});
