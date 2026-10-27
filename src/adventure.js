export function createAdventureState(){return{time:0,shield:false,invincible:0,score:0,hits:0,combo:0,defeated:new Set(),relics:new Set(),opened:new Set(),scatter:[]};}
export function enemyPosition(enemy,time){
 const offset=Math.sin(time*1.5+enemy.phase)*enemy.range;
 let y=enemy.y;
 if(enemy.kind==='drone')y+=-65+Math.sin(time*2+enemy.phase)*24;
 else if(enemy.ground&&enemy.range>0)y=enemy.ground[1]+(enemy.ground[offset<0?0:2]-enemy.ground[1])*Math.abs(offset)/enemy.range;
 return{x:enemy.x+offset,y};
}
export function ventPhase(vent,time){const phase=(time+vent.phase)%4;return phase<2?'idle':phase<2.9?'warning':'active';}
export function stepAdventure(state,p,adventure,dt,bank){
 state.time+=dt;state.invincible=Math.max(0,state.invincible-dt);
 const events=[];let balance=bank;
 const overlaps=(x,y,w=28,h=30)=>Math.abs(p.x-x)<w&&Math.abs(p.feet-20-y)<h;
 const damage=()=>{
  if(state.invincible>0||p.loop)return;
  state.hits++;state.combo=0;state.invincible=2.2;
  if(state.shield){state.shield=false;events.push({type:'shield-broken'});return;}
  if(balance>0){
   const lost=Math.min(balance,20);balance-=lost;
   for(let i=0;i<lost;i++){const angle=Math.PI*(.15+.7*i/Math.max(1,lost-1));state.scatter.push({x:p.x,y:p.feet-25,vx:Math.cos(angle)*190,vy:-Math.sin(angle)*310,age:0});}
   events.push({type:'hurt',lost});
  }else events.push({type:'respawn'});
 };
 for(const enemy of adventure.enemies){
  if(state.defeated.has(enemy.id))continue;
  const pos=enemyPosition(enemy,state.time);
  if(!overlaps(pos.x,pos.y))continue;
  const stomp=!p.grounded&&p.vy>0&&p.feet<pos.y+23;
  if(p.rolling||p.sliding&&Math.abs(p.vx)>130||stomp){
   state.defeated.add(enemy.id);state.combo++;state.score+=100*Math.min(5,state.combo);
   if(stomp){p.vy=-420;p.grounded=false;p.surfaceId=null;p.coyote=0;}
   events.push({type:'defeat',x:pos.x,y:pos.y});
  }else damage();
 }
 for(const vent of adventure.vents)if(ventPhase(vent,state.time)==='active'&&overlaps(vent.x,vent.y-35,25,45))damage();
 for(const monitor of adventure.monitors)if(!state.opened.has(monitor.id)&&overlaps(monitor.x,monitor.y,30,32)){
  state.opened.add(monitor.id);if(monitor.type==='shield')state.shield=true;else balance+=10;
  state.score+=50;events.push({type:monitor.type});
 }
 for(const relic of adventure.relics)if(!state.relics.has(relic.id)&&overlaps(relic.x,relic.y,27,32)){
  state.relics.add(relic.id);state.score+=1000;events.push({type:'relic'});
 }
 for(const shard of state.scatter){
  shard.age+=dt;shard.vy+=650*dt;shard.x+=shard.vx*dt;shard.y+=shard.vy*dt;
  if(shard.age>.45&&overlaps(shard.x,shard.y,22,28)){balance++;shard.age=5;}
 }
 state.scatter=state.scatter.filter(s=>s.age<4);
 return{balance,events};
}
export function adventureRank({score,hits},falls,seconds,relicCount){
 const total=score+Math.max(0,12000-Math.round(seconds*80))-hits*150-falls*500;
 return{total:Math.max(0,total),rank:relicCount>=3&&hits===0&&falls===0?'S':total>=10000?'A':total>=6000?'B':'C'};
}
