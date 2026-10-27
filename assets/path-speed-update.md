# Chemins et sensation de vitesse

Mise à jour du 26 octobre : l'affichage sélectionne désormais les décors selon leur encombrement, avec une marge entre les sprites et des zones dégagées autour du jeu. Les panneaux textuels et les détails redondants sont supprimés. Le zoom reste fixe ; l'anticipation est limitée à 60–100 px, le suivi est plus réactif et porte sur la position réelle du personnage dans les loopings. Les points bonus sont espacés des patrouilles et des drapeaux. La description du 25 octobre ci-dessous conserve l'historique de la première version.

25 octobre 2026 — complément de la revue V5.

## Décors des chemins

57 placements supplémentaires réutilisent les sprites du jeu en petits groupes asymétriques : roches et basalte au volcan, végétation et jeunes arbres à Mafate, plantes et arbustes fleuris sur la côte. Le parcours compte maintenant 195 placements décoratifs.

365 motifs légers dessinés par le moteur complètent les bordures : éclats de basalte, touffes d'herbe et petits fragments clairs sur la côte. Ces motifs sont placés sous l'arête de marche, également sur les voies hautes, pour donner des repères de défilement sans créer de faux obstacles.

Les groupes de sprites gardent une distance de 115 px avec les ravines, obstacles, ressorts, accélérateurs, panneaux et points de reprise. Les pentes trop raides sont exclues. Les détails n'ajoutent aucune collision et ne modifient ni les objets à ramasser ni la géométrie du parcours.

## Sensation de vitesse

- Cadre normal jusqu'à 360 px/s, puis élargissement progressif jusqu'à un zoom de 0,935 à 850 px/s.
- Anticipation de la caméra de 140 à 255 px dans le sens du déplacement.
- Transitions lissées sur environ 220 ms pour éviter un changement brutal au passage sur un accélérateur.
- Jusqu'à 15 filets d'air discrets dans le ciel et au bas de l'écran ; pas de voile ni de flou sur les réceptions.
- Petites projections de poussière dès 300 px/s, y compris pendant la course ; couleur adaptée à la région et historique limité à 16 émissions.
- Intensité stable pendant le looping, calculée à partir de la vitesse d'entrée plutôt que du changement de direction à chaque quart de tour.
- Panorama côtier borné à sa région pour éviter de répéter une bordure de palmier tronquée au milieu du ciel.

La préférence de réduction des mouvements désactive le zoom, les filets d'air et les projections. La pause fige les effets ; le redémarrage et une chute remettent le cadrage à zéro. Le fond couvre tout l'écran pendant le zoom et après un changement d'orientation sur téléphone.

La vitesse physique, les accélérations, les sauts et les chronos comparables restent ceux de V5 : le changement porte sur la perception et la lisibilité.

## Vérifications

Les tests de logique vérifient les limites de cadrage, le sens du regard, les placements et la protection des mécanismes. Les essais navigateur couvrent une traversée complète au clavier, le looping, les effets à pleine vitesse, la pause, le redémarrage, la réduction des mouvements, le tactile et la rotation d'un téléphone. Les trois régions ont été inspectées visuellement et la compilation de production passe.

Les ajouts sont définis dans `src/route-dressing.js` et `src/speed-feedback.js`. Les captures de contrôle sont locales dans `.local/speed-update/`. La génération des détails ne requiert ni nouvel appel à un modèle d'image ni nouvelle bibliothèque.
