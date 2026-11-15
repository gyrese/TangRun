// Fiche du bar affichée à l'arrivée. Tout ce qui est commercial se règle ici.
export const VENUE={
 name:'Les Toiles Noires',
 tagline:'Geek bar & pop culture',
 address:'85 rue du Général De Gaulle · Saint-Gilles-les-Bains',
 phone:'0262 70 37 55',phoneHref:'tel:+262262703755',
 links:{
  maps:'https://www.google.com/maps/dir/?api=1&destination=Les+Toiles+Noires%2C+85+rue+du+G%C3%A9n%C3%A9ral+De+Gaulle%2C+97434+Saint-Gilles-les-Bains',
  reserve:'https://lestoilesnoires.re/#reserver',
  instagram:'https://www.instagram.com/lestoilesnoires974/',
 },
 // Jours : 0 = dimanche … 6 = samedi. Une fermeture après minuit appartient à la soirée d'ouverture.
 hours:[
  {days:[2,3,4],open:'18:00',close:'00:30'},
  {days:[5,6],open:'18:00',close:'02:00'},
 ],
 // Récompense à montrer au comptoir, par exemple 'Montre cet écran au comptoir : …'.
 // Laisser null tant que l'offre n'est pas décidée : le bandeau reste masqué.
 reward:null,
};

const DAYS=['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
const minutes=text=>{const [h,m]=text.split(':').map(Number);return h*60+m;};
const clock=total=>{const h=Math.floor(total/60)%24,m=total%60;return `${h}h${m?String(m).padStart(2,'0'):''}`;};
// Jour et heure à La Réunion, quel que soit le fuseau du joueur.
function reunionNow(date){
 const parts=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'Indian/Reunion',weekday:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(date).map(p=>[p.type,p.value]));
 return{day:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(parts.weekday),minute:Number(parts.hour)*60+Number(parts.minute)};
}
// « OUVERT · jusqu'à 2h » ou « FERMÉ · ouvre mardi à 18h ».
export function venueStatus(date=new Date(),hours=VENUE.hours){
 const WEEK=7*1440,{day,minute}=reunionNow(date),now=day*1440+minute;
 const slots=hours.flatMap(h=>h.days.map(d=>{const start=d*1440+minutes(h.open),length=(minutes(h.close)-minutes(h.open)+1440)%1440||1440;return{start,end:start+length,day:d};}));
 for(const s of slots)for(const shift of [0,-WEEK])if(now>=s.start+shift&&now<s.end+shift)return{open:true,text:`OUVERT · jusqu’à ${clock(s.end%1440)}`};
 let next=null;
 for(const s of slots){const wait=(s.start-now+WEEK)%WEEK;if(!next||wait<next.wait)next={wait,slot:s};}
 if(!next)return{open:false,text:'FERMÉ'};
 const when=next.slot.day===day&&next.slot.start>now?'ce soir':next.slot.day===(day+1)%7?'demain':DAYS[next.slot.day];
 return{open:false,text:`FERMÉ · ouvre ${when} à ${clock(next.slot.start%1440)}`};
}
