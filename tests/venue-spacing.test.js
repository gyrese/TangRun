import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildLevel,GOAL_X,groundAt,heightOn} from '../src/level.js';
import {VENUE_KEYS} from '../src/scenery.js';

test('Saint-Gilles venues have a full wide viewport between their facades',()=>{
 const level=buildLevel(),assets=JSON.parse(fs.readFileSync(new URL('../assets/manifest-v3.json',import.meta.url)));
 const venues=level.scenery.filter(p=>VENUE_KEYS.includes(p.key)).map(p=>({...p,width:assets.find(a=>a.key===p.key).size[0]*p.scale}));
 assert.equal(venues.length,3);
 for(const p of venues){
  const base=groundAt(level,p.x),left=groundAt(level,p.x-p.width/2),right=groundAt(level,p.x+p.width/2);
  assert.ok(base&&left&&right,`${p.key} needs a complete ground footprint`);
  assert.equal(left.slope,0);assert.equal(right.slope,0);
  assert.equal(heightOn(left,p.x-p.width/2),heightOn(right,p.x+p.width/2));
  assert.ok(Math.abs(p.y-heightOn(base,p.x))<=10,`${p.key} sits on its new foundation`);
 }
 venues.push({key:'toiles-noires',x:GOAL_X+70,width:1673*.36});
 venues.sort((a,b)=>a.x-b.x);
 for(let i=1;i<venues.length;i++){
  const previous=venues[i-1],current=venues[i];
  const clear=current.x-current.width/2-(previous.x+previous.width/2);
  assert.ok(clear>=1400,`${previous.key}/${current.key} have only ${clear}px between them`);
 }
});
