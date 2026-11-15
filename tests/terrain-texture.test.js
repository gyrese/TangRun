import test from 'node:test';
import assert from 'node:assert/strict';
import {buildLevel} from '../src/level.js';
import {terrainTextureLayout} from '../src/terrain-texture.js';

test('terrain textures stay within a mobile memory budget and cover both slope ends',()=>{
 let bytes=0;
 for(const p of buildLevel().terrain){
  const t=terrainTextureLayout(p);
  assert.ok(t.height>0&&t.height<=1024,`${p.id}: texture height ${t.height}`);
  assert.ok(t.top+t.height>=Math.min(t.bottom,Math.max(p.y,p.y2)+540));
  bytes+=t.width*t.height*4;
 }
 assert.ok(bytes<80*1024*1024,`Terrain texture budget: ${bytes} bytes`);
});
