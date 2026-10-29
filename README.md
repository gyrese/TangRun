# LTN — La course au bar

## Foulée du tangue — 29 octobre 2026

La course du tangue utilise désormais seize poses dédiées, avec une ligne de sol commune pour conserver les phases d'appui et d'envol. La cadence reste liée à la distance parcourue et le personnage se retourne lorsqu'il court vers la gauche. Les poses de saut, de roulade et d'attente restent séparées. L'ancien cycle est accessible avec `?perso=tangue-pop-v4`.

Planche créée avec ImageGen à partir du tangue existant et de la référence de mouvement fournie : [aperçu des 16 poses](assets/preview-tangue-stride-v5.png), [prompt](assets/prompt-tangue-stride-v5.txt), [manifest](assets/manifest-tangue-stride-v5.json). Atlas utilisé : `public/assets/tangue/run-cycle-pop-v5.png`. Export reproductible : `python scripts/prepare-tangue-stride.py`.

## TangRun — classement partagé

L’accueil affiche les dix meilleurs temps de la traversée, avec un pseudo de 2 à 12 caractères. À l’arrivée, le rang du run apparaît sous le tableau ; une place dans le top 10 ouvre la saisie du pseudo. Un temps qualifié reste affiché comme ANONYME tant que son pseudo n’est pas enregistré. Les parcours de test de l’éditeur ne participent pas au classement.

En développement (`npm run dev`) et en prévisualisation (`npm run preview`), Vite sert aussi l’API de classement. Les résultats sont stockés dans `data/leaderboard.json` (chemin configurable avec `LEADERBOARD_FILE`). Avec Docker Compose, le service `leaderboard` sauvegarde les temps dans le volume persistant `leaderboard-data` et Nginx lui transmet `/api/`. Relancer `docker compose up --build -d` pour déployer les deux services. Sauvegarder ce volume pour conserver les résultats.

Le serveur attribue un identifiant à chaque run, vérifie les temps reçus et évite les doublons de fin de run. La simulation du jeu reste côté navigateur ; ces vérifications ne constituent pas un système anti-triche complet. Le service est prévu pour une seule instance avec son volume local.

## Atelier de niveaux / Admin

Refonte de l’atelier : recherche dans les objets, familles Construire/Jouer/Décorer, aperçu de placement, mini-carte, calques masquables/verrouillables et mode Vue large. Les déplacements utilisent un aperçu direct sans reconstruction du décor pendant le geste. « Tester ici » permet de démarrer près de la zone affichée. Raccourcis : V sélectionner, B placer, H déplacer la vue, flèches ajuster (Maj = 10 px), Ctrl D dupliquer, F cadrer, F4 vue large, Ctrl + molette zoom sous le curseur.


Audit du 26 octobre : [causes, corrections et vérifications](assets/editor-audit-2026-10-26.md). Les décors sont désormais figés à leurs positions affichées pendant la création ; déplacer un objet ne relance plus le placement des autres. Les patrouilles et oscillations sont arrêtées dans l’éditeur et actives en mode Tester. Échap annule le geste en cours ; Alt + clic sélectionne un objet derrière un autre.


Ouvrir directement `/editeur`. Aucun bouton du jeu ne donne accès à l’éditeur. Choisir un type d'élément, puis **Placer** et cliquer sur la carte. **Sélectionner** permet de déplacer un élément et de modifier ses propriétés dans l'inspecteur. Le sol et les plateformes ont une largeur, une hauteur initiale Y et une hauteur finale Y2 pour dessiner les pentes. Les segments du sol sont indépendants ; conserver un support aux trois départs (X 80, 8500, 16900).

L’aperçu utilise les fonctions de dessin et les sprites du jeu, avec un panorama cadré sans répétition. La bibliothèque affiche les objets réels à placer. Les poignées aux extrémités du sol et des plateformes ajustent les pentes à la souris. Espace + glisser, le bouton Main, la molette et le curseur sous la carte parcourent le niveau ; Maj + molette déplace la vue verticalement et le sélecteur de région rejoint chaque acte. La grille visuelle est facultative. Les décors placés ou déplacés manuellement conservent leur position et leur échelle dans le jeu. Annuler/rétablir, duplication, suppression et aimantation à 10 pixels sont disponibles. `Ctrl+S` sauvegarde, `Ctrl+Z` annule et `Suppr` supprime la sélection hors d'un champ.

**Sauvegarder** conserve le brouillon dans ce navigateur. **Tester le parcours** sauvegarde puis ouvre `/?custom=1`, qui charge le niveau édité avec des records séparés. Le jeu à l'adresse normale conserve son parcours original. **Exporter** télécharge un JSON ; **Importer** restaure un export. Charger l'original est annulable. L'atelier est local, sans compte administrateur ni publication serveur : exporter les fichiers pour disposer d'une sauvegarde durable ou changer de navigateur.

## Finition des sprites — pixel art animé

Corniches en basalte naturel, pièces dorées animées, nouveaux drones, drapeaux, ressorts et linteaux. Les objets utilisent une palette limitée et des animations à appui fixe ; le parcours V6 est conservé. [Aperçu animé](assets/sprite-polish-gameplay.webm) · [Atlas et consignes de génération](assets/sprite-polish-v1.md).

## Traversée V6 — aventure réunionnaise

Refonte du parcours : neuf séquences sur trois actes, trois nouvelles routes intermédiaires, une seconde boucle, 18 sentinelles, boucliers, réserves d'éclats, neuf emblèmes et évents temporisés. Les nouveaux décors représentent lave cordée, tamarin des Hauts, fougère arborescente, vacoa, case créole et embarcation de pêche. Le tangue et le cadrage mobile rapproché sont conservés. [Direction, parcours et validation](assets/adventure-v6.md).

Rouler ou retomber sur une sentinelle permet de la détruire ; un impact consomme le bouclier ou disperse des éclats. Sans protection, retour au dernier drapeau. Les records V6 sont séparés des versions précédentes.

## Tangue pop culture — 25 octobre 2026

Le tangue actif adopte une silhouette plus graphique, des mèches brunes à pointes crème, des lunettes noires, un blouson turquoise et des baskets rétro corail. Les huit poses de course, la roulade, l’attente et la victoire partagent cette direction. L’ancienne version reste accessible avec `?perso=tangue-v2`. Sources et prompt : `assets/source/tangue-pop-v4.png` et `assets/prompt-tangue-pop-v4.txt`. Export : `python scripts/prepare-tangue-pop.py`.

## Variante tangue — 24 octobre 2026

La course utilise maintenant huit poses dédiées à une foulée complète, avec un cadrage et une échelle communs. Source : `assets/source/tangue-run-v3.png` ; atlas : `public/assets/tangue/run-cycle-v3.png` ; export : `python scripts/prepare-tangue-run.py`. Les poses d’attente, saut et roulade restent séparées.

Le personnage actif est désormais le tangue de La Réunion V2 : héros bipède en pixel art, course sur deux pieds, lunettes de soleil noires, baskets et foulard corail. Pour rejouer avec le chat, ajouter `?perso=cat` à l’adresse du jeu ; `?perso=tangue-v1` retrouve le premier tangue ; `?perso=tangue` sélectionne la nouvelle version. Les collisions et les mouvements restent identiques.

La sauvegarde complète du chat, de ses assets et du code avant ce changement se trouve dans `backups/chat-2026-10-24/`. Ses sources et exports restent aussi présents à leurs emplacements d’origine. Les nouveaux sprites sont indépendants : `assets/source/tangue-v2.png` et `public/assets/tangue/`. Régénération des atlas : `python scripts/prepare-tangue.py --version v2`. Le prompt est conservé dans `assets/prompt-tangue-v2.txt`.

Version actuelle : **La traversée de La Réunion V5** — trois niveaux sélectionnables (Volcan, Mafate, Saint-Gilles) ou la traversée continue. Difficulté progressive, 15 points de reprise, arcs de guidage des sauts, 195 placements décoratifs, océan recadré, records séparés et temps par étape. La [revue complète](assets/level-design-v5-review.md) explique les changements et les mesures ; la [carte du parcours](assets/course-overview-v5.svg) présente les trois niveaux. Pour reproduire l'audit : `node scripts/audit-level.mjs`. Les exports V3 restent répertoriés dans `assets/manifest-v3.json` et peuvent être préparés avec `python scripts/prepare-v3.py`.

Complément du 25 octobre : **chemins enrichis et sensation de vitesse renforcée** — 57 placements de plus, 365 détails de bordure, caméra progressive et poussière adaptée à la région. Détails et validation dans [Chemins et vitesse](assets/path-speed-update.md).

Le décor utilise maintenant des sprites animés pour l’eau et les flammes, de nouvelles poses du chat (roulade, attente, réception, victoire), ainsi que du vent dans la végétation, des lueurs variables et des bateaux qui oscillent. Documentation et sources : `assets/animation-notes.md`.

Prototype jouable d’un jeu de plateformes pour Les Toiles Noires, Saint-Gilles-les-Bains, La Réunion.

## Jouer en local

### Avec Docker

Avec Docker et Docker Compose installés, depuis le dossier du projet :

```sh
docker compose up --build -d
```

Ouvrir http://localhost:8080. Pour arrêter le jeu : `docker compose down`.
Le port peut être modifié avec la variable d’environnement `PORT` (8080 par défaut).
Après une modification du jeu, relancer `docker compose up --build -d`.

L’image compile le jeu avec Node.js puis sert uniquement le site compilé avec Nginx,
sans privilèges administrateur. Les ressources exportées dans `public/assets/` sont
incluses ; les sources graphiques et sauvegardes restent dans le projet mais ne sont
pas envoyées à Docker. Les records personnels restent dans le navigateur ; le classement partagé est conservé par le service `leaderboard` dans son volume persistant.

### Avec Node.js

Node.js 22.12+ :

```sh
npm install
npm run dev
```

Ouvrir l’adresse affichée. Sur un téléphone connecté au même Wi-Fi, utiliser l’adresse réseau affichée par Vite (le pare-feu de l’ordinateur doit autoriser ce serveur).

## Commandes

- Flèches, Q/D ou A/D : courir.
- Espace, flèche haut, Z ou W : sauter. Relâcher tôt pour un petit saut.
- R : recommencer immédiatement.
- Flèche bas, S ou Maj : glisser / se mettre en boule pour conserver son élan. La mise en glissade est automatique en descente. La direction opposée freine ; le saut permet de sortir de la glissade.
- P ou Échap : pause. La perte de focus met automatiquement en pause.
- Boutons tactiles sur petit écran ou appareil tactile.
- Son facultatif, activé par le bouton SON.

Chaque niveau dispose de son départ et de son arrivée ; la traversée enchaîne les trois régions. Les routes hautes et le looping sont facultatifs. Les descentes, vallons, montées et envolées alternent avec des replats de reprise et des passages à glisser ou à sauter. Les traînées de pixels indiquent la glissade, la jauge d’élan compare la vitesse à la course normale. Les fonds défilent à 4,5 % du déplacement de la caméra ; la parallaxe est désactivée si l’utilisateur préfère réduire les mouvements.

Le personnage utilise un contrôleur cinématique à 120 pas par seconde pour suivre les pentes, conserver son élan et détecter les réceptions. Les collisions ne dépendent pas des images. Les montées convertissent la vitesse en hauteur à leur sortie. Les plateformes en hauteur se traversent par-dessous. Les anciens records restent dans le navigateur. Les records V5 utilisent quatre clés distinctes : une par niveau et une pour la traversée complète.

Le chrono démarre au premier déplacement ou saut, continue après une chute et s’arrête à l’arrivée. Les pixels n’affectent pas le chrono. La pause arrête le chrono : cette version convient à l’entraînement, pas à l’homologation de records.

Le meilleur temps est local à ce navigateur. Aucun compte, aucune collecte de données, aucun classement public ou concours officiel. Pour un concours : définir les règles, la version du niveau et les conditions matérielles ; ajouter une validation des parcours et un stockage serveur avant de publier un classement en ligne. Une finale sur poste dédié au bar est la première option envisagée.

## Vérifier et construire

```sh
npm test
npm run build
npx playwright test
```

Les tests navigateur nécessitent Chromium (`npx playwright install chromium`). Le dossier `dist/` est le site statique à héberger. Le jeu et ses graphismes sont inclus dans la compilation ; seules les polices de présentation utilisent Google Fonts, avec polices système en secours.

## Direction et ressources

Chat noir original au foulard corail, pixel art généré puis normalisé, palette nuit tropicale, corail, crème et vert doux. Les décors évoquent un Saint-Gilles imaginaire : océan, montagnes, palmiers, toits, bornes d’arcade et bar. Ils ne prétendent pas reproduire l’intérieur réel.

Les sources originales sont dans `assets/source/`, les exports intégrés dans `public/assets/`, la direction artistique dans `assets/art-direction.md`, les prompts dans `assets/prompts-v1.json` et les dimensions/provenances dans `assets/manifest-v1.json`. Une planche d’aperçu est disponible dans `assets/preview-v1.png`.

Pour régénérer les exports depuis les sources (Python et Pillow requis) : `python scripts/prepare-assets.py`. Cette opération ne fait aucun appel à un modèle et ne modifie pas les images source.

Guides consultés du dépôt demandé : https://github.com/gamedev-skills/awesome-gamedev-agent-skills — router, platformer, level-design, phaser-core, phaser-arcade-physics, prototype-fast. Les instructions ont été lues, sans installation globale.

Question du prototype : les déplacements et les choix de trajet donnent-ils envie de recommencer pour gagner du temps ? Premier essai à faire avec une personne qui découvre le jeu : apprend-elle les sauts en moins de 30 secondes, puis relance-t-elle volontairement une partie ? Valider ce point avant de produire une grande bibliothèque d’illustrations.

Sprites pixel art animés : [sources, atlas et validation](assets/props-v2.md).
