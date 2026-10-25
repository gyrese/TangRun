import test from 'node:test';
import assert from 'node:assert/strict';
import {speedProfile} from '../src/speed-feedback.js';
import {buildLevel,groundAt,heightOn} from '../src/level.js';
import {resolveScenery} from '../src/scenery.js';
import fs from 'node:fs';

test('speed view preserves normal framing and caps boost effects in both directions',()=>{
 assert.deepEqual(speedProfile(330),{intensity:0,zoom:1,lookAhead:140});
 for(const v of [0,330,500,740,850,1200,-330,-850]){
  const p=speedProfile(v);assert.ok(p.intensity>=0&&p.intensity<=1);assert.ok(p.zoom>=.935&&p.zoom<=1);
  assert.ok(Math.abs(p.lookAhead)<=255);
  if(v< -30)assert.ok(p.lookAhead<0);
 }
 assert.ok(speedProfile(740).zoom<speedProfile(500).zoom);
 assert.equal(speedProfile(850,true).zoom,1);assert.equal(speedProfile(850,true).intensity,0);
});

test('new path clusters have valid foundations and leave gameplay mechanisms clear',()=>{
 const level=buildLevel(),props=level.scenery.filter(p=>p.id.startsWith('path-cluster-'));
 const assets=JSON.parse(fs.readFileSync(new URL('../assets/manifest-v3.json',import.meta.url)));
 assert.ok(props.length>=45);
 for(const p of props){
  const asset=assets.find(a=>a.key===p.key);assert.ok(asset);
  assert.ok(resolveScenery(level,p,asset.size[0]*p.scale),`Hidden prop ${p.id}`);
  assert.ok(!level.gaps.some(([a,b])=>p.x>a-115&&p.x<b+115));
  assert.ok(![...level.springs,...level.pads,...level.checkpoints].some(m=>Math.abs(m.x-p.x)<115));
 }
 assert.ok(level.pathDetails.length>300);
 for(const p of level.pathDetails){
  const floor=groundAt(level,p.x),roof=level.platforms.find(s=>s.kind==='roof'&&p.x>=s.x&&p.x<=s.x+s.w&&p.y===s.y+8);
  assert.ok(roof||(floor&&Math.abs(p.y-heightOn(floor,p.x)-7)<.001),'Detail must be recessed below a real path');
 }
});
