// Diagnostic temporaire de fluidité : ?debug=fps,nowiden,nobackdrop,notouch
export const DEBUG=new Set(typeof location==='undefined'?[]:(new URLSearchParams(location.search).get('debug')||'').split(',').filter(Boolean));
