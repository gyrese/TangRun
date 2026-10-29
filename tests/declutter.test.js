import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildLevel} from '../src/level.js';
import {planScenery,decorOverlap} from '../src/scenery.js';
const assets=JSON.parse(fs.readFileSync(new URL('../assets/manifest-v3.json',import.meta.url)));
const landmarks=JSON.parse(fs.readFileSync(new URL('../assets/manifest-v6.json',import.meta.url)));
test('decor selection leaves space between sprites and protects the loop silhouettes',()=>{
 const level=buildLevel(),plan=planScenery(level,key=>{
  const a=key.startsWith('v6-')?landmarks.find(a=>a.key===key.slice(3)):assets.find(a=>a.key===key);
  return{width:a?.size[0]||212,height:a?.size[1]||350};
 });
 assert.ok(plan.all.length>20&&plan.all.length<70);
 assert.ok(plan.all.some(p=>p.key==='basaltarch'),'Keep the natural arches on valid foundations');
 for(const key of ['lava','tamarin','case-creole','fern','vacoa','pirogue'])assert.ok(plan.landmarks.some(p=>p.key===`v6-${key}`),`Réunion landmark must actually be visible: ${key}`);
 for(let i=0;i<plan.all.length;i++){
  const a=plan.all[i];if(!a.authored)assert.ok(a.width<=220.001&&a.height<=165.001);
  for(const b of plan.all.slice(i+1))assert.ok(!decorOverlap(a.bounds,b.bounds,42),`Overlapping decor ${a.id}/${b.id}`);
  for(const l of level.loops)assert.ok(!decorOverlap(a.bounds,{left:l.x-l.radius-35,right:l.x+l.radius+35,top:l.baseY-2*l.radius-20,bottom:l.baseY+8},12));
 }
});
test('bonus boxes do not overlap enemy patrols or checkpoint flags',()=>{
 const level=buildLevel();
 for(const m of level.adventure.monitors){
  for(const e of level.adventure.enemies)assert.ok(Math.abs(m.x-e.x)>=e.range+80,`${m.id} overlaps patrol ${e.id}`);
  for(const c of level.checkpoints)assert.ok(Math.abs(m.x-c.x)>=90,`${m.id} overlaps a checkpoint`);
 }
});
