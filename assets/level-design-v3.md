# La traversée de La Réunion — parcours V3

## Trois lieux et six séquences

1. **Fournaise, départ (0–2260)** : un espace pour apprendre le saut et la glissade, une première pente avec zone de réception, deux arches comme repères et un petit trou annoncé.
2. **Fournaise, belvédère (2380–4600)** : tremplin optionnel vers un chemin haut et ses pixels ; le joueur qui le saute garde la trajectoire basse. Le vallon permet de retrouver de la vitesse avant le premier checkpoint.
3. **Mafate, les îlets (4600–6600)** : le fond devient un cirque de remparts géants. Un tremplin permet de rejoindre une chaîne de passerelles avec zones d’accélération. Le sentier inférieur reste continu sous les passerelles.
4. **Mafate, la ravine (6740–9200)** : réception en contrebas, passage bas à glisser ou à sauter et dernière montée avant le checkpoint. Les cases ont des fondations planes, la végétation et les cascades sont réduites pour laisser lire les remparts.
5. **Saint-Gilles, corniche (9200–11240)** : ouverture sur l’océan, descente rapide, quai, mobilier portuaire et dernier petit saut obligatoire.
6. **Saint-Gilles, quartier du QG (11240–14200)** : un tremplin propose un trajet sur les boutiques, tandis que le front de mer passe sous un portique. Terrasses, lanternes, arche, musique et enseigne officielle annoncent l’arrivée.

Le parcours est une traversée fantaisiste de paysages emblématiques, pas une carte ou un itinéraire de randonnée.

## Règles du placement

Les positions sont décrites objet par objet dans `src/level.js`, avec ancrage au terrain, échelle et profondeur. Les maisons et meubles larges sont déplacés vers une terrasse plane assez large, ou omis si aucune fondation valable n’est proche. Les arbres et rochers utilisent leur propre point d’ancrage. Les passerelles se calent sur la hauteur de leur tablier ; la ligne claire indique la surface de collision exacte. Les boutiques sont attachées aux plateformes hautes. Les décors sont derrière le personnage.

Les objets décoratifs n’ont pas de collision implicite : les collisions du niveau sont explicites. Trois tremplins donnent accès aux raccourcis ; les trois portiques se franchissent en glissant ou en sautant. Un appui sur glisser fonctionne même si le joueur s’est déjà arrêté contre un portique. Les champs de pixels guident les routes et ne modifient pas le chrono.

## Art et vérification

24 nouveaux objets isolés, trois nouveaux panoramas intégrés (volcan, remparts de Mafate, côte étendue), plus une bande de bois dérivée pour les portiques. Les autres exports de recherche sont conservés avec leurs sources. Génération avec l’outil intégré ImageGen ; prompts dans `prompts-v3.json` et `prompts-v3-refinements.json`, provenance et dimensions dans `manifest-v3.json`. Normalisation reproductible via `scripts/prepare-v3.py` ; suppression des petits fragments de cellules voisines et contrôle alpha.

Mafate a été corrigé à la demande de l’utilisateur : beaucoup moins de ciel, parois presque verticales, érosion en stries, crêtes fines et îlets minuscules. Références de relief consultées :

- https://portaildupaysage-lareunion.re/les-unites-de-paysage/12-le-cirque-de-mafate/
- https://www.reunion.fr/decouvrez/le-maido-le-balcon-de-la-reunion/

La photographie de référence du Maïdo (IRT, page officielle du tourisme) a été consultée pour le relief uniquement ; elle reste dans les fichiers de travail et n’est pas distribuée dans le jeu.

Les panoramas étendus de Mafate et du littoral défilent sans répétition dans la fenêtre utile de la caméra. Le fond du volcan utilise une paire en miroir. La parallaxe reste lente et les transitions entre zones sont progressives. Les records V3 ont leur propre clé de stockage.
