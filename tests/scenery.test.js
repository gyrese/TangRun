import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildLevel,groundAt,heightOn} from '../src/level.js';
import {resolveScenery,V3_KEYS} from '../src/scenery.js';
const manifest=JSON.parse(fs.readFileSync(new URL('../assets/manifest-v3.json',import.meta.url),'utf8'));

test('scenery uses real assets and wide structures have a level foundation',()=>{
 const level=buildLevel(),wide=new Set(['hut','kiosk','bench','surfboards','terrace','bollards','arch']);let placed=0;
 for(const item of level.scenery){
  assert.ok(V3_KEYS.includes(item.key)||item.key==='palm');
  const asset=manifest.find(a=>a.key===item.key),width=(asset?.size[0]||212)*item.scale;
  const placement=resolveScenery(level,item,width);if(!placement)continue;placed++;
  if(placement.anchor==='absolute')continue;
  const floor=groundAt(level,placement.x);assert.ok(floor);assert.ok(placement.y>=heightOn(floor,placement.x)&&placement.y<=heightOn(floor,placement.x)+8);if(placement.foundation){assert.equal(Math.floor(placement.x/8400),Math.floor(item.x/8400));assert.ok(Math.abs(placement.x-item.x)<=600);assert.ok(placement.foundation.variation<=8);}else assert.equal(placement.x,item.x,'Other decor keeps its authored socket');
  if(wide.has(item.key)){assert.equal(floor.slope,0);assert.ok(placement.x-width/2>=floor.x);assert.ok(placement.x+width/2<=floor.x+floor.w);}
 }
 assert.ok(placed>=38,'The authored scenes should stay well populated');
});
