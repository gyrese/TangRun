// Screen-space atmosphere follows the same clock as gameplay: idle stays alive,
// pause stops it, and reduced-motion keeps a stationary atmospheric frame.
const wrap=(value,span)=>(value%span+span)%span;
function cloud(g,x,y,size,color,alpha){
 g.fillStyle(color,alpha);
 for(const [dx,dy,w,h]of [[-42,0,92,7],[-32,-5,65,7],[-14,-10,38,8],[6,-6,45,7],[-48,5,112,4]])
  g.fillRect(Math.round(x+dx*size),Math.round(y+dy*size),Math.ceil(w*size),Math.ceil(h*size));
}

export function createBackdropLife(scene){
 scene.backdropLife={layers:Array.from({length:4},(_,zone)=>({zone,graphics:scene.add.graphics().setScrollFactor(0).setDepth(-25),sample:null}))};
}

export function updateBackdropLife(scene,reduced=false){
 const life=scene.backdropLife;if(!life)return;
 const time=reduced?0:(scene.visualClock||0)/1000,zoom=scene.cameras.main.zoom||1;
 const width=scene.scale.width/zoom,height=scene.scale.height/zoom;
 const left=(scene.scale.width-width)/2,top=(scene.scale.height-height)/2;
 const weights=scene.backgrounds.map((bg,i)=>bg.alpha*scene.backgrounds.slice(i+1).reduce((v,b)=>v*(1-b.alpha),1));
 for(const layer of life.layers){
  const {zone,graphics:g}=layer,bg=scene.backgrounds[zone];
  g.clear().setPosition(left,top).setScale(width/960,height/540).setAlpha(weights[zone]).setVisible(weights[zone]>.001);
  layer.sample={time,weight:weights[zone],drift:wrap(time*(zone===1?13:8),1140)};
  if(!g.visible)continue;
  if(zone===0){
   // Thin drifting banks below the snowy summit; the lagoon stays visible.
   for(let i=0;i<7;i++)cloud(g,wrap(i*181-time*(8+i%3*2),1200)-120,232+(i%3)*42,1.1+i%2*.45,0xd3e4ed,.08+(i%2)*.025);
   for(let i=0;i<18;i++){
    const x=590+wrap(i*19+time*4,230),y=237+(i%4)*3;
    g.fillStyle(0xe4f3ed,.12+.1*Math.sin(time*1.3+i)**2);g.fillRect(Math.round(x),y,3+i%4*2,1);
   }
  }else if(zone===1){
   // Plumes stay attached to the craters in the panorama as it pans.
   for(const crater of [692,1192]){
    const x=wrap(crater-bg.tilePositionX,1920);
    for(let i=0;i<9;i++){
     const age=wrap(time*.13+i/9,1),s=.22+age*.9;
     cloud(g,x+Math.sin(age*5+i)*10+age*35,193-age*138,s,0x5e5960,(1-age)*.24);
    }
    for(let i=0;i<14;i++){
     const age=wrap(time*.35+i/14,1);
     g.fillStyle(i%3?0xff9b47:0xffe3a3,(1-age)*.65);
     g.fillRect(Math.round(x+Math.sin(i*13)*age*70),Math.round(194-age*95),i%4?1:2,2);
    }
    g.fillStyle(0xff873b,.08+Math.sin(time*2.4)**2*.1);g.fillEllipse(x,195,75,14);
   }
   for(let i=0;i<5;i++)cloud(g,wrap(i*257+time*5,1300)-150,270+i%2*55,1.7,0x82878c,.045);
  }else if(zone===2){
   // Distinct near/far banks slip through the remparts at different speeds.
   for(let i=0;i<11;i++){
    const near=i%2,drift=time*(near?10:3);
    cloud(g,wrap(i*137+drift,1240)-140,196+(i%5)*47+Math.sin(time*.17+i)*4,near?1.55:.85,0xd2e4dd,near?.13:.08);
   }
   // Water glints on the distant vertical cliff faces.
   for(let i=0;i<22;i++){
    const age=wrap(time*.3+i*.17,1),x=277+(i%2)*245;
    g.fillStyle(0xc7e8e2,.1*(1-age));g.fillRect(x,Math.round(171+age*95),1,3+i%4);
   }
  }else{
   for(let row=0;row<10;row++)for(let i=0;i<13;i++){
    const x=wrap(i*83+row*31+time*(row%2?7:-5),1080)-60,y=302+row*11+Math.sin(time*1.1+i+row)*2;
    g.fillStyle(row%3?0xafd6d4:0xf4d69b,.12+Math.sin(time*1.5+i+row)**2*.14);
    g.fillRect(Math.round(x),Math.round(y),4+(i%4)*6,1);
   }
   for(let i=0;i<5;i++)cloud(g,wrap(i*241+time*3,1220)-130,118+(i%3)*29,.8,0xd2c6b4,.08);
   // A narrow moving swell at the shoreline, behind the playable terrain.
   for(let i=0;i<6;i++){
    const age=wrap(time*.12+i/6,1);
    g.fillStyle(0xd6eee5,Math.sin(age*Math.PI)*.15);
    g.fillRect(0,Math.round(371+age*22),960,1);
   }
  }
 }
}
