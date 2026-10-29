import {formatTime} from './level.js';

export function createLeaderboardUI(){
 const $=id=>document.getElementById(id);
 let run=null,lastFinish=null,version=0,atFinish=false;
 const api=async(path,data)=>{
  const response=await fetch(`/api/${path}`,{method:data?'POST':'GET',headers:data?{'Content-Type':'application/json'}:undefined,body:data?JSON.stringify(data):undefined,signal:AbortSignal.timeout(10000)});
  const value=await response.json();if(!response.ok)throw Error(value.error||'Classement indisponible.');return value;
 };
 function render(data){
  $('leaderboard-rows').replaceChildren();
  for(let i=0;i<10;i++){
   const row=data.top[i],tr=document.createElement('tr');
   for(const value of [String(i+1).padStart(2,'0'),row?.name??'—',row?formatTime(row.ms):'— — : — —']){const td=document.createElement('td');td.textContent=value;tr.append(td);}
   $('leaderboard-rows').append(tr);
  }
  $('leaderboard-status').textContent=data.total?'':'À toi de signer le premier chrono.';
  $('leaderboard-status').hidden=!!data.total;
 }
 async function refresh(){try{render(await api('leaderboard'));}catch{$('leaderboard-status').hidden=false;$('leaderboard-status').textContent='Classement indisponible. Réessaie dans un instant.';}}
 function rank(value){$('last-run-rank').hidden=false;$('last-run-rank').textContent=value;}
 $('record-form').addEventListener('submit',async event=>{
  event.preventDefault();if(!lastFinish||!$('record-form').reportValidity())return;
  const current=version,id=lastFinish.id;$('save-record').disabled=true;$('record-message').textContent='Enregistrement…';
  try{
   const result=await api(`runs/${id}/name`,{name:$('record-name').value});
   if(current!==version)return;render(result);$('record-form').hidden=true;rank(`TON DERNIER RUN : ${result.rank===1?'1ER':`${result.rank}E`}`);
  }catch(error){if(current===version)$('record-message').textContent=error.message;}
  finally{if(current===version)$('save-record').disabled=false;}
 });
 render({top:[],total:0});refresh();
 return {
  refresh,
  start(eligible){
   version++;atFinish=false;lastFinish=null;$('record-form').hidden=true;$('record-message').textContent='';$('save-record').disabled=false;
   run=eligible?api('runs',{}).catch(()=>null):null;
  },
  async finish(ms){
   const current=version,pending=run;run=null;if(!pending)return;atFinish=true;
   rank('CLASSEMENT EN COURS…');
   try{
    const session=await pending;if(!session)throw Error('Classement indisponible pour ce run.');
    const result=await api(`runs/${session.id}/finish`,{ms:Math.floor(ms)});if(current!==version)return;
    lastFinish={id:session.id};render(result);rank(`TON DERNIER RUN : ${result.rank===1?'1ER':`${result.rank}E`}`);
    if(result.rank<=10&&atFinish){$('record-form').hidden=false;$('record-name').value='';$('record-name').focus({preventScroll:true});}
   }catch(error){if(current===version)rank(error.message);}
  },
  leaveFinish(){atFinish=false;$('record-form').hidden=true;}
 };
}
