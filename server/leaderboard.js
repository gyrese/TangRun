import {randomUUID} from 'node:crypto';
import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import {dirname} from 'node:path';

export function createLeaderboard(file){
 let queue=Promise.resolve();
 const sessions=new Map();
 const load=async()=>{try{return JSON.parse(await readFile(file,'utf8'));}catch(error){if(error.code==='ENOENT')return [];throw error;}};
 const sorted=rows=>[...rows].sort((a,b)=>a.ms-b.ms);
 const snapshot=(rows,id)=>{const ordered=sorted(rows);return {top:ordered.slice(0,10).map(({name,ms},index)=>({rank:index+1,name,ms})),rank:id?ordered.findIndex(row=>row.id===id)+1:null,total:rows.length};};
 const transaction=fn=>{const task=queue.then(async()=>{const rows=await load();const result=await fn(rows);await mkdir(dirname(file),{recursive:true});await writeFile(`${file}.tmp`,JSON.stringify(rows),'utf8');await rename(`${file}.tmp`,file);return result;});queue=task.catch(()=>{});return task;};
 return {
  async list(){await queue;return snapshot(await load());},
  start(){const now=Date.now();for(const [id,session]of sessions)if(now-session.started>86400000)sessions.delete(id);const id=randomUUID();sessions.set(id,{started:now});return {id};},
  finish(id,ms){return transaction(rows=>{
   const session=sessions.get(id);if(!session)throw Object.assign(new Error('Run introuvable ou expiré.'),{status:404});
   const previous=rows.find(row=>row.id===id);if(previous)return snapshot(rows,id);
   if(!Number.isSafeInteger(ms)||ms<=0||ms>Date.now()-session.started+2000)throw Object.assign(new Error('Temps du run invalide.'),{status:400});
   rows.push({id,ms,name:'ANONYME',finishedAt:Date.now()});return snapshot(rows,id);
  });},
  name(id,value){return transaction(rows=>{
   const name=typeof value==='string'?value.trim().normalize('NFC'):'';
   if(!/^[\p{L}\p{N} _.-]{2,12}$/u.test(name))throw Object.assign(new Error('Utilise 2 à 12 caractères : lettres, chiffres, espaces, . _ ou -.'),{status:400});
   const row=rows.find(row=>row.id===id);if(!row||!sessions.has(id))throw Object.assign(new Error('Run introuvable ou expiré.'),{status:404});
   const result=snapshot(rows,id);if(result.rank>10)throw Object.assign(new Error('Ce temps ne fait plus partie du top 10.'),{status:409});
   row.name=name;return snapshot(rows,id);
  });}
 };
}

export function leaderboardMiddleware(board){return async(req,res,next)=>{
 const path=new URL(req.url,'http://localhost').pathname;if(!path.startsWith('/api/'))return next?.();
 const send=(status,value)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(value));};
 try{
  if(req.method==='GET'&&path==='/api/leaderboard')return send(200,await board.list());
  if(req.method==='POST'&&path==='/api/runs')return send(201,board.start());
  const match=path.match(/^\/api\/runs\/([a-f0-9-]{36})\/(finish|name)$/);
  if(req.method!=='POST'||!match)return send(404,{error:'Adresse introuvable.'});
  let body='';for await(const chunk of req){body+=chunk;if(body.length>2048)return send(413,{error:'Requête trop volumineuse.'});}
  let data;try{data=JSON.parse(body);if(!data||typeof data!=='object'||Array.isArray(data))throw Error();}catch{return send(400,{error:'Requête invalide.'});}
  send(200,match[2]==='finish'?await board.finish(match[1],data.ms):await board.name(match[1],data.name));
 }catch(error){if(!error.status)console.error('Leaderboard:',error);send(error.status??500,{error:error.status?error.message:'Le classement est momentanément indisponible.'});}
};}
