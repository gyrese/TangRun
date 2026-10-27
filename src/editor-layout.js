import {planScenery} from './scenery.js';
import {COLLECTIONS,collection} from './editor-store.js';

// Bake the existing automatic composition once, retaining hidden source objects.
// Saved custom levels use these same explicit placements in the game.
export function freezeEditorLayout(level,measure){
 if(level.editorLayoutVersion===1)return level;
 const plan=planScenery(level,measure);
 for(const key of ['scenery','adventure.landmarks'])for(const item of collection(level,key))item.editorHidden=true;
 for(const placed of plan.all){
  const key=placed.landmark?'adventure.landmarks':'scenery';
  const item=collection(level,key)[placed.sourceIndex];if(!item)continue;
  Object.assign(item,{x:placed.x,y:placed.y,scale:placed.scale,anchor:'absolute',authored:true,editorHidden:false});
 }
 for(const key of COLLECTIONS)for(const [i,p]of collection(level,key).entries())p.id??=`editor-${key.replaceAll('.','-')}-${i}`;
 for(const p of level.platforms.filter(p=>p.kind==='roof')){
  const route=level.platforms.filter(q=>q.kind==='roof'&&q.route===p.route),index=route.indexOf(p),first=index===0,last=index===route.length-1;
  p.editorSupports=[];
  if(p.rail){const previous=route[index-1],next=route[index+1];if(!previous||previous.x+previous.w<p.x-1||index%4===0)p.editorSupports.push('left');if(!next||next.x>p.x+p.w+1)p.editorSupports.push('right');}
  else if(['ropebridge','comics','gameshop'].includes(p.style)){if(first)p.editorSupports.push('left');if(last)p.editorSupports.push('right');}
  else if(first||last||index%3===0)p.editorSupports.push('center');
 }
 level.editorLayoutVersion=1;
 return level;
}
