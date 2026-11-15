import test from 'node:test';
import assert from 'node:assert/strict';
import {VENUE,venueStatus} from '../src/venue.js';

// Heures données à La Réunion (UTC+4).
const at=(iso)=>new Date(`${iso}+04:00`);

test('venue status follows the Réunion opening hours, including after midnight',()=>{
 assert.deepEqual(venueStatus(at('2026-11-13T21:00')),{open:true,text:'OUVERT · jusqu’à 2h'},'vendredi soir');
 assert.deepEqual(venueStatus(at('2026-11-15T01:30')),{open:true,text:'OUVERT · jusqu’à 2h'},'nuit de samedi à dimanche');
 assert.deepEqual(venueStatus(at('2026-11-15T02:00')),{open:false,text:'FERMÉ · ouvre mardi à 18h'},'dimanche après la fermeture');
 assert.deepEqual(venueStatus(at('2026-11-11T00:15')),{open:true,text:'OUVERT · jusqu’à 0h30'},'nuit de mardi à mercredi');
 assert.deepEqual(venueStatus(at('2026-11-12T12:00')),{open:false,text:'FERMÉ · ouvre ce soir à 18h'},'jeudi midi');
 assert.deepEqual(venueStatus(at('2026-11-16T20:00')),{open:false,text:'FERMÉ · ouvre demain à 18h'},'lundi soir');
});

test('venue status uses Réunion time whatever the player time zone',()=>{
 // 16h UTC un vendredi = 20h à La Réunion.
 assert.equal(venueStatus(new Date('2026-11-13T16:00:00Z')).open,true);
});

test('venue links are complete and the reward stays off until it is decided',()=>{
 for(const url of Object.values(VENUE.links))assert.match(url,/^https:\/\//);
 assert.match(VENUE.phoneHref,/^tel:\+262/);
 assert.equal(VENUE.reward,null);
});
