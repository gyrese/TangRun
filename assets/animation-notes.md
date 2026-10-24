# Monde vivant — sprites et mouvements

Trois planches originales générées avec l’outil intégré ImageGen, huit images chacune :

- `public/assets/animation/water-sheet.png` : écoulement de l’eau et éclaboussures, cellules 128 × 224, 12 images/seconde, superposées au lit rocheux des cascades.
- `public/assets/animation/fire-sheet.png` : huit phases de flammes et fumée, cellules 96 × 128, 10 images/seconde sur les affleurements volcaniques et 8 images/seconde au cratère distant.
- `public/assets/animation/cat-sheet.png` : quatre phases de roulade, deux poses d’attente avec clignement, réception accroupie et pose de victoire, cellules 64 × 64.

Sources conservées dans `assets/source/animation`, prompts dans `assets/prompts-animation.json`, tailles, points de découpe et provenance dans `assets/manifest-animation.json`. Exports reproductibles avec `python scripts/prepare-animation.py` (Pillow). Planche de contrôle : `assets/preview-animation.png`.

Les états du chat utilisent une échelle commune, un pivot centré pour la roulade et une ligne de pieds commune pour les autres poses. Le cycle de roulade accélère avec la vitesse. Les collisions et les chronos restent pilotés par le contrôleur physique ; les animations ne les déplacent pas.

Les palmes, arbres, plantes et auvents oscillent légèrement autour de leur pied. Les bateaux bougent de quelques pixels ; les lanternes et néons varient doucement en intensité. Des étincelles accompagnent les affleurements volcaniques et des filets d’eau parcourent les cascades. Les pixels à collecter tournent sur huit images natives. Les effets hors champ sont masqués.

Une horloge visuelle séparée fait vivre le décor dès l’accueil. Elle s’arrête avec la pause ; les effets décoratifs se figent si le navigateur demande une réduction des mouvements. Les textures sont normalisées et les animations sont inspectées dans le navigateur, y compris leur immobilisation en pause.
