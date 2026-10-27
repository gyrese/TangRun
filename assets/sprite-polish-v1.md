# Sprites — basalte et cuivre, pixel art animé

Le parcours V6, ses collisions, le personnage et les fonds restent ceux de la version restaurée. Cette mise à jour porte sur le rendu, les objets et leurs appuis.

## Fichiers utilisés

- `public/assets/polish-v1/drone-animated.png` : quatre poses, hélices et échappement.
- `public/assets/polish-v1/spring-animated.png` : repos, compression, extension, retour.
- `public/assets/polish-v1/checkpoint-animated.png` : quatre poses de tissu ; pied et mât fixes.
- `public/assets/polish-v1/coin.png` : médaille volcanique dorée ; huit vues de rotation préparées dans le jeu.
- `public/assets/polish-v1/lowgate.png` : linteau de basalte et cuivre ; quatre états de reflets discrets.
- `sprite-polish-atlas.png` et `sprite-polish-atlas.json` : export des images réellement préparées par le jeu, à leur résolution native.
- `sprite-polish-gameplay.webm` : enregistrement du jeu, avec les animations actives.

Les textures d’origine ne sont pas remplacées. Les corniches utilisent le basalte déjà présent dans `public/assets/v5/pinnacle.webp`, découpé selon les appuis existants, avec une tranche irrégulière. Les rochers et les arches sont replacés sur des fondations suffisamment plates. Une sentinelle sur une voie haute ne bloque plus un décor placé dans l’étage inférieur.

## Style et animations dans le jeu

Les sprites sont préparés sur de petites grilles : drone 56 × 48, ressort 48 × 48, drapeau 64 × 88 et pièce 22 × 24. Palette commune de 32 couleurs au maximum, transparence franche et affichage sans lissage. Les sources restent intactes ; la préparation est dans `src/prop-art.js`, les ancrages dans `src/prop-art-data.json`.

Le drone utilise quatre poses à 10 images par seconde, le drapeau quatre poses à 7 images par seconde et les pièces huit vues à 9 images par seconde. Le ressort se comprime, s’étend puis revient lorsque le mécanisme est réellement déclenché. Les reflets des linteaux évoluent à 4 images par seconde. Les animations s’arrêtent en pause et passent à leur pose de repos avec la préférence de mouvement réduit.

## Génération et consignes

Outil utilisé : **ImageGen intégré**, avec fond transparent. Les premières études se trouvent dans `assets/source/props-polish-v1`. Trois études ont été redessinées en planches animées pour répondre à la demande de pixel art plus marqué.

### Consigne commune initiale

Production-ready premium 2D side-scrolling game sprite, richly shaded hand-crafted pixel art matching a lush Reunion Island volcanic platform game: charcoal blue basalt, worn copper, warm ivory highlights, restrained sage and turquoise accents, warm sunset light from upper left. Crisp clustered pixels with an effective 64-pixel asset resolution, expanded cleanly; no blur, no vector flat shapes, no photorealism, no isometric perspective. Exactly ONE complete object centered, fully visible, isolated on genuine transparent alpha background, generous transparent margin, no setting, no ground plane, no drop shadow outside the object, no labels, no lettering, no watermark.

### Sujets initiaux

**Drone.** A beautiful small hovering scout automaton, a rounded charcoal basalt and aged-copper body, a single luminous mint optical lens in a dark inset, two delicate short side rotor arms and a thin brass rotor on top. Elegant compact silhouette, intricate but readable metal fittings and tiny warm exhaust below, facing slightly to the left in a strict side view. Avoid blocky rectangular face and cartoon teeth.

**Ressort.** An elegant mechanical jump spring for a platform game, side view. A low broad dark basalt plinth, a clearly visible polished bronze helical coil, and a solid warm copper top plate with ivory highlight. Natural carved stone edges, subtle turquoise inlay in the plinth. At rest, compact squat silhouette, roughly 3:2 width to height, flat stable bottom. No arrows, no letters, no extra props.

**Drapeau.** An elegant checkpoint marker: one slender weathered copper pole rising from a small solid carved basalt foot; a beautifully folded sage-green fabric pennant blowing to the right, with a tiny simple golden sun emblem. Hand-crafted fittings and subtle fabric shading. Entire pole and stone foot visible; tall narrow overall silhouette about 2:3 width to height, bottom of foot flat and solid. No giant plain triangle, no letters, no numbers, no extra flags.

**Passage bas.** A beautiful low horizontal basalt lintel used as a crouch-under obstacle in a 2D side scrolling platform game. Strict orthographic side view. One long narrow carved volcanic stone beam with warm copper reinforcement bands and small amber rune inlays, sitting on two short sturdy stone feet, one at each end. Delicate tufts of moss on the upper corners only. Main beam is the top third; transparent open passage underneath; feet extend to a common flat baseline. Overall long and low, 4:1 width to height. It must read as an ancient volcanic structure, not industrial timber or a bench. No arrows, letters, scenery, or ground.

**Pièce.** One gorgeous small collectible GOLD COIN, frontal side view, perfectly circular silhouette. A thick elegantly beveled gold rim, copper recess, and a simple embossed tiny volcanic mountain emblem with one mint jewel at its summit. Premium readable pixel-art game currency; warm ivory highlight upper left, amber and deep bronze shading lower right. Keep the center simple and legible when displayed at 20 by 20 pixels; not a diamond-shaped gem, not a ring, no text, no numbers, no loose sparkles outside the circular silhouette.

### Redessin des planches animées — consigne commune

EDIT THE REFERENCE into an actual low-resolution pixel-art ANIMATED GAME SPRITE SHEET. Preserve its basalt/copper/sage/turquoise design but simplify radically into the visual language of a 1990s 16-bit platformer: visibly chunky square pixel clusters, at most 24 colors, hard aliased contours, compact readable shapes. Effective resolution per object 48x48 pixels. NO painterly detail, NO gradients, NO antialiasing, NO bloom or background glow, NO 3D render. Produce exactly FOUR animation frames in a precise 2-by-2 grid (reading order top-left, top-right, bottom-left, bottom-right). Equal size cells with generous transparent padding, no labels or grid lines. Consistent object scale, perfectly fixed body anchor and flat base within each cell. Genuine transparent alpha background. All four frames show the SAME object, not variants.

**Drone.** The hovering scout's round basalt body, mint lens and copper fittings remain at exactly the same coordinates across all four frames. Only its top and side propeller blades rotate visibly through four angles and its tiny exhaust flickers. Strong flat pixel clusters and a clearly readable mint eye. No ground beneath the floating drone.

**Ressort.** Four gameplay animation states of the SAME copper coil spring on the SAME small basalt base. Frame 1: relaxed resting spring. Frame 2: compressed coil and lowered top plate. Frame 3: fully extended spring, raised plate. Frame 4: recoil halfway between extended and resting. The basalt plinth remains fixed at an identical baseline and the coil changes height, not the base. All parts visible in every cell.

**Drapeau.** Four looping frames of the SAME checkpoint flag on its fixed pole and small basalt foot. Only the sage-green fabric waves and folds to the right in a smooth four-frame cycle. Pole, brass finial and basalt foot occupy identical coordinates and baseline in all cells. Simplify to readable 16-bit pixel art with a tiny gold sun emblem, no lettering.
