# La course au QG — direction artistique v1

## Cible visuelle choisie

Un Saint-Gilles imaginaire à l’heure bleue, avec océan, reliefs volcaniques, végétation tropicale et chaleur d’un QG geek. Le décor `source/coast-v1.png` est la référence choisie pour cette famille. La façade est une réinterprétation fantastique, pas une reproduction du lieu réel.

Palette : pétrole et bleu nuit en fond, sauge pour les repères, ambre pour la lumière, corail pour la mascotte et les accents. Pixel art détaillé à contours lisibles, caméra de profil et silhouettes simples. Les surfaces jouables gardent un liseré clair et les éléments purement décoratifs restent derrière le joueur.

## Cadre technique

- Phaser 4.2, monde 2D, vue orthographique de profil ; écran logique 960 × 540, ou 720 × 540 sur mobile.
- Les fichiers source sont archivés sans modification. Les exports de jeu sont dans `public/assets`.
- Fond ramené à 960 × 540 ; pixels affichés sans interpolation.
- Mascotte : 6 cellules de 64 × 64, 1 pose idle, 4 poses de course, 1 pose de saut. Pieds alignés à y=62. Réduction commune à tous les états pour préserver le volume. Aucune collision calculée depuis les pixels de l’image.
- Accessoires : palmier, borne d’arcade, caisse, jardinière ; détourages alpha vérifiés et marges nettoyées.
- Façade : 768 px de large ; texte de l’enseigne ajouté par le moteur pour rester net et exact.
- Tous les objets ont leur base en bas du sprite. La géométrie du parcours et les collisions restent définies dans le niveau.

## Provenance

Images générées avec l’outil intégré ImageGen pour ce projet, le 24 octobre 2026. Les trois images transparentes et le sol réutilisent le décor comme référence de style. Aucun asset Nintendo ni autre personnage de licence utilisé. Prompts dans `prompts-v1.json` et `prompt-ground-v1.txt` ; aucun droit exclusif ou absence de ressemblance fortuite n’est affirmé.

Les exports sont recadrés, réduits au plus proche voisin et nettoyés de leurs pixels alpha trop faibles. Les sources restent disponibles pour toute retouche future. Validation : contrôle alpha/dimensions, planche d’aperçu, inspection dans le jeu à sa résolution réelle, puis tests du parcours et du tactile.
