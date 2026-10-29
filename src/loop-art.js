// Both rock assets share this opening. The physics radius describes the inner
// running surface, not the outer bounds of the illustration.
export const LOOP_ART={width:704,height:560,cx:352,cy:280,radius:178};

export function prepareLoopArt(scene,key){
 const normalized=`${key}-surface`;
 if(scene.textures.exists(normalized))return normalized;
 const source=scene.textures.get(key).getSourceImage();
 const {width,height,cx,cy,radius}=LOOP_ART;
 const texture=scene.textures.createCanvas(normalized,width,height),c=texture.context;
 c.imageSmoothingEnabled=false;
 // Extend the rock under the irregular illustrated edge, then cut a precise
 // circular opening. This keeps every angle on the same visible contact surface.
 const rock=document.createElement('canvas');rock.width=48;rock.height=48;
 rock.getContext('2d').drawImage(source,280,48,48,48,0,0,48,48);
 c.fillStyle='#34414b';
 c.beginPath();c.arc(cx,cy,radius+32,0,Math.PI*2);c.fill();
 c.fillStyle=c.createPattern(rock,'repeat');c.fill();
 const sx=radius/174,sy=radius/178;
 c.drawImage(source,cx-337*sx,cy-280*sy,source.width*sx,source.height*sy);
 c.globalCompositeOperation='destination-out';
 c.fillStyle='#000';
 c.beginPath();c.arc(cx,cy,radius,0,Math.PI*2);c.fill();
 c.globalCompositeOperation='source-over';texture.refresh();
 return normalized;
}

export function loopArtPose(loop){
 return{x:loop.x,y:loop.baseY-loop.radius,originX:LOOP_ART.cx/LOOP_ART.width,
  originY:LOOP_ART.cy/LOOP_ART.height,scale:loop.radius/LOOP_ART.radius};
}
