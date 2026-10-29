import {ZONES,groundAt,heightOn} from './level.js';

export function createRavineArt(scene){
 const texture=scene.textures.get('ravine-lava');
 for(let i=0;i<4;i++)texture.add(`body-${i}`,0,0,i*32+16,128,16);
 const art=scene.ravineArt={lava:[],water:[]};
 for(const [left,right]of scene.level.gaps){
  if(left<ZONES[1].x||right>=ZONES[2].x)continue;
  const leftGround=groundAt(scene.level,left-1),rightGround=groundAt(scene.level,right+1);
  const y=Math.max(leftGround?heightOn(leftGround,left-1):450,rightGround?heightOn(rightGround,right+1):450)+65;
  const surface=scene.add.tileSprite(left-8,y,right-left+16,64,'ravine-lava',0).setOrigin(0).setTileScale(2).setDepth(1);
  const body=scene.add.image(left-8,y+64,'ravine-lava','body-0').setOrigin(0).setDisplaySize(right-left+16,1700-y-64).setTint(0x923c34).setDepth(1);
  art.lava.push({left,right,y,surface,body});
 }
 // A single tall fall follows the first deep Mafate ravine, behind its paths.
 const gap=scene.level.gaps.find(([a,b])=>a>ZONES[2].x&&b<ZONES[3].x);
 if(gap){
  const x=(gap[0]+gap[1])/2,top=-180,height=1900;
  // Preserve the water's native pixels instead of elongating a short sprite.
  const source=scene.textures.get('water-flow').getSourceImage();
  for(let i=0;i<8;i++){
   const t=scene.textures.createCanvas(`ravine-stream-${i}`,48,192),c=t.context;c.imageSmoothingEnabled=false;
   c.drawImage(source,i*128+40,45,48,96,0,0,48,96);
   c.save();c.translate(0,192);c.scale(1,-1);c.drawImage(source,i*128+40,45,48,96,0,0,48,96);c.restore();t.refresh();
   const splash=scene.textures.createCanvas(`ravine-splash-${i}`,40,12),sc=splash.context;
   // Broken foam at the contact point, without the source sprite's oval pool.
   for(let n=0;n<26;n++){
    const px=(n*17+i*7)%38,py=6+(n*13+i*3)%5;
    sc.fillStyle=n%3===0?'#d1e8da':n%3===1?'#80bcb8':'#53969e';
    sc.globalAlpha=.45+(n%3)*.15;sc.fillRect(px,py,n%4===0?3:2,1);
   }
   splash.refresh();
  }
  const sprite=scene.add.tileSprite(x,top,64,height,'ravine-stream-0').setOrigin(.5,0).setTileScale(4/3).setDepth(1).setTint(0xb6d9ce).setAlpha(.72);
  const impacts=[];
  for(const p of scene.level.platforms.filter(p=>p.rail&&p.x<x+32&&p.x+p.w>x-32)){
   const hitX=(Math.max(p.x,x-32)+Math.min(p.x+p.w,x+32))/2,hitY=heightOn(p,hitX);
   const foam=scene.add.image(hitX,hitY+1,'ravine-splash-0').setOrigin(.5,1).setAlpha(.8).setDepth(7);
   const drops=Array.from({length:8},(_,i)=>scene.add.rectangle(hitX,hitY,1,i%3===0?2:1,i%2?0xc8f2ed:0x78bfc7,.85).setDepth(7));
   impacts.push({x:hitX,y:hitY,foam,drops});
  }
  art.water.push({x,top,height,sprite,impacts});
 }
}

export function updateRavineArt(scene,reduced){
 const art=scene.ravineArt;if(!art)return;
 const time=reduced?0:scene.visualClock/1000,camera=scene.cameras.main;
 for(const lava of art.lava){
  const visible=lava.right>camera.scrollX-100&&lava.left<camera.scrollX+scene.scale.width+100;
  const frame=Math.floor(time*6)%4;
  lava.surface.setVisible(visible).setFrame(frame);lava.body.setVisible(visible).setFrame(`body-${frame}`);
  lava.surface.tilePositionX=time*5;
 }
 for(const fall of art.water){
  const visible=Math.abs(fall.x-camera.midPoint.x)<scene.scale.width;
  fall.sprite.setVisible(visible).setTexture(`ravine-stream-${Math.floor(time*10)%8}`);fall.sprite.tilePositionY=-time*50;
  for(const hit of fall.impacts){
   hit.foam.setVisible(visible).setTexture(`ravine-splash-${Math.floor(time*12)%8}`);
   hit.drops.forEach((drop,i)=>{
    const age=(time*1.8+i/8)%1,side=i%2?1:-1;
    drop.setVisible(visible&&!reduced).setPosition(hit.x+side*(3+age*(10+i%4*3)),hit.y-2-42*age+47*age*age).setAlpha((1-age)*.7);
   });
  }
 }
}

export function touchesLava(scene){
 return scene.ravineArt?.lava.some(l=>scene.runner.x>l.left&&scene.runner.x<l.right&&scene.runner.feet>=l.y+14)??false;
}
