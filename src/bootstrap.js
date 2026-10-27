if(location.pathname.startsWith('/admin')||new URLSearchParams(location.search).has('admin')){
  import('./editor.js');
}else{
  import('./main.js');
  const link=document.createElement('a');
  link.href='/?admin';link.textContent='ADMIN · Éditeur de niveaux';
  if(new URLSearchParams(location.search).get('custom')==='1'){link.textContent='RETOUR À L’ÉDITEUR';const spawn=Number(new URLSearchParams(location.search).get('spawn'));if(Number.isFinite(spawn)&&spawn>0)link.href=`/?admin&x=${Math.max(0,spawn-200)}`;}
  link.style.cssText='position:fixed;bottom:8px;right:12px;z-index:10000;color:#fff;background:#182b27;padding:8px 12px;border-radius:6px;font:12px system-ui';
  document.body.append(link);
}
