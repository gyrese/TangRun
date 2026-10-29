// Génère les assets pixel-art du Piton des Neiges (fond + planches de sprites animés).
// Usage : node scripts/generate-snow-assets.mjs  →  public/assets/snow/*.png
import {deflateSync} from 'node:zlib';
import {writeFileSync,mkdirSync} from 'node:fs';

const OUT=new URL('../public/assets/snow/',import.meta.url);
mkdirSync(OUT,{recursive:true});
const TAU=Math.PI*2;

// ---------- Encodeur PNG minimal (RGBA 8 bits) ----------
const CRC=new Uint32Array(256);
for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;CRC[n]=c>>>0;}
const crc32=buf=>{let c=0xffffffff;for(const b of buf)c=CRC[(c^b)&255]^(c>>>8);return(c^0xffffffff)>>>0;};
function chunk(type,data){
 const len=Buffer.alloc(4);len.writeUInt32BE(data.length);
 const body=Buffer.concat([Buffer.from(type,'ascii'),data]),crc=Buffer.alloc(4);crc.writeUInt32BE(crc32(body));
 return Buffer.concat([len,body,crc]);
}
function encodePng(bmp){
 const {w,h,data}=bmp,stride=w*4+1,raw=Buffer.alloc(stride*h),src=Buffer.from(data.buffer);
 for(let y=0;y<h;y++)src.copy(raw,y*stride+1,y*w*4,(y+1)*w*4);
 const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(w,0);ihdr.writeUInt32BE(h,4);ihdr[8]=8;ihdr[9]=6;
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))]);
}

// ---------- Petit raster pixel-art ----------
const colorCache=new Map();
const rgb=c=>{if(!colorCache.has(c))colorCache.set(c,[1,3,5].map(i=>parseInt(c.slice(i,i+2),16)));return colorCache.get(c);};
const BAYER=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
class Bitmap{
 constructor(w,h){this.w=w;this.h=h;this.data=new Uint8ClampedArray(w*h*4);}
 px(x,y,c,a=1){
  x=Math.round(x);y=Math.round(y);if(x<0||y<0||x>=this.w||y>=this.h||a<=0)return;
  const [r,g,b]=rgb(c),i=(y*this.w+x)*4,d=this.data,sa=Math.min(1,a),da=d[i+3]/255,oa=sa+da*(1-sa);
  d[i]=(r*sa+d[i]*da*(1-sa))/oa;d[i+1]=(g*sa+d[i+1]*da*(1-sa))/oa;d[i+2]=(b*sa+d[i+2]*da*(1-sa))/oa;d[i+3]=oa*255;
 }
 rect(x,y,w,h,c,a){for(let j=0;j<h;j++)for(let i=0;i<w;i++)this.px(x+i,y+j,c,a);}
 ellipse(cx,cy,rx,ry,c,a){for(let y=Math.floor(cy-ry);y<=Math.ceil(cy+ry);y++)for(let x=Math.floor(cx-rx);x<=Math.ceil(cx+rx);x++)if(((x-cx)/rx)**2+((y-cy)/ry)**2<=1)this.px(x,y,c,a);}
 disc(cx,cy,r,c,a){this.ellipse(cx,cy,r,r,c,a);}
 line(x0,y0,x1,y1,c,a){const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0),1);for(let i=0;i<=n;i++)this.px(x0+(x1-x0)*i/n,y0+(y1-y0)*i/n,c,a);}
 poly(pts,c,a){
  const ys=pts.map(p=>p[1]);
  for(let y=Math.floor(Math.min(...ys));y<=Math.ceil(Math.max(...ys));y++){
   const sy=y+.5,xs=[];
   for(let i=0;i<pts.length;i++){const [x0,y0]=pts[i],[x1,y1]=pts[(i+1)%pts.length];if((y0<=sy&&y1>sy)||(y1<=sy&&y0>sy))xs.push(x0+(sy-y0)*(x1-x0)/(y1-y0));}
   xs.sort((p,q)=>p-q);for(let k=0;k+1<xs.length;k+=2)for(let x=Math.round(xs[k]);x<Math.round(xs[k+1]);x++)this.px(x,y,c,a);
  }
 }
 blit(src,dx,dy){const d=src.data;for(let y=0;y<src.h;y++)for(let x=0;x<src.w;x++){const i=(y*src.w+x)*4;if(!d[i+3])continue;const hex='#'+[d[i],d[i+1],d[i+2]].map(v=>v.toString(16).padStart(2,'0')).join('');this.px(dx+x,dy+y,hex,d[i+3]/255);}}
}
function sheet(name,fw,fh,frames,draw){
 const s=new Bitmap(fw*frames,fh);
 for(let f=0;f<frames;f++){const b=new Bitmap(fw,fh);draw(b,f);s.blit(b,f*fw,0);}
 writeFileSync(new URL(name,OUT),encodePng(s));console.log(`${name}  ${fw}x${fh} × ${frames}`);
}

// ---------- Fond panoramique (raccord horizontal sans couture) ----------
function background(){
 const W=1536,H=540,b=new Bitmap(W,H);
 const wrapD=(x,c)=>{const d=Math.abs(x-c)%W;return Math.min(d,W-d);};
 const sky=['#132647','#1a335b','#22406d','#2d4f80','#3a6193','#4b75a6','#6189b6','#7aa0c7','#97b8d8','#b6cfe6','#d3e3f1'];
 for(let y=0;y<H;y++){
  const f=Math.min(1,y/340)*(sky.length-1),i=Math.floor(f),fr=f-i;
  for(let x=0;x<W;x++)b.px(x,y,sky[Math.min(sky.length-1,i+(fr*16>BAYER[(y&3)*4+(x&3)]?1:0))]);
 }
 // Soleil d'hiver voilé.
 for(const [r,a]of [[90,.05],[60,.07],[34,.1],[18,.25]])b.disc(1180,140,r,'#fff4dc',a);
 b.disc(1180,140,9,'#fffaf0');
 // Nuages lointains en bandes.
 const cloud=(cx,cy,s)=>{for(const o of [-W,0,W])for(const [dx,dy,rx,ry]of [[0,0,46,11],[-38,5,30,8],[40,4,34,9],[10,-7,26,9]]){
  b.ellipse(cx+o+dx*s,cy+dy*s+3,rx*s,ry*s,'#9cb6d3',.22);b.ellipse(cx+o+dx*s,cy+dy*s,rx*s,ry*s,'#e8f1fa',.34);}};
 for(let k=0;k<9;k++)cloud(k*W/9+((k*97)%60),150+(k*53)%70,.7+(k%3)*.25);
 const layer=(ridge,cap,colors,haze)=>{
  for(let x=0;x<W;x++){
   // Lumière venant de la droite : ombrage tramé progressif, sans bandes dures.
   const top=Math.round(ridge(x)),depth=cap(x),shade=Math.max(0,Math.min(1,.5+(ridge(x+5)-ridge(x-5))/10*2.6));
   for(let y=top;y<H;y++){
    const lit=shade*(1-Math.min(.6,(y-top)/400))>BAYER[(y&3)*4+(x&3)]/16;
    const snow=y<top+depth||(y<top+depth+26&&(x*7919%23)<3&&y<top+depth+((x*31)%26));
    const c=snow?(lit?colors.snowLit:colors.snowShade):(lit?colors.rockLit:colors.rock);
    b.px(x,y,(!snow&&((x+y)&7)===0)?colors.rockShade:c);
   }
   b.px(x,top,colors.edge);
  }
  if(haze)b.rect(0,0,W,H,'#cfe0ef',haze);
 };
 const s=(k,p=0)=>x=>Math.sin(TAU*x/W*k+p);
 // Massif du Piton des Neiges (sommet dominant) et ses crêtes.
 const far=x=>292-28*s(2,1)(x)-18*s(5,.4)(x)-9*s(11,2)(x)-5*s(23)(x)-205*Math.exp(-((wrapD(x,560)/175)**2))-70*Math.exp(-((wrapD(x,1260)/120)**2));
 layer(far,x=>30+12*s(7)(x)+9*s(17,1)(x)+60*Math.exp(-((wrapD(x,560)/150)**2)),
  {rock:'#5e7ba3',rockLit:'#86a3c7',rockShade:'#53709a',snowLit:'#f3f8ff',snowShade:'#c3d5ec',edge:'#ffffff'},.12);
 const mid=x=>378-22*s(3,2.2)(x)-14*s(7,.3)(x)-7*s(16,1)(x)-45*Math.exp(-((wrapD(x,980)/140)**2));
 layer(mid,x=>22+10*s(9,2)(x)+6*s(19)(x),
  {rock:'#3e5880',rockLit:'#5f7ea8',rockShade:'#36507a',snowLit:'#e7effa',snowShade:'#adc3df',edge:'#f6faff'},.1);
 const near=x=>442-16*s(4,.7)(x)-9*s(9,2.5)(x)-5*s(21)(x);
 layer(near,()=>160,{rock:'#b5cae2',rockLit:'#eaf2fb',rockShade:'#b5cae2',snowLit:'#e2edf8',snowShade:'#b8cce3',edge:'#ffffff'},0);
 // Filaos et cryptomérias enneigés sur la crête proche.
 for(let x=6,k=0;x<W;x+=14+((k*37)%26),k++){
  const h=16+((k*53)%20),base=near(x)+4;
  for(const o of [-W,0,W]){
   const cx=x+o;if(cx<-20||cx>W+20)continue;
   for(let t=0;t<3;t++){const yA=base-h+t*h*.28,yB=yA+h*.45,hw=3+t*2+h*.08;b.poly([[cx,yA],[cx+hw,yB],[cx-hw,yB]],'#1d3446');b.line(cx,yA,cx+hw*.8,yB-1,'#e8f1fa');b.px(cx,yA,'#ffffff');}
   b.rect(cx-1,base-3,2,4,'#2a2430');
  }
 }
 // Champ de neige au pied.
 for(let y=490;y<H;y++)for(let x=0;x<W;x++)b.px(x,y,BAYER[(y&3)*4+(x&3)]<(y-490)/4?'#c9dbee':'#dbe7f4',.9);
 writeFileSync(new URL('piton-des-neiges.png',OUT),encodePng(b));console.log(`piton-des-neiges.png  ${W}x${H}`);
}

// ---------- Flocons : 4 types × 4 images de rotation ----------
function flakes(){
 sheet('snowflakes.png',12,12,16,(b,f)=>{
  const type=Math.floor(f/4),frame=f%4,c=5.5;
  if(type===0){b.rect(5,5,2,2,'#ffffff');b.px(4,5,'#dcebff',.5);b.px(7,6,'#dcebff',.5);return;}
  if(type===1){const d=frame%2;b.px(6,6,'#ffffff');for(const [x,y]of d?[[5,5],[7,7],[7,5],[5,7]]:[[6,5],[6,7],[5,6],[7,6]])b.px(x,y,'#e6f2ff');return;}
  const r=type===2?4:5,a0=frame*Math.PI/12;
  for(let k=0;k<6;k++){
   const a=a0+k*TAU/6,ex=c+Math.cos(a)*r,ey=c+Math.sin(a)*r;b.line(c,c,ex,ey,'#ffffff',.95);b.px(ex,ey,'#cfe6ff');
   if(type===3){const mx=c+Math.cos(a)*r*.6,my=c+Math.sin(a)*r*.6;for(const s of [-1,1])b.px(mx+Math.cos(a+s*.9)*1.6,my+Math.sin(a+s*.9)*1.6,'#dcecff');}
  }
  b.px(c,c,'#ffffff');
 });
}

// ---------- Bonhomme de neige sentinelle (4 images) ----------
function snowman(){
 sheet('snowman.png',48,56,4,(b,f)=>{
  const bob=[0,-1,-2,-1][f],ball=(cx,cy,r)=>{
   b.disc(cx,cy,r+1,'#2e3f5c');b.disc(cx,cy,r,'#f4f8ff');
   for(let y=Math.floor(cy-r);y<=cy+r;y++)for(let x=Math.floor(cx-r);x<=cx+r;x++)if((x-cx)**2+(y-cy)**2<=r*r&&(x-cx)*.55+(y-cy)>r*.42)b.px(x,y,'#c4d6ea');
   b.rect(cx-r*.45,cy-r*.55,3,2,'#ffffff');
  };
  b.ellipse(24,54,15,2.5,'#6d87a8',.45);
  const angL=[-2.5,-2.7,-2.4,-2.2][f],angR=[-.5,-.95,-.3,-1.05][f];
  for(const [x,y,a]of [[15,26+bob*.5,angL],[33,26+bob*.5,angR]]){
   const ex=x+Math.cos(a)*12,ey=y+Math.sin(a)*12;b.line(x,y,ex,ey,'#6b4a2e');b.line(x,y+1,ex,ey+1,'#4a3220');
   b.line(ex,ey,ex+Math.cos(a-.7)*4,ey+Math.sin(a-.7)*4,'#6b4a2e');b.line(ex,ey,ex+Math.cos(a+.7)*4,ey+Math.sin(a+.7)*4,'#6b4a2e');
  }
  ball(24,42,13);ball(24,26+bob*.5,10);ball(24,13+bob,8);
  for(const y of [22,28])b.rect(23,y+bob*.5,2,2,'#1c2230');
  const hy=13+bob;
  // Bonnet rouge et pompon.
  b.poly([[15,hy-2],[33,hy-2],[30,hy-8],[24,hy-10],[18,hy-8]],'#c8372f');b.rect(15,hy-3,19,2,'#f2e6d8');b.disc(24,hy-11,2.2,'#ffffff');
  // Yeux fâchés (clignement image 3), sourcils et bouche de charbon.
  if(f===3){b.rect(20,hy+1,3,1,'#1a1a22');b.rect(26,hy+1,3,1,'#1a1a22');}else{b.rect(20,hy,2,2,'#1a1a22');b.rect(27,hy,2,2,'#1a1a22');}
  b.line(19,hy-2,22,hy-1,'#1a1a22');b.line(30,hy-2,27,hy-1,'#1a1a22');
  for(const [x,y]of [[20,hy+5],[22,hy+6],[25,hy+6],[27,hy+5]])b.px(x,y,'#1a1a22');
  b.poly([[24,hy+1.5],[33,hy+3],[24,hy+4]],'#f08a2c');b.line(25,hy+3.5,31,hy+3.3,'#c4621c');
  // Écharpe qui flotte au vent.
  const sy=hy+8;b.rect(16,sy,17,3,'#d8423a');b.rect(16,sy+2,17,1,'#a42c28');
  const tail=[[[17,sy+2],[12,sy+10],[15,sy+11],[19,sy+3]],[[17,sy+2],[11,sy+9],[14,sy+11],[19,sy+3]],[[17,sy+2],[10,sy+8],[13,sy+10],[19,sy+3]],[[17,sy+2],[11,sy+10],[14,sy+11],[19,sy+3]]][f];
  b.poly(tail,'#d8423a');b.line(tail[1][0],tail[1][1],tail[2][0],tail[2][1],'#f2e6d8');
 });
}

// ---------- Tamarin des hauts enneigé qui oscille (4 images) ----------
function pine(){
 sheet('snow-pine.png',64,96,4,(b,f)=>{
  const sway=[0,1,0,-1][f]*1.6,off=y=>sway*((96-y)/96)**1.6,cx=32;
  b.ellipse(32,94,16,2.5,'#7d97b7',.4);
  b.rect(29+off(85),78,6,17,'#4a3426');b.rect(29+off(85),78,2,17,'#634634');
  for(let k=3;k>=0;k--){
   const yA=6+k*17,yB=yA+30,hw=9+k*6.5;
   for(let y=yA;y<=yB;y++){
    const t=(y-yA)/(yB-yA),half=hw*t,o=off(y),notch=y>yB-3&&((y+k)&1);
    for(let x=Math.round(cx-half+o+(notch?2:0));x<=Math.round(cx+half+o-(notch?2:0));x++){
     const edge=x<cx-half+o+2.5||x>cx+half+o-2.5,cap=t<.25;
     b.px(x,y,cap||(edge&&t<.7)?(x>cx+o?'#eef5fc':'#d6e4f2'):(x>cx+o?'#2f6a52':'#1b4034'));
    }
   }
   for(const s of [-1,1])b.disc(cx+s*(hw-2)+off(yB),yB-1,2.2,'#e3edf8');
  }
  b.disc(cx+off(6),6,2,'#ffffff');
  // Quelques paillettes de neige qui tombent des branches.
  for(let i=0;i<4;i++){const y=(20+i*19+f*6)%90,x=12+((i*29+f*3)%40);b.px(x+off(y),y,'#ffffff',.8);}
 });
}

// ---------- Gerbe de neige des glissades (6 images) ----------
function spray(){
 sheet('snow-spray.png',40,24,6,(b,f)=>{
  const t=f*.06+.03,alpha=1-f/6;
  for(let k=0;k<16;k++){
   const vx=-(70+k*14+(k%3)*20),vy=-(70+(k%5)*38),x=37+vx*t,y=22+vy*t+380*t*t,size=f<3&&k%2?2:1;
   b.rect(x,y,size,size,k%3?'#ffffff':'#cfe3f7',alpha*(.7+(k%4)*.1));
  }
 });
}

// ---------- Bouffée de poudreuse (6 images) ----------
function puff(){
 sheet('snow-puff.png',32,32,6,(b,f)=>{
  const r=3+f*2.3,alpha=1-f/6*.9;
  for(let k=0;k<10;k++){const a=k*TAU/10+f*.15,x=16+Math.cos(a)*r,y=20-f+Math.sin(a)*r*.6;b.disc(x,y,Math.max(1,3.2-f*.4),k%2?'#ffffff':'#d9e8f6',alpha);}
  if(f<3)b.disc(16,20-f,3-f,'#ffffff',alpha);
 });
}

// ---------- Paquet de neige qui chute des corniches (4 images) ----------
function chunk4(){
 const blob=[[0,0,6],[5,-3,4],[-5,2,4],[2,5,3.5],[-3,-5,3]];
 sheet('snow-chunk.png',24,24,4,(b,f)=>{
  const a=f*Math.PI/2,rot=([x,y])=>[12+x*Math.cos(a)-y*Math.sin(a),12+x*Math.sin(a)+y*Math.cos(a)];
  for(const [x,y,r]of blob){const [cx,cy]=rot([x,y]);b.disc(cx,cy,r+1,'#8fa9c6');}
  for(const [x,y,r]of blob){const [cx,cy]=rot([x,y]);b.disc(cx,cy,r,'#f2f7fd');b.disc(cx+1,cy+1.5,r*.55,'#c3d6ea');b.px(cx-1,cy-2,'#ffffff');}
 });
}

background();flakes();snowman();pine();spray();puff();chunk4();
