// Authoring-only: build the small pixel-art atlas from the generated sources.
import bounds from '../src/prop-art-data.json' with {type:'json'};

export function preloadPropSources(scene){
 for(const name of Object.keys(bounds))scene.load.image(`polish-source-${name}`,bounds[name].source||`/assets/polish-v1/${bounds[name].animated?name+'-animated':name}.png`);
}

const PALETTE=['#0d1820','#172731','#263b43','#3a4b53','#53636a','#7d8583','#301d1c','#543128','#7b4b34','#a3683f','#ca8d50','#e6ad63','#3c251b','#704119','#a2601d','#cf8b25','#edb53d','#ffd873','#fff1ba','#153734','#24564a','#3b7b62','#659a74','#9abe8d','#16464b','#23727b','#43a4a1','#7dd3b9','#8d6952','#b9b9a1','#d8d9bb','#f4ead0'].map(hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)));
function pixelPalette(c,w,h){
 const image=c.getImageData(0,0,w,h),data=image.data;
 for(let i=0;i<data.length;i+=4){
  if(data[i+3]<150){data[i+3]=0;continue;}
  let best=PALETTE[0],score=Infinity;
  for(const color of PALETTE){const d=(data[i]-color[0])**2+(data[i+1]-color[1])**2+(data[i+2]-color[2])**2;if(d<score){best=color;score=d;}}
  data[i]=best[0];data[i+1]=best[1];data[i+2]=best[2];data[i+3]=255;
 }
 c.putImageData(image,0,0);
}

function spriteTexture(scene,key,name,w,h,rect=bounds[name]){
 if(scene.textures.exists(key))return;
 const source=scene.textures.get(`polish-source-${name}`).getSourceImage(),t=scene.textures.createCanvas(key,w,h),c=t.context;
 c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
 c.drawImage(source,rect.x,rect.y,rect.w,rect.h,0,0,w,h);pixelPalette(c,w,h);t.refresh();
}

function animatedTextures(scene,name,prefix,w,h,anchorX,anchorY){
 const frames=bounds[name].frames,source=scene.textures.get(`polish-source-${name}`).getSourceImage();
 const left=Math.max(...frames.map(f=>f.anchorX-f.x)),right=Math.max(...frames.map(f=>f.x+f.w-f.anchorX));
 const top=Math.max(...frames.map(f=>f.anchorY-f.y)),bottom=Math.max(...frames.map(f=>f.y+f.h-f.anchorY));
 const scale=Math.min((anchorX-2)/left,(w-anchorX-2)/right,(anchorY-2)/top,bottom>0?(h-anchorY)/bottom:Infinity);
 frames.forEach((frame,i)=>{
  const t=scene.textures.createCanvas(`${prefix}-${i}`,w,h),c=t.context;
  c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
  c.drawImage(source,frame.x,frame.y,frame.w,frame.h,anchorX+(frame.x-frame.anchorX)*scale,anchorY+(frame.y-frame.anchorY)*scale,frame.w*scale,frame.h*scale);
  pixelPalette(c,w,h);
  if(name==='aura'){
   const image=c.getImageData(0,0,w,h);for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(Math.hypot(x-anchorX,y-anchorY)<25)image.data[(y*w+x)*4+3]=0;c.putImageData(image,0,0);
  }
  t.refresh();
 });
}

function variantTexture(scene,key,sourceKey,replacements={}){
 const source=scene.textures.get(sourceKey).getSourceImage(),t=scene.textures.createCanvas(key,source.width,source.height),c=t.context;
 c.drawImage(source,0,0);const image=c.getImageData(0,0,source.width,source.height),d=image.data;
 for(let i=0;i<d.length;i+=4){const to=replacements[[d[i],d[i+1],d[i+2]].join(',')];if(to){d[i]=to[0];d[i+1]=to[1];d[i+2]=to[2];}}
 c.putImageData(image,0,0);t.refresh();
}

function colorMap(from,to){return Object.fromEntries(from.map((a,i)=>[PALETTE[a].join(','),PALETTE[to[i]]]));}

export function preparePropSources(scene){
 animatedTextures(scene,'spring','polish-spring',48,48,24,46);
 animatedTextures(scene,'checkpoint','polish-checkpoint',64,88,14,86);
 animatedTextures(scene,'drone','v6-drone',56,48,28,24);
 for(const [name,prefix,w,h,x,y]of [
  ['crab','v6-crab',48,40,24,38],['relic','v6-relic',34,40,17,20],
  ['cache','v6-cache',42,44,21,44],['shield','v6-shield',42,44,21,44],
  ['boost','polish-boost',88,24,44,22],['sign','polish-sign',40,44,20,42],
  ['finish','polish-finish',64,104,14,102],['aura','polish-aura',76,76,38,38],
  // Extra room behind the body preserves the paille-en-queue's two long tail feathers.
  ['bird','polish-bird',48,36,34,24],['guest','polish-guest',24,40,12,40],
 ])animatedTextures(scene,name,prefix,w,h,x,y);
 for(let frame=0;frame<4;frame++){
  variantTexture(scene,`polish-hit-${frame}`,`polish-aura-${frame}`,colorMap([19,20,21,22,23,24,25,26,27],[13,14,15,16,17,13,15,16,17]));
  for(let person=0;person<3;person++)variantTexture(scene,`guest-${person}-${frame}`,`polish-guest-${frame}`,person===0?{}:colorMap([19,20,21,22,23,24,25,26,27],person===1?[6,7,8,9,11,7,8,10,11]:[19,20,21,22,23,19,20,22,23]));
 }
 for(let frame=0;frame<8;frame++)variantTexture(scene,`bird-${frame}`,`polish-bird-${frame%4}`);
 const gate=bounds.lowgate;
 spriteTexture(scene,'polish-gate-cap','lowgate',128,24,{x:gate.x,y:gate.capTop,w:gate.w,h:gate.capBottom-gate.capTop});
 spriteTexture(scene,'polish-gate-feet','lowgate',128,28,{x:gate.x,y:gate.capBottom,w:gate.w,h:gate.y+gate.h-gate.capBottom});
 for(let frame=0;frame<4;frame++){
  const t=scene.textures.createCanvas(`polish-gate-cap-${frame}`,128,24),c=t.context;
  c.drawImage(scene.textures.get('polish-gate-cap').getSourceImage(),0,0);
  for(const [i,x]of [20,64,108].entries())if((frame+i)%4===0){c.fillStyle='#fff1ba';c.fillRect(x,11,2,1);}
  t.refresh();
 }
 spriteTexture(scene,'polish-coin','coin',32,32);
 const t=scene.textures.createCanvas('token',22,24),c=t.context;
 c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
 c.drawImage(scene.textures.get('polish-coin').getSourceImage(),1,2,20,20);pixelPalette(c,22,24);t.refresh();
 for(let frame=0;frame<8;frame++){
  const spin=scene.textures.createCanvas(`token-spin-${frame}`,22,24),ctx=spin.context,width=Math.max(4,Math.round(22*Math.abs(Math.cos(frame*Math.PI/8))));
  ctx.imageSmoothingEnabled=false;ctx.drawImage(t.getSourceImage(),0,0,22,24,Math.floor((22-width)/2),0,width,24);spin.refresh();
 }
}

