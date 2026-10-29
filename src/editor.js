import {buildLevel,groundAt,heightOn,WORLD_WIDTH,GOAL_X,SPEED,MAX_SPEED,JUMP_SPEED} from './level.js';
import {createRunner,stepRunner} from './movement.js';
import {COLLECTIONS,collection,DRAFT_KEY,TEST_KEY,normalizeLevel,validateLevel} from './editor-store.js';
import './editor.css';
import {createEditorRenderer} from './editor-renderer.js';
import {syncEditorObject,syncTerrainGaps} from './editor-object.js';

const names=['Sol / pente','Plateformes','Éclats','Drapeaux','Ressorts','Accélérateurs','Loopings','Panneaux','Décors','Plateformes mobiles','Ennemis','Emblèmes','Caisses bonus','Évents','Décors régionaux'];
let level=buildLevel(),selected=null,tool='select',kind='platforms',zoom=1,offset=0,viewY=0,undo=[],redo=[],drag=null,dirty=false,renderer=null,space=false,variant={},savedState='',startupWarning='',drawFrame=0,hoverPoint=null,telemetry=null;
const hiddenLayers=new Set(),lockedLayers=new Set();
try{const saved=localStorage.getItem(DRAFT_KEY);if(saved)level=validateLevel(JSON.parse(saved));}catch(error){startupWarning=`Brouillon non chargé : ${error.message}. Le fichier enregistré reste conservé.`;}
try{const raw=sessionStorage.getItem('ltn-editor-telemetry-v1');if(raw)telemetry=JSON.parse(raw);}catch{}
document.title='LTN · Atelier de niveaux';document.body.className='editor';
document.body.innerHTML=`<header><a class="skip-link" href="#map">Aller au niveau</a><a href="/" class="brand">LTN<span>ATELIER DE NIVEAUX</span></a><div class="actions"><span id="save-state" role="status">Enregistré</span><button id="focus-mode" title="Masquer les panneaux · F4">Vue large</button><button id="save">Sauvegarder</button><button id="test-here" title="Tester à partir de la vue ou plateforme actuelle">Tester ici</button><button id="test" class="primary">Tester le parcours ↗</button><a href="/">Retour au jeu</a></div></header>
<div class="workspace"><aside><p class="eyebrow">TON ATELIER</p><h1>Bibliothèque</h1><label class="search-label"><span class="sr-only">Rechercher un objet</span><input id="asset-search" type="search" placeholder="Chercher un objet…" autocomplete="off"></label><div class="library-tabs" role="group" aria-label="Familles d’objets"><button data-family="build" aria-pressed="true">Construire</button><button data-family="play" aria-pressed="false">Jouer</button><button data-family="decor" aria-pressed="false">Décorer</button></div><div class="tools"><button title="Sélectionner · V" id="select" aria-pressed="true">Sélection · V</button><button title="Placer · B" id="place" aria-pressed="false">Placer · B</button><button id="pan" aria-pressed="false" title="Déplacer la vue · Espace + glisser">Main · H</button></div><label>Catégorie<select id="kind">${COLLECTIONS.map((k,i)=>k==='signs'?'':`<option value="${k}" ${k===kind?'selected':''}>${names[i]}</option>`).join('')}</select></label><div id="palette" class="palette" aria-label="Bibliothèque d’objets"></div><label class="check"><input id="snap" type="checkbox" checked> Grille aimantée · 10 px</label><label class="check"><input id="weld" type="checkbox" checked> Souder les pentes</label><details class="files"><summary>Gérer mes fichiers</summary><button id="export">Exporter le niveau (.json)</button><button id="import">Importer un niveau</button><input id="file" type="file" accept=".json,application/json" hidden><button id="original">Charger le parcours original</button><p class="muted">Sauvegarde dans ce navigateur. Exporte un fichier pour conserver ou partager ton travail. Aucun changement du jeu public.</p></details></aside>
<main><div class="toolbar"><div class="history-tools"><button id="undo" aria-label="Annuler">↶ Annuler</button><button id="redo" aria-label="Rétablir">↷ Rétablir</button><button id="live-preview" aria-pressed="false" title="Animer le monde vivant, les patrouilles et les plateformes mobiles · L">▶ Animer</button></div><span id="mode-label" class="mode-label">SÉLECTION</span><label>Région<select id="region"><option value="0">01 · Piton des Neiges</option><option value="8400">02 · Volcan</option><option value="16800">03 · Mafate</option><option value="25200">04 · Saint-Gilles</option></select></label><div class="zoom-tools"><button id="zoom-out" aria-label="Réduire le zoom">−</button><label><span class="sr-only">Zoom</span><select id="zoom"><option value="0.25">25 %</option><option value="0.5">50 %</option><option value="0.75">75 %</option><option value="1" selected>100 %</option><option value="1.5">150 %</option></select></label><button id="zoom-in" aria-label="Augmenter le zoom">+</button></div></div><div class="stage-area"><div class="map-wrap"><div id="game-preview" aria-hidden="true"></div><img id="placement-ghost" alt="" hidden><div class="stage-badge"><span class="live-dot"></span> VUE DU JEU <span id="object-count"></span></div><span id="loading" class="canvas-hint">Chargement du décor du jeu…</span><canvas id="map" tabindex="0" aria-label="Carte du niveau. Sélectionne un objet pour le modifier dans les propriétés."></canvas><div id="selection-hint" class="selection-hint" hidden></div><div class="canvas-controls"><button id="left-view" aria-label="Vue vers la gauche">←</button><button id="center-view">Recentrer</button><button id="right-view" aria-label="Vue vers la droite">→</button><label><input id="grid" type="checkbox"> Grille</label><label><input id="guides" type="checkbox" checked> Guides LD</label></div></div></div><div class="overview-wrap"><canvas id="overview" tabindex="0" aria-label="Vue d’ensemble du niveau. Cliquer pour naviguer."></canvas><div class="overview-labels"><span id="zone-label-0">01 · PITON DES NEIGES</span><span id="zone-label-1">02 · VOLCAN</span><span id="zone-label-2">03 · MAFATE</span><span id="zone-label-3">04 · SAINT-GILLES</span></div></div><label class="navigation">Position dans le parcours<input id="position" type="range" min="0" max="33600" value="0" step="50"></label><div class="status"><span id="status" role="status">Atelier prêt</span><span id="coords">X 0 · Y 0</span></div><p class="legend">Clique pour sélectionner · Glisse pour déplacer · Poignées pour ajuster les pentes · Espace + glisser pour parcourir · Alt + clic : objet derrière · Échap : annuler le geste</p></main>
<aside class="properties"><p class="eyebrow">INSPECTEUR</p><div id="selection-preview" class="selection-preview" hidden><img id="selection-image" alt=""><span>OBJET SÉLECTIONNÉ</span></div><h2 id="selection-title">Aucun élément sélectionné</h2><div id="gd-metrics" class="gd-metrics" hidden></div><div id="fields"><p class="muted">Clique sur un élément de la carte. Alt + clic permet de choisir un objet situé derrière un autre.</p></div><div id="selection-actions" hidden><button id="duplicate">Dupliquer</button><button id="token-arc" hidden title="Générer une ligne ou parabole d’éclats">✦ Éclats auto</button><button id="delete" class="danger">Supprimer</button></div><div class="inspector-help"><h2>Calques</h2><div id="layers"></div><details class="help-panel"><summary>Commandes et astuces</summary><p class="muted">Sélectionne un objet visible pour le déplacer. Les poignées aux extrémités des plateformes et du sol ajustent leur profil.</p><p class="muted">Le bouton Tester lance ton parcours avec les mêmes collisions et les mêmes graphismes.</p><p class="muted">V : sélectionner · B : placer · H : main<br>Flèches : ajuster · Maj : 10 px<br>Ctrl D : dupliquer · F : cadrer · L : animer<br>Ctrl + molette : zoomer<br>Échap : annuler · F4 : vue large</p></details></div></aside></div>`;
const $=id=>document.getElementById(id),canvas=$('map'),ctx=canvas.getContext('2d');
const say=t=>$('status').textContent=t;
function snapshot(){undo.push(JSON.stringify(level));if(undo.length>60)undo.shift();redo=[];dirty=true;}
function changed(){renderer?.setLevel(level);dirty=JSON.stringify(level)!==savedState;draw();inspect();}
function history(from,to){endDrag();if(!from.length)return;to.push(JSON.stringify(level));level=JSON.parse(from.pop());selected=null;changed();}
function entries(){return COLLECTIONS.flatMap(key=>collection(level,key).map((p,index)=>({key,index,p}))).filter(e=>e.key!=='signs'&&!e.p.editorHidden&&!hiddenLayers.has(e.key)&&!lockedLayers.has(e.key));}
function floor(x){const s=groundAt(level,x);return s?heightOn(s,x):450;}
function objectY(p){
 if(!p)return 450;
 if(p.y!==undefined)return p.y;
 if(p.baseY!==undefined)return p.baseY;
 if(p.surface){const s=[...level.platforms,...level.terrain].find(s=>s.id===p.surface);if(s)return heightOn(s,p.x);}
 return floor(p.x);
}
function bounds({key,p}){
 const rawY=objectY(p),y=key==='adventure.enemies'&&p.kind==='drone'?rawY-65:rawY;
 if(key==='loops')return{x:p.x-p.radius,y:y-2*p.radius,w:2*p.radius,h:2*p.radius};
 const top=p.w?Math.min(y,p.y2??y):y-14;
 return{x:p.w?p.x:p.x-13,y:top,w:p.w??26,h:p.w?(key==='terrain'?900-top:Math.abs((p.y2??y)-y)+(p.h??22)):28};
}
function simulateArc(startX,startFeet,vx,vy,maxSteps=110){
 const r=createRunner(startX,startFeet);r.vx=vx;r.vy=vy;r.grounded=false;r.surfaceId=null;r.lastJump=true;
 const pts=[[r.x,r.feet]];
 for(let i=0;i<maxSteps;i++){
  stepRunner(r,{left:false,right:vx>=0,jump:true,slide:false},level,1/120);
  if(i%3===2||r.grounded)pts.push([r.x,r.feet]);
  if(r.grounded||r.feet>920)break;
 }
 return{points:pts,landed:r.grounded,x:r.x,y:r.feet};
}
function drawArc(points,color,dashed=true){
 if(points.length<2)return;
 ctx.save();ctx.strokeStyle=color;ctx.lineWidth=2/zoom;if(dashed)ctx.setLineDash([6/zoom,4/zoom]);
 ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);
 for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][1]);
 ctx.stroke();
 const last=points.at(-1);ctx.setLineDash([]);ctx.fillStyle=color;ctx.beginPath();ctx.arc(last[0],last[1],3.5/zoom,0,Math.PI*2);ctx.fill();
 ctx.restore();
}
function drawGuides(viewLeft,viewRight){
 ctx.save();
 // 1. Ravine gap spans and jump reachability
 for(const [left,right]of level.gaps||[]){
  if(right<viewLeft||left>viewRight)continue;
  const width=Math.round(right-left),y=Math.min(floor(left-2),floor(right+2))+18,safe=width<=235;
  ctx.strokeStyle=safe?'rgba(142,240,167,.65)':'rgba(255,130,110,.85)';ctx.lineWidth=2/zoom;ctx.setLineDash([4/zoom,4/zoom]);
  ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(right,y);ctx.stroke();ctx.setLineDash([]);
  ctx.fillStyle=safe?'#8ef0a7':'#ff826e';ctx.font=`bold ${Math.round(10/zoom)}px monospace`;
  ctx.fillText(`Ravine ${width}px`,(left+right)/2-28/zoom,y-5/zoom);
 }
 // 2. Enemy patrol ranges
 if(!hiddenLayers.has('adventure.enemies'))for(const e of level.adventure?.enemies||[]){
  if(e.x+e.range<viewLeft||e.x-e.range>viewRight||e.range<=0)continue;
  const y=e.kind==='drone'?e.y-65:e.y,yL=e.ground?e.ground[0]:y,yR=e.ground?e.ground[2]:y;
  ctx.strokeStyle='rgba(255,180,120,.75)';ctx.lineWidth=1.5/zoom;ctx.setLineDash([4/zoom,3/zoom]);
  ctx.beginPath();ctx.moveTo(e.x-e.range,yL);ctx.lineTo(e.x,y);ctx.lineTo(e.x+e.range,yR);ctx.stroke();ctx.setLineDash([]);
  ctx.fillStyle='#ffb478';ctx.fillRect(e.x-e.range-1.5/zoom,yL-6/zoom,3/zoom,12/zoom);ctx.fillRect(e.x+e.range-1.5/zoom,yR-6/zoom,3/zoom,12/zoom);
 }
 // 3. Moving platform oscillation envelopes
 if(!hiddenLayers.has('movers'))for(const m of level.movers||[]){
  if(m.x+m.w+(m.motion?.amplitude||0)<viewLeft||m.x-(m.motion?.amplitude||0)>viewRight)continue;
  const amp=m.motion?.amplitude||0,ax=m.motion?.axis==='x'?amp:0,ay=m.motion?.axis==='y'?amp:0;
  ctx.strokeStyle='rgba(124,224,223,.65)';ctx.lineWidth=1.5/zoom;ctx.setLineDash([5/zoom,4/zoom]);
  ctx.strokeRect(m.x-ax,m.y-ay,m.w,m.h||22);ctx.strokeRect(m.x+ax,m.y+ay,m.w,m.h||22);
  ctx.beginPath();ctx.moveTo(m.x+m.w/2-ax,m.y-ay+11);ctx.lineTo(m.x+m.w/2+ax,m.y+ay+11);ctx.stroke();ctx.setLineDash([]);
 }
 // 4. Lava vents flame hazard envelope
 if(!hiddenLayers.has('adventure.vents'))for(const v of level.adventure?.vents||[]){
  if(v.x+30<viewLeft||v.x-30>viewRight)continue;
  ctx.strokeStyle='rgba(255,123,76,.75)';ctx.fillStyle='rgba(255,123,76,.12)';ctx.lineWidth=1.5/zoom;ctx.setLineDash([4/zoom,3/zoom]);
  ctx.fillRect(v.x-25,v.y-80,50,80);ctx.strokeRect(v.x-25,v.y-80,50,80);ctx.setLineDash([]);
  ctx.fillStyle='#ffb499';ctx.font=`${Math.round(9/zoom)}px monospace`;ctx.fillText(`⏱${Number(v.phase||0).toFixed(1)}s`,v.x-18/zoom,v.y-84/zoom);
 }
 // 5. Low gates (beam) slide clearance indicator
 if(!hiddenLayers.has('platforms'))for(const p of level.platforms||[]){
  if(p.kind!=='beam'||p.x+p.w<viewLeft||p.x>viewRight)continue;
  const groundY=floor(p.x+p.w/2),clearance=Math.round(groundY-(p.y+p.h));
  const color=clearance>=23&&clearance<=33?'#8ef0a7':clearance<=22?'#ff7b6b':'#ffe08a';
  ctx.strokeStyle=color;ctx.lineWidth=2/zoom;ctx.beginPath();ctx.moveTo(p.x+p.w/2,p.y+p.h);ctx.lineTo(p.x+p.w/2,groundY);ctx.stroke();
  ctx.fillStyle=color;ctx.font=`bold ${Math.round(9/zoom)}px monospace`;ctx.fillText(`${clearance}px`,p.x+p.w/2+4/zoom,(p.y+p.h+groundY)/2+3/zoom);
 }
 // 6. Playtest telemetry ghost trail
 if(telemetry?.points?.length>1){
  ctx.lineWidth=2/zoom;ctx.setLineDash([3/zoom,3/zoom]);
  for(let i=1;i<telemetry.points.length;i++){
   const [x0,y0]=telemetry.points[i-1],[x1,y1,vx]=telemetry.points[i];
   if(Math.max(x0,x1)<viewLeft||Math.min(x0,x1)>viewRight||Math.abs(x1-x0)>350)continue;
   ctx.strokeStyle=Math.abs(vx)>450?'rgba(255,210,125,.75)':'rgba(124,224,223,.65)';
   ctx.beginPath();ctx.moveTo(x0,y0-16);ctx.lineTo(x1,y1-16);ctx.stroke();
  }
  ctx.setLineDash([]);
  for(const ev of telemetry.events||[]){
   if(ev.x<viewLeft||ev.x>viewRight)continue;
   ctx.strokeStyle='#ff6b57';ctx.lineWidth=2.5/zoom;const r=6/zoom;
   ctx.beginPath();ctx.moveTo(ev.x-r,ev.y-20-r);ctx.lineTo(ev.x+r,ev.y-20+r);ctx.moveTo(ev.x+r,ev.y-20-r);ctx.lineTo(ev.x-r,ev.y-20+r);ctx.stroke();
  }
 }
 // 7. Physics trajectory arcs for the selected object
 const sel=selected&&collection(level,selected.key)[selected.index];
 if(sel){
  if(selected.key==='springs'){
   const y=objectY(sel);
   drawArc(simulateArc(sel.x,y-2,SPEED,-sel.power).points,'#8ef0a7');
   drawArc(simulateArc(sel.x,y-2,680,-sel.power).points,'#ffd27d');
  }else if(selected.key==='pads'){
   const y=objectY(sel);
   drawArc(simulateArc(sel.x,y-2,sel.speed,-JUMP_SPEED).points,'#ffd27d');
  }else if(['terrain','platforms'].includes(selected.key)&&sel.kind!=='crate'&&sel.kind!=='beam'){
   const slope=sel.slope||0,autoRoll=Math.abs(slope)>.10;
   ctx.strokeStyle=autoRoll?'#ffd27d':'#8ef0a7';ctx.lineWidth=3/zoom;
   ctx.beginPath();ctx.moveTo(sel.x,sel.y);ctx.lineTo(sel.x+sel.w,sel.y2??sel.y);ctx.stroke();
   const endX=sel.x+sel.w,endY=sel.y2??sel.y,jumpVy=Math.max(-650,-JUMP_SPEED+Math.min(0,SPEED*slope*.25));
   drawArc(simulateArc(endX,endY-2,SPEED,jumpVy).points,'#8ef0a7');
   drawArc(simulateArc(endX,endY-2,650,Math.max(-650,-JUMP_SPEED+Math.min(0,650*slope*.25))).points,'#ffd27d');
  }else if(selected.key==='loops'){
   ctx.strokeStyle='#ffd27d';ctx.lineWidth=1.5/zoom;ctx.setLineDash([5/zoom,4/zoom]);
   ctx.beginPath();ctx.arc(sel.x,sel.baseY-sel.radius,sel.radius,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
  }
 }
 ctx.restore();
}
function draw(){if(drawFrame)return;drawFrame=requestAnimationFrame(renderOverlay);}
function renderOverlay(){
 drawFrame=0;const r=canvas.getBoundingClientRect();const pixelWidth=Math.round(r.width*devicePixelRatio),pixelHeight=Math.round(r.height*devicePixelRatio);if(canvas.width!==pixelWidth||canvas.height!==pixelHeight){canvas.width=pixelWidth;canvas.height=pixelHeight;}ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);ctx.clearRect(0,0,r.width,r.height);offset=Math.max(0,Math.min(Math.max(0,WORLD_WIDTH-r.width/zoom),offset));$('position').max=Math.max(0,WORLD_WIDTH-r.width/zoom);$('position').value=offset;
 const activeRegion=String(Math.min(3,Math.floor(offset/8400))*8400);if($('region')&&$('region').value!==activeRegion)$('region').value=activeRegion;
 renderer?.setView({x:offset,y:viewY,zoom});
 ctx.save();ctx.scale(zoom,zoom);ctx.translate(-offset,-viewY);
 const end=offset+r.width/zoom;
 if($('grid').checked){ctx.lineWidth=1/zoom;ctx.strokeStyle='rgba(255,255,255,.17)';for(let x=Math.floor(offset/50)*50;x<end;x+=50){ctx.beginPath();ctx.moveTo(x,viewY);ctx.lineTo(x,viewY+r.height/zoom);ctx.stroke();}for(let y=Math.floor(viewY/50)*50;y<viewY+r.height/zoom;y+=50){ctx.beginPath();ctx.moveTo(offset,y);ctx.lineTo(end,y);ctx.stroke();}}
 if($('guides')?.checked)drawGuides(offset-150,end+150);
 const p=selected&&collection(level,selected.key)[selected.index];
 if(p){const b=visualBounds({...selected,p})??bounds({...selected,p});ctx.strokeStyle='#ffe0a1';ctx.lineWidth=2/zoom;ctx.strokeRect(b.x-3,b.y-3,b.w+6,b.h+6);ctx.fillStyle='#ffe0a1';for(const h of handles(p)){ctx.fillRect(h.x-5/zoom,h.y-5/zoom,10/zoom,10/zoom);}}
 ctx.restore();$('undo').disabled=!undo.length;$('redo').disabled=!redo.length;updateChrome();drawOverview();
}
function visualBounds(e){return ['terrain','platforms','movers','loops'].includes(e.key)?bounds(e):renderer?.bounds(e.key,e.index)??bounds(e);}
function handles(p){return selected&&['terrain','platforms','movers'].includes(selected.key)?[{name:'start',x:p.x,y:p.y},{name:'end',x:p.x+p.w,y:p.y2??p.y}]:[];}
function updateGdMetrics(p){
 const box=$('gd-metrics'),arcBtn=$('token-arc');
 if(!p||!selected){box.hidden=true;if(arcBtn)arcBtn.hidden=true;return;}
 if(arcBtn)arcBtn.hidden=!(['terrain','platforms','loops','springs'].includes(selected.key)&&p.kind!=='beam'&&p.kind!=='crate');
 const lines=[];
 if(['terrain','platforms','movers'].includes(selected.key)&&p.kind!=='beam'&&p.kind!=='crate'){
  const slope=p.slope||0,pct=Math.round(slope*100),deg=Math.round(Math.atan(slope)*180/Math.PI);
  lines.push(`Pente : ${pct>0?'+':''}${pct} % (${deg}°) · ${Math.abs(slope)>.10?'⚡ Auto-Roll actif (> 10 %)':'Course standard (≤ 10 %)'}`);
 }
 if(selected.key==='platforms'&&p.kind==='beam'){
  const clearance=Math.round(floor(p.x+p.w/2)-(p.y+p.h));
  lines.push(`Dégagement : ${clearance} px · ${clearance>=23&&clearance<=33?'✓ Glissade valide (23–33 px)':clearance<=22?'⚠ Bloqué en glissade (≤ 22 px)':'⚠ Passe debout (≥ 34 px)'}`);
 }
 if(selected.key==='loops')lines.push(`Élan requis : ≥ ${p.minSpeed} px/s (course normale : ${SPEED} px/s)`);
 if(selected.key==='springs')lines.push(`Support : ${p.surface||'Sol'} · Hauteur de rebond : ~${Math.round(p.power*p.power/3100)} px`);
 if(selected.key==='pads')lines.push(`Support : ${p.surface||'Aucun (hors piste)'} · Impulsion : ${p.speed} px/s`);
 box.hidden=!lines.length;box.textContent=lines.join(' | ');
}
function inspect(){
 const p=selected&&collection(level,selected.key)[selected.index];$('selection-actions').hidden=!p;$('selection-preview').hidden=!p;$('fields').replaceChildren();$('selection-title').textContent=p?names[COLLECTIONS.indexOf(selected.key)]:'Aucun élément sélectionné';
 updateGdMetrics(p);
 if(!p){const text=document.createElement('p');text.className='muted';text.textContent='Clique sur un élément du jeu pour le modifier. Alt + clic parcourt les objets superposés.';$('fields').append(text);return;}
 const texture=selected.key==='scenery'?p.key:selected.key==='adventure.landmarks'?`v6-${p.key}`:selected.key==='adventure.enemies'?`v6-${p.kind}-0`:selected.key==='adventure.monitors'?`v6-${p.type}-0`:presets[selected.key]?.[0]?.[1];$('selection-image').src=renderer?.thumbnail(texture)||'';
 const values=Object.entries(p).filter(([,v])=>['number','string','boolean'].includes(typeof v));
 if(['springs','pads','checkpoints'].includes(selected.key)&&!('y'in p))values.splice(1,0,['y',Math.round(objectY(p))]);
 if(selected.key==='platforms'&&p.kind==='roof'&&!('rail'in p))values.push(['rail',false]);
 if(p.motion)for(const [key,value]of Object.entries(p.motion))values.push([`motion.${key}`,value]);
 for(const [key,value]of values){
  if(selected.key==='movers'&&key==='y2'||selected.key==='terrain'&&key==='kind')continue;
  if(selected.key==='platforms'&&(p.kind==='beam'||p.kind==='crate')&&(key==='y2'||key==='style'))continue;
  if(['id','slope','surface','surfaceId','zone','authored','editorHidden'].includes(key))continue;
  if((key==='route'||key==='rail')&&(selected.key!=='platforms'||p.kind!=='roof'))continue;
  if((key==='anchor'||key==='depth')&&selected.key!=='scenery')continue;
  if(key==='phase'&&!['adventure.enemies','adventure.vents'].includes(selected.key))continue;
  const label=document.createElement('label');label.textContent=({x:'X · position horizontale',y:'Y · hauteur',y2:'Y2 · fin de pente',w:'Largeur',h:'Épaisseur',text:'Texte',key:'Décor',kind:'Type',style:'Aspect',scale:'Échelle',power:'Puissance',range:'Patrouille',speed:'Vitesse',radius:'Rayon',baseY:'Base du looping',minSpeed:'Élan minimum',phase:'Décalage du cycle · s',route:'Voie / chaîne',rail:'Voie continue (rail)',anchor:'Ancrage',depth:'Plan de profondeur','motion.axis':'Axe du mouvement','motion.period':'Période · secondes','motion.amplitude':'Amplitude · pixels'}[key]??key);
  let options=key==='kind'&&selected.key==='adventure.enemies'?['crab','drone']:key==='kind'?['roof','beam','crate']:key==='type'?['shield','cache']:key==='style'?['basalt','ropebridge','comics','gameshop']:key==='anchor'?['ground','absolute']:key==='motion.axis'?['x','y']:key==='key'?[...new Set((presets[selected.key]||[]).map(p=>p[2].key).filter(Boolean)),value]:null;
  if(options)options=[...new Set(options)];
  const input=document.createElement(options?'select':'input');
  if(options)for(const option of options){const o=document.createElement('option');o.value=option;o.textContent=({crab:'Crabe',drone:'Drone',shield:'Bouclier',cache:'Réserve',roof:'Plateforme',beam:'Obstacle bas',crate:'Caisse',basalt:'Basalte',ropebridge:'Passerelle',comics:'Terrasse',gameshop:'Boutique',ground:'Au sol',absolute:'Libre',x:'Horizontal',y:'Vertical'}[option]??option);input.append(o);}
  else{input.type=typeof value==='number'?'number':typeof value==='boolean'?'checkbox':'text';if(typeof value==='number'){input.step=key==='scale'?'.05':key==='motion.period'||key==='phase'?'.1':'1';input.inputMode='decimal';}}
  if(input.type==='checkbox')input.checked=value;else input.value=value;
  input.addEventListener('change',()=>{
   if(typeof value==='number'&&input.value.trim()===''){say('Renseigne une valeur avant de valider.');inspect();return;}
   const next=typeof value==='number'?Number(input.value):input.type==='checkbox'?input.checked:input.value;if(next===value)return;
   const candidate=structuredClone(level),target=collection(candidate,selected.key)[selected.index],parts=key.split('.');if(parts.length===2)target[parts[0]][parts[1]]=next;else target[key]=next;
   if(selected.key==='platforms'&&key==='kind'){
    if(next==='crate'){target.y2=target.y;target.slope=0;target.w=48;target.h=44;delete target.style;delete target.route;delete target.rail;delete target.editorSupports;}
    else if(next==='beam'){target.y2=target.y;target.slope=0;target.h=24;delete target.style;delete target.route;delete target.rail;delete target.editorSupports;}
    else{target.h=22;target.style??='basalt';target.route??=target.id;target.editorSupports??=['center'];}
   }
   if(selected.key==='platforms'&&key==='style'&&!target.rail)target.editorSupports=['ropebridge','comics','gameshop'].includes(next)?['left','right']:['center'];
   if(['scenery','adventure.landmarks'].includes(selected.key)&&key!=='anchor'){target.authored=true;target.anchor='absolute';}
   syncEditorObject(candidate,selected.key,target);if(selected.key==='movers'||target.kind==='beam'||target.kind==='crate')target.y2=target.y;if('y2'in target&&'w'in target)target.slope=(target.y2-target.y)/target.w;
   try{validateLevel(candidate);}catch(error){say(error.message);inspect();return;}snapshot();level=candidate;changed();
  });label.append(input);$('fields').append(label);
 }
}

function point(e){const r=canvas.getBoundingClientRect(),round=v=>$('snap').checked?Math.round(v/10)*10:v;return{x:Math.max(0,Math.min(WORLD_WIDTH,round((e.clientX-r.left)/zoom+offset))),y:round((e.clientY-r.top)/zoom+viewY)};}
function create(x,y){endDrag();y=Math.max(-300,Math.min(850,y));const id=`custom-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;let p={id,x,y};
 if(['terrain','platforms','movers'].includes(kind))p={...p,id:kind==='terrain'?`ground-${id}`:kind==='movers'?`moving-${id}`:id,kind:kind==='terrain'?'ground':'roof',w:Math.min(200,WORLD_WIDTH-x),h:kind==='terrain'?Math.max(20,900-y):22,y2:y,slope:0,style:'basalt',...(kind==='movers'?{motion:{axis:'x',amplitude:60,period:3}}:{})};
 if(kind==='springs')p.power=840;if(kind==='pads')p.speed=740;if(kind==='loops')p={id,x,baseY:y,radius:120,minSpeed:590};if(kind==='signs')p.text='Ton message';if(kind==='scenery')Object.assign(p,{key:x<8400?'lavarocks':'plants',scale:.5,anchor:'absolute',depth:1});if(kind==='adventure.landmarks')Object.assign(p,{key:x<8400?'lava':'fern',scale:.7});if(kind==='adventure.enemies')Object.assign(p,{kind:'crab',range:42,phase:0});if(kind==='adventure.monitors')p.type='shield';if(kind==='adventure.relics')p.zone=Math.min(3,Math.floor(x/8400));if(kind==='adventure.vents')p.phase=0;
 Object.assign(p,variant);if(p.w!==undefined)p.w=Math.min(p.w,WORLD_WIDTH-x);if(kind==='platforms'&&p.kind==='roof'){p.route=id;p.editorSupports=['ropebridge','comics','gameshop'].includes(p.style)?['left','right']:['center'];}else if(kind==='platforms')delete p.style;if(p.w!==undefined&&p.w<1){say('Choisis une position avant la fin du parcours.');return;}if(['scenery','adventure.landmarks'].includes(kind)){p.authored=true;p.editorHidden=false;}if(kind==='pads'){const surfaces=[...level.platforms.filter(s=>s.kind==='roof'),...level.terrain].filter(s=>x>=s.x&&x<=s.x+s.w);const surface=surfaces.sort((a,b)=>Math.abs(heightOn(a,x)-y)-Math.abs(heightOn(b,x)-y))[0];if(surface)p.surface=surface.id;}snapshot();const items=collection(level,kind);syncEditorObject(level,kind,p);items.push(p);selected={key:kind,index:items.length-1};changed();
}
function chooseTool(t){tool=t;for(const n of ['select','place','pan'])$(n).setAttribute('aria-pressed',n===t);canvas.style.cursor=t==='place'?'crosshair':t==='pan'?'grab':'default';$('placement-ghost').hidden=t!=='place';$('mode-label').textContent=t==='place'?'PLACEMENT':t==='pan'?'DÉPLACER LA VUE':'SÉLECTION';}
function findWeldedNeighbor(key,target,handleName){
 if(!['terrain','platforms'].includes(key))return null;
 const list=collection(level,key);
 for(const [i,other]of list.entries()){
  if(other===target||other.kind!==target.kind)continue;
  if(handleName==='start'&&Math.abs(other.x+other.w-target.x)<=2&&Math.abs((other.y2??other.y)-target.y)<=2)return{index:i,p:other,side:'end',x:other.x,w:other.w,y:other.y,y2:other.y2??other.y};
  if(handleName==='end'&&Math.abs(other.x-(target.x+target.w))<=2&&Math.abs(other.y-(target.y2??target.y))<=2)return{index:i,p:other,side:'start',x:other.x,w:other.w,y:other.y,y2:other.y2??other.y};
 }
 return null;
}
function snapToNeighborVertex(key,target,x,y){
 if(!['terrain','platforms'].includes(key)||!$('snap').checked)return null;
 const threshold=12/zoom;
 for(const other of collection(level,key)){
  if(other===target)continue;
  for(const [vx,vy]of [[other.x,other.y],[other.x+other.w,other.y2??other.y]]){
   if(Math.hypot(x-vx,y-vy)<threshold)return{x:vx,y:vy};
  }
 }
 return null;
}
canvas.addEventListener('pointerdown',e=>{
 if(drag||!renderer?.ready||renderer.pending||e.isPrimary===false)return;
 if(e.button!==0&&e.button!==1)return;const q=point(e);canvas.focus();canvas.setPointerCapture(e.pointerId);
 if(tool==='pan'||space||e.button===1){drag={pointerId:e.pointerId,pan:true,clientX:e.clientX,clientY:e.clientY,offset,viewY};canvas.style.cursor='grabbing';return;}
 if(tool==='place'){create(q.x,q.y);return;}
 const p=selected&&collection(level,selected.key)[selected.index];const handle=p&&handles(p).find(h=>Math.hypot(q.x-h.x,q.y-h.y)<14/zoom);
 if(handle){renderer.beginEdit(selected.key,selected.index);drag={pointerId:e.pointerId,handle:handle.name,q,p,x:p.x,y:p.y,y2:p.y2??p.y,w:p.w,welded:findWeldedNeighbor(selected.key,p,handle.name)};return;}
 const hits=entries().filter(v=>{const b=visualBounds(v),margin=5/zoom;if(!b)return false;return q.x>=b.x-margin&&q.x<=b.x+b.w+margin&&q.y>=b.y-margin&&q.y<=b.y+b.h+margin;});
 const ordered=hits.sort((a,b)=>{if(a.key==='terrain'&&b.key!=='terrain')return 1;if(b.key==='terrain'&&a.key!=='terrain')return -1;const depth=renderer.depth(b.key,b.index)-renderer.depth(a.key,a.index);if(depth)return depth;const aa=visualBounds(a),bb=visualBounds(b);return aa.w*aa.h-bb.w*bb.h;});
 const previous=ordered.findIndex(e=>selected?.key===e.key&&selected?.index===e.index);
 const hit=e.altKey?ordered[(previous+1)%ordered.length]:ordered[0];
 selected=hit?{key:hit.key,index:hit.index}:null;
 if(hit){
  renderer.beginEdit(hit.key,hit.index);
  const startY=hit.p.y??(['springs','pads','checkpoints'].includes(hit.key)?Math.round(objectY(hit.p)):undefined);
  drag={pointerId:e.pointerId,q,p:hit.p,x:hit.p.x,y:startY,baseY:hit.p.baseY,y2:hit.p.y2};
 }
 draw();inspect();
});
canvas.addEventListener('pointermove',e=>{
 const q=point(e);hoverPoint=q;updateGhost(e);$('coords').textContent=`X ${Math.round(q.x)} · Y ${Math.round(q.y)}`;if(!drag||drag.pointerId!==e.pointerId)return;
 if(drag.pan){offset=Math.max(0,Math.min(WORLD_WIDTH,drag.offset-(e.clientX-drag.clientX)/zoom));viewY=Math.max(-6000,Math.min(800,drag.viewY-(e.clientY-drag.clientY)/zoom));$('position').value=offset;draw();return;}
 const dx=q.x-drag.q.x,dy=q.y-drag.q.y;
 if(!dx&&!dy&&!drag.saved)return;if(!drag.saved){drag.before=JSON.stringify(level);drag.redoBefore=redo.slice();drag.undoBefore=undo.slice();snapshot();drag.saved=true;if(['scenery','adventure.landmarks'].includes(selected.key)){drag.p.authored=true;drag.p.anchor='absolute';}}
 const flatSurface=selected.key==='movers'||drag.p.kind==='beam'||drag.p.kind==='crate';
 const useWeld=Boolean(drag.welded&&$('weld')?.checked&&!e.altKey);
 if(drag.handle==='start'){
  const minX=useWeld?drag.welded.x+1:0;
  let nx=Math.max(minX,Math.min(drag.x+drag.w-1,drag.x+dx)),ny=Math.max(-300,Math.min(850,drag.y+dy));
  const vertex=!drag.welded&&!e.altKey?snapToNeighborVertex(selected.key,drag.p,nx,ny):null;
  if(vertex&&vertex.x<drag.x+drag.w){nx=vertex.x;ny=vertex.y;}
  drag.p.x=nx;drag.p.w=drag.w+drag.x-drag.p.x;drag.p.y=ny;if(flatSurface)drag.p.y2=ny;
  if(useWeld){
   drag.welded.p.w=Math.max(1,drag.p.x-drag.welded.x);drag.welded.p.y2=drag.p.y;drag.welded.p.slope=(drag.welded.p.y2-drag.welded.p.y)/drag.welded.p.w;
  }else if(drag.welded){
   drag.welded.p.x=drag.welded.x;drag.welded.p.w=drag.welded.w;drag.welded.p.y=drag.welded.y;drag.welded.p.y2=drag.welded.y2;drag.welded.p.slope=(drag.welded.y2-drag.welded.y)/drag.welded.w;
  }
 }
 else if(drag.handle==='end'){
  const maxX=useWeld?drag.welded.x+drag.welded.w-1:WORLD_WIDTH;
  let endX=Math.max(drag.x+1,Math.min(maxX,q.x)),ny2=flatSurface?drag.p.y:Math.max(-300,Math.min(850,q.y));
  const vertex=!drag.welded&&!e.altKey?snapToNeighborVertex(selected.key,drag.p,endX,ny2):null;
  if(vertex&&vertex.x>drag.x){endX=vertex.x;if(!flatSurface)ny2=vertex.y;}
  drag.p.w=endX-drag.x;drag.p.y2=ny2;
  if(useWeld){
   const rightEdge=drag.welded.x+drag.welded.w,nextStart=Math.min(rightEdge-1,drag.p.x+drag.p.w);
   drag.welded.p.x=nextStart;drag.welded.p.w=rightEdge-nextStart;drag.welded.p.y=drag.p.y2;drag.welded.p.slope=(drag.welded.p.y2-drag.welded.p.y)/drag.welded.p.w;
  }else if(drag.welded){
   drag.welded.p.x=drag.welded.x;drag.welded.p.w=drag.welded.w;drag.welded.p.y=drag.welded.y;drag.welded.p.y2=drag.welded.y2;drag.welded.p.slope=(drag.welded.y2-drag.welded.y)/drag.welded.w;
  }
 }
 else{drag.p.x=Math.max(0,Math.min(WORLD_WIDTH-(drag.p.w??0),drag.x+dx));if(drag.y!==undefined)drag.p.y=Math.max(-300,Math.min(850,drag.y+dy));if(drag.baseY!==undefined)drag.p.baseY=drag.baseY+dy;if(drag.y2!==undefined){const deltaY=drag.p.y-drag.y;drag.p.y2=Math.max(-300,Math.min(850,drag.y2+deltaY));}}
 syncEditorObject(level,selected.key,drag.p);
 if('y2'in drag.p)drag.p.slope=(drag.p.y2-drag.p.y)/drag.p.w;
 renderer?.previewObject(selected.key,selected.index,drag.p,drag.welded);updateGdMetrics(drag.p);draw();
});
function endDrag(cancel=false){
 if(!drag)return;const current=drag;drag=null;
 if(current.saved){
  if(cancel||JSON.stringify(level)===current.before){level=JSON.parse(current.before);undo=current.undoBefore;redo=current.redoBefore;}
  else{try{validateLevel(level);}catch(error){level=JSON.parse(current.before);undo=current.undoBefore;redo=current.redoBefore;say(error.message);}}
  renderer?.setLevel(level);dirty=JSON.stringify(level)!==savedState;
 }
 if(canvas.hasPointerCapture(current.pointerId))canvas.releasePointerCapture(current.pointerId);
 chooseTool(tool);draw();inspect();
}
canvas.addEventListener('pointerup',e=>{if(drag?.pointerId===e.pointerId)endDrag();});
canvas.addEventListener('pointercancel',e=>{if(drag?.pointerId===e.pointerId)endDrag(true);});
canvas.addEventListener('lostpointercapture',()=>endDrag());
canvas.addEventListener('wheel',e=>{e.preventDefault();if(drag)return;if(e.ctrlKey||e.metaKey){setZoom(zoom*(e.deltaY<0?1.15:1/1.15),e.clientX,e.clientY);return;}if(e.shiftKey)viewY=Math.max(-6000,Math.min(800,viewY+e.deltaY/zoom));else offset=Math.max(0,Math.min(WORLD_WIDTH,offset+(e.deltaX||e.deltaY)/zoom));$('position').value=offset;draw();},{passive:false});
for(const t of ['select','place','pan'])$(t).onclick=()=>chooseTool(t);
$('kind').onchange=e=>{kind=e.target.value;variant={};palette();};$('zoom').onchange=e=>setZoom(Number(e.target.value));
function navigate(x,resetY=false,focusY=null){
 endDrag();offset=Math.max(0,Math.min(WORLD_WIDTH,x));$('position').value=offset;
 if(resetY){const y=focusY??floor(offset+300);viewY=Math.max(-6000,Math.min(800,y-canvas.clientHeight/zoom*(focusY!==null?.5:.7)));}
 draw();
}
$('region').onchange=e=>navigate(Number(e.target.value),true);$('position').oninput=e=>navigate(Number(e.target.value),false);$('grid').onchange=draw;$('guides').onchange=draw;
$('left-view').onclick=()=>navigate(offset-canvas.clientWidth/zoom*.7,false);$('right-view').onclick=()=>navigate(offset+canvas.clientWidth/zoom*.7,false);
$('center-view').onclick=()=>{
 const p=selected&&collection(level,selected.key)[selected.index];
 navigate(p?Math.max(0,p.x-canvas.clientWidth/zoom/2):offset,true,p?objectY(p):null);
};
$('live-preview').onclick=()=>{
 const next=!renderer?.livePreview;renderer?.setLivePreview(next);
 updateChrome();
 say(next?'Aperçu animé actif : patrouilles, plateformes mobiles et décors en mouvement.':'Aperçu figé pour l’édition précise.');
};
$('undo').onclick=()=>history(undo,redo);$('redo').onclick=()=>history(redo,undo);
$('delete').onclick=()=>{endDrag();if(!selected)return;if(['terrain','checkpoints'].includes(selected.key)&&collection(level,selected.key).length===1){say('Conserve au moins un sol et un drapeau.');return;}snapshot();collection(level,selected.key).splice(selected.index,1);if(selected.key==='terrain')syncTerrainGaps(level);selected=null;changed();};
$('duplicate').onclick=()=>{endDrag();if(!selected)return;snapshot();const items=collection(level,selected.key),p=structuredClone(items[selected.index]);p.x=Math.min(WORLD_WIDTH-(p.w??0),p.x+40);p.id=`${selected.key==='terrain'?'ground-':selected.key==='movers'?'moving-':''}copy-${crypto.randomUUID()}`;syncEditorObject(level,selected.key,p);items.push(p);selected.index=items.length-1;changed();};
$('token-arc').onclick=()=>{
 endDrag();if(!selected)return;const p=collection(level,selected.key)[selected.index];if(!p)return;
 const candidate=structuredClone(level),tokens=candidate.tokens,add=(x,y)=>{x=Math.round(x);y=Math.round(y);if(x<20||x>WORLD_WIDTH-20||y<-280||y>840)return;if(!tokens.some(t=>Math.hypot(t.x-x,t.y-y)<24))tokens.push({id:`token-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,x,y});};
 if(selected.key==='platforms'&&p.kind==='roof'){for(let x=p.x+45;x<=p.x+p.w-25;x+=90)add(x,heightOn(p,x)-43);}
 else if(selected.key==='loops'){for(let i=1;i<12;i++){const a=i*Math.PI*2/12;add(p.x+Math.sin(a)*(p.radius-30),p.baseY-p.radius+Math.cos(a)*(p.radius-30));}}
 else if(selected.key==='springs'){const arc=simulateArc(p.x,objectY(p)-2,SPEED,-p.power,65);for(let i=2;i<arc.points.length-1;i+=3)add(arc.points[i][0],arc.points[i][1]-18);}
 else if(selected.key==='terrain'){for(let x=p.x+50;x<=p.x+p.w-30;x+=120)add(x,heightOn(p,x)-40);}
 try{validateLevel(candidate);}catch(error){say(error.message);return;}snapshot();level=candidate;changed();say('Éclats générés le long de la trajectoire.');
};
function save(key=DRAFT_KEY){endDrag();try{const data=normalizeLevel(structuredClone(level),{playable:key===TEST_KEY});localStorage.setItem(key,JSON.stringify(data));if(key===DRAFT_KEY){savedState=JSON.stringify(level);dirty=false;}say('Parcours sauvegardé dans ce navigateur.');return true;}catch(e){say(`Sauvegarde impossible : ${e.message}`);return false;}}
$('save').onclick=()=>save();
$('test-here').onclick=()=>{
 const sel=selected&&collection(level,selected.key)[selected.index];
 const desired=selected?.key==='loops'?sel.x-140:sel?sel.x:offset+Math.min(200,canvas.clientWidth/zoom/3);
 let roof=selected?.key==='platforms'&&sel.kind==='roof'?sel:null;
 if(!roof&&sel&&selected.key!=='terrain'&&selected.key!=='loops'){
  const surfaceId=sel.surface||sel.surfaceId;
  if(surfaceId)roof=level.platforms.find(p=>p.kind==='roof'&&p.id===surfaceId&&sel.x>=p.x&&sel.x<=p.x+p.w)||null;
  if(!roof){
   const y=objectY(sel),groundY=floor(sel.x);
   const candidate=level.platforms.filter(p=>p.kind==='roof'&&sel.x>=p.x&&sel.x<=p.x+p.w).sort((a,b)=>Math.abs(heightOn(a,sel.x)-y)-Math.abs(heightOn(b,sel.x)-y))[0];
   if(candidate&&Math.abs(heightOn(candidate,sel.x)-y)+20<Math.abs(groundY-y))roof=candidate;
  }
 }
 if(roof&&roof.x<24700&&roof.x+roof.w>=80){
  const targetX=selected.key==='platforms'?roof.x+Math.min(40,roof.w/2):sel.x;
  const x=Math.max(80,Math.min(GOAL_X-1,Math.round(Math.max(roof.x,Math.min(roof.x+roof.w,targetX)))));
  if(save()&&save(TEST_KEY))location.href=`/?custom=1&spawn=${x}&surface=${encodeURIComponent(roof.id)}`;
  return;
 }
 const nearby=level.terrain.filter(p=>p.x<24700&&p.x+p.w>=80).sort((a,b)=>Math.abs(Math.max(a.x,Math.min(a.x+a.w,desired))-desired)-Math.abs(Math.max(b.x,Math.min(b.x+b.w,desired))-desired))[0];
 if(!nearby){say('Ajoute du sol pour tester cette partie.');return;}
 const x=Math.max(80,Math.min(GOAL_X-1,Math.round(Math.max(nearby.x,Math.min(nearby.x+nearby.w,desired)))));
 const vxParam=selected?.key==='loops'?`&vx=${Math.round(sel.minSpeed+40)}`:'';
 if(save()&&save(TEST_KEY))location.href=`/?custom=1&spawn=${x}${vxParam}`;
};
$('test').onclick=()=>{if(save()&&save(TEST_KEY))location.href='/?custom=1';};
$('export').onclick=()=>{try{const data=normalizeLevel(structuredClone(level)),url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='ltn-mon-parcours.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);say('Niveau exporté.');}catch(e){say(e.message);}};
$('import').onclick=()=>$('file').click();$('file').onchange=async e=>{try{const file=e.target.files[0];if(!file)return;if(file.size>5e6)throw Error('Fichier trop volumineux (maximum 5 Mo).');const data=normalizeLevel(JSON.parse(await file.text()));snapshot();level=data;selected=null;changed();say('Niveau importé. Sauvegarde-le pour le conserver.');}catch(error){say(`Import impossible : ${error.message}`);}e.target.value='';};
$('original').onclick=()=>{snapshot();level=buildLevel();selected=null;changed();say('Parcours original chargé. Annuler permet de revenir à ton travail.');};
window.addEventListener('keydown',e=>{
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();document.activeElement?.blur();save();return;}
 if(/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();history(e.shiftKey?redo:undo,e.shiftKey?undo:redo);}
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='y'){e.preventDefault();history(redo,undo);}
 if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();$('delete').click();}
});
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
const presets={
 platforms:[
  ['Corniche','island-ledge',{style:'basalt'}],
  ['Passerelle','island-bridge',{style:'ropebridge'}],
  ['Terrasse','island-bridge',{style:'comics'}],
  ['Boutique','island-bridge',{style:'gameshop'}],
  ['Obstacle bas','polish-gate-cap-0',{kind:'beam',h:24}],
  ['Caisse','crate',{kind:'crate',w:48,h:44}]
 ],
 terrain:[['Sol en basalte','ground',{}]],tokens:[['Éclat','token',{}]],checkpoints:[['Drapeau','polish-checkpoint-0',{}]],springs:[['Ressort','polish-spring-0',{}]],pads:[['Accélérateur','polish-boost-0',{}]],loops:[['Looping','island-loop',{}]],
 scenery:[
  ['Roches de lave','lavarocks',{key:'lavarocks'}],
  ['Arche de basalte','basaltarch',{key:'basaltarch'}],
  ['Plantes','plants',{key:'plants'}],
  ['Rochers','rocks',{key:'rocks'}],
  ['Palmier','palm',{key:'palm'}],
  ['Lanterne','lantern',{key:'lantern'}],
  ['Barque','boat',{key:'boat'}],
  ['Cascade','waterfall',{key:'waterfall'}],
  ['Paillote','hut',{key:'hut'}],
  ['Tamarinier','tamarind',{key:'tamarind'}],
  ['Frangipanier','frangipani',{key:'frangipani'}],
  ['Kiosque','kiosk',{key:'kiosk'}],
  ['Terrasse café','terrace',{key:'terrace'}],
  ['Banc','bench',{key:'bench'}],
  ['Planches de surf','surfboards',{key:'surfboards'}],
  ['Plots','bollards',{key:'bollards'}],
  ['Arche côtière','arch',{key:'arch'}],
  ['Flèche néon','neonarrow',{key:'neonarrow'}],
  ['Auvent','canopy',{key:'canopy'}],
  ['Ponton','pier',{key:'pier'}],
  ['Passerelle bois','footbridge',{key:'footbridge'}],
  ['Pont de corde','ropebridge',{key:'ropebridge'}],
  ['Façade BD','comics',{key:'comics'}],
  ['Façade boutique','gameshop',{key:'gameshop'}],
  ['Enceintes','speakers',{key:'speakers'}],
  ['Borne arcade','arcade',{key:'arcade'}],
  ['Bac à plantes','planter',{key:'planter'}]
 ],
 'adventure.enemies':[['Crabe','v6-crab-0',{kind:'crab'}],['Drone','v6-drone-0',{kind:'drone'}]],
 'adventure.monitors':[['Bouclier','v6-shield-0',{type:'shield'}],['Réserve','v6-cache-0',{type:'cache'}]],
 'adventure.landmarks':[['Fougère','v6-fern',{key:'fern'}],['Tamarin','v6-tamarin',{key:'tamarin'}],['Case créole','v6-case-creole',{key:'case-creole'}],['Vacoa','v6-vacoa',{key:'vacoa'}],['Pirogue','v6-pirogue',{key:'pirogue'}],['Lave','v6-lava',{key:'lava'}]],
 'adventure.relics':[['Emblème','v6-relic-0',{}]],'adventure.vents':[['Évent de lave','v6-lava',{}]],movers:[['Appui mobile','island-ledge',{}]],signs:[['Panneau','polish-sign-0',{}]]
};
const families={build:['terrain','platforms','movers','loops'],play:['tokens','checkpoints','springs','pads','adventure.enemies','adventure.relics','adventure.monitors','adventure.vents'],decor:['scenery','adventure.landmarks']};
function palette(){
 const host=$('palette'),query=$('asset-search').value.trim().toLocaleLowerCase('fr');host.replaceChildren();
 const keys=query?Object.keys(presets).filter(k=>k!=='signs'):[kind];
 let total=0;
 for(const key of keys)for(const [i,[name,texture,props]]of (presets[key]||[]).entries()){
  if(query&&!`${name} ${names[COLLECTIONS.indexOf(key)]}`.toLocaleLowerCase('fr').includes(query))continue;total++;
  const b=document.createElement('button');b.className='asset-card';b.setAttribute('aria-pressed',key===kind&&(JSON.stringify(variant)===JSON.stringify(props)||i===0&&Object.keys(variant).length===0));
  const image=document.createElement('img');image.src=renderer?.thumbnail(texture)||'';image.alt='';const label=document.createElement('span');label.textContent=name;b.append(image,label);
  b.onclick=()=>{kind=key;$('kind').value=key;variant={...props};chooseTool('place');palette();updateGhost();say(`${name} : clique dans le décor pour le placer. Échap pour sélectionner.`);};host.append(b);
 }
 if(!total){const empty=document.createElement('p');empty.className='muted';empty.textContent='Aucun objet trouvé. Essaie « rocher », « bonus » ou « pont ».';host.append(empty);}
 for(const b of document.querySelectorAll('[data-family]'))b.setAttribute('aria-pressed',families[b.dataset.family].includes(kind));
 updateGhost();
}
function updateGhost(e){
 const image=$('placement-ghost');if(!image)return;
 if(e)hoverPoint=point(e);
 const asset=(presets[kind]||[]).find(([, ,props])=>JSON.stringify(props)===JSON.stringify(variant))??presets[kind]?.[0];
 image.hidden=tool!=='place'||!hoverPoint||!asset;if(image.hidden)return;
 const source=renderer?.thumbnail(asset[1]);if(source&&image.src!==source)image.src=source;
 image.style.left=`${(hoverPoint.x-offset)*zoom}px`;image.style.top=`${(hoverPoint.y-viewY)*zoom}px`;image.style.width=`${96*zoom}px`;
}
function updateChrome(){
 $('save-state').textContent=dirty?'Modifications à enregistrer':'Enregistré dans ce navigateur';$('save-state').classList.toggle('unsaved',dirty);
 const live=Boolean(renderer?.livePreview);
 if($('live-preview')){$('live-preview').setAttribute('aria-pressed',String(live));$('live-preview').textContent=live?'⏸ Figer':'▶ Animer';}
 const p=selected&&collection(level,selected.key)[selected.index];$('object-count').textContent=`${COLLECTIONS.reduce((n,k)=>n+collection(level,k).filter(p=>!p.editorHidden).length,0)} éléments`;
 const hint=$('selection-hint');hint.hidden=!p;hint.textContent=p?`${names[COLLECTIONS.indexOf(selected.key)]} · ${Math.round(p.x)}, ${Math.round(objectY(p))}  |  Flèches : ajuster · Ctrl D : dupliquer`:'';
 updateGhost();
}
function setZoom(next,clientX,clientY){
 endDrag();const rect=canvas.getBoundingClientRect(),x=(clientX??rect.left+rect.width/2)-rect.left,y=(clientY??rect.top+rect.height/2)-rect.top;
 const worldX=offset+x/zoom,worldY=viewY+y/zoom;zoom=Math.max(.25,Math.min(2,Math.round(next*100)/100));offset=worldX-x/zoom;viewY=worldY-y/zoom;
 let option=[...$('zoom').options].find(o=>Number(o.value)===zoom);if(!option){option=$('zoom').querySelector('[data-custom]')??document.createElement('option');option.dataset.custom='true';option.value=zoom;option.textContent=`${Math.round(zoom*100)} %`;$('zoom').append(option);}$('zoom').value=String(zoom);draw();
}
function drawOverview(){
 const overview=$('overview');if(!overview)return;const width=overview.clientWidth,height=overview.clientHeight,dpr=devicePixelRatio;
 if(!width||!height)return;
 if(overview.width!==Math.round(width*dpr)||overview.height!==Math.round(height*dpr)){overview.width=Math.round(width*dpr);overview.height=Math.round(height*dpr);}
 const c=overview.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,width,height);const top=Math.min(0,...level.terrain.map(p=>Math.min(p.y,p.y2??p.y))),sx=width/WORLD_WIDTH,sy=(height-8)/(1100-top);
 for(let i=0;i<4;i++){c.fillStyle=['#293d55','#382b27','#24372d','#203540'][i];c.fillRect(i*width/4,0,width/4,height);}
 c.fillStyle='rgba(255,110,89,.45)';for(const [a,b]of level.gaps||[])c.fillRect(a*sx,0,Math.max(2,(b-a)*sx),height);
 c.strokeStyle='#a9b69b';c.lineWidth=1;for(const p of level.terrain){c.beginPath();c.moveTo(p.x*sx,4+(p.y-top)*sy);c.lineTo((p.x+p.w)*sx,4+((p.y2??p.y)-top)*sy);c.stroke();}
 c.strokeStyle='#74ad99';for(const p of level.platforms){c.beginPath();c.moveTo(p.x*sx,4+(p.y-top)*sy);c.lineTo((p.x+p.w)*sx,4+((p.y2??p.y)-top)*sy);c.stroke();}
 c.fillStyle='#f2c777';for(const p of level.checkpoints)c.fillRect(p.x*sx,6,2,height-12);
 c.fillStyle='#9ef0b8';for(const r of level.adventure?.relics||[])c.fillRect(r.x*sx-1.5,3,3,6);
 if(selected){c.fillStyle='#ffad84';const p=collection(level,selected.key)[selected.index];if(p)c.fillRect(p.x*sx-2,0,4,height);}
 c.fillStyle='#e9efcb20';c.strokeStyle='#d0e8b3';c.lineWidth=1.5;const x=offset*sx,w=Math.max(8,canvas.clientWidth/zoom*sx);c.fillRect(x,0,w,height);c.strokeRect(x+.75,.75,w-1.5,height-1.5);
 const zoneTitles=['01 · PITON DES NEIGES','02 · VOLCAN','03 · MAFATE','04 · SAINT-GILLES'];
 for(let z=0;z<4;z++){
  const el=$(`zone-label-${z}`);if(!el)continue;
  const relics=(level.adventure?.relics||[]).filter(r=>Math.min(3,Math.floor(r.x/8400))===z).length;
  el.textContent=`${zoneTitles[z]} · ${relics}/3 ★`;
 }
}
$('asset-search').oninput=palette;
for(const button of document.querySelectorAll('[data-family]'))button.onclick=()=>{kind=families[button.dataset.family][0];$('kind').value=kind;variant={};$('asset-search').value='';palette();};
$('zoom-in').onclick=()=>setZoom(zoom*1.25);$('zoom-out').onclick=()=>setZoom(zoom/1.25);
$('focus-mode').onclick=()=>{document.body.classList.toggle('focus-mode');$('focus-mode').textContent=document.body.classList.contains('focus-mode')?'Afficher les panneaux':'Vue large';setTimeout(draw,0);};
canvas.addEventListener('pointerleave',()=>{hoverPoint=null;$('placement-ghost').hidden=true;});
const overview=$('overview');let overviewDragging=false;
function overviewNavigate(e){const r=overview.getBoundingClientRect();navigate((e.clientX-r.left)/r.width*WORLD_WIDTH-canvas.clientWidth/zoom/2,false);}
overview.addEventListener('pointerdown',e=>{overviewDragging=true;overview.setPointerCapture(e.pointerId);overviewNavigate(e);});overview.addEventListener('pointermove',e=>{if(overviewDragging)overviewNavigate(e);});overview.addEventListener('pointerup',()=>overviewDragging=false);overview.addEventListener('pointercancel',()=>overviewDragging=false);
overview.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();navigate(offset+(e.key==='ArrowRight'?1:-1)*canvas.clientWidth/zoom*.5,false);}});
for(const [label,keys]of [['Terrain',['terrain','platforms','movers','loops']],['Objets',families.play],['Décors',families.decor]]){
 const row=document.createElement('div');row.className='layer-row';const name=document.createElement('span');name.textContent=label;
 const visible=document.createElement('button');visible.textContent='Visible';visible.setAttribute('aria-label',`Afficher ou masquer : ${label}`);visible.setAttribute('aria-pressed','true');visible.onclick=()=>{const show=hiddenLayers.has(keys[0]);for(const k of keys){if(show)hiddenLayers.delete(k);else hiddenLayers.add(k);renderer.setLayerVisibility(k,show);}visible.textContent=show?'Visible':'Masqué';visible.setAttribute('aria-pressed',show);if(selected&&keys.includes(selected.key)){selected=null;inspect();}draw();};
 const lock=document.createElement('button');lock.textContent='Libre';lock.setAttribute('aria-label',`Verrouiller : ${label}`);lock.setAttribute('aria-pressed','false');lock.onclick=()=>{const locked=!lockedLayers.has(keys[0]);for(const k of keys)locked?lockedLayers.add(k):lockedLayers.delete(k);lock.textContent=locked?'Verrouillé':'Libre';lock.setAttribute('aria-pressed',locked);if(locked&&selected&&keys.includes(selected.key)){selected=null;inspect();}draw();};row.append(name,visible,lock);$('layers').append(row);
}
window.addEventListener('keydown',e=>{
 if(/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)||e.ctrlKey||e.metaKey||e.altKey)return;
 if(e.key.toLowerCase()==='v')chooseTool('select');if(e.key.toLowerCase()==='b')chooseTool('place');if(e.key.toLowerCase()==='h')chooseTool('pan');
 if(e.key.toLowerCase()==='l')$('live-preview').click();
 if(e.key.toLowerCase()==='f'){$('center-view').click();canvas.focus();}
 if(e.key==='F4'){e.preventDefault();$('focus-mode').click();}
 if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)&&selected){
  e.preventDefault();endDrag();const candidate=structuredClone(level),p=collection(candidate,selected.key)[selected.index],step=e.shiftKey?10:1;
  if(e.key==='ArrowLeft')p.x-=step;if(e.key==='ArrowRight')p.x+=step;
  const dy=e.key==='ArrowUp'?-step:e.key==='ArrowDown'?step:0;
  if(dy){
   if(['scenery','adventure.landmarks'].includes(selected.key)){p.authored=true;p.anchor='absolute';}
   if(p.y===undefined&&['springs','pads','checkpoints'].includes(selected.key))p.y=Math.round(objectY(p));
   if(p.y!==undefined)p.y+=dy;if(p.y2!==undefined)p.y2+=dy;if(p.baseY!==undefined)p.baseY+=dy;
  }
  syncEditorObject(candidate,selected.key,p);try{validateLevel(candidate);}catch(error){say(error.message);return;}snapshot();level=candidate;changed();
 }
});
window.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='d'&&!/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)){e.preventDefault();$('duplicate').click();}});

renderer=createEditorRenderer($('game-preview'),level,()=>{$('loading').hidden=true;savedState=JSON.stringify(level);palette();navigate(Math.max(0,Number(new URLSearchParams(location.search).get('x'))||offset),true);say(startupWarning||'Décor prêt · sélectionne un objet ou choisis-le dans la bibliothèque.');},say,draw);
new ResizeObserver(()=>{renderer.resize(canvas.clientWidth,canvas.clientHeight);draw();}).observe(canvas);
window.addEventListener('keydown',e=>{if(/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;if(e.code==='Space'){e.preventDefault();space=true;canvas.style.cursor='grab';}if(e.key==='Escape'){endDrag(true);selected=null;chooseTool('select');draw();inspect();}});
window.addEventListener('keyup',e=>{if(e.code==='Space'){space=false;if(!drag)chooseTool(tool);}});
window.addEventListener('blur',()=>{space=false;endDrag(true);});
window.__LTN_EDITOR__={get ready(){return renderer.ready&&!renderer.pending;},get level(){return level;},get view(){return{x:offset,y:viewY,zoom};},get backgrounds(){return renderer.backgrounds;},get objects(){return renderer.objects;},get selection(){return selected;},get dirty(){return dirty;},get metrics(){return renderer.metrics;},get livePreview(){return renderer.livePreview;},simulateArc};
draw();
