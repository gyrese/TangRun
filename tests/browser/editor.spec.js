import {test,expect} from '@playwright/test';
test('editor is available only by its direct address with no game link',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await page.waitForFunction(()=>window.__LTN__?.game.scene.getScene('run')?.level);
 await expect(page.locator('a[href*="editeur"], .admin-link, #open-editor')).toHaveCount(0);
 await page.goto('/?admin');await page.waitForFunction(()=>window.__LTN__?.game.scene.getScene('run')?.level);expect(await page.evaluate(()=>Boolean(window.__LTN_EDITOR__))).toBe(false);
 await page.goto('/editeur');await page.waitForFunction(()=>window.__LTN_EDITOR__?.ready);await expect(page.locator('h1')).toHaveText('Bibliothèque');
 await page.goto('/editeur/');await page.waitForFunction(()=>window.__LTN_EDITOR__?.ready);expect(errors).toEqual([]);
});
test('editor places, edits, restores, saves and plays the authored level',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/editeur');await expect(page.locator('h1')).toHaveText('Bibliothèque');
 await page.waitForFunction(()=>window.__LTN_EDITOR__?.ready);
 await expect(page.locator('#game-preview canvas')).toBeVisible();
 await expect(page.locator('.asset-card img').first()).toHaveAttribute('src',/^data:image/);
 await page.screenshot({path:'.local/editor-desktop.png'});
 const count=await page.evaluate(async()=>{const {buildLevel}=await import('/src/level.js');return buildLevel().platforms.length;});
 await page.locator('#place').click();const map=await page.locator('#map').boundingBox();await page.mouse.click(map.x+240,map.y+210);
 await expect(page.locator('#selection-title')).toHaveText('Plateformes');
 await page.getByLabel('Largeur',{exact:true}).fill('310');await page.getByLabel('Largeur',{exact:true}).press('Tab');
 await page.locator('#save').click();
 await page.waitForFunction(()=>window.__LTN_EDITOR__?.ready);
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('ltn-editor-draft-v1')).platforms.at(-1).w)).toBe(310);
 await page.locator('#delete').click();await page.locator('#undo').click();
 await page.locator('#save').click();await page.reload();await expect(page.locator('h1')).toBeVisible();
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('ltn-editor-draft-v1')).platforms.length)).toBe(count+1);
 await page.locator('#test').click();await expect(page).toHaveURL(/custom=1/);await expect(page.locator('#play')).toBeEnabled();
 await page.waitForFunction(()=>window.__LTN__?.game.scene.getScene('run')?.level);
 expect(await page.evaluate(()=>window.__LTN__.game.scene.getScene('run').level.platforms.at(-1).w)).toBe(310);
 await expect(page.locator('#boot-screen')).toBeHidden();await page.locator('#play').click();
 await expect.poll(()=>page.evaluate(()=>window.__LTN__.state.mode)).toBe('running');expect(errors).toEqual([]);
});

test('game panoramas stay within their edges at every editor zoom and region',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/editeur');await page.waitForFunction(()=>window.__LTN_EDITOR__?.ready);
 for(const [region,index]of [['0',0],['8400',1],['16800',2],['25200',3]]){
  await page.locator('#region').selectOption(region);
  for(const zoom of ['0.25','1','1.5']){
   await page.locator('#zoom').selectOption(zoom);
   await expect.poll(()=>page.evaluate(i=>window.__LTN_EDITOR__.backgrounds[i].alpha,index)).toBe(1);
   await page.waitForTimeout(80);
   const bg=await page.evaluate(i=>window.__LTN_EDITOR__.backgrounds[i],index);
   expect(bg.sourceWidth*bg.scale).toBeGreaterThanOrEqual(bg.width-.01);
   expect(bg.sourceHeight*bg.scale).toBeGreaterThanOrEqual(bg.height-.01);
   expect(bg.x).toBeGreaterThanOrEqual(0);expect(bg.x+bg.width/bg.scale).toBeLessThanOrEqual(bg.sourceWidth+.01);expect(bg.y).toBe(0);
  }
  await page.locator('#zoom').selectOption('1');await page.waitForTimeout(80);
  await page.screenshot({path:`.local/editor-region-${index}.png`});
 }
 const before=await page.evaluate(()=>window.__LTN_EDITOR__.view.x);
 const map=await page.locator('#map').boundingBox();await page.keyboard.down('Space');await page.mouse.move(map.x+400,map.y+200);await page.mouse.down();await page.mouse.move(map.x+250,map.y+250,{steps:8});await page.mouse.up();await page.keyboard.up('Space');
 expect(await page.evaluate(()=>window.__LTN_EDITOR__.view.x)).toBeGreaterThan(before);
 await page.locator('#kind').selectOption('adventure.enemies');await page.getByRole('button',{name:'Drone',exact:true}).click();await page.mouse.click(map.x+250,map.y+200);
 await page.waitForFunction(()=>window.__LTN_EDITOR__?.ready);
 expect(await page.evaluate(()=>window.__LTN_EDITOR__.level.adventure.enemies.at(-1).kind)).toBe('drone');
 await page.locator('#undo').click();await page.waitForFunction(()=>window.__LTN_EDITOR__?.ready);expect(errors).toEqual([]);
});

test('platform handles edit the collision slope directly on the game preview',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/editeur');await page.waitForFunction(()=>window.__LTN_EDITOR__?.ready);
 await page.getByRole('button',{name:'Corniche',exact:true}).click();
 const map=await page.locator('#map').boundingBox();await page.mouse.click(map.x+240,map.y+150);
 await page.waitForFunction(()=>window.__LTN_EDITOR__?.ready);
 await page.locator('#select').click();
 const before=await page.evaluate(()=>structuredClone(window.__LTN_EDITOR__.level.platforms.at(-1)));
 const view=await page.evaluate(()=>window.__LTN_EDITOR__.view);
 const x=map.x+(before.x+before.w-view.x)*view.zoom,y=map.y+(before.y2-view.y)*view.zoom;
 await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+60,y+40,{steps:6});await page.mouse.up();
 await page.waitForFunction(()=>window.__LTN_EDITOR__?.ready);
 const after=await page.evaluate(()=>window.__LTN_EDITOR__.level.platforms.at(-1));
 expect(after.w).toBe(before.w+60);expect(after.y2).toBe(before.y2+40);expect(after.slope).toBeCloseTo((after.y2-after.y)/after.w);
 await page.locator('#undo').click();await page.waitForFunction(()=>window.__LTN_EDITOR__?.ready);
 expect(await page.evaluate(()=>window.__LTN_EDITOR__.level.platforms.at(-1).w)).toBe(before.w);expect(errors).toEqual([]);
});

test('moving one original decoration preserves every other sprite and its own scale',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/editeur');await page.waitForFunction(()=>window.__LTN_EDITOR__?.ready);
 const baseline=await page.evaluate(()=>({objects:window.__LTN_EDITOR__.objects,level:structuredClone(window.__LTN_EDITOR__.level),view:window.__LTN_EDITOR__.view}));
 await page.waitForTimeout(600);expect(await page.evaluate(()=>window.__LTN_EDITOR__.objects)).toEqual(baseline.objects);
 const map=await page.locator('#map').boundingBox();
 const target=baseline.objects.find(e=>e.key.startsWith('adventure.landmarks:')&&e.bounds&&e.bounds.x>150&&e.bounds.x+e.bounds.w<map.width&&e.bounds.y>baseline.view.y&&e.bounds.y+e.bounds.h<baseline.view.y+map.height);
 expect(target).toBeTruthy();const b=target.bounds,x=map.x+b.x+b.w*.5,y=map.y+b.y+b.h*.5-baseline.view.y;
 await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+80,y-30,{steps:8});await page.mouse.up();await page.waitForFunction(()=>window.__LTN_EDITOR__?.ready);
 const selection=await page.evaluate(()=>window.__LTN_EDITOR__.selection);expect(`${selection.key}:${selection.index}`).toBe(target.key);
 const after=await page.evaluate(()=>({objects:window.__LTN_EDITOR__.objects,level:structuredClone(window.__LTN_EDITOR__.level)}));
 expect(after.objects.filter(p=>p.key!==target.key)).toEqual(baseline.objects.filter(p=>p.key!==target.key));
 const original=baseline.level.adventure.landmarks[selection.index],moved=after.level.adventure.landmarks[selection.index];expect(moved.scale).toBe(original.scale);expect(moved.x).toBe(original.x+80);expect(moved.y).toBe(original.y-30);
 const unchanged=structuredClone(after.level);unchanged.adventure.landmarks[selection.index]=original;expect(unchanged).toEqual(baseline.level);
 await page.locator('#undo').click();await page.waitForFunction(()=>window.__LTN_EDITOR__?.ready);expect(await page.evaluate(()=>window.__LTN_EDITOR__.objects)).toEqual(baseline.objects);
 await page.locator('#redo').click();await page.waitForFunction(()=>window.__LTN_EDITOR__?.ready);expect(await page.evaluate(()=>window.__LTN_EDITOR__.objects)).toEqual(after.objects);
 await page.locator('#save').click();await page.reload();await page.waitForFunction(()=>window.__LTN_EDITOR__?.ready);expect(await page.evaluate(()=>window.__LTN_EDITOR__.objects)).toEqual(after.objects);expect(errors).toEqual([]);
});

test('an overlapping new platform cannot remove or relocate original decoration',async({page})=>{
 await page.goto('/editeur');await page.waitForFunction(()=>window.__LTN_EDITOR__?.ready);
 const before=await page.evaluate(()=>window.__LTN_EDITOR__.objects);const view=await page.evaluate(()=>window.__LTN_EDITOR__.view),map=await page.locator('#map').boundingBox();
 const target=before.find(p=>p.key.startsWith('adventure.landmarks:')&&p.bounds?.x>200&&p.bounds.x+p.bounds.w<map.width);
 await page.getByRole('button',{name:'Corniche',exact:true}).click();await page.mouse.click(map.x+target.bounds.x,map.y+target.bounds.y-view.y);
 await page.waitForFunction(()=>window.__LTN_EDITOR__?.ready);
 expect(await page.evaluate(()=>window.__LTN_EDITOR__.objects.filter(p=>!p.key.startsWith('platforms:')))).toEqual(before.filter(p=>!p.key.startsWith('platforms:')));
});

test('clicks stay clean and Escape cancels a drag as one transaction',async({page})=>{
 await page.goto('/editeur');await page.waitForFunction(()=>window.__LTN_EDITOR__?.ready);
 const baseline=await page.evaluate(()=>JSON.stringify(window.__LTN_EDITOR__.level));const map=await page.locator('#map').boundingBox();const view=await page.evaluate(()=>window.__LTN_EDITOR__.view);
 const target=await page.evaluate(()=>window.__LTN_EDITOR__.objects.find(p=>p.key.startsWith('tokens:')&&p.bounds?.x>250&&p.bounds.x<400));
 const x=map.x+target.bounds.x+target.bounds.w/2,y=map.y+target.bounds.y+target.bounds.h/2-view.y;
 await page.mouse.click(x,y);expect(await page.evaluate(()=>window.__LTN_EDITOR__.dirty)).toBe(false);
 await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+60,y-40,{steps:4});await page.keyboard.press('Escape');await page.mouse.up();await page.waitForFunction(()=>window.__LTN_EDITOR__?.ready);
 expect(await page.evaluate(()=>JSON.stringify(window.__LTN_EDITOR__.level))).toBe(baseline);expect(await page.evaluate(()=>window.__LTN_EDITOR__.dirty)).toBe(false);await expect(page.locator('#undo')).toBeDisabled();
});

test('invalid properties and malformed imports leave the current level intact',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/editeur');await page.waitForFunction(()=>window.__LTN_EDITOR__?.ready);
 await page.getByRole('button',{name:'Corniche',exact:true}).click();const map=await page.locator('#map').boundingBox();await page.mouse.click(map.x+240,map.y+160);await page.waitForFunction(()=>window.__LTN_EDITOR__?.ready);
 const baseline=await page.evaluate(()=>JSON.stringify(window.__LTN_EDITOR__.level));
 await page.getByLabel('Y · hauteur',{exact:true}).fill('999999');await page.getByLabel('Y · hauteur',{exact:true}).press('Tab');await expect(page.locator('#status')).toContainText('limites');
 expect(await page.evaluate(()=>JSON.stringify(window.__LTN_EDITOR__.level))).toBe(baseline);
 await page.locator('#file').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{"terrain":null}')});await expect(page.locator('#status')).toContainText('Import impossible');
 expect(await page.evaluate(()=>JSON.stringify(window.__LTN_EDITOR__.level))).toBe(baseline);expect(errors).toEqual([]);
});

test('duplicate, saved dirty state, export and import retain exactly the authored layout',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/editeur');await page.waitForFunction(()=>window.__LTN_EDITOR__?.ready);
 await page.getByRole('button',{name:'Corniche',exact:true}).click();const map=await page.locator('#map').boundingBox();await page.mouse.click(map.x+240,map.y+150);await page.waitForFunction(()=>window.__LTN_EDITOR__?.ready);
 await page.locator('#duplicate').click();await page.waitForFunction(()=>window.__LTN_EDITOR__?.ready);
 const ids=await page.evaluate(()=>window.__LTN_EDITOR__.level.platforms.map(p=>p.id));expect(new Set(ids).size).toBe(ids.length);
 await page.locator('#save').click();expect(await page.evaluate(()=>window.__LTN_EDITOR__.dirty)).toBe(false);
 await page.locator('#undo').click();await page.waitForFunction(()=>window.__LTN_EDITOR__?.ready);expect(await page.evaluate(()=>window.__LTN_EDITOR__.dirty)).toBe(true);
 await page.locator('#redo').click();await page.waitForFunction(()=>window.__LTN_EDITOR__?.ready);expect(await page.evaluate(()=>window.__LTN_EDITOR__.dirty)).toBe(false);
 const layout=await page.evaluate(()=>window.__LTN_EDITOR__.objects);
 await page.locator('.files summary').click();const downloadPromise=page.waitForEvent('download');await page.locator('#export').click();const download=await downloadPromise;
 await page.locator('#original').click();await page.waitForFunction(()=>window.__LTN_EDITOR__?.ready);
 await page.locator('#file').setInputFiles(await download.path());await expect(page.locator('#status')).toContainText('Niveau importé');await page.waitForFunction(()=>window.__LTN_EDITOR__?.ready);
 expect(await page.evaluate(()=>window.__LTN_EDITOR__.objects)).toEqual(layout);expect(errors).toEqual([]);
});

test('small-screen editing and undo preserve the original level',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width:640,height:900});await page.goto('/editeur');await page.waitForFunction(()=>window.__LTN_EDITOR__?.ready);
 const baseline=await page.evaluate(()=>JSON.stringify(window.__LTN_EDITOR__.level));
 await page.getByRole('button',{name:'Corniche',exact:true}).click();const map=await page.locator('#map').boundingBox();await page.mouse.click(map.x+100,map.y+100);await page.waitForFunction(()=>window.__LTN_EDITOR__?.ready);
 const after=await page.evaluate(()=>window.__LTN_EDITOR__.level.platforms.length);expect(after).toBe(JSON.parse(baseline).platforms.length+1);
 await page.locator('#undo').click();await page.waitForFunction(()=>window.__LTN_EDITOR__?.ready);expect(await page.evaluate(()=>JSON.stringify(window.__LTN_EDITOR__.level))).toBe(baseline);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);
});

test('overlapping objects can be selected separately and a return drag makes no edit',async({page})=>{
 await page.goto('/editeur');await page.waitForFunction(()=>window.__LTN_EDITOR__?.ready);await page.getByRole('button',{name:'Corniche',exact:true}).click();
 const map=await page.locator('#map').boundingBox();
 for(let i=0;i<2;i++){await page.mouse.click(map.x+240,map.y+140);await page.waitForFunction(()=>window.__LTN_EDITOR__?.ready);}
 await page.locator('#select').click();const last=await page.evaluate(()=>window.__LTN_EDITOR__.selection.index);
 await page.keyboard.down('Alt');await page.mouse.click(map.x+330,map.y+150);await page.keyboard.up('Alt');expect(await page.evaluate(()=>window.__LTN_EDITOR__.selection.index)).toBe(last-1);
 await page.locator('#save').click();const before=await page.evaluate(()=>JSON.stringify(window.__LTN_EDITOR__.level));
 await page.mouse.move(map.x+330,map.y+150);await page.mouse.down();await page.mouse.move(map.x+390,map.y+110,{steps:4});await page.mouse.move(map.x+330,map.y+150,{steps:4});await page.mouse.up();await page.waitForFunction(()=>window.__LTN_EDITOR__?.ready);
 const diffs=await page.evaluate(raw=>{const a=JSON.parse(raw),b=window.__LTN_EDITOR__.level,changes=[];for(const key of ['terrain','platforms','scenery','tokens','checkpoints','springs','pads','loops','movers'])for(let i=0;i<a[key].length;i++)if(JSON.stringify(a[key][i])!==JSON.stringify(b[key][i]))changes.push({key,index:i,before:a[key][i],after:b[key][i]});return changes;},before);expect(diffs).toEqual([]);expect(await page.evaluate(()=>window.__LTN_EDITOR__.dirty)).toBe(false);
});

test('dragging previews the selected sprite without rebuilding the world',async({page})=>{
 await page.goto('/editeur');await page.waitForFunction(()=>window.__LTN_EDITOR__?.ready);
 await page.getByRole('button',{name:'Corniche',exact:true}).click();const map=await page.locator('#map').boundingBox();await page.mouse.click(map.x+240,map.y+140);await page.waitForFunction(()=>window.__LTN_EDITOR__?.ready);await page.locator('#select').click();
 const metrics=await page.evaluate(()=>window.__LTN_EDITOR__.metrics),before=await page.evaluate(()=>window.__LTN_EDITOR__.objects);
 await page.mouse.move(map.x+320,map.y+150);await page.mouse.down();await page.mouse.move(map.x+460,map.y+110,{steps:24});
 const during=await page.evaluate(()=>window.__LTN_EDITOR__.metrics);expect(during.builds).toBe(metrics.builds);expect(during.previews-metrics.previews).toBeGreaterThan(10);
 const selected=await page.evaluate(()=>window.__LTN_EDITOR__.selection),key=`${selected.key}:${selected.index}`;
 expect(await page.evaluate(k=>window.__LTN_EDITOR__.objects.filter(p=>p.key!==k),key)).toEqual(before.filter(p=>p.key!==key));
 await page.mouse.up();await page.waitForFunction(()=>window.__LTN_EDITOR__?.ready);expect((await page.evaluate(()=>window.__LTN_EDITOR__.metrics)).builds).toBe(metrics.builds+1);
});

test('search, layer controls, cursor zoom, keyboard nudge and overview work together',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/editeur');await page.waitForFunction(()=>window.__LTN_EDITOR__?.ready);
 await page.getByRole('searchbox',{name:'Rechercher un objet'}).fill('drone');await expect(page.locator('.asset-card')).toHaveCount(1);await page.getByRole('button',{name:'Drone',exact:true}).click();
 let map=await page.locator('#map').boundingBox();await page.mouse.click(map.x+250,map.y+160);await page.waitForFunction(()=>window.__LTN_EDITOR__?.ready);await page.locator('#select').click();await page.locator('#map').focus();
 const x=await page.evaluate(()=>window.__LTN_EDITOR__.level.adventure.enemies.at(-1).x);await page.keyboard.press('Shift+ArrowRight');await page.waitForFunction(()=>window.__LTN_EDITOR__?.ready);expect(await page.evaluate(()=>window.__LTN_EDITOR__.level.adventure.enemies.at(-1).x)).toBe(x+10);
 await page.keyboard.press('Control+d');await page.waitForFunction(()=>window.__LTN_EDITOR__?.ready);expect(await page.evaluate(()=>window.__LTN_EDITOR__.level.adventure.enemies.at(-1).x)).toBe(x+50);
 await page.getByRole('button',{name:'Afficher ou masquer : Décors',exact:true}).click();expect(await page.evaluate(()=>window.__LTN_EDITOR__.objects.filter(p=>p.key.startsWith('scenery:')||p.key.startsWith('adventure.landmarks:')).every(p=>p.objects.every(o=>!o.visible)))).toBe(true);
 await page.getByRole('button',{name:'Afficher ou masquer : Décors',exact:true}).click();await page.getByRole('button',{name:'Verrouiller : Terrain',exact:true}).click();await expect(page.getByRole('button',{name:'Verrouiller : Terrain',exact:true})).toHaveAttribute('aria-pressed','true');
 const view=await page.evaluate(()=>window.__LTN_EDITOR__.view);map=await page.locator('#map').boundingBox();const anchor={x:map.width*.6,y:map.height*.4};await page.mouse.move(map.x+anchor.x,map.y+anchor.y);await page.keyboard.down('Control');await page.mouse.wheel(0,-100);await page.keyboard.up('Control');
 await expect.poll(()=>page.evaluate(()=>window.__LTN_EDITOR__.view.zoom)).toBeGreaterThan(view.zoom);const zoomed=await page.evaluate(()=>window.__LTN_EDITOR__.view);expect(zoomed.x+anchor.x/zoomed.zoom).toBeCloseTo(view.x+anchor.x/view.zoom,0);expect(zoomed.y+anchor.y/zoomed.zoom).toBeCloseTo(view.y+anchor.y/view.zoom,0);
 const overview=await page.locator('#overview').boundingBox();await page.mouse.click(overview.x+overview.width*.7,overview.y+20);expect(await page.evaluate(()=>window.__LTN_EDITOR__.view.x)).toBeGreaterThan(15000);
 await page.locator('#focus-mode').click();await expect(page.locator('.workspace>aside').first()).toBeHidden();await page.locator('#focus-mode').click();await expect(page.locator('.workspace>aside').first()).toBeVisible();expect(errors).toEqual([]);
});

test('test-here starts the custom game in the edited region',async({page})=>{
 await page.goto('/editeur');await page.waitForFunction(()=>window.__LTN_EDITOR__?.ready);await page.locator('#region').selectOption('8400');await page.locator('#test-here').click();await expect(page).toHaveURL(/custom=1&spawn=/);
 await page.waitForFunction(()=>window.__LTN__?.game.scene.getScene('run')?.level);if(await page.locator('#boot-screen').isVisible())await page.locator('#skip-boot').click();await page.locator('#play').click();
 const state=await page.evaluate(()=>window.__LTN__.state);expect(state.x).toBeGreaterThanOrEqual(8400);expect(state.x).toBeLessThan(10000);await expect(page.locator('a[href*="editeur"]')).toHaveCount(0);
});

test('expanded library, GD slope metrics, auto token arcs and live animation preview work together',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/editeur');await page.waitForFunction(()=>window.__LTN_EDITOR__?.ready);
 await page.locator('#kind').selectOption('scenery');await expect(page.locator('.asset-card')).toHaveCount(27);
 await page.locator('#kind').selectOption('platforms');await page.getByRole('button',{name:'Corniche',exact:true}).click();
 const map=await page.locator('#map').boundingBox();await page.mouse.click(map.x+260,map.y+150);await page.waitForFunction(()=>window.__LTN_EDITOR__?.ready);
 await expect(page.locator('#gd-metrics')).toContainText('Pente');
 const tokensBefore=await page.evaluate(()=>window.__LTN_EDITOR__.level.tokens.length);
 await page.locator('#token-arc').click();await page.waitForFunction(()=>window.__LTN_EDITOR__?.ready);
 expect(await page.evaluate(()=>window.__LTN_EDITOR__.level.tokens.length)).toBeGreaterThan(tokensBefore);
 await page.locator('#live-preview').click();expect(await page.evaluate(()=>window.__LTN_EDITOR__.livePreview)).toBe(true);
 await page.locator('#live-preview').click();expect(await page.evaluate(()=>window.__LTN_EDITOR__.livePreview)).toBe(false);
 expect(errors).toEqual([]);
});
