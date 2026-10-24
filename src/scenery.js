import {GROUND_Y,GOAL_X,ZONES,STAGES,groundAt,heightOn} from './level.js';
export const V3_KEYS=['pier','rocks','boat','bench','bollards','surfboards','kiosk','comics','gameshop','footbridge','neonarrow','arch','plants','frangipani','lantern','terrace','speakers','canopy','lavarocks','basaltarch','tamarind','hut','ropebridge','waterfall'];
const WIDE_STRUCTURES=new Set(['hut','kiosk','bench','surfboards','terrace','bollards','arch','comics','gameshop']);

export function resolveScenery(level,item,width){
 if(item.anchor==='absolute')return{...item,y:item.y};
 const x=item.x,ground=groundAt(level,x);
 if(level.platforms.some(p=>(p.kind==='beam'||p.kind==='crate')&&x>p.x-width/2-35&&x<p.x+p.w+width/2+35))return null;
 if(!ground)return null;
 if(WIDE_STRUCTURES.has(item.key)){
  const left=groundAt(level,x-width/2),right=groundAt(level,x+width/2);
  if(!left||!right||Math.abs(heightOn(left,x-width/2)-heightOn(right,x+width/2))>2)return null;
 }
 // Trees/rocks sink slightly into slopes instead of balancing on a single pixel.
 const half=Math.min(width*.22,24),a=groundAt(level,x-half),b=groundAt(level,x+half);
 const y=heightOn(ground,x);
 return {...item,x,y:y+(WIDE_STRUCTURES.has(item.key)?0:Math.min(8,Math.abs((a?heightOn(a,x-half):y)-(b?heightOn(b,x+half):y))*.25))};
}

export function drawScenery(scene){
 const level=scene.level;
 const floor=x=>{const s=groundAt(level,x);return s?heightOn(s,x):null;};
 const label=(x,y,text,color='#e4d8bc',size=11)=>scene.add.text(x,y,text,{fontFamily:'monospace',fontSize:`${size}px`,fontStyle:'bold',color,stroke:'#10252b',strokeThickness:2,backgroundColor:'#112a30',padding:{x:8,y:6}}).setDepth(3);
 scene.placedScenery=[];scene.extraProps=[];
 for(const item of level.scenery){
  const source=scene.textures.get(item.key).getSourceImage();
  const placement=resolveScenery(level,item,source.width*item.scale);
  if(!placement)continue;
  const sprite=scene.add.image(placement.x,placement.y,item.key).setOrigin(.5,1).setScale(item.scale).setDepth(item.depth??1);
  scene.placedScenery.push({...placement,sprite,width:source.width*item.scale,height:source.height*item.scale});
 }
 // Sparse trail markers: no numbered chapter boards across the scenery.
 for(const sign of level.signs){const y=floor(sign.x);if(y===null)continue;
  scene.add.rectangle(sign.x+3,y-32,4,64,0x6b5840).setDepth(2);
  const text=scene.add.text(sign.x-10,y-77,sign.text,{fontFamily:'Arial',fontSize:'12px',color:'#eee5ce',backgroundColor:'#303a30',padding:{x:9,y:7}}).setDepth(3);
  scene.add.rectangle(text.x,text.y+text.height-2,text.width,2,0x8e8262).setOrigin(0).setDepth(3);
 }
 for(const checkpoint of level.checkpoints.slice(1)){const x=checkpoint.x,y=floor(x),g=scene.add.graphics().setDepth(2);
  g.fillStyle(0x9b8d69);g.fillRect(x,y-72,3,72);
  g.fillStyle(0xbdd59d);g.fillTriangle(x+3,y-71,x+30,y-61,x+3,y-50);
  scene.add.rectangle(x,y+2,28,4,0xbdd59d).setDepth(5);
 }
 // Shared visual grammar: ember = jump/bonus, mint = recovery, blue = finish.
 scene.stageGates=[];
 for(const stage of STAGES){const x=stage.end,y=floor(x),g=scene.add.graphics().setDepth(5);
  g.fillStyle(stage.color);g.fillRect(x-3,y-96,6,96);
  for(let row=0;row<3;row++)for(let col=0;col<3;col++)g.fillStyle((row+col)%2?0x193136:stage.color).fillRect(x+3+col*9,y-96+row*9,9,9);
  scene.stageGates.push({x,y});
 }
 for(const [a,b]of level.gaps){const y=floor(a-5),g=scene.add.graphics().setDepth(6);
  g.fillStyle(0xed936c);g.fillRect(a-40,y-4,34,4);
  g.lineStyle(3,0xed936c);g.beginPath();g.moveTo(a-65,y-40);g.lineTo(a-47,y-58);g.lineTo(a-47,y-45);g.moveTo(a-47,y-58);g.lineTo(a-60,y-58);g.strokePath();
  scene.add.rectangle(b+22,floor(b+22)-2,36,4,0xbdd59d).setDepth(6);
 }
 for(const pad of level.pads){const roof=[...level.platforms,...level.terrain].find(s=>s.id===pad.surface),g=scene.add.graphics().setDepth(6);
  const y=heightOn(roof,pad.x);
  g.fillStyle(0xc4e29e);g.fillRect(pad.x-40,y-7,80,7);
  for(let i=0;i<4;i++){g.fillStyle(0xffad78);g.fillTriangle(pad.x-31+i*19,y-26,pad.x-20+i*19,y-19,pad.x-31+i*19,y-12);}
 }
 for(const spring of level.springs){const y=floor(spring.x),g=scene.add.graphics().setDepth(6);
  g.fillStyle(0x112d32);g.fillRect(spring.x-21,y,42,24);g.lineStyle(3,0xbad4a0);
  g.beginPath();g.moveTo(spring.x-12,y+19);g.lineTo(spring.x+11,y+14);g.lineTo(spring.x-11,y+9);g.lineTo(spring.x+11,y+4);g.strokePath();
  g.fillStyle(0xffa078);g.fillRect(spring.x-23,y-5,46,6);g.fillStyle(0xeff1b8);g.fillTriangle(spring.x-6,y-39,spring.x+6,y-39,spring.x,y-47);
 }
 const building=scene.add.image(GOAL_X,GROUND_Y,'qg').setOrigin(.5,1).setDepth(1),signY=GROUND_Y-building.height+101;
 scene.add.image(GOAL_X-137,signY,'barLogo').setDisplaySize(30,30*745/701).setDepth(2);
 scene.add.text(GOAL_X+17,signY,'LES TOILES NOIRES',{fontFamily:'monospace',fontSize:'20px',fontStyle:'bold',color:'#ffce94',stroke:'#6d4430',strokeThickness:2}).setOrigin(.5).setDepth(2);
 scene.add.rectangle(GOAL_X+58,390,4,120,0xd7dfa4).setDepth(2);
 for(let i=0;i<5;i++)for(let j=0;j<2;j++)scene.add.rectangle(GOAL_X+60+j*10,330+i*10,10,10,(i+j)%2?0xeee6cb:0x233b3b).setOrigin(0).setDepth(2);

}
