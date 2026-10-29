const floorAt=(terrain,x)=>{
 const p=terrain.find(p=>x>=p.x&&x<=p.x+p.w);
 return p?{surface:p,y:p.y+(x-p.x)*(p.slope||0)}:null;
};
export function buildRouteDressing(level,terrain){
 const scenery=[],details=[];
 const clear=(x,margin)=>!level.gaps.some(([a,b])=>x>a-margin&&x<b+margin)
  &&!level.platforms.some(p=>['crate','beam'].includes(p.kind)&&x>p.x-75&&x<p.x+p.w+75)
  &&![...level.springs,...level.pads,...level.checkpoints,...level.signs].some(p=>Math.abs(p.x-x)<margin);

 for(let x=430,index=0;x<32500;x+=320+(index++%3)*45){
  for(const [j,offset]of [-38,48].entries()){
   const at=x+offset,floor=floorAt(terrain,at);
   if(!floor||Math.abs(floor.surface.slope)>.45||!clear(at,115))continue;
   const zone=at<8400?0:at<16800?1:at<25200?2:3;
   const keys=zone===0?['rocks']:zone===1?['lavarocks']:zone===2?['plants','rocks','tamarind']:['plants','rocks','frangipani'];
   const key=keys[(index+j)%keys.length];
   scenery.push({id:`path-cluster-${index}-${j}`,key,x:at,scale:key==='tamarind'||key==='frangipani'?.16:key==='plants'?.26:.27,anchor:'ground',depth:2});
  }
 }
 for(let x=130,index=0;x<32800;x+=240+(index++%4)*30){
  const floor=floorAt(terrain,x);if(!floor||!clear(x,45))continue;
  details.push({x,y:floor.y+7,zone:x<8400?0:x<16800?1:x<25200?2:3,variant:index%4,slope:floor.surface.slope});
 }
 for(const roof of level.platforms.filter(p=>p.kind==='roof'&&!(p.rail&&Number(p.id.split('-').at(-1))%2))){
  for(let x=roof.x+45;x<roof.x+roof.w-45&&details.length<280;x+=220)details.push({x,y:roof.y+(x-roof.x)*roof.slope+8,zone:roof.route==='ice-ridge'?0:roof.route==='volcano'||roof.route==='cinder-ridge'?1:roof.route==='mafate'?2:3,variant:2,slope:roof.slope});
 }
 return{scenery,details};
}

export function drawPathDetails(scene){
 const g=scene.add.graphics().setDepth(5);
 const palettes=[
  [0x85a5cb,0xdbeafe,0x4b6b94],
  [0xd97757,0x9e5238,0x6e382b],
  [0x608055,0x82a56c,0x3d5435],
  [0xb4a478,0x8f7d54,0xd0c498],
 ];
 for(const d of scene.level.pathDetails||[]){
  const colors=palettes[d.zone]||palettes[0],col=colors[d.variant%colors.length];
  g.fillStyle(col,.75);g.fillRect(d.x,d.y,d.variant===0?6:3,2);
 }
}
