import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {createLeaderboard} from '../server/leaderboard.js';

test('shared times persist, sort, rank ties and retain ranks outside top 10',async t=>{
 await mkdir('.local',{recursive:true});const dir=await mkdtemp(join(process.cwd(),'.local','tangrun-leaderboard-'));t.after(()=>rm(dir,{recursive:true}));
 const file=join(dir,'scores.json'),board=createLeaderboard(file);
 const sessions=Array.from({length:12},()=>board.start());
 const results=await Promise.all(sessions.map(({id},i)=>board.finish(id,100+i)));
 assert.equal(results[11].rank,12);assert.equal(results[11].top.length,10);
 await assert.rejects(board.name(sessions[11].id,'DERNIER'),{status:409});
 await board.name(sessions[0].id,'Tangue_974');
 assert.equal((await createLeaderboard(file).list()).top[0].name,'Tangue_974');
 assert.equal((await board.finish(sessions[0].id,100)).total,12,'finish retries never duplicate a run');
 const tie=board.start();assert.equal((await board.finish(tie.id,100)).rank,2,'older equal time stays ahead');
});

test('rejects fabricated runs, invalid times and unsafe names',async t=>{
 await mkdir('.local',{recursive:true});const dir=await mkdtemp(join(process.cwd(),'.local','tangrun-leaderboard-'));t.after(()=>rm(dir,{recursive:true}));
 const board=createLeaderboard(join(dir,'scores.json'));
 await assert.rejects(board.finish('unknown',100),{status:404});
 const {id}=board.start();
 for(const time of [-1,0,1.5,Infinity,5000])await assert.rejects(board.finish(id,time),{status:400});
 await board.finish(id,120);
 for(const name of ['','A','<script>','a'.repeat(13)])await assert.rejects(board.name(id,name),{status:400});
 const result=await board.name(id,'  Réunion 974 ');assert.equal(result.top[0].name,'Réunion 974');
});
