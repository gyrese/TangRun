import {ROLL_DIAMETER} from './runner-body.js';
// Use opaque sprite pixels as the contact point, excluding sheet padding.
export function frameBounds(rgba,width,height){
 let top=height,bottom=0;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(rgba[(y*width+x)*4+3]>32){top=Math.min(top,y);bottom=Math.max(bottom,y+1);}
 return bottom?{top,bottom}:{top:0,bottom:height};
}
export function contactPose(runner,bounds,frameHeight=64){
 // The contact inset rotates with the loop, including on its ceiling.
 const rotation=runner.grounded||runner.loop?runner.angle:0;
 return{x:runner.x-(runner.loop?Math.sin(rotation):0),y:runner.feet+(runner.loop?Math.cos(rotation):1),originY:bounds.bottom/frameHeight,
  scale:runner.sliding||runner.loop?ROLL_DIAMETER/Math.max(1,bounds.bottom-bounds.top):1,
  rotation};
}
