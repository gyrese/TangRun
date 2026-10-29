if(location.pathname.replace(/\/+$/,'')==='/editeur'){
  import('./editor.js');
}else{
  import('./main.js');
}
