import fs from 'node:fs';
import {buildLevel,STAGES,groundAt,heightOn} from '../src/level.js';
const level=buildLevel(),parts=[];
parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="990" viewBox="0 0 1440 990"><rect width="1440" height="990" fill="#0b171b"/><style>text{font-family:Arial,sans-serif;fill:#efe9d8}.small{font-size:13px;fill:#b4c5bb}</style><text x="50" y="50" font-size="30" font-weight="bold">LA TRAVERSÉE · CARTE DE LEVEL DESIGN V5</text><text x="50" y="80" class="small">Trois niveaux · voies hautes facultatives · apprentissage, précision, maîtrise</text>`);
for(const [i,stage]of STAGES.entries()){
 const top=130+i*260,color='#'+stage.color.toString(16).padStart(6,'0'),left=stage.start-80,right=stage.end+50;
 const X=x=>50+(x-left)/(right-left)*1340,Y=y=>top+50+(y-200)*.29;
 parts.push(`<rect x="30" y="${top-20}" width="1380" height="245" rx="8" fill="#14252a"/><text x="50" y="${top+7}" font-size="20" font-weight="bold">0${i+1} · ${stage.name.toUpperCase()} — ${stage.difficulty}</text><text x="50" y="${top+30}" class="small">${stage.focus}</text>`);
 for(const p of level.terrain){if(p.x+p.w<left||p.x>right)continue;const a=Math.max(left,p.x),b=Math.min(right,p.x+p.w);parts.push(`<path d="M${X(a)},${Y(heightOn(p,a))}L${X(b)},${Y(heightOn(p,b))}V${top+220}H${X(a)}Z" fill="#283e3c"/><path d="M${X(a)},${Y(heightOn(p,a))}L${X(b)},${Y(heightOn(p,b))}" stroke="${color}" stroke-width="3"/>`);}
 for(const p of level.platforms){if(p.x<left||p.x>right)continue;parts.push(`<rect x="${X(p.x)}" y="${Y(p.y)}" width="${Math.max(4,X(p.x+p.w)-X(p.x))}" height="${p.kind==='roof'?4:8}" fill="${p.kind==='roof'?'#9ed6db':'#ed936c'}"/>`);}
 for(const p of level.movers){if(p.x<left||p.x>right)continue;parts.push(`<rect x="${X(p.x)}" y="${Y(p.y)}" width="${X(p.x+p.w)-X(p.x)}" height="4" fill="#e4c67c"/><text x="${X(p.x)}" y="${Y(p.y)-7}" font-size="14">↕</text>`);}
 for(const c of level.checkpoints){if(c.x<left||c.x>right)continue;const x=X(c.x),y=Y(heightOn(groundAt(level,c.x),c.x));parts.push(`<path d="M${x},${y}v-20h12l-12,7" fill="none" stroke="#bdd59d" stroke-width="2"/>`);}
 for(const [a,b]of level.gaps){if(a<left||b>right)continue;parts.push(`<text x="${X(a)-8}" y="${top+211}" class="small">${b-a}px</text>`);}
 for(const l of level.loops){if(l.x<left||l.x>right)continue;parts.push(`<ellipse cx="${X(l.x)}" cy="${Y(l.baseY-l.radius)}" rx="${l.radius/(right-left)*1340}" ry="${l.radius*.29}" fill="none" stroke="#ed936c" stroke-width="3"/>`);}
}
parts.push(`<text x="50" y="950" class="small">CRÈME/CORAIL/VERT : sol régional     BLEU : voie haute     CORAIL : obstacle / looping     VERT : point de reprise     JAUNE : appui mobile</text></svg>`);
fs.writeFileSync(new URL('../assets/course-overview-v5.svg',import.meta.url),parts.join('\n'));
