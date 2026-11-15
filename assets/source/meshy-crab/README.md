# Crabe Meshy

Source fournie par l'utilisateur : `Meshy_AI_Create_a_single_styli_1031113321_texture.glb`.
Le modèle est conservé dans `crab.glb` ; il contient un maillage texturé, sans squelette ni animation.

Les quatre rendus transparents `frame-0.png` à `frame-3.png` montrent une vue de trois quarts avec un léger balancement rigide. Ils ne constituent pas une marche articulée.

`python scripts/prepare-meshy-crab.py` produit les sprites 64 × 48 à palette commune de 32 couleurs et l'aperçu. Les pieds sont ancrés à la ligne 46, l'origine du sprite à la ligne 28 pour rejoindre le sol situé 18 pixels sous le centre de collision existant. Les collisions restent identiques.

Seuls les quatre petits PNG de `public/assets/meshy-crab/` sont chargés dans le jeu, sous les clés `v6-crab-0` à `v6-crab-3`. Le GLB n'est pas envoyé au navigateur.
