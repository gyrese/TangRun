// Texture only the visible surface band; deep underground uses solid geometry.
export function terrainTextureLayout(p){
 const top=Math.floor(Math.min(p.y,p.y2)),bottom=1120;
 const height=Math.min(bottom-top,Math.ceil(Math.max(p.y,p.y2)-top)+540);
 return{top,bottom,height,width:Math.ceil(p.w)+37};
}
