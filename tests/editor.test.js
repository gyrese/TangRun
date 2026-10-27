import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildLevel} from '../src/level.js';
import {planScenery} from '../src/scenery.js';
import {freezeEditorLayout} from '../src/editor-layout.js';
import {validateLevel,normalizeLevel} from '../src/editor-store.js';
import {syncEditorObject} from '../src/editor-object.js';
import {enemyPosition} from '../src/adventure.js';
const assets=JSON.parse(fs.readFileSync(new URL('../assets/manifest-v3.json',import.meta.url)));
const landmarks=JSON.parse(fs.readFileSync(new URL('../assets/manifest-v6.json',import.meta.url)));
const measure=key=>{const item=key.startsWith('v6-')?landmarks.find(a=>a.key===key.slice(3)):assets.find(a=>a.key===key);return{width:item?.size[0]||212,height:item?.size[1]||350};};
const placements=level=>planScenery(level,measure).all.map(p=>({id:p.id,x:p.x,y:p.y,scale:p.scale}));
test('freeze preserves the visible composition and retained hidden source data',()=>{
 const level=buildLevel(),before=planScenery(level,measure),count=level.scenery.length;
 freezeEditorLayout(level,measure);assert.equal(level.scenery.length,count);
 const after=planScenery(level,measure);
 assert.deepEqual(after.scenery.map(p=>[p.x,p.y,p.scale]),before.scenery.map(p=>[p.x,p.y,p.scale]));
 assert.deepEqual(after.landmarks.map(p=>[p.x,p.y,p.scale]),before.landmarks.map(p=>[p.x,p.y,p.scale]));
 assert.ok(level.scenery.some(p=>p.editorHidden));validateLevel(level);
});
test('moving hazards or platforms never reflows frozen scenery, even after serialization',()=>{
 const level=freezeEditorLayout(buildLevel(),measure),before=placements(level);
 level.platforms[0].x+=100;level.springs[0].x+=300;level.adventure.enemies[0].x+=200;
 assert.deepEqual(placements(level),before);
 assert.deepEqual(placements(normalizeLevel(JSON.parse(JSON.stringify(level)))),before);
 assert.deepEqual(freezeEditorLayout(level,()=>{throw Error('must not replan');}),level);
});
test('normalization preserves selection order and resolves boosts at the actual sloped height',()=>{
 const level=buildLevel();level.terrain.reverse();const ids=level.terrain.map(p=>p.id);
 normalizeLevel(level);assert.deepEqual(level.terrain.map(p=>p.id),ids);
 level.platforms.push({id:'slope-a',kind:'roof',x:100,y:100,y2:400,w:300,h:20,slope:1});
 level.platforms.push({id:'slope-b',kind:'roof',x:100,y:250,y2:250,w:300,h:20,slope:0});
 level.pads.push({x:390,y:390,speed:700});normalizeLevel(level);assert.equal(level.pads.at(-1).surface,'slope-a');
});
test('unfinished drafts save while playing rejects absent starts or boost supports',()=>{
 const level=buildLevel();level.terrain=level.terrain.filter(p=>p.x>500);
 assert.doesNotThrow(()=>normalizeLevel(structuredClone(level)));
 assert.throws(()=>normalizeLevel(structuredClone(level),{playable:true}),/départ/);
 const boosts=buildLevel();boosts.pads.push({x:2600,y:450,speed:700});
 assert.doesNotThrow(()=>normalizeLevel(structuredClone(boosts)));
});
test('reject duplicate surface IDs and geometry that would crash the renderer',()=>{
 for(const mutate of [l=>l.platforms[0].id=l.terrain[0].id,l=>l.terrain[0].y=900,l=>l.platforms[0].y2=-1000,l=>l.platforms[0].w=100000,l=>l.movers[0].motion.period=0,l=>l.adventure.enemies[0].kind='missing-texture',l=>l.adventure.monitors[0].type='missing-texture']){
  const level=buildLevel();mutate(level);assert.throws(()=>normalizeLevel(level));
 }
});

test('edited patrol metadata follows only the edited enemy and zero patrol range is finite',()=>{
 const level=buildLevel(),other=structuredClone(level.adventure.enemies[1]),p=level.adventure.enemies[0];
 p.x+=500;p.y-=25;syncEditorObject(level,'adventure.enemies',p);assert.equal(p.ground[1],p.y);assert.deepEqual(level.adventure.enemies[1],other);
 p.range=0;assert.ok(Number.isFinite(enemyPosition(p,2).y));syncEditorObject(level,'adventure.enemies',p);assert.equal(p.ground,undefined);
});

test('fixed platform support ownership survives deleting a neighboring rail section',()=>{
 const level=freezeEditorLayout(buildLevel(),measure),p=level.platforms.find(p=>p.rail),index=level.platforms.indexOf(p),next=level.platforms[index+1];
 const supports=structuredClone(next.editorSupports);level.platforms.splice(index,1);assert.deepEqual(next.editorSupports,supports);
});
