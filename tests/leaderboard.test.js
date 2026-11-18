import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,rm,readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createLeaderboard,MIN_RUN_MS} from '../server/leaderboard.js';

test('shared times persist, sort, rank ties and retain ranks outside top 10',async t=>{
 await mkdir('.local',{recursive:true});const dir=await mkdtemp(join(process.cwd(),'.local','tangrun-leaderboard-'));t.after(()=>rm(dir,{recursive:true}));
 const file=join(dir,'scores.json'),board=createLeaderboard(file,{minMs:1});
 const sessions=Array.from({length:12},()=>board.start());
 for(let i=0;i<10;i++){await board.finish(sessions[i].id,100+i);await board.name(sessions[i].id,`Joueur_${i}`);}
 const result=await board.finish(sessions[11].id,111);
 assert.equal(result.rank,11);assert.equal(result.top.length,10);assert.equal(result.total,10);
 await assert.rejects(board.name(sessions[11].id,'DERNIER'),{status:409});
 await board.name(sessions[0].id,'Tangue_974');
 assert.equal((await createLeaderboard(file).list()).top[0].name,'Tangue_974');
 assert.equal((await board.finish(sessions[0].id,100)).total,10,'finish retries never duplicate a run');
 const tie=board.start();assert.equal((await board.finish(tie.id,100)).rank,2,'older equal time stays ahead');

});

test('rejects fabricated runs, invalid times and unsafe names',async t=>{
 await mkdir('.local',{recursive:true});const dir=await mkdtemp(join(process.cwd(),'.local','tangrun-leaderboard-'));t.after(()=>rm(dir,{recursive:true}));
 const board=createLeaderboard(join(dir,'scores.json'),{minMs:1});
 await assert.rejects(board.finish('unknown',100),{status:404});
 const {id}=board.start();
 for(const time of [-1,0,1.5,Infinity,5000])await assert.rejects(board.finish(id,time),{status:400});
 await board.finish(id,120);
 for(const name of ['','A','<script>','a'.repeat(13)])await assert.rejects(board.name(id,name),{status:400});
 const result=await board.name(id,'  Réunion 974 ');assert.equal(result.top[0].name,'Réunion 974');
});

test('rejects times faster than the physical minimum of the crossing',async t=>{
 await mkdir('.local',{recursive:true});const dir=await mkdtemp(join(process.cwd(),'.local','tangrun-leaderboard-'));t.after(()=>rm(dir,{recursive:true}));
 let clock=1_000_000;const board=createLeaderboard(join(dir,'scores.json'),{now:()=>clock});
 const {id}=board.start();clock+=120000;
 for(const time of [1,5000,MIN_RUN_MS-1])await assert.rejects(board.finish(id,time),{status:400});
 assert.equal((await board.finish(id,MIN_RUN_MS)).rank,1);
});

test('the minimum time never exceeds what the course physically allows',async()=>{
 const {GOAL_X,MAX_SPEED}=await import('../src/level.js');
 assert.ok(MIN_RUN_MS<=(GOAL_X-80)/MAX_SPEED*1000,'un run à vitesse maximale doit rester accepté');
});

test('anonymous finishes stay private until a valid nickname is saved',async t=>{
 await mkdir('.local',{recursive:true});const dir=await mkdtemp(join(process.cwd(),'.local','tangrun-leaderboard-'));t.after(()=>rm(dir,{recursive:true}));
 const file=join(dir,'scores.json'),board=createLeaderboard(file,{minMs:1});
 const {id}=board.start();const pending=await board.finish(id,100);
 assert.equal(pending.rank,1);assert.deepEqual(pending.top,[]);assert.equal(pending.total,0);
 assert.deepEqual(JSON.parse(await readFile(file,'utf8')),[]);
 await assert.rejects(board.name(id,' anonyme '),{status:400});
 assert.equal((await board.list()).total,0);
 await board.finish(id,150);
 const saved=await board.name(id,'Tangue');assert.equal(saved.top[0].ms,100);assert.equal(saved.total,1);
 assert.equal((await createLeaderboard(file).list()).top[0].name,'Tangue');
});
test('legacy anonymous entries do not occupy leaderboard places',async t=>{
 await mkdir('.local',{recursive:true});const dir=await mkdtemp(join(process.cwd(),'.local','tangrun-leaderboard-'));t.after(()=>rm(dir,{recursive:true}));
 const file=join(dir,'scores.json');
 await writeFile(file,JSON.stringify([{id:'old',name:'ANONYME',ms:50},{id:'named',name:'Tangue',ms:100}]));
 const result=await createLeaderboard(file).list();assert.equal(result.total,1);assert.deepEqual(result.top,[{rank:1,name:'Tangue',ms:100}]);
});
