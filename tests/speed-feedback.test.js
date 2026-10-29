import test from 'node:test';
import assert from 'node:assert/strict';
import {speedProfile,cameraFocus,snowCameraPlan,cameraZoom,dampCameraValue} from '../src/speed-feedback.js';
import {buildLevel,groundAt,heightOn} from '../src/level.js';
import {resolveScenery} from '../src/scenery.js';
import fs from 'node:fs';

test('speed view preserves normal framing and caps boost effects in both directions',()=>{
 assert.deepEqual(speedProfile(330),{intensity:0,zoom:1,lookAhead:60});
 for(const v of [0,330,500,740,850,1200,-330,-850]){
  const p=speedProfile(v);assert.ok(p.intensity>=0&&p.intensity<=1);assert.ok(p.zoom>=.935&&p.zoom<=1);
  assert.ok(Math.abs(p.lookAhead)<=100);
  if(v< -30)assert.ok(p.lookAhead<0);
 }
 assert.equal(speedProfile(740).zoom,speedProfile(500).zoom);
 assert.equal(speedProfile(850,true).zoom,1);assert.equal(speedProfile(850,true).intensity,0);
});

test('new path clusters have valid foundations and leave gameplay mechanisms clear',()=>{
 const level=buildLevel(),props=level.scenery.filter(p=>p.id.startsWith('path-cluster-'));
 const assets=JSON.parse(fs.readFileSync(new URL('../assets/manifest-v3.json',import.meta.url)));
 assert.ok(props.filter(p=>p.x>=8400).length>=30);
 for(const p of props){
  const asset=assets.find(a=>a.key===p.key);assert.ok(asset);
  assert.ok(resolveScenery(level,p,asset.size[0]*p.scale),`Hidden prop ${p.id}`);
  assert.ok(!level.gaps.some(([a,b])=>p.x>a-115&&p.x<b+115));
  assert.ok(![...level.springs,...level.pads,...level.checkpoints].some(m=>Math.abs(m.x-p.x)<115));
 }
 assert.ok(level.pathDetails.length>100&&level.pathDetails.length<200);
 for(const p of level.pathDetails){
  const floor=groundAt(level,p.x),roof=level.platforms.find(s=>s.kind==='roof'&&p.x>=s.x&&p.x<=s.x+s.w&&Math.abs(p.y-heightOn(s,p.x)-8)<.001);
  assert.ok(roof||(floor&&Math.abs(p.y-heightOn(floor,p.x)-7)<.001),'Detail must be recessed below a real path');
 }
});

test('camera holds its horizon on small jumps and its facing when braking to rest',()=>{
 const f={lookAhead:-80,facing:-1,focusFeet:450},p={x:1000,feet:450,vx:0,grounded:true};
 const grounded=cameraFocus(f,p,16);
 p.grounded=false;p.feet=365;
 const jumping=cameraFocus(f,p,16);
 assert.equal(jumping.y,grounded.y);assert.ok(jumping.x<p.x,'Stopping after going left keeps the leftward view');
 p.feet=200;
 const high=cameraFocus(f,p,16);
 assert.ok(high.y<jumping.y,'A large ascent still moves the view');
 p.feet=550;
 const falling=cameraFocus(f,p,16);
 assert.ok(falling.y>high.y,'A fall cannot disappear beneath the camera');
});

test('camera frames a loop as one space instead of following its orbit',()=>{
 const f={lookAhead:80,facing:1,focusFeet:600};
 const loop={x:1800,baseY:600,radius:180,entry:780};
 const bottom=cameraFocus(f,{x:1800,feet:600,vx:780,loop},0);
 const top=cameraFocus(f,{x:1800,feet:240,vx:-780,loop},0);
 assert.deepEqual(top,bottom);assert.equal(top.y,420);
});


test('snow descent frames the terrain below and widens the view for deep landings',()=>{
 const l=buildLevel(),x=1650,support=groundAt(l,x),p={x,feet:heightOn(support,x),vx:850,vy:0,slope:support.slope,grounded:true};
 const plan=snowCameraPlan(p,l,540);
 assert.ok(plan.zoom<.7);assert.ok(plan.lead>200);assert.ok(plan.lookAhead>=200);
 const f={focusFeet:p.feet,lookAhead:plan.lookAhead,snowLead:plan.lead,zoom:plan.zoom,verticalLead:plan.vertical*.045},focus=cameraFocus(f,p,16,false,plan);
 const screenY=(p.feet-focus.y)*plan.zoom+270;
 assert.ok(screenY>55&&screenY<220,'Runner occupies the upper part of the view');
 const landing=groundAt(l,2181),landingY=(heightOn(landing,2181)-focus.y)*plan.zoom+270;
 assert.ok(landingY>screenY&&landingY<540,'Lower reception is visible before takeoff');
 assert.equal(snowCameraPlan({...p,x:9000},l),null,'Other stages retain their own framing');
});


test('zoom eases with a continuous velocity and holds its wide view through a landing',()=>{
 const f={zoom:1,zoomVelocity:0};
 const first=cameraZoom(f,{zoom:.56,gap:true},1,16,0);
 assert.ok(1-first<.005,'Zoom-out starts gently');
 for(let t=16;t<800;t+=16)cameraZoom(f,{zoom:.56,gap:true},1,16,t);
 const wide=f.zoom;
 for(let t=800;t<1200;t+=16)cameraZoom(f,{zoom:1,gap:false},1,16,t);
 assert.ok(f.zoom<wide+.01,'Touchdown does not immediately zoom back in');
 const before=f.zoom;
 cameraZoom(f,{zoom:1,gap:false},1,16,1500);
 assert.ok(f.zoom-before<.005,'Return starts progressively');
 assert.equal(cameraZoom(f,{zoom:.82,gap:false},1,16,1600,true),.82);
});

test('camera damping is independent of render frame rate',()=>{
 const result=hz=>{let s={value:1,velocity:0};for(let i=0;i<hz;i++)s=dampCameraValue(s.value,s.velocity,.56,1/hz,8);return s;};
 const a=result(30),b=result(120);
 assert.ok(Math.abs(a.value-b.value)<1e-10);assert.ok(Math.abs(a.velocity-b.velocity)<1e-10);
});
