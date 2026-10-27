# Ravines : lave et cascade

Les deux trous du volcan contiennent une lave animée (4 poses, 6 images/s), avec surface lumineuse et magma sombre en profondeur. Le contact ramène au checkpoint. La première ravine de Mafate accueille une cascade animée de 2200 pixels de haut, avec ses extrémités hors champ, derrière les sentiers, basée sur la planche d’eau existante (8 poses). Les animations suivent la pause et le mode de mouvements réduits.

Source de lave créée avec ImageGen intégré : `source/ravines/lava-source.png`. Export normalisé : `../public/assets/ravines/lava-sheet.png`, 128 × 128, 24 couleurs. Consigne : quatre bandes horizontales identiques de lave vue de côté, surface orange dorée bouillonnante, croûte de basalte sombre, pixel art 16 bits, sans flou, sans texte, quatre états d’écoulement.

Aperçus réels : `ravine-lava-gameplay.png`, `ravine-cascade-gameplay.png`. Validation : 33 tests unitaires, compilation et test navigateur des ravines, des animations et de la détection du contact avec la lave.

