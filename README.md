# LTN — La course au bar

## Variante tangue — 24 octobre 2026

La course utilise huit poses dédiées à une foulée complète, avec cadrage et échelle communs. Source : `assets/source/tangue-run-v3.png` ; atlas : `public/assets/tangue/run-cycle-v3.png` ; export : `python scripts/prepare-tangue-run.py`. Les poses d’attente, saut et roulade restent séparées.

Le personnage actif est désormais le tangue de La Réunion V2 : héros bipède en pixel art, course sur deux pieds, lunettes de soleil noires, baskets et foulard corail. Pour rejouer avec le chat, ajouter `?perso=cat` à l’adresse du jeu ; `?perso=tangue-v1` retrouve le premier tangue ; `?perso=tangue` sélectionne la nouvelle version. Les collisions et les mouvements restent identiques.

La sauvegarde complète du chat, de ses assets et du code avant ce changement se trouve dans `backups/chat-2026-10-24/`. Ses sources et exports restent aussi présents à leurs emplacements d’origine. Les nouveaux sprites sont indépendants : `assets/source/tangue-v2.png` et `public/assets/tangue/`. Régénération des atlas : `python scripts/prepare-tangue.py --version v2`. Le prompt est conservé dans `assets/prompt-tangue-v2.txt`.

Version actuelle : **La traversée de La Réunion (V3)** — Piton de la Fournaise, remparts de Mafate, Saint-Gilles puis Les Toiles Noires. 24 nouveaux objets, trois panoramas distincts, trois tremplins, trois chemins hauts optionnels et trois passages bas. Le placement et le rythme du parcours sont décrits dans `assets/level-design-v3.md` ; les nouveaux exports et leurs sources sont répertoriés dans `assets/manifest-v3.json`. Les temps V3 sont enregistrés séparément. Pour préparer les nouveaux exports depuis les sources : `python scripts/prepare-v3.py`.

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
pas envoyées à Docker. Les meilleurs temps restent enregistrés dans le navigateur.

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

Le parcours conserve les descentes, vallons, montées et envolées du prototype V2, avec de nouvelles routes hautes et des passages à glisser ou à sauter. Les traînées de pixels indiquent la glissade, la jauge d’élan compare la vitesse à la course normale. Les fonds défilent à 4,5 % du déplacement de la caméra ; la parallaxe est désactivée si l’utilisateur préfère réduire les mouvements.

Le personnage utilise un contrôleur cinématique à 120 pas par seconde pour suivre les pentes, conserver son élan et détecter les réceptions. Les collisions ne dépendent pas des images. Les montées convertissent la vitesse en hauteur à leur sortie. Les plateformes en hauteur se traversent par-dessous. Les anciens temps V1 restent dans le navigateur mais les records V2 ont une clé distincte, car le parcours et la physique ont changé.

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
