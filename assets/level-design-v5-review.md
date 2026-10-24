# TangRun — revue du parcours V5

24 octobre 2026 · version de parcours `v5-progression`

Le parcours dispose désormais de trois niveaux jouables séparément et d'une traversée continue. La refonte porte sur l'apprentissage, les reprises, la progression des sauts, le guidage visuel, les décors et la comparaison des temps. La longueur totale et les trois paysages restent le cadre du jeu.

## Diagnostic et corrections

| Constat initial | Conséquence | Correction livrée |
|---|---|---|
| Un seul départ pour 25 200 pixels | Rejouer tout le début pour travailler Mafate ou la côte | Sélection libre des trois niveaux, arrivée propre, rejouer et niveau suivant |
| Cinq ravines identiques de 120 px | Difficulté uniforme, apprentissage peu gradué | Largeurs successives de 80, 100, 120, 135 et 150 px |
| Peu de reprises avant les difficultés | Perte d'une longue portion après une erreur | 15 points de reprise ; départ à l'arrêt vérifié depuis chacun |
| Glissade maintenue sur les montées | Le personnage peut rester prisonnier d'un vallon | Reprise d'appui automatique sous 65 % de la vitesse normale sur une pente montante |
| Accélérateur du lagon attaché à `ground-86` | Risque de disparition de l'effet après une modification du terrain | Surface résolue à sa position réelle après construction du sol |
| Éclats distribués à intervalle constant | Ligne répétitive, conseils de trajectoire insuffisants | Sol moins dense, arcs au-dessus de chaque ravine, exclusion des volumes d'obstacles |
| Première glissade expliquée uniquement par les descentes | Passage sous portique découvert tard | Portique d'apprentissage sur un replat sûr, avant la première ravine |
| Panneaux proches des bords | Lecture difficile en vitesse | Avertissements de ravine placés 300 px avant le bord et repères au sol |
| Décors refusés par les règles de placement | Cabanes, kiosque, banc et petits objets absents | Réimplantation explicite sur des fondations valides ; aucune migration automatique |
| Appuis mobiles semblables à des rochers isolés | Fonction et direction peu lisibles | Plancher de bois, arête claire et indication de mouvement |
| Horizon côtier derrière le terrain | Océan masqué pendant la course | Recadrage du panorama dans le moteur, avec prolongement de l'eau |
| Un seul record et aucun bilan intermédiaire | Entraînement et traversée difficiles à comparer | Quatre espaces de records V5 et temps par région à l'arrivée |

## Les trois niveaux

| Niveau | Départ → arrivée | Intention | Construction du rythme |
|---|---|---|---|
| 01 · Les coulées | 80 → 8 350 | Découverte | Course, descente en boule, portique sûr, petit saut, premier ressort, voie haute, deuxième ravine, sortie dégagée |
| 02 · Les sentiers de Mafate | 8 500 → 16 750 | Précision | Reprise au calme, embranchement, chaîne de passerelles, appuis mobiles facultatifs, deuxième série de sauts, récupération en bas |
| 03 · Le sprint de Saint-Gilles | 16 900 → 24 700 | Maîtrise | Descente rapide, accélérateur, looping facultatif, respiration sur le front de mer, ravine finale, route des toits et convergence au bar |

La traversée conserve les transitions continues entre les régions. Les niveaux séparés se terminent avant ces transitions pour présenter un bilan clair. La côte est volontairement plus rapide : elle combine des gestes déjà appris ; sa difficulté ne repose pas sur une durée supérieure.

Les voies hautes restent des prises de risque facultatives, avec éclats et accélérateurs. Le chemin inférieur permet de poursuivre après une réception manquée. Les deux appuis mobiles offrent une variante ; leur attente ne bloque pas le chemin principal. Le looping conserve son seuil de 700 px/s et son contournement inférieur.

## Mesures d'équilibrage

Résultats d'un pilote déterministe à 120 pas/s, avec anticipation des obstacles. Ce sont des références techniques, pas des temps cibles pour un débutant.

| Parcours | Course, glissade automatique en descente | Glissade maintenue |
|---|---:|---:|
| Les coulées | 18,63 s | 20,63 s |
| Mafate | 18,27 s | 19,59 s |
| Saint-Gilles | 14,82 s | 17,29 s |
| Traversée continue | 50,30 s | — |

Les trois niveaux se terminent sans chute dans ces simulations. Les 15 départs de reprise rejoignent l'arrivée de leur niveau à partir de l'arrêt. Les trois voies hautes sont accessibles par leur ressort. Les chaînes de plateformes conservent une marge sous l'enveloppe de saut.

À 330 px/s, le saut complet sur sol de même hauteur porte théoriquement à environ 234 px. La ravine la plus large mesure 150 px ; la différence de hauteur à sa réception est également prise en compte par la simulation réelle. Les éclats en arc servent de repère, sans garantir la collecte intégrale à toutes les vitesses.

## Cohérence et ressources

- 138 placements décoratifs résolus, contre 124 lors du premier audit après ajout du portique. Aucun placement n'est désormais écarté.
- Aucun fichier manquant dans le manifeste V3 ; aucune réponse HTTP en erreur pour les ressources chargées lors de la vérification des trois régions.
- Basalte et teintes chaudes au volcan, passerelles et végétation à Mafate, bois et panorama marin à Saint-Gilles.
- Nouveaux éléments dessinés par le moteur : drapeaux de reprise, fanions d'arrivée, flèches de saut, repères de réception et indicateurs des appuis mobiles.
- Les sources graphiques existantes restent la base des décors. Le recadrage côtier est composé au chargement ; aucune nouvelle dépendance de génération d'images n'est nécessaire.
- Les collisions continuent de dépendre de la géométrie, jamais de la silhouette des illustrations. Les grands supports rocheux des voies hautes sont décoratifs ; le joueur peut passer devant sur la route inférieure.

Le menu conserve la palette crème, corail et vert du jeu. Les choix ont un état sélectionné et un focus clavier visibles. Les boutons sont utilisables en paysage mobile. Le sélecteur est masqué pendant la pause pour préserver le parcours en cours. Les marqueurs de tiers de la traversée sont masqués pendant un niveau indépendant.

## Validation et livrables

- Tests de logique : format des temps, stockage, marges de saut, routes hautes, pentes, freinage, glissade, portique, ressorts, looping, transport des plateformes et reprises.
- Essai navigateur au clavier : traversée réelle sans chute, pause, redémarrage et persistance du record.
- Essais tactiles : joystick, glissade, saut simultané, changement d'orientation et reprise.
- Sélection des niveaux : départs, arrivées, séparation des records, niveau suivant et reprise après chute.
- Inspection visuelle : menu ordinateur, menu paysage, trois régions et fin de niveau sur téléphone.
- Compilation de production vérifiée.

Reproduire les mesures : `node scripts/audit-level.mjs`. Recréer la carte : `node scripts/map-level.mjs`. Vérifier le jeu : `npm test`, `npm run build`, puis `npx playwright test`.

Les données détaillées sont dans [level-audit-v5.json](level-audit-v5.json). La [carte du parcours](course-overview-v5.svg) est générée à partir de la géométrie réellement jouée. Les captures de contrôle restent locales dans `.local/review-v5/`.

## Méthode et portée

La démarche reprend la boucle « modifier, simuler, évaluer, corriger » d'[AgenticPCG](https://github.com/JiangZehua/AgenticPCG), directement dans le contrôleur Phaser du jeu. AgenticPCG n'a pas été installé ni exécuté. Les extensions [Unity](https://github.com/TaaroBravo/ai-powered-level-designer) et [Unreal](https://github.com/PRQELT/Autonomix) ne correspondent pas à ce moteur. [Game Studio AI](https://github.com/miharbi/game-studio-ai) n'a pas été intégré : le projet dispose déjà de son moteur, de ses assets et d'une simulation exploitable. Aucun de ces dépôts n'est requis pour lancer le jeu.

La validation automatique établit la faisabilité et la cohérence technique. Le plaisir, la compréhension spontanée des embranchements et la difficulté ressentie restent à mesurer avec des joueurs. Le prochain essai utile consiste à observer une première partie sur téléphone, puis une deuxième tentative : noter les chutes par ravine, les portiques mal compris et le choix volontaire des routes bonus. Ne pas confondre les temps du pilote avec une mesure d'accessibilité humaine.
