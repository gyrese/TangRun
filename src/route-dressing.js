// Decorative sockets only: these never enter the collision or pickup lists.
const floorAt=(terrain,x)=>{
 const p=terrain.find(p=>x>=p.x&&x<=p.x+p.w);
 return p?{surface:p,y:p.y+(x-p.x)*(p.slope||0)}:null;
};
export function buildRouteDressing(level,terrain){
 const scenery=[],details=[];
 const clear=(x,margin)=>!level.gaps.some(([a,b])=>x>a-margin&&x<b+margin)
  &&!level.platforms.some(p=>['crate','beam'].includes(p.kind)&&x>p.x-margin&&x<p.x+p.w+margin)
  &&![...level.springs,...level.pads,...level.checkpoints,...level.signs].some(p=>Math.abs(p.x-x)<margin);
 // Asymmetric clusters give near-field reference points without a repeated hedge.
 for(let x=430,index=0;x<24300;x+=410+(index++%3)*65){
  const zone=x<8400?0:x<16800?1:2;
  const keys=zone===0?['rocks','lavarocks']:zone===1?['plants','rocks','tamarind']:['plants','rocks','frangipani'];
  for(const [j,offset]of [-38,48].entries()){
   const at=x+offset,floor=floorAt(terrain,at);
   if(!floor||Math.abs(floor.surface.slope)>.48||!clear(at,115))continue;
   const key=keys[(index+j)%keys.length];
   scenery.push({id:`path-cluster-${index}-${j}`,key,x:at,scale:key==='tamarind'||key==='frangipani'?.16:key==='plants'?.26:.27,anchor:'ground',depth:2});
  }
 }
 // Small inset stones, grass seams and shore fragments make ground speed legible.
 for(let x=130,index=0;x<24500;x+=61+(index++%4)*13){
  const floor=floorAt(terrain,x);if(!floor||!clear(x,45))continue;
  details.push({x,y:floor.y+7,zone:x<8400?0:x<16800?1:2,variant:index%4,slope:floor.surface.slope});
 }
 for(const roof of level.platforms.filter(p=>p.kind==='roof')){
  // Recessed edge marks leave both the foot sensor and the landing lip unobscured.
  for(let x=roof.x+35;x<roof.x+roof.w-28;x+=74)details.push({x,y:roof.y+8,zone:roof.route==='volcano'?0:roof.route==='mafate'?1:2,variant:2,slope:0});
 }
 return{scenery,details};
}

export function drawPathDetails(scene){
 const g=scene.add.graphics().setDepth(5);
 const palettes=[[0x6c4b3d,0xaa7960,0x493b35],[0x52754b,0x9cae72,0x304f3b],[0x8f9775,0xc6b88a,0x496c64]];
 for(const p of scene.level.pathDetails||[]){
  const colors=palettes[p.zone];g.fillStyle(colors[0],.85);
  g.fillRect(p.x-7,p.y,15+p.variant*3,3);
  g.fillStyle(colors[1],.8);g.fillRect(p.x-4,p.y+1,4,2);g.fillRect(p.x+8,p.y+7,3,2);
  if(p.zone===1){g.lineStyle(1,colors[0],.85);g.lineBetween(p.x+4,p.y+4,p.x+1,p.y-3);g.lineBetween(p.x+4,p.y+4,p.x+8,p.y-1);}
  else if(p.zone===2){g.fillStyle(colors[1],.75);g.fillTriangle(p.x+12,p.y+4,p.x+17,p.y+7,p.x+10,p.y+8);}
  else{g.fillStyle(colors[2],.8);g.fillRect(p.x-11,p.y+8,8,3);}
 }
 scene.pathDetailArt=g;
}
