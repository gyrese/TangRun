if(location.pathname.startsWith('/admin')||new URLSearchParams(location.search).has('admin')){
  import('./editor.js');
}else{
  import('./main.js');
  const link=document.createElement('a');
  link.href='/?admin';link.textContent='ADMIN · Éditeur de niveaux';
  if(new URLSearchParams(location.search).get('custom')==='1'){link.textContent='RETOUR À L’ÉDITEUR';const spawn=Number(new URLSearchParams(location.search).get('spawn'));if(Number.isFinite(spawn)&&spawn>0)link.href=`/?admin&x=${Math.max(0,spawn-200)}`;}
  link.className='admin-link';
  document.body.append(link);
}
