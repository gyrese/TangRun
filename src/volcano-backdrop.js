// Coordinates follow the vents and lava channels in the 1920 × 540 panorama.
const VENTS=[716,1204];
const CHANNEL=[[721,195],[751,199],[776,207],[791,216],[807,226],[802,232],
 [792,236],[824,241],[849,247],[879,253],[910,259],[918,264],[905,269],[921,274]];
const phase=(time,offset)=>((time+offset)%1+1)%1;
let channelLength=0;
const channelSegments=CHANNEL.slice(1).map(([x,y],i)=>{
 const [startX,startY]=CHANNEL[i],dx=x-startX,dy=y-startY;
 const length=Math.hypot(dx,dy),start=channelLength;
 channelLength+=length;
 return{startX,startY,dx,dy,start,length,end:channelLength};
});

function pixelTexture(scene,key,width,height,paint){
 if(scene.textures.exists(key))return;
 const texture=scene.textures.createCanvas(key,width,height);
 paint(texture.context);
 texture.refresh();
}

export function createVolcanoBackdrop(scene){
 for(let variant=0;variant<3;variant++){
  pixelTexture(scene,'volcano-smoke-'+variant,32,24,ctx=>{
   for(let y=0;y<24;y++)for(let x=0;x<32;x++){
    const a=(x-11)**2+(y-14)**2,b=(x-20)**2+(y-10)**2,c=(x-16)**2+(y-7)**2;
    const grain=(x*17+y*23+x*y*3+variant*29)%17;
    if(a>65+grain&&b>78+grain&&c>35+grain)continue;
    const shade=(Math.floor(x/4)*7+Math.floor(y/4)*3+variant)%11;
    ctx.fillStyle=y>16&&shade<5?'#6d4c44':shade<4?'#4c4b54':shade<8?'#42434c':'#383941';
    ctx.fillRect(x,y,1,1);
   }
  });
 }
 pixelTexture(scene,'volcano-lava-light',13,3,ctx=>{
  ctx.fillStyle='#a32f17';ctx.fillRect(0,1,13,1);
  ctx.fillStyle='#d04c20';ctx.fillRect(3,1,8,1);
  ctx.fillStyle='#f38836';ctx.fillRect(6,1,4,1);
 });
 pixelTexture(scene,'volcano-ember',4,4,ctx=>{
  ctx.fillStyle='#e85926';ctx.fillRect(1,0,2,4);ctx.fillRect(0,1,4,2);
  ctx.fillStyle='#ffe0a3';ctx.fillRect(1,1,2,2);
 });
 const image=(key,depth)=>scene.add.image(0,0,key).setScrollFactor(0).setDepth(depth).setVisible(false);
 return VENTS.map(()=>({
  flames:Array.from({length:3},()=>image('volcanic-fire',-25).setOrigin(.5,1)),
  smoke:Array.from({length:10},(_,i)=>image('volcano-smoke-'+i%3,-24)),
  lava:Array.from({length:8},()=>image('volcano-lava-light',-25)),
  embers:Array.from({length:18},()=>image('volcano-ember',-23)),
 }));
}

export function updateVolcanoBackdrop(vents,bg,time,weight){
 // Le fond est aussi mis à l'échelle pour suivre le zoom (fitSpeedBackdrop) :
 // les éléments animés appliquent la même échelle pour rester calés dessus.
 const sx=bg.tileScaleX*bg.scaleX,sy=bg.tileScaleY*bg.scaleY,period=bg.texture.getSourceImage().width;
 const place=(sprite,x,y,scale,alpha)=>{
  // Use the same source-pixel coordinates and wrap as the TileSprite.
  const screenX=phase((x-bg.tilePositionX+64)/period,0)*period-64;
  const visible=weight>.001&&screenX*sx>-64&&screenX*sx<bg.displayWidth+64;
  sprite.setVisible(visible);
  if(visible)sprite.setPosition(bg.x+Math.round(screenX*sx),bg.y+Math.round((y-bg.tilePositionY)*sy))
   .setScale(scale*sx,scale*sy).setAlpha(weight*alpha);
 };
 vents.forEach(({flames,smoke,lava,embers},vent)=>{
  const x=VENTS[vent],clock=time+vent*.77,direction=vent?-1:1;
  flames.forEach((sprite,i)=>{
   const flicker=Math.sin(clock*9+i*2);
   place(sprite,x+(i-1)*12,196,.18+i*.023+flicker*.022,.63+i*.08);
   sprite.setFrame(Math.floor(clock*11+i*3)%8);
  });
  smoke.forEach((sprite,i)=>{
   const age=phase(clock*.24,i/smoke.length);
   const wind=direction*(age*age*48+Math.sin(age*5+i)*10);
   place(sprite,x+wind,183-age*146,.53+age*2.2,Math.sin(age*Math.PI)*.46);
  });
  lava.forEach((sprite,i)=>{
   const progress=phase(clock*.045,i*.137);
   const distance=progress*channelLength;
   const segment=channelSegments.find(part=>distance<part.end);
   const fraction=(distance-segment.start)/segment.length;
   const px=segment.startX+segment.dx*fraction,py=segment.startY+segment.dy*fraction;
   const fade=Math.min(1,progress*10,(1-progress)*10);
   place(sprite,vent?period-px:px,py,.78+i%3*.12,fade*(.6+.18*Math.sin(clock*1.8+i)));
   sprite.setRotation(Math.atan2(segment.dy,direction*segment.dx));
  });
  embers.forEach((sprite,i)=>{
   const age=phase(clock*(.38+i%4*.07),i/embers.length);
   const rise=age*(1-age)*(150+i%7*21);
   place(sprite,x+Math.sin(i*17)*age*76,189-rise+age*9,.38+i%3*.25,(1-age)**1.5);
  });
 });
}
