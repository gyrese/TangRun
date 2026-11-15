// Ne transmet au rendu que les objets du monde proches du cadre de la caméra.
// Phaser prépare sinon chaque image, pièce et décor du parcours (plus de 1 100
// objets) à chaque image, alors qu'une centaine seulement est à l'écran :
// sur téléphone, ce travail limitait le jeu à 10-18 images/s.
const CULLED=new Set(['Image','Sprite','Rectangle','TileSprite','Text']);

// Rectangle englobant approximatif, rotation comprise (on prend le pire cas).
export function isNearView(o,view,margin=96){
 if(!CULLED.has(o.type)||o.scrollFactorX!==1||o.scrollFactorY!==1||o.parentContainer)return true;
 const w=Math.abs(o.displayWidth),h=Math.abs(o.displayHeight);
 if(!Number.isFinite(w)||!Number.isFinite(h))return true;
 let left=o.x-w*o.originX,top=o.y-h*o.originY,right=left+w,bottom=top+h;
 if(o.rotation){const r=Math.hypot(w,h);left=o.x-r;right=o.x+r;top=o.y-r;bottom=o.y+r;}
 return right>=view.x-margin&&left<=view.right+margin&&bottom>=view.y-margin&&top<=view.bottom+margin;
}

export function installRenderCulling(scene){
 const manager=scene.cameras;
 manager.getVisibleChildren=(children,camera)=>children.filter(child=>child.willRender(camera)&&isNearView(child,camera.worldView));
}
