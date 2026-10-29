export const DRAFT_KEY='ltn-editor-draft-v1';
import {VENUE_KEYS,V3_KEYS} from './scenery.js';
export const TEST_KEY='ltn-editor-test-v1';
export const COLLECTIONS=['terrain','platforms','tokens','checkpoints','springs','pads','loops','signs','scenery','movers','adventure.enemies','adventure.relics','adventure.monitors','adventure.vents','adventure.landmarks'];
export const collection=(level,key)=>key.split('.').reduce((v,k)=>v[k],level);
const SCENERY_KEYS=new Set(['pier','rocks','boat','bench','bollards','surfboards','kiosk','comics','gameshop','footbridge','neonarrow','arch','plants','frangipani','lantern','terrace','speakers','canopy','lavarocks','basaltarch','tamarind','hut','ropebridge','waterfall','palm','arcade','planter']);
const LANDMARK_KEYS=new Set(['lava','tamarin','case-creole','fern','vacoa','pirogue']);
for(const key of VENUE_KEYS)SCENERY_KEYS.add(key);
for(const key of V3_KEYS)SCENERY_KEYS.add(key);
export function validateLevel(level,{playable=false}={}){
 if(!level||typeof level!=='object')throw Error('Fichier de niveau invalide.');
 let pixels=0;
 for(const key of COLLECTIONS){
  const items=key.split('.').reduce((v,k)=>v?.[k],level),ids=new Set();
  if(!Array.isArray(items)||items.length>10000)throw Error(`Collection invalide : ${key}`);
  for(const p of items){
   if(!p||!Number.isFinite(p.x)||p.x<0||p.x>33600)throw Error(`Position X invalide : ${key}`);
   if(p.id!==undefined){if(typeof p.id!=='string'||!p.id||ids.has(p.id))throw Error(`Identifiant absent ou en double : ${key}`);ids.add(p.id);}
   for(const [name,value]of Object.entries(p))if(typeof value==='number'&&!Number.isFinite(value))throw Error(`Valeur invalide : ${name}`);
   for(const name of ['y','y2','baseY'])if(p[name]!==undefined&&(!Number.isFinite(p[name])||p[name]<-6000||p[name]>850))throw Error(`Hauteur hors limites : ${key} / ${name}`);
   if(['terrain','platforms','movers'].includes(key)){
    if(!Number.isFinite(p.y)||!Number.isFinite(p.w)||p.w<1||p.w>33600||p.x+p.w>33601||!Number.isFinite(p.h)||p.h<=0||p.h>(p.kind==='ground'?7000:1200))throw Error('Surface hors limites.');
    if(!['ground','roof','beam','crate'].includes(p.kind))throw Error('Type de surface inconnu.');
    pixels+=Math.ceil(p.w+2)*(p.kind==='ground'?900-Math.min(p.y,p.y2??p.y):Math.abs((p.y2??p.y)-p.y)+64);
   }
   if(key==='movers'&&(!p.motion||!['x','y'].includes(p.motion.axis)||!Number.isFinite(p.motion.period)||p.motion.period<=0||!Number.isFinite(p.motion.amplitude)||p.motion.amplitude<0||p.motion.amplitude>2000))throw Error('Mouvement invalide.');
   if(key==='loops'&&(!Number.isFinite(p.radius)||p.radius<10||p.radius>600||!Number.isFinite(p.baseY)||!Number.isFinite(p.minSpeed)||p.minSpeed<=0))throw Error('Boucle invalide.');
   if(key==='adventure.enemies'&&(!['crab','drone'].includes(p.kind)||!Number.isFinite(p.range)||p.range<0||p.range>2000||!Number.isFinite(p.phase)))throw Error('Ennemi invalide.');
   if(key==='adventure.monitors'&&!['shield','cache'].includes(p.type))throw Error('Bonus inconnu.');
   if(['tokens','adventure.enemies','adventure.monitors','adventure.relics','adventure.vents'].includes(key)&&!Number.isFinite(p.y))throw Error(`Hauteur manquante : ${key}`);
   if(['scenery','adventure.landmarks'].includes(key)&&(typeof p.key!=='string'||!Number.isFinite(p.scale)||p.scale<=0||p.scale>5||level.editorLayoutVersion===1&&!p.editorHidden&&!Number.isFinite(p.y)))throw Error('Décor invalide.');
   if(key==='scenery'&&!SCENERY_KEYS.has(p.key)||key==='adventure.landmarks'&&!LANDMARK_KEYS.has(p.key))throw Error('Décor inconnu.');
   if(p.ground!==undefined&&(!Array.isArray(p.ground)||p.ground.length!==3||!p.ground.every(Number.isFinite)))throw Error('Profil de patrouille invalide.');
   if(key==='springs'&&(!Number.isFinite(p.power)||p.power<=0||p.power>3000))throw Error('Puissance du ressort invalide.');
   if(key==='pads'&&(!Number.isFinite(p.speed)||p.speed<=0||p.speed>3000))throw Error('Vitesse du boost invalide.');
  }
 }
 const surfaceIds=new Set();for(const p of [...level.terrain,...level.platforms,...level.movers]){if(typeof p.id!=='string'||surfaceIds.has(p.id))throw Error('Identifiant de surface en double.');surfaceIds.add(p.id);}
 if(pixels>64000000)throw Error('Terrain trop volumineux pour être affiché.');
 if(!level.terrain.length||!level.checkpoints.length||!Array.isArray(level.pathDetails)||!Array.isArray(level.stages)||!Array.isArray(level.gaps)||!Array.isArray(level.adventure.chapters))throw Error('Il faut un sol, un drapeau et les données du parcours.');
 if(level.pathDetails.some(p=>!p||!Number.isFinite(p.x)||!Number.isFinite(p.y)||![0,1,2,3].includes(p.zone)||![0,1,2,3].includes(p.variant)))throw Error('Détails de terrain invalides.');
 if(level.gaps.some(p=>!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite)||p[0]>p[1]))throw Error('Ravine invalide.');
 if(playable)for(const x of [80,8480,16880,25280])if(!level.terrain.some(p=>x>=p.x&&x<=p.x+p.w))throw Error(`Il manque du sol au départ X ${x}.`);
 return level;
}
export function normalizeLevel(level,{playable=false}={}){
 validateLevel(level,{playable});
 for(const key of ['terrain','platforms','movers'])for(const p of level[key]){p.y2??=p.y;p.slope=(p.y2-p.y)/p.w;}
 // Preserve array order: selection and undo refer to these exact items.
 for(const pad of level.pads){
  const surfaces=[...level.platforms.filter(p=>p.kind==='roof'),...level.terrain],current=surfaces.find(p=>p.id===pad.surface&&pad.x>=p.x&&pad.x<=p.x+p.w);
  const height=p=>p.y+(pad.x-p.x)*(p.slope||0);
  const s=pad.y===undefined&&current?current:surfaces.filter(p=>pad.x>=p.x&&pad.x<=p.x+p.w).sort((a,b)=>Math.abs(height(a)-(pad.y??450))-Math.abs(height(b)-(pad.y??450)))[0];
  if(!s){if(playable)throw Error(`Accélérateur sans support à X ${pad.x}.`);continue;}pad.surface=s.id;
 }
 return level;
}
export function loadPlayableLevel(fallback){
 if(new URLSearchParams(location.search).get('custom')!=='1')return fallback();
 try{return normalizeLevel(JSON.parse(localStorage.getItem(TEST_KEY)),{playable:true});}catch(error){console.warn('Parcours personnalisé indisponible',error);return fallback();}
}
