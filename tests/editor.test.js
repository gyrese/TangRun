import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildLevel,heightOn} from '../src/level.js';
import {createRunner,stepRunner} from '../src/movement.js';
import {planScenery} from '../src/scenery.js';
import {freezeEditorLayout} from '../src/editor-layout.js';
import {validateLevel,normalizeLevel} from '../src/editor-store.js';
import {syncEditorObject,syncTerrainGaps} from '../src/editor-object.js';
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
 for(const mutate of [l=>l.platforms[0].id=l.terrain[0].id,l=>l.terrain[0].y=900,l=>l.platforms[0].y2=-7000,l=>l.platforms[0].w=100000,l=>l.movers[0].motion.period=0,l=>l.adventure.enemies[0].kind='missing-texture',l=>l.adventure.monitors[0].type='missing-texture']){
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

test('terrain edits recompute ravine gaps and elevated springs/crabs attach to platforms',()=>{
 const level=buildLevel(),baselineGaps=structuredClone(level.gaps);
 assert.deepEqual(syncTerrainGaps(level),baselineGaps);
 // Shorten the first ground segment to open a new ravine of 150px
 const prevEnd=level.terrain[0].x+level.terrain[0].w;
 level.terrain[0].w-=150;
 syncEditorObject(level,'terrain',level.terrain[0]);
 assert.ok(level.gaps.some(([a,b])=>a===prevEnd-150&&b===prevEnd),'New ravine gap is registered automatically');
 // Place a spring and a crab on an elevated roof platform
 const roof=level.platforms.find(p=>p.kind==='roof'&&!p.slope);
 const spring={id:'roof-spring',x:roof.x+60,y:heightOn(roof,roof.x+60)-5,power:780};
 syncEditorObject(level,'springs',spring);
 assert.equal(spring.surface,roof.id);
 assert.equal(spring.y,heightOn(roof,spring.x));
 level.springs.push(spring);
 const runner=createRunner(spring.x-4,spring.y);runner.surfaceId=roof.id;runner.vx=200;
 const ev=stepRunner(runner,{left:false,right:true,jump:false,slide:false},level,1/120);
 assert.equal(ev.jumped,true);assert.equal(runner.vy,-780);
 const crab={id:'roof-crab',x:roof.x+80,y:roof.y-18,kind:'crab',range:30,phase:0};
 syncEditorObject(level,'adventure.enemies',crab);
 assert.equal(crab.surfaceId,roof.id);
 assert.deepEqual(crab.ground,[roof.y-18,roof.y-18,roof.y-18]);
});

test('high-route pads keep their roof support on nudge, ignore crates/beams, and custom movers carry riders',()=>{
 const level=buildLevel();
 // High-route pad without explicit y stays on its elevated roof when nudged horizontally
 const highPad=level.pads.find(p=>!p.surface.startsWith('ground'));
 const originalSurface=highPad.surface;
 highPad.x+=10;
 syncEditorObject(level,'pads',highPad);
 assert.equal(highPad.surface,originalSurface);
 // Boost pads never attach to low gates (beam) or crates
 const beam=level.platforms.find(p=>p.kind==='beam');
 const padNearBeam={id:'pad-beam-test',x:beam.x+20,y:beam.y,speed:740};
 syncEditorObject(level,'pads',padNearBeam);
 assert.notEqual(padNearBeam.surface,beam.id);
 // Custom mover with arbitrary ID carries rider horizontally
 const mover={id:'custom-mover-1',kind:'roof',style:'basalt',x:500,y:350,y2:350,w:140,h:22,slope:0,motion:{axis:'x',amplitude:60,period:2}};
 level.movers.push(mover);
 const runner=createRunner(570,350);runner.surfaceId=mover.id;
 for(let i=0;i<30;i++)stepRunner(runner,{left:false,right:false,jump:false,slide:false},level,1/120);
 assert.ok(runner.x>590,'Custom mover carries rider along X');
 // Relic zone follows X across regions
 const relic=level.adventure.relics[0];
 relic.x=18500;
 syncEditorObject(level,'adventure.relics',relic);
 assert.equal(relic.zone,2);
});
