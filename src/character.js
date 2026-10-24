// Keep the original cat selectable without replacing any of its assets.
export const CHARACTERS = {
 cat: {run:'/assets/mascot-run-v1.png',extras:'/assets/animation/cat-sheet.png'},
 'tangue-v1': {run:'/assets/tangue/run-v1.png',extras:'/assets/tangue/extras-v1.png'},
 tangue: {run:'/assets/tangue/run-v2.png',extras:'/assets/tangue/extras-v2.png'},
};
const requested = new URLSearchParams(globalThis.location?.search ?? '').get('perso');
export const character = CHARACTERS[requested] ?? CHARACTERS.tangue;
