# Audit de l’éditeur — 26 octobre 2026

## Incident signalé

Déplacer un objet pouvait modifier d’autres sprites affichés. Les données du déplacement ne contenaient pas une sélection multiple : le moteur reconstruisait la scène et relançait les décisions de placement automatique. Le placement des rochers, les exclusions autour des dangers et le filtrage des décors dépendaient des autres objets. Par ailleurs, les ennemis patrouillaient et les décors oscillaient pendant l’édition.

## Corrections

| Problème constaté | Correction |
| --- | --- |
| Recalcul global du décor après chaque modification | Les positions, échelles et visibilités du parcours sont matérialisées à son ouverture. Les parcours personnalisés utilisent ces mêmes positions en jeu. |
| Sources décoratives masquées pouvant réapparaître | Les sources sont conservées avec un état de visibilité explicite ; elles ne participent plus à la sélection. |
| Patrouilles, oscillations et effets de visibilité pendant la création | Pose fixe dans l’éditeur. Les animations et déplacements restent actifs en mode Tester. |
| Décor qui grossit ou saute à la prise en main | Les coordonnées et l’échelle affichées deviennent les valeurs d’édition ; aucun recalage automatique sur un autre socle. |
| Supports de plateformes recalculés selon les plateformes voisines | Les supports appartiennent explicitement à chaque plateforme ; créer ou supprimer une voisine ne lui ajoute ou retire plus de pilier. |
| Sélection d’objets invisibles ou de mauvaise couche | Sélection selon les objets effectivement dessinés et leur profondeur ; Alt + clic parcourt les éléments superposés. |
| Cadres de sélection obsolètes après reconstruction | Le cadre est redessiné une fois les nouveaux sprites disponibles ; les limites des surfaces tiennent compte des pentes. |
| Gestes interrompus, deuxième pointeur et annulation incomplète | Un geste appartient à un seul pointeur. Échap, annulation tactile et perte de focus restaurent la transaction. Un simple clic ne crée pas de modification. |
| Déplacement ramené au départ laissant un changement | Retour à la position initiale et annulation ne laissent ni modification ni entrée d’historique supplémentaire. |
| Validation insuffisante avant le rendu | Les coordonnées, tailles, identifiants, types d’objets, patrouilles et budgets de textures sont contrôlés avant application. Un import invalide laisse le niveau courant intact. |
| Index de sélection et ordre du terrain modifiés à la sauvegarde | La normalisation conserve l’ordre des tableaux. Duplication avec identifiant unique, annuler/rétablir et état de sauvegarde vérifiés. |
| Boosts associés au mauvais tronçon | Recherche du support à la hauteur réelle sur la pente et mise à jour du boost édité uniquement. Un boost sans support reste visible en avertissement dans l’éditeur ; le lancement le refuse. |
| Patrouille conservant un ancien profil après déplacement | Le profil du seul ennemi modifié est recalculé. Une amplitude nulle ne produit plus de coordonnées non numériques. |
| Champ vertical sans effet pour un objet ancré au sol | Les drapeaux et ressorts exposent leur déplacement horizontal. Les plateformes mobiles restent horizontales, conformément à leur rendu. |
| Brouillon inachevé impossible à conserver | Sauvegarde et export de brouillons autorisés ; contrôle des départs et supports avant Tester. Un ancien brouillon illisible est signalé sans effacer son enregistrement. |

## Refonte de fluidité et d’ergonomie

- Pendant un déplacement, seuls les sprites de l’objet manipulé sont transformés. Une modification de pente ou de largeur redessine uniquement la surface concernée. La scène est réconciliée à la fin du geste.
- Le dessin des repères est regroupé sur les images du navigateur ; le canevas n’est plus recréé à chaque mouvement. Les vignettes sont mises en cache et le fond n’est recalculé que lorsque la vue change.
- Bibliothèque organisée en familles, recherche dans tous les objets et aperçu de placement sous le curseur.
- Mini-carte navigable, zoom conservant le point sous le curseur, vue large et recentrage sur la sélection.
- Calques masquables et verrouillables, sans modifier le contenu sauvegardé du parcours.
- Inspecteur avec menus de types, aperçu de sélection et paramètres des plateformes mobiles.
- Raccourcis V/B/H, ajustements par flèches, Maj pour 10 pixels, Ctrl D pour dupliquer, F pour cadrer et F4 pour la vue large. Tab garde sa navigation habituelle.
- « Tester ici » démarre la partie personnalisée près de la zone éditée et propose un retour vers l’éditeur.

## Vérifications

- Tests unitaires : composition initiale conservée, indépendance des placements, conservation des sources masquées, sérialisation, ordre des objets, boosts sur pentes, brouillons incomplets, données dangereuses, profils de patrouille et propriété des supports.
- Tests navigateur : placement et modification, lancement réel, trois régions et plusieurs zooms, poignées de pente, déplacement d’un décor d’origine avec comparaison de tous les autres sprites, annuler/rétablir, sauvegarde/rechargement, superposition d’une plateforme, annulation de geste, données invalides, duplication, import/export et écran étroit.
- Comparaison d’isolation : positions, échelles, textures, visibilité et limites de tous les objets enregistrés dans le rendu, avant et après le geste.
- Construction de production validée ; 33 tests unitaires et 13 scénarios navigateur de l’éditeur réussis. Le test de caméra du jeu a également été vérifié pendant l’audit.
- Le test de fluidité contrôle plus de dix mises à jour successives du sprite sélectionné sans reconstruction du monde pendant le geste, puis une seule reconstruction à sa validation.

## Comportements conservés et portée

Modifier le sol adapte les éléments structurellement attachés au sol, notamment les drapeaux, ressorts et pieds des piliers. C’est une dépendance de support, distincte du placement automatique du décor désormais désactivé dans les parcours édités. Les éléments purement décoratifs restent à leurs coordonnées explicites.

L’aperçu reconstruit la scène à la validation des gestes et lors des changements structurels, avec regroupement des rafraîchissements ; les déplacements intermédiaires sont directs. Cet audit ne constitue pas un benchmark de performances sur téléphone physique. La sauvegarde reste locale au navigateur, avec import/export pour la conservation des fichiers. Les fichiers sources décoratifs masqués sont conservés dans le niveau et ne sont pas effacés par la migration.
