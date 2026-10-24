import test from 'node:test';
import assert from 'node:assert/strict';
import {advanceMascotCycle} from '../src/mascot-animation.js';

test('accelerating and braking preserve the current stride instead of resampling the whole clock',()=>{
 const runner={grounded:true,sliding:false,vx:100};
 let cycle=advanceMascotCycle(null,runner,60000);
 cycle=advanceMascotCycle(cycle,runner,60020);
 for(const speed of [250,600,120,30]){
  const phase=cycle.phase;
  runner.vx=speed;
  cycle=advanceMascotCycle(cycle,runner,cycle.time);
  assert.equal(cycle.phase,phase,'speed changes alone cannot change the displayed pose');
  const next=advanceMascotCycle(cycle,runner,cycle.time+16);
  assert.ok((next.phase-phase+4)%4<=18*.016+1e-9);
  cycle=next;
 }
});

test('idle, jumps and a new runner reset the stride, and rolling advances continuously',()=>{
 const runner={grounded:true,sliding:false,vx:240};
 let cycle=advanceMascotCycle(null,runner,0);
 cycle=advanceMascotCycle(cycle,runner,60);
 runner.grounded=false;
 cycle=advanceMascotCycle(cycle,runner,120);
 assert.equal(cycle.phase,0);
 runner.grounded=true;runner.sliding=true;
 cycle=advanceMascotCycle(cycle,runner,140);
 assert.equal(cycle.phase,0);
 cycle=advanceMascotCycle(cycle,runner,160);
 assert.ok(cycle.phase>0);
 const phase=cycle.phase;runner.vx=800;
 assert.equal(advanceMascotCycle(cycle,runner,160).phase,phase);
 assert.equal(advanceMascotCycle(cycle,{...runner},200).phase,0);
 runner.sliding=false;runner.vx=0;
 assert.equal(advanceMascotCycle(cycle,runner,200).phase,0);
});
