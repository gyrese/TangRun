# Sprites pixel art animés — deuxième passe

Les objets simplifiés du jeu ont été remplacés par des sprites raster : crabes, drones, coffres, bornes de protection, emblèmes, ressorts, checkpoints, drapeaux d’arrivée, panneaux de saut, plaques d’accélération, protections du personnage, oiseaux et personnages d’ambiance. Les pièces ramassées et dispersées utilisent la même animation de rotation. Les jets volcaniques réutilisent la flamme pixel art animée existante. Les plateformes mobiles reprennent la roche du décor et les rails emploient une texture de basalte.

Le tracé, les collisions et les commandes restent ceux du niveau restauré. Les fonds et le personnage existants sont conservés.

## Exports

- Atlas intégré : `public/assets/pixel-props-v2/atlas.png` et `atlas.json`, 82 images, 1024 × 288 pixels.
- Aperçu réel en jeu : `assets/props-v2-gameplay.png` et `props-v2-gameplay.webm`.
- Sources : `assets/source/props-polish-v1/` et `props-polish-v2/`.
- Consignes exactes de cette passe : `assets/props-v2-prompts.json` ; première passe : `assets/sprite-polish-v1.md`.

Les sources ont été créées avec ImageGen intégré, puis découpées et normalisées à la taille du jeu : palette commune de 32 couleurs, transparence franche, rendu sans lissage. Les grandes images sources ne sont pas chargées en jeu. Chaque nouvelle famille comporte quatre poses ; les pièces en comportent huit. Les animations respectent la pause et le mode de mouvements réduits. Le ressort réagit à son déclenchement réel.

## Préparation et vérification

`node scripts/bake-prop-atlas.mjs --browser <chemin-du-navigateur>` prépare l’atlas à partir des sources, sans nouvel appel à ImageGen. Les dimensions et points d’ancrage sont dans `src/prop-art-data.json`.

Validation : 26 tests unitaires réussis, compilation réussie, deux tests navigateur réussis couvrant les poses distinctes, les couleurs, la transparence, les ancrages, la pause et le déclenchement du ressort. L’enregistrement réel ne relève aucune erreur JavaScript.
