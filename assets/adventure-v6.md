# La traversée de La Réunion — V6

Trois actes jouables séparément ou en traversée continue, neuf séquences nommées,
six routes hautes/intermédiaires, deux loopings, trois plateformes mobiles et
quinze points de reprise. Le parcours principal reste récupérable après une chute.

## Direction réunionnaise

Les nouveaux décors représentent la lave cordée du Piton de la Fournaise,
le tamarin des Hauts, la fougère arborescente, le vacoa, la case créole avec
lambrequins et une embarcation de pêche du littoral. Ils prolongent les fonds
volcaniques, remparts de Mafate et panorama côtier existants. La traversée est
une composition de jeu, pas une reconstitution géographique à l'échelle.

Références locales consultées :
- [Tamarinaie — Parc national](https://www.reunion-parcnational.fr/fr/des-decouvertes/la-reunion-une-ile-de-nature/le-grand-ouest-la-lumiere/la-tamarinaie-entre-ombres-et)
- [Cases créoles — Parc national](https://www.reunion-parcnational.fr/en/node/6637)
- [Vacoa — Comité réunionnais du tourisme](https://www.reunion.fr/decouvrez/gastronomie/produits-locaux/le-vacoa/)
- [Mafate — Office de tourisme de l'Ouest](https://www.ouest-lareunion.com/mafate)

Planche produite avec l'outil ImageGen intégré : `assets/source/reunion-v6.png`.
Prompt : `assets/prompt-reunion-v6.txt`. Les six exports et leurs dimensions
sont recensés dans `assets/manifest-v6.json`. Reproduction des exports :
`python scripts/prepare-adventure.py`. Les premières pistes fantaisie ne sont
pas chargées par le jeu.

## Parcours

| Acte | Séquences | Choix et récompenses |
| --- | --- | --- |
| Volcan | Coulée ardente, orgues de basalte, terrasses de lave | Boucle d'apprentissage, ressort vers la corniche, escalier de lave bonus |
| Mafate | Canopée, cirque suspendu, cascade des tamarins | Ponts hauts, sentinelles, appui mobile et terrasses latérales |
| Saint-Gilles | Boucle du lagon, toits, dernière ligne droite | Grande boucle, promenade haute, sprint final vers le bar |

18 sentinelles (crabes mécaniques et drones), huit réserves/boucliers, neuf
emblèmes (trois par acte), trois évents temporisés sur des routes facultatives.
Les évents préviennent pendant 0,9 seconde avant de s'activer. Les sentinelles
se détruisent en roulant ou par un saut descendant, qui déclenche un rebond.
Ces éléments mécaniques sont des conventions de gameplay, pas des animaux locaux.

Un impact consomme d'abord le bouclier, sinon disperse jusqu'à vingt éclats
récupérables. Sans éclat, retour au dernier drapeau. L'invulnérabilité de 2,2 s
empêche les dégâts en chaîne. Une reprise conserve les emblèmes déjà acquis ;
rejouer réinitialise tous les objets. Le score récompense les sentinelles et
les emblèmes ; le bilan affiche un rang, les découvertes et les reprises.
Les records V6 sont indépendants des records V5.

## Vérification

`npm test` : physique, sauts, parcours/reprises, attaques, dommages, protection,
objets à usage unique et traversée avec les rencontres.

`npm run build` puis `node scripts/verify-adventure.mjs` : Chromium charge la
version compilée depuis le disque avec interception des requêtes, sans serveur
HTTP. Vérifie les assets, les trois actes, la pause, la fin, le redémarrage et
les dimensions mobile/bureau. Captures dans `.local/review-v6/`.

Les tests de parcours sont des simulations et les vues navigateur des contrôles
techniques ; un essai humain reste nécessaire pour affiner difficulté et rythme.
