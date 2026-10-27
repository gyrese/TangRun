import {buildLevel,groundAt,heightOn,WORLD_WIDTH} from './level.js';
import {COLLECTIONS,collection,DRAFT_KEY,TEST_KEY,normalizeLevel,validateLevel} from './editor-store.js';
import './editor.css';
import {createEditorRenderer} from './editor-renderer.js';
import {syncEditorObject} from './editor-object.js';

const names=['Sol / pente','Plateformes','Éclats','Drapeaux','Ressorts','Accélérateurs','Loopings','Panneaux','Décors','Plateformes mobiles','Ennemis','Emblèmes','Caisses bonus','Évents','Décors régionaux'];
let level=buildLevel(),selected=null,tool='select',kind='platforms',zoom=1,offset=0,viewY=0,undo=[],redo=[],drag=null,dirty=false,renderer=null,space=false,variant={},savedState='',startupWarning='',drawFrame=0,hoverPoint=null;
const hiddenLayers=new Set(),lockedLayers=new Set();
try{const saved=localStorage.getItem(DRAFT_KEY);if(saved)level=validateLevel(JSON.parse(saved));}catch(error){startupWarning=`Brouillon non chargé : ${error.message}. Le fichier enregistré reste conservé.`;}
document.title='LTN · Atelier de niveaux';document.body.className='editor';
document.body.innerHTML=`<header><a class="skip-link" href="#map">Aller au niveau</a><a href="/" class="brand">LTN<span>ATELIER DE NIVEAUX</span></a><div class="actions"><span id="save-state" role="status">Enregistré</span><button id="focus-mode" title="Masquer les panneaux · F4">Vue large</button><button id="save">Sauvegarder</button><button id="test-here" title="Tester à partir de la vue actuelle">Tester ici</button><button id="test" class="primary">Tester le parcours ↗</button><a href="/">Retour au jeu</a></div></header>
<div class="workspace"><aside><p class="eyebrow">TON ATELIER</p><h1>Bibliothèque</h1><label class="search-label"><span class="sr-only">Rechercher un objet</span><input id="asset-search" type="search" placeholder="Chercher un objet…" autocomplete="off"></label><div class="library-tabs" role="group" aria-label="Familles d’objets"><button data-family="build" aria-pressed="true">Construire</button><button data-family="play" aria-pressed="false">Jouer</button><button data-family="decor" aria-pressed="false">Décorer</button></div><div class="tools"><button title="Sélectionner · V" id="select" aria-pressed="true">Sélection · V</button><button title="Placer · B" id="place" aria-pressed="false">Placer · B</button><button id="pan" aria-pressed="false" title="Déplacer la vue · Espace + glisser">Main · H</button></div><label>Catégorie<select id="kind">${COLLECTIONS.map((k,i)=>k==='signs'?'':`<option value="${k}" ${k===kind?'selected':''}>${names[i]}</option>`).join('')}</select></label><div id="palette" class="palette" aria-label="Bibliothèque d’objets"></div><label class="check"><input id="snap" type="checkbox" checked> Grille aimantée · 10 px</label><details class="files"><summary>Gérer mes fichiers</summary><button id="export">Exporter le niveau (.json)</button><button id="import">Importer un niveau</button><input id="file" type="file" accept=".json,application/json" hidden><button id="original">Charger le parcours original</button><p class="muted">Sauvegarde dans ce navigateur. Exporte un fichier pour conserver ou partager ton travail. Aucun changement du jeu public.</p></details></aside>
<main><div class="toolbar"><div class="history-tools"><button id="undo" aria-label="Annuler">↶ Annuler</button><button id="redo" aria-label="Rétablir">↷ Rétablir</button></div><span id="mode-label" class="mode-label">SÉLECTION</span><label>Région<select id="region"><option value="0">01 · Volcan</option><option value="8400">02 · Mafate</option><option value="16800">03 · Saint-Gilles</option></select></label><div class="zoom-tools"><button id="zoom-out" aria-label="Réduire le zoom">−</button><label><span class="sr-only">Zoom</span><select id="zoom"><option value="0.25">25 %</option><option value="0.5">50 %</option><option value="0.75">75 %</option><option value="1" selected>100 %</option><option value="1.5">150 %</option></select></label><button id="zoom-in" aria-label="Augmenter le zoom">+</button></div></div><div class="stage-area"><div class="map-wrap"><div id="game-preview" aria-hidden="true"></div><img id="placement-ghost" alt="" hidden><div class="stage-badge"><span class="live-dot"></span> VUE DU JEU <span id="object-count"></span></div><span id="loading" class="canvas-hint">Chargement du décor du jeu…</span><canvas id="map" tabindex="0" aria-label="Carte du niveau. Sélectionne un objet pour le modifier dans les propriétés."></canvas><div id="selection-hint" class="selection-hint" hidden></div><div class="canvas-controls"><button id="left-view" aria-label="Vue vers la gauche">←</button><button id="center-view">Recentrer</button><button id="right-view" aria-label="Vue vers la droite">→</button><label><input id="grid" type="checkbox"> Grille</label></div></div></div><div class="overview-wrap"><canvas id="overview" tabindex="0" aria-label="Vue d’ensemble du niveau. Cliquer pour naviguer."></canvas><div class="overview-labels"><span>01 · VOLCAN</span><span>02 · MAFATE</span><span>03 · SAINT-GILLES</span></div></div><label class="navigation">Position dans le parcours<input id="position" type="range" min="0" max="25200" value="0" step="50"></label><div class="status"><span id="status" role="status">Atelier prêt</span><span id="coords">X 0 · Y 0</span></div><p class="legend">Clique pour sélectionner · Glisse pour déplacer · Poignées pour ajuster les pentes · Espace + glisser pour parcourir · Alt + clic : objet derrière · Échap : annuler le geste</p></main>
<aside class="properties"><p class="eyebrow">INSPECTEUR</p><div id="selection-preview" class="selection-preview" hidden><img id="selection-image" alt=""><span>OBJET SÉLECTIONNÉ</span></div><h2 id="selection-title">Aucun élément sélectionné</h2><div id="fields"><p class="muted">Clique sur un élément de la carte. Alt + clic permet de choisir un objet situé derrière un autre.</p></div><div id="selection-actions" hidden><button id="duplicate">Dupliquer</button><button id="delete" class="danger">Supprimer</button></div><div class="inspector-help"><h2>Calques</h2><div id="layers"></div><details class="help-panel"><summary>Commandes et astuces</summary><p class="muted">Sélectionne un objet visible pour le déplacer. Les poignées aux extrémités des plateformes et du sol ajustent leur profil.</p><p class="muted">Le bouton Tester lance ton parcours avec les mêmes collisions et les mêmes graphismes.</p><p class="muted">V : sélectionner · B : placer · H : main<br>Flèches : ajuster · Maj : 10 px<br>Ctrl D : dupliquer · F : cadrer<br>Ctrl + molette : zoomer<br>Échap : annuler · F4 : vue large</p></details></div></aside></div>`;
const $=id=>document.getElementById(id),canvas=$('map'),ctx=canvas.getContext('2d');
const say=t=>$('status').textContent=t;
function snapshot(){undo.push(JSON.stringify(level));if(undo.length>60)undo.shift();redo=[];dirty=true;}
function changed(){renderer?.setLevel(level);dirty=JSON.stringify(level)!==savedState;draw();inspect();}
function history(from,to){endDrag();if(!from.length)return;to.push(JSON.stringify(level));level=JSON.parse(from.pop());selected=null;changed();}
function entries(){return COLLECTIONS.flatMap(key=>collection(level,key).map((p,index)=>({key,index,p}))).filter(e=>e.key!=='signs'&&!e.p.editorHidden&&!hiddenLayers.has(e.key)&&!lockedLayers.has(e.key));}
function floor(x){const s=groundAt(level,x);return s?heightOn(s,x):450;}
function bounds({key,p}){const y=p.y??p.baseY??floor(p.x);if(key==='loops')return{x:p.x-p.radius,y:y-2*p.radius,w:2*p.radius,h:2*p.radius};const top=p.w?Math.min(y,p.y2??y):y-14;return{x:p.x,y:top,w:p.w??26,h:p.w?(key==='terrain'?900-top:Math.abs((p.y2??y)-y)+(p.h??22)):28};}
function draw(){if(drawFrame)return;drawFrame=requestAnimationFrame(renderOverlay);}
function renderOverlay(){
 drawFrame=0;const r=canvas.getBoundingClientRect();const pixelWidth=Math.round(r.width*devicePixelRatio),pixelHeight=Math.round(r.height*devicePixelRatio);if(canvas.width!==pixelWidth||canvas.height!==pixelHeight){canvas.width=pixelWidth;canvas.height=pixelHeight;}ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);ctx.clearRect(0,0,r.width,r.height);offset=Math.max(0,Math.min(Math.max(0,WORLD_WIDTH-r.width/zoom),offset));$('position').max=Math.max(0,WORLD_WIDTH-r.width/zoom);$('position').value=offset;
 renderer?.setView({x:offset,y:viewY,zoom});
 ctx.save();ctx.scale(zoom,zoom);ctx.translate(-offset,-viewY);
 if($('grid').checked){ctx.lineWidth=1/zoom;ctx.strokeStyle='rgba(255,255,255,.17)';const end=offset+r.width/zoom;for(let x=Math.floor(offset/50)*50;x<end;x+=50){ctx.beginPath();ctx.moveTo(x,viewY);ctx.lineTo(x,viewY+r.height/zoom);ctx.stroke();}for(let y=Math.floor(viewY/50)*50;y<viewY+r.height/zoom;y+=50){ctx.beginPath();ctx.moveTo(offset,y);ctx.lineTo(end,y);ctx.stroke();}}
 const p=selected&&collection(level,selected.key)[selected.index];
 if(p){const b=visualBounds({...selected,p})??bounds({...selected,p});ctx.strokeStyle='#ffe0a1';ctx.lineWidth=2/zoom;ctx.strokeRect(b.x-3,b.y-3,b.w+6,b.h+6);ctx.fillStyle='#ffe0a1';for(const h of handles(p)){ctx.fillRect(h.x-5/zoom,h.y-5/zoom,10/zoom,10/zoom);}}
 ctx.restore();$('undo').disabled=!undo.length;$('redo').disabled=!redo.length;updateChrome();drawOverview();
}
function visualBounds(e){return ['terrain','platforms','movers','loops'].includes(e.key)?bounds(e):renderer?.bounds(e.key,e.index);}
function handles(p){return selected&&['terrain','platforms','movers'].includes(selected.key)?[{name:'start',x:p.x,y:p.y},{name:'end',x:p.x+p.w,y:p.y2??p.y}]:[];}
function inspect(){
 const p=selected&&collection(level,selected.key)[selected.index];$('selection-actions').hidden=!p;$('selection-preview').hidden=!p;$('fields').replaceChildren();$('selection-title').textContent=p?names[COLLECTIONS.indexOf(selected.key)]:'Aucun élément sélectionné';
 if(!p){const text=document.createElement('p');text.className='muted';text.textContent='Clique sur un élément du jeu pour le modifier. Alt + clic parcourt les objets superposés.';$('fields').append(text);return;}
 const texture=selected.key==='scenery'?p.key:selected.key==='adventure.landmarks'?`v6-${p.key}`:selected.key==='adventure.enemies'?`v6-${p.kind}-0`:selected.key==='adventure.monitors'?`v6-${p.type}-0`:presets[selected.key]?.[0]?.[1];$('selection-image').src=renderer?.thumbnail(texture)||'';
 const values=Object.entries(p).filter(([,v])=>['number','string','boolean'].includes(typeof v));if(p.motion)for(const [key,value]of Object.entries(p.motion))values.push([`motion.${key}`,value]);
 for(const [key,value]of values){
  if(['checkpoints','springs'].includes(selected.key)&&key==='y'||selected.key==='movers'&&key==='y2'||selected.key==='terrain'&&key==='kind')continue;
  if(['id','slope','surface','route','rail','anchor','depth','phase','zone','authored','editorHidden'].includes(key))continue;
  const label=document.createElement('label');label.textContent=({x:'X · position horizontale',y:'Y · hauteur',y2:'Y2 · fin de pente',w:'Largeur',h:'Épaisseur',text:'Texte',key:'Décor',kind:'Type',style:'Aspect',scale:'Échelle',power:'Puissance',range:'Patrouille',speed:'Vitesse',radius:'Rayon',baseY:'Base du looping',minSpeed:'Élan minimum','motion.axis':'Axe du mouvement','motion.period':'Période · secondes','motion.amplitude':'Amplitude · pixels'}[key]??key);
  let options=key==='kind'&&selected.key==='adventure.enemies'?['crab','drone']:key==='kind'?['roof','beam','crate']:key==='type'?['shield','cache']:key==='style'?['basalt','ropebridge','comics']:key==='motion.axis'?['x','y']:key==='key'?[...new Set((presets[selected.key]||[]).map(p=>p[2].key).filter(Boolean)),value]:null;
  if(options)options=[...new Set(options)];
  const input=document.createElement(options?'select':'input');
  if(options)for(const option of options){const o=document.createElement('option');o.value=option;o.textContent=({crab:'Crabe',drone:'Drone',shield:'Bouclier',cache:'Réserve',roof:'Plateforme',beam:'Obstacle bas',crate:'Caisse',basalt:'Basalte',ropebridge:'Passerelle',comics:'Terrasse',x:'Horizontal',y:'Vertical'}[option]??option);input.append(o);}
  else{input.type=typeof value==='number'?'number':typeof value==='boolean'?'checkbox':'text';if(typeof value==='number'){input.step=key==='scale'?'.05':key==='motion.period'?'.1':'1';input.inputMode='decimal';}}
  if(input.type==='checkbox')input.checked=value;else input.value=value;
  input.addEventListener('change',()=>{
   if(typeof value==='number'&&input.value.trim()===''){say('Renseigne une valeur avant de valider.');inspect();return;}
   const next=typeof value==='number'?Number(input.value):input.type==='checkbox'?input.checked:input.value;if(next===value)return;
   const candidate=structuredClone(level),target=collection(candidate,selected.key)[selected.index],parts=key.split('.');if(parts.length===2)target[parts[0]][parts[1]]=next;else target[key]=next;
   if(['scenery','adventure.landmarks'].includes(selected.key)){target.authored=true;target.anchor='absolute';}
   syncEditorObject(candidate,selected.key,target);if(selected.key==='movers')target.y2=target.y;if('y2'in target&&'w'in target)target.slope=(target.y2-target.y)/target.w;
   try{validateLevel(candidate);}catch(error){say(error.message);inspect();return;}snapshot();level=candidate;changed();
  });label.append(input);$('fields').append(label);
 }
}

function point(e){const r=canvas.getBoundingClientRect(),round=v=>$('snap').checked?Math.round(v/10)*10:v;return{x:Math.max(0,Math.min(WORLD_WIDTH,round((e.clientX-r.left)/zoom+offset))),y:round((e.clientY-r.top)/zoom+viewY)};}
function create(x,y){endDrag();y=Math.max(-300,Math.min(850,y));const id=`custom-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;let p={id,x,y};
 if(['terrain','platforms','movers'].includes(kind))p={...p,id:kind==='terrain'?`ground-${id}`:id,kind:kind==='terrain'?'ground':'roof',w:Math.min(200,WORLD_WIDTH-x),h:kind==='terrain'?Math.max(20,900-y):22,y2:y,slope:0,style:'basalt',...(kind==='movers'?{motion:{axis:'x',amplitude:60,period:3}}:{})};
 if(kind==='springs')p.power=840;if(kind==='pads')p.speed=740;if(kind==='loops')p={id,x,baseY:y,radius:120,minSpeed:590};if(kind==='signs')p.text='Ton message';if(kind==='scenery')Object.assign(p,{key:'plants',scale:.5,anchor:'absolute',depth:1});if(kind==='adventure.landmarks')Object.assign(p,{key:'fern',scale:.7});if(kind==='adventure.enemies')Object.assign(p,{kind:'crab',range:42,phase:0});if(kind==='adventure.monitors')p.type='shield';if(kind==='adventure.relics')p.zone=Math.min(2,Math.floor(x/8400));if(kind==='adventure.vents')p.phase=0;
 Object.assign(p,variant);if(kind==='platforms'&&p.kind==='roof'){p.route=id;p.editorSupports=p.style==='ropebridge'?['left','right']:['center'];}if(p.w!==undefined&&p.w<1){say('Choisis une position avant la fin du parcours.');return;}if(['scenery','adventure.landmarks'].includes(kind)){p.authored=true;p.editorHidden=false;}if(kind==='pads'){const surfaces=[...level.platforms,...level.terrain].filter(s=>x>=s.x&&x<=s.x+s.w);const surface=surfaces.sort((a,b)=>Math.abs(a.y-y)-Math.abs(b.y-y))[0];if(surface)p.surface=surface.id;}snapshot();const items=collection(level,kind);syncEditorObject(level,kind,p);items.push(p);selected={key:kind,index:items.length-1};changed();
}
function chooseTool(t){tool=t;for(const n of ['select','place','pan'])$(n).setAttribute('aria-pressed',n===t);canvas.style.cursor=t==='place'?'crosshair':t==='pan'?'grab':'default';$('placement-ghost').hidden=t!=='place';$('mode-label').textContent=t==='place'?'PLACEMENT':t==='pan'?'DÉPLACER LA VUE':'SÉLECTION';}
canvas.addEventListener('pointerdown',e=>{
 if(drag||!renderer?.ready||renderer.pending||e.isPrimary===false)return;
 if(e.button!==0&&e.button!==1)return;const q=point(e);canvas.focus();canvas.setPointerCapture(e.pointerId);
 if(tool==='pan'||space||e.button===1){drag={pointerId:e.pointerId,pan:true,clientX:e.clientX,clientY:e.clientY,offset,viewY};canvas.style.cursor='grabbing';return;}
 if(tool==='place'){create(q.x,q.y);return;}
 const p=selected&&collection(level,selected.key)[selected.index];const handle=p&&handles(p).find(h=>Math.hypot(q.x-h.x,q.y-h.y)<14/zoom);
 if(handle){renderer.beginEdit(selected.key,selected.index);drag={pointerId:e.pointerId,handle:handle.name,q,p,x:p.x,y:p.y,y2:p.y2,w:p.w};return;}
 const hits=entries().filter(v=>{const b=visualBounds(v),margin=5/zoom;if(!b)return false;return q.x>=b.x-margin&&q.x<=b.x+b.w+margin&&q.y>=b.y-margin&&q.y<=b.y+b.h+margin;});
 const ordered=hits.sort((a,b)=>{if(a.key==='terrain'&&b.key!=='terrain')return 1;if(b.key==='terrain'&&a.key!=='terrain')return -1;const depth=renderer.depth(b.key,b.index)-renderer.depth(a.key,a.index);if(depth)return depth;const aa=visualBounds(a),bb=visualBounds(b);return aa.w*aa.h-bb.w*bb.h;});
 const previous=ordered.findIndex(e=>selected?.key===e.key&&selected?.index===e.index);
 const hit=e.altKey?ordered[(previous+1)%ordered.length]:ordered[0];
 selected=hit?{key:hit.key,index:hit.index}:null;if(hit){renderer.beginEdit(hit.key,hit.index);drag={pointerId:e.pointerId,q,p:hit.p,x:hit.p.x,y:hit.p.y,baseY:hit.p.baseY,y2:hit.p.y2};}draw();inspect();
});
canvas.addEventListener('pointermove',e=>{
 const q=point(e);hoverPoint=q;updateGhost(e);$('coords').textContent=`X ${Math.round(q.x)} · Y ${Math.round(q.y)}`;if(!drag||drag.pointerId!==e.pointerId)return;
 if(drag.pan){offset=Math.max(0,Math.min(WORLD_WIDTH,drag.offset-(e.clientX-drag.clientX)/zoom));viewY=Math.max(-400,Math.min(800,drag.viewY-(e.clientY-drag.clientY)/zoom));$('position').value=offset;draw();return;}
 const dx=q.x-drag.q.x,dy=q.y-drag.q.y;
 if(!dx&&!dy&&!drag.saved)return;if(!drag.saved){drag.before=JSON.stringify(level);drag.redoBefore=redo.slice();drag.undoBefore=undo.slice();snapshot();drag.saved=true;if(['scenery','adventure.landmarks'].includes(selected.key)){drag.p.authored=true;drag.p.anchor='absolute';}}
 if(drag.handle==='start'){drag.p.x=Math.max(0,Math.min(drag.x+drag.w-1,drag.x+dx));drag.p.w=drag.w+drag.x-drag.p.x;drag.p.y=Math.max(-300,Math.min(850,drag.y+dy));}
 else if(drag.handle==='end'){drag.p.w=Math.max(1,Math.min(WORLD_WIDTH-drag.x,q.x-drag.x));drag.p.y2=selected.key==='movers'?drag.p.y:Math.max(-300,Math.min(850,q.y));}
 else{drag.p.x=Math.max(0,Math.min(WORLD_WIDTH-(drag.p.w??0),drag.x+dx));if(drag.y!==undefined&&!['checkpoints','springs'].includes(selected.key))drag.p.y=Math.max(-300,Math.min(850,drag.y+dy));if(drag.baseY!==undefined)drag.p.baseY=drag.baseY+dy;if(drag.y2!==undefined){const deltaY=drag.p.y-drag.y;drag.p.y2=Math.max(-300,Math.min(850,drag.y2+deltaY));}}
 syncEditorObject(level,selected.key,drag.p);
 if('y2'in drag.p)drag.p.slope=(drag.p.y2-drag.p.y)/drag.p.w;
 renderer?.previewObject(selected.key,selected.index,drag.p);draw();
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
canvas.addEventListener('wheel',e=>{e.preventDefault();if(drag)return;if(e.ctrlKey||e.metaKey){setZoom(zoom*(e.deltaY<0?1.15:1/1.15),e.clientX,e.clientY);return;}if(e.shiftKey)viewY=Math.max(-400,Math.min(800,viewY+e.deltaY/zoom));else offset=Math.max(0,Math.min(WORLD_WIDTH,offset+(e.deltaX||e.deltaY)/zoom));$('position').value=offset;draw();},{passive:false});
for(const t of ['select','place','pan'])$(t).onclick=()=>chooseTool(t);
$('kind').onchange=e=>{kind=e.target.value;variant={};palette();};$('zoom').onchange=e=>setZoom(Number(e.target.value));
function navigate(x){endDrag();offset=Math.max(0,Math.min(WORLD_WIDTH,x));$('position').value=offset;const y=floor(offset+300);viewY=y-canvas.clientHeight/zoom*.7;draw();}
$('region').onchange=e=>navigate(Number(e.target.value));$('position').oninput=e=>navigate(Number(e.target.value));$('grid').onchange=draw;
$('left-view').onclick=()=>navigate(offset-canvas.clientWidth/zoom*.7);$('right-view').onclick=()=>navigate(offset+canvas.clientWidth/zoom*.7);$('center-view').onclick=()=>navigate(selected?Math.max(0,collection(level,selected.key)[selected.index].x-canvas.clientWidth/zoom/2):offset);
$('undo').onclick=()=>history(undo,redo);$('redo').onclick=()=>history(redo,undo);
$('delete').onclick=()=>{endDrag();if(!selected)return;if(['terrain','checkpoints'].includes(selected.key)&&collection(level,selected.key).length===1){say('Conserve au moins un sol et un drapeau.');return;}snapshot();collection(level,selected.key).splice(selected.index,1);selected=null;changed();};
$('duplicate').onclick=()=>{endDrag();if(!selected)return;snapshot();const items=collection(level,selected.key),p=structuredClone(items[selected.index]);p.x=Math.min(WORLD_WIDTH-(p.w??0),p.x+40);p.id=`${selected.key==='terrain'?'ground-':''}copy-${crypto.randomUUID()}`;syncEditorObject(level,selected.key,p);items.push(p);selected.index=items.length-1;changed();};
function save(key=DRAFT_KEY){endDrag();try{const data=normalizeLevel(structuredClone(level),{playable:key===TEST_KEY});localStorage.setItem(key,JSON.stringify(data));if(key===DRAFT_KEY){savedState=JSON.stringify(level);dirty=false;}say('Parcours sauvegardé dans ce navigateur.');return true;}catch(e){say(`Sauvegarde impossible : ${e.message}`);return false;}}
$('save').onclick=()=>save();
$('test-here').onclick=()=>{const desired=selected?collection(level,selected.key)[selected.index].x:offset+Math.min(200,canvas.clientWidth/zoom/3),nearby=level.terrain.filter(p=>p.x<24700&&p.x+p.w>=80).sort((a,b)=>Math.abs(Math.max(a.x,Math.min(a.x+a.w,desired))-desired)-Math.abs(Math.max(b.x,Math.min(b.x+b.w,desired))-desired))[0];if(!nearby){say('Ajoute du sol pour tester cette partie.');return;}const x=Math.max(80,Math.min(24699,Math.max(nearby.x,Math.min(nearby.x+nearby.w,desired))));if(save()&&save(TEST_KEY))location.href=`/?custom=1&spawn=${Math.round(x)}`;};$('test').onclick=()=>{if(save()&&save(TEST_KEY))location.href='/?custom=1';};
$('export').onclick=()=>{try{const data=normalizeLevel(structuredClone(level)),url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='ltn-mon-parcours.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);say('Niveau exporté.');}catch(e){say(e.message);}};
$('import').onclick=()=>$('file').click();$('file').onchange=async e=>{try{const file=e.target.files[0];if(!file)return;if(file.size>5e6)throw Error('Fichier trop volumineux (maximum 5 Mo).');const data=normalizeLevel(JSON.parse(await file.text()));snapshot();level=data;selected=null;changed();say('Niveau importé. Sauvegarde-le pour le conserver.');}catch(error){say(`Import impossible : ${error.message}`);}e.target.value='';};
$('original').onclick=()=>{snapshot();level=buildLevel();selected=null;changed();say('Parcours original chargé. Annuler permet de revenir à ton travail.');};
window.addEventListener('keydown',e=>{
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();document.activeElement?.blur();save();return;}
 if(/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();history(e.shiftKey?redo:undo,e.shiftKey?undo:redo);}
 if(e.key==='Delete')$('delete').click();
});
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
const presets={
 platforms:[['Corniche','island-ledge',{style:'basalt'}],['Passerelle','island-bridge',{style:'ropebridge'}],['Obstacle bas','polish-gate-cap-0',{kind:'beam',h:24}]],
 terrain:[['Sol en basalte','ground',{}]],tokens:[['Éclat','token',{}]],checkpoints:[['Drapeau','polish-checkpoint-0',{}]],springs:[['Ressort','polish-spring-0',{}]],pads:[['Accélérateur','polish-boost-0',{}]],loops:[['Looping','island-loop',{}]],
 scenery:[['Plantes','plants',{key:'plants'}],['Rochers','rocks',{key:'rocks'}],['Palmier','palm',{key:'palm'}],['Lanterne','lantern',{key:'lantern'}],['Barque','boat',{key:'boat'}],['Cascade','waterfall',{key:'waterfall'}]],
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
 const p=selected&&collection(level,selected.key)[selected.index];$('object-count').textContent=`${COLLECTIONS.reduce((n,k)=>n+collection(level,k).filter(p=>!p.editorHidden).length,0)} éléments`;
 const hint=$('selection-hint');hint.hidden=!p;hint.textContent=p?`${names[COLLECTIONS.indexOf(selected.key)]} · ${Math.round(p.x)}, ${Math.round(p.y??p.baseY??floor(p.x))}  |  Flèches : ajuster · Ctrl D : dupliquer`:'';
 updateGhost();
}
function setZoom(next,clientX,clientY){
 endDrag();const rect=canvas.getBoundingClientRect(),x=(clientX??rect.left+rect.width/2)-rect.left,y=(clientY??rect.top+rect.height/2)-rect.top;
 const worldX=offset+x/zoom,worldY=viewY+y/zoom;zoom=Math.max(.25,Math.min(2,Math.round(next*100)/100));offset=worldX-x/zoom;viewY=worldY-y/zoom;
 let option=[...$('zoom').options].find(o=>Number(o.value)===zoom);if(!option){option=$('zoom').querySelector('[data-custom]')??document.createElement('option');option.dataset.custom='true';option.value=zoom;option.textContent=`${Math.round(zoom*100)} %`;$('zoom').append(option);}$('zoom').value=String(zoom);draw();
}
function drawOverview(){
 const overview=$('overview');if(!overview)return;const width=overview.clientWidth,height=overview.clientHeight,dpr=devicePixelRatio;
 if(overview.width!==Math.round(width*dpr)||overview.height!==Math.round(height*dpr)){overview.width=Math.round(width*dpr);overview.height=Math.round(height*dpr);}
 const c=overview.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,width,height);const sx=width/WORLD_WIDTH,sy=(height-8)/1100;
 for(let i=0;i<3;i++){c.fillStyle=['#382b27','#24372d','#203540'][i];c.fillRect(i*width/3,0,width/3,height);}
 c.strokeStyle='#a9b69b';c.lineWidth=1;for(const p of level.terrain){c.beginPath();c.moveTo(p.x*sx,4+p.y*sy);c.lineTo((p.x+p.w)*sx,4+(p.y2??p.y)*sy);c.stroke();}
 c.strokeStyle='#74ad99';for(const p of level.platforms){c.beginPath();c.moveTo(p.x*sx,4+p.y*sy);c.lineTo((p.x+p.w)*sx,4+(p.y2??p.y)*sy);c.stroke();}
 c.fillStyle='#f2c777';for(const p of level.checkpoints)c.fillRect(p.x*sx,6,2,height-12);
 if(selected){c.fillStyle='#ffad84';const p=collection(level,selected.key)[selected.index];if(p)c.fillRect(p.x*sx-2,0,4,height);}
 c.fillStyle='#e9efcb20';c.strokeStyle='#d0e8b3';c.lineWidth=1.5;const x=offset*sx,w=Math.max(8,canvas.clientWidth/zoom*sx);c.fillRect(x,0,w,height);c.strokeRect(x+.75,.75,w-1.5,height-1.5);
}
$('asset-search').oninput=palette;
for(const button of document.querySelectorAll('[data-family]'))button.onclick=()=>{kind=families[button.dataset.family][0];$('kind').value=kind;variant={};$('asset-search').value='';palette();};
$('zoom-in').onclick=()=>setZoom(zoom*1.25);$('zoom-out').onclick=()=>setZoom(zoom/1.25);
$('focus-mode').onclick=()=>{document.body.classList.toggle('focus-mode');$('focus-mode').textContent=document.body.classList.contains('focus-mode')?'Afficher les panneaux':'Vue large';setTimeout(draw,0);};
canvas.addEventListener('pointerleave',()=>{hoverPoint=null;$('placement-ghost').hidden=true;});
const overview=$('overview');let overviewDragging=false;
function overviewNavigate(e){const r=overview.getBoundingClientRect();navigate((e.clientX-r.left)/r.width*WORLD_WIDTH-canvas.clientWidth/zoom/2);}
overview.addEventListener('pointerdown',e=>{overviewDragging=true;overview.setPointerCapture(e.pointerId);overviewNavigate(e);});overview.addEventListener('pointermove',e=>{if(overviewDragging)overviewNavigate(e);});overview.addEventListener('pointerup',()=>overviewDragging=false);overview.addEventListener('pointercancel',()=>overviewDragging=false);
overview.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();navigate(offset+(e.key==='ArrowRight'?1:-1)*canvas.clientWidth/zoom*.5);}});
for(const [label,keys]of [['Terrain',['terrain','platforms','movers','loops']],['Objets',families.play],['Décors',families.decor]]){
 const row=document.createElement('div');row.className='layer-row';const name=document.createElement('span');name.textContent=label;
 const visible=document.createElement('button');visible.textContent='Visible';visible.setAttribute('aria-label',`Afficher ou masquer : ${label}`);visible.setAttribute('aria-pressed','true');visible.onclick=()=>{const show=hiddenLayers.has(keys[0]);for(const k of keys){if(show)hiddenLayers.delete(k);else hiddenLayers.add(k);renderer.setLayerVisibility(k,show);}visible.textContent=show?'Visible':'Masqué';visible.setAttribute('aria-pressed',show);if(selected&&keys.includes(selected.key)){selected=null;inspect();}draw();};
 const lock=document.createElement('button');lock.textContent='Libre';lock.setAttribute('aria-label',`Verrouiller : ${label}`);lock.setAttribute('aria-pressed','false');lock.onclick=()=>{const locked=!lockedLayers.has(keys[0]);for(const k of keys)locked?lockedLayers.add(k):lockedLayers.delete(k);lock.textContent=locked?'Verrouillé':'Libre';lock.setAttribute('aria-pressed',locked);if(locked&&selected&&keys.includes(selected.key)){selected=null;inspect();}draw();};row.append(name,visible,lock);$('layers').append(row);
}
window.addEventListener('keydown',e=>{
 if(/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)||e.ctrlKey||e.metaKey||e.altKey)return;
 if(e.key.toLowerCase()==='v')chooseTool('select');if(e.key.toLowerCase()==='b')chooseTool('place');if(e.key.toLowerCase()==='h')chooseTool('pan');
 if(e.key.toLowerCase()==='f'){$('center-view').click();canvas.focus();}
 if(e.key==='F4'){e.preventDefault();$('focus-mode').click();}
 if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)&&selected){
  e.preventDefault();endDrag();const candidate=structuredClone(level),p=collection(candidate,selected.key)[selected.index],step=e.shiftKey?10:1;
  if(e.key==='ArrowLeft')p.x-=step;if(e.key==='ArrowRight')p.x+=step;
  if(!['checkpoints','springs'].includes(selected.key)){const dy=e.key==='ArrowUp'?-step:e.key==='ArrowDown'?step:0;if(p.y!==undefined)p.y+=dy;if(p.y2!==undefined)p.y2+=dy;if(p.baseY!==undefined)p.baseY+=dy;}
  syncEditorObject(candidate,selected.key,p);try{validateLevel(candidate);}catch(error){say(error.message);return;}snapshot();level=candidate;changed();
 }
});
window.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='d'&&!/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)){e.preventDefault();$('duplicate').click();}});

renderer=createEditorRenderer($('game-preview'),level,()=>{$('loading').hidden=true;savedState=JSON.stringify(level);palette();navigate(Math.max(0,Number(new URLSearchParams(location.search).get('x'))||offset));say(startupWarning||'Décor prêt · sélectionne un objet ou choisis-le dans la bibliothèque.');},say,draw);
new ResizeObserver(()=>{renderer.resize(canvas.clientWidth,canvas.clientHeight);draw();}).observe(canvas);
window.addEventListener('keydown',e=>{if(/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;if(e.code==='Space'){e.preventDefault();space=true;canvas.style.cursor='grab';}if(e.key==='Escape'){endDrag(true);selected=null;chooseTool('select');draw();inspect();}});
window.addEventListener('keyup',e=>{if(e.code==='Space'){space=false;if(!drag)chooseTool(tool);}});
window.addEventListener('blur',()=>{space=false;endDrag(true);});
window.__LTN_EDITOR__={get ready(){return renderer.ready&&!renderer.pending;},get level(){return level;},get view(){return{x:offset,y:viewY,zoom};},get backgrounds(){return renderer.backgrounds;},get objects(){return renderer.objects;},get selection(){return selected;},get dirty(){return dirty;},get metrics(){return renderer.metrics;}};
draw();
