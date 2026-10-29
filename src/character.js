// Keep the original cat selectable without replacing any of its assets.
export const CHARACTERS = {
 cat: {run:'/assets/mascot-run-v1.png',extras:'/assets/animation/cat-sheet.png'},
 'tangue-v1': {run:'/assets/tangue/run-v1.png',extras:'/assets/tangue/extras-v1.png'},
 'tangue-v2': {run:'/assets/tangue/run-v2.png',extras:'/assets/tangue/extras-v2.png',runCycle:'/assets/tangue/run-cycle-v3.png',runFrames:8},
 'tangue-pop-v4': {run:'/assets/tangue/run-pop-v4.png',extras:'/assets/tangue/extras-pop-v4.png',runCycle:'/assets/tangue/run-cycle-pop-v4.png',runFrames:8},
 tangue: {run:'/assets/tangue/run-pop-v4.png',extras:'/assets/tangue/extras-pop-v4.png',runCycle:'/assets/tangue/run-cycle-pop-v5.png',runFrames:16,runBaseline:62},
};
const requested = new URLSearchParams(globalThis.location?.search ?? '').get('perso');
export const character = CHARACTERS[requested] ?? CHARACTERS.tangue;
