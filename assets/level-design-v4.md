# La Traversée — acte V4

Le parcours fait 25 200 pixels (arrivée à 24 700), contre 14 600 auparavant. Les nouveaux records utilisent leur propre clé afin de ne pas comparer des courses différentes.

## Progression

1. Départ : commandes et première descente.
2. Coulées : courbes douces, glissade et conservation de la vitesse.
3. Belvédères : premier ressort, route haute en basalte et retour au sol.
4. Îlets : entrée de Mafate et embranchement vers les passerelles.
5. Grand rempart : changements de hauteur et deux plateformes mobiles.
6. Corniche : précision et récupération sur le sentier inférieur.
7. Océan : descente, accélérateur et looping facultatif du lagon.
8. Saint-Gilles : route des toits ou route au sol.
9. Sprint final : convergence et arrivée aux Toiles Noires.

## Placement

Les décors ont des coordonnées fixes dans `src/course-data.js`. Le moteur ne les déplace plus automatiquement vers un replat voisin. Les meubles larges nécessitent une fondation plane ; ceux qui chevaucheraient un obstacle sont écartés. Les petits éléments sont légèrement enterrés sur les pentes. Les passerelles répètent leurs planches à taille native, avec leur surface de marche alignée sur la collision. Les façades conservent leurs proportions et sont limitées à leur taille native. Les passages sous les portiques restent dégagés. Le logo officiel est conservé à l’arrivée.

## Jeu

Trois routes hautes, cinq ravines franchissables à vitesse normale, trois ressorts, cinq portiques, deux plateformes mobiles et sept points de reprise. Les chemins hauts offrent des accélérateurs et des pixels supplémentaires ; le sol permet de récupérer après une chute depuis ces chemins. Le looping demande 700 px/s ; l’accélérateur précédent donne 830 px/s. À faible vitesse, le joueur passe au-dessous. La rotation et la caméra suivent un tour complet, avec une énergie réduite au sommet et une sortie tangentielle. Ce looping est guidé, ce n’est pas un moteur de collision à 360 degrés généralisé.

La simulation fonctionne à 120 pas par seconde. Les plateformes mobiles utilisent cette même horloge et transportent leur passager. Leur mouvement se fige pendant la pause. Les fonds conservent leur défilement lent et leurs transitions entre les trois zones.

## Validation

La simulation du chemin principal termine en environ 55 secondes sans chute avec un pilote anticipant les obstacles. Les trois routes hautes sont accessibles par leur ressort. Les tests couvrent aussi le tour complet du looping, le contournement à faible vitesse, le transport par une plateforme mobile, les sauts, les glissades et les placements. Les tests navigateur couvrent la course réelle au clavier, la pause, le record, le mobile et les animations.
