import test from 'node:test';
import assert from 'node:assert/strict';
import {isNearView} from '../src/render-cull.js';

const view={x:1000,y:0,right:1960,bottom:540};
const img=(x,y,w=100,h=100,extra={})=>({type:'Image',x,y,displayWidth:w,displayHeight:h,originX:.5,originY:.5,scrollFactorX:1,scrollFactorY:1,rotation:0,...extra});

test('world objects far from the camera are skipped, nearby ones are kept',()=>{
 assert.equal(isNearView(img(1500,200),view),true,'dans le cadre');
 assert.equal(isNearView(img(930,200),view),true,'déborde à gauche');
 assert.equal(isNearView(img(2050,200),view),true,'dans la marge de droite');
 assert.equal(isNearView(img(400,200),view),false,'loin à gauche');
 assert.equal(isNearView(img(5000,200),view),false,'loin à droite');
 assert.equal(isNearView(img(1500,1500),view),false,'loin en dessous');
});

test('wide, rotated, screen-space and unknown objects are never wrongly hidden',()=>{
 assert.equal(isNearView(img(0,200,4000,50,{originX:0}),view),true,'longue plateforme qui traverse le cadre');
 assert.equal(isNearView(img(830,200,120,40,{rotation:1.2}),view),true,'objet tourné près du bord');
 assert.equal(isNearView(img(9000,200,100,100,{scrollFactorX:0,scrollFactorY:0}),view),true,'fond fixe à l’écran');
 assert.equal(isNearView({type:'Graphics',x:0,y:0,scrollFactorX:1,scrollFactorY:1},view),true,'tracé sans taille connue');
 assert.equal(isNearView(img(9000,200,100,100,{parentContainer:{}}),view),true,'enfant de conteneur');
});
