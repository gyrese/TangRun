# Sprites pixel art animés — deuxième passe

Les objets simplifiés du jeu ont été remplacés par des sprites raster : crabes, drones, coffres, bornes de protection, emblèmes, ressorts, checkpoints, drapeaux d’arrivée, panneaux de saut, plaques d’accélération, protections du personnage, oiseaux et personnages d’ambiance. Les pièces ramassées et dispersées utilisent la même animation de rotation. Les jets volcaniques réutilisent la flamme pixel art animée existante. Les plateformes mobiles reprennent la roche du décor et les rails emploient une texture de basalte.

Le tracé, les collisions et les commandes restent ceux du niveau restauré. Les fonds et le personnage existants sont conservés.

## Exports

- Atlas intégré : `public/assets/pixel-props-v2/atlas.png` et `atlas.json`, 82 images, 1024 × 304 pixels.
- Aperçu réel en jeu : `assets/props-v2-gameplay.png` et `props-v2-gameplay.webm`.
- Sources : `assets/source/props-polish-v1/` et `props-polish-v2/`.
- Consignes exactes de cette passe : `assets/props-v2-prompts.json` ; première passe : `assets/sprite-polish-v1.md`.

Les sources ont été créées avec ImageGen intégré, puis découpées et normalisées à la taille du jeu : palette commune de 32 couleurs, transparence franche, rendu sans lissage. Les grandes images sources ne sont pas chargées en jeu. Chaque nouvelle famille comporte quatre poses ; les pièces en comportent huit. Les animations respectent la pause et le mode de mouvements réduits. Le ressort réagit à son déclenchement réel.

## Préparation et vérification

`node scripts/bake-prop-atlas.mjs --browser <chemin-du-navigateur>` prépare l’atlas à partir des sources, sans nouvel appel à ImageGen. Les dimensions et points d’ancrage sont dans `src/prop-art-data.json`.

Validation : 26 tests unitaires réussis, compilation réussie, deux tests navigateur réussis couvrant les poses distinctes, les couleurs, la transparence, les ancrages, la pause et le déclenchement du ressort. L’enregistrement réel ne relève aucune erreur JavaScript.

## Paille-en-queue — 27 octobre 2026

Les oiseaux d’arrière-plan représentent désormais des paille-en-queue à brins blancs : deux longues rectrices blanches, corps ivoire, bec jaune et marques sombres sur les ailes. Référence : [fiche de la SEOR](https://www.seor.fr/oiseau-16-phaeton-a-brins-blancs.html).

Le fond accueille trois oiseaux espacés, à trois distances : échelles de 34 %, 50 % et 72 %, opacité et vitesse progressives, défilement plus faible pour les plus lointains. La pause les immobilise ; le mode de mouvements réduits fige aussi leur défilement lié à la caméra.

Source créée avec ImageGen intégré : `assets/source/props-polish-v2/paille-en-queue-v1.png`. Consigne exacte : `assets/prompt-paille-en-queue-v1.txt`. Les quatre poses sont exportées en 48 × 36 pixels, avec un ancrage commun sur le corps à (34, 24) pour conserver la queue entière. Les clés `bird-0` à `bird-7` et le fonctionnement de l’animation sont conservés. L’ancienne image source reste disponible.

Aperçus : `assets/paille-en-queue-preview.png` (poses agrandies et taille réelle), `assets/paille-en-queue-gameplay.png` (en jeu). Vérifications : compilation, test navigateur des sprites, contrôle des marges et de la queue dans chaque pose, comparaison pixel à pixel des 74 autres sprites inchangés. Le test historique d’environnement démarre avant que `window.__LTN__` existe ; la pause et les mouvements réduits ont été contrôlés séparément après le chargement du jeu.
