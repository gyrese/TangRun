import {chromium} from '@playwright/test';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const browserArg=process.argv.indexOf('--browser'),browserPath=browserArg>=0?process.argv[browserArg+1]:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
const html=`<!doctype html><html><body><script type="module">
import Phaser from 'phaser';
import {preloadPropSources,preparePropSources} from '/scripts/prepare-prop-art.js';
new Phaser.Game({type:Phaser.CANVAS,width:32,height:32,audio:{noAudio:true},scene:{
 preload(){preloadPropSources(this);this.load.on('loaderror',file=>window.__atlasError='Missing source: '+file.src);},
 create(){try{
  const before=new Set(this.textures.getTextureKeys());preparePropSources(this);
  const keys=this.textures.getTextureKeys().filter(key=>!before.has(key)&&!key.startsWith('polish-bird-')&&!key.startsWith('polish-guest-')&&key!=='polish-coin'&&key!=='polish-gate-cap');
  const cells=keys.map(key=>({key,image:this.textures.get(key).getSourceImage()})).sort((a,b)=>b.image.height-a.image.height||a.key.localeCompare(b.key));
  const frames={};let x=0,y=0,row=0;
  for(const cell of cells){const w=cell.image.width,h=cell.image.height;if(x+w>1024){x=0;y+=row+2;row=0;}cell.x=x;cell.y=y;frames[cell.key]={frame:{x,y,w,h},rotated:false,trimmed:false,spriteSourceSize:{x:0,y:0,w,h},sourceSize:{w,h}};x+=w+2;row=Math.max(row,h);}
  const c=document.createElement('canvas');c.width=1024;c.height=Math.ceil((y+row)/16)*16;const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;
  for(const cell of cells)ctx.drawImage(cell.image,cell.x,cell.y);
  window.__atlasResult={png:c.toDataURL('image/png').split(',')[1],json:{frames,meta:{image:'atlas.png',size:{w:c.width,h:c.height},scale:'1',generator:'ImageGen; native 32-color pixel-art preparation'}}};
 }catch(error){window.__atlasError=error.stack;}}
}});
</script></body></html>`;
await mkdir(new URL('../.local/',import.meta.url),{recursive:true});
await writeFile(new URL('../.local/prop-art-author.html',import.meta.url),html);
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5185','--strictPort'],{cwd:root,windowsHide:true,stdio:'pipe'});
let browser;
try{
 await new Promise((resolve,reject)=>{server.stdout.on('data',data=>{if(data.toString().includes('Local:'))resolve();});server.once('error',reject);server.once('exit',code=>reject(new Error('Authoring server exited: '+code)));});
 browser=await chromium.launch({executablePath:browserPath||undefined});const page=await browser.newPage();
 await page.goto('http://127.0.0.1:5185/.local/prop-art-author.html');
 await page.waitForFunction(()=>window.__atlasResult||window.__atlasError,{timeout:60000});
 const error=await page.evaluate(()=>window.__atlasError);if(error)throw new Error(error);
 const result=await page.evaluate(()=>window.__atlasResult),out=new URL('../public/assets/pixel-props-v2/',import.meta.url);
 await mkdir(out,{recursive:true});
 await writeFile(new URL('atlas.png',out),Buffer.from(result.png,'base64'));await writeFile(new URL('atlas.json',out),JSON.stringify(result.json,null,2));
 console.log(JSON.stringify({frames:Object.keys(result.json.frames).length,size:result.json.meta.size,output:fileURLToPath(out)}));
}finally{await browser?.close();server.kill();}
