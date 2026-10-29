import test from 'node:test';
import assert from 'node:assert/strict';
import {frameBounds,contactPose} from '../src/runner-pose.js';
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
