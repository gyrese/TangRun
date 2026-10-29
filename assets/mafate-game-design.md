# Mafate (acte 3, X 16800 → 25200) : diagnostic et nouvelle vision

## 1. Diagnostic : pourquoi ce Mafate « n'a pas de sens »

**Pas d'intention, que des quotas.** Le plan a recopié les *chiffres* de la référence (1 → 2 → 3 → 4 couches, 4 loopings, 5 cascades) sans recopier *pourquoi* ces couches existent. Aucune phrase ne dit ce que le joueur doit vivre. Résultat : des étages empilés parce que « la carte en avait quatre ».

**Les choix sont faux (SDT, autonomie nulle).**
- Ressort de l'îlot `x:19560` posé *sur* le rail `mafate` : `movement.js` l. 168 le déclenche à chaque passage au sol. L'îlot « secret » est imposé à tout le monde, et pour l'éviter il faut *sauter* : le choix est inversé.
- Même chose pour le ressort de la crête `x:22850` vers `mafate-canopy` : l'emblème « de maîtrise » ne demande aucune maîtrise.
- Le verrou de vitesse de la rampe 20650–20900 se franchit « avec l'accélérateur et le looping 2 », qui sont tous deux sur la route obligatoire. Le verrou s'ouvre donc tout seul, sans geste du joueur.
- Le trou du sentier suspendu (19280–19400) fait tomber dans la vallée basse : 2000 px, une seule sortie (le ressort 21340). L'échec le plus fréquent devient le plus cher, ce qui viole le rapport coût/fréquence.

**Les couches sont illisibles.** Sur les captures 03, 06, 07, 08 et 09, toutes les routes ont le même rendu (arches de basalte gris moussu, style `ropebridge` qui ne montre pas de lianes). Les éclats sont posés en lignes régulières sur *chaque* couche (capture 09 : trois rangées identiques). Ils ne guident pas le regard et ne hiérarchisent rien. Sur la capture 09, la grotte (Y 520) et le sol (Y 600) ne sont qu'à 80 px l'un de l'autre, moins qu'un saut : ce sont deux couches qui se lisent comme une seule. Les récompenses sont invisibles depuis le point de choix (emblème de la canopée hors champ).

**Aucun lien avec le lieu.** Mafate est un cirque fermé, sans route, où l'on circule à pied : on descend un rempart par des lacets, on traverse des îlets habités, on longe la rivière des Galets, on franchit des passerelles. Le niveau, lui, part de Y 450 et finit à Y 420. Le profil est plat, sans descente ni fond du cirque. La rivière n'existe pas : le sol bas est une prairie verte uniforme (captures 01, 07, 12) et les cascades tombent dans le vide sans eau en bas (colonnade, capture 03). La seule case créole apparaît au sprint final.

**L'acte prend l'identité de ses voisins.** `level.js` annonce Mafate comme « Choisir sa route et maîtriser les appuis · Précision ». Or l'acte enchaîne 4 loopings et 3 accélérateurs, c'est-à-dire la grammaire de Saint-Gilles (« Enchaîner vitesse, looping et toits »). La précision n'est mise à l'épreuve qu'une fois, par la ravine 3. La courbe Volcan (ascension) → Mafate → Côte (maîtrise de la vitesse) n'a donc pas de marche intermédiaire.

**Durée irréaliste.** 8400 px à 330 px/s (vitesse de base) donnent environ 25 s. Les cibles de 45 à 60 s (§8 du plan) supposeraient une moyenne de 140 à 190 px/s. *Hypothèse retenue :* l'acte dure **22 à 32 s** selon la route, sauf si l'on allonge la zone.

## 2. Vision de l'acte : « La traversée à pied »

**Fantasme.** « Je suis le petit tangue qui traverse Mafate là où aucune voiture ne passe : je dévale le rempart, je saute de passerelle en passerelle, et je ressors par le sentier taillé dans la falaise. »

**Piliers.**
1. **Le sentier d'abord.** La route principale *est* le GR de Mafate : des lacets, des passerelles, des îlets. Lisible, juste, toujours récupérable.
2. **Précision plutôt que vitesse.** C'est le seul acte où ralentir est une stratégie. Les ravines s'élargissent (125 / 135 / 145) et les sauts entre passerelles se jouent à la vitesse de base.
3. **L'eau guide.** Chaque cascade signale quelque chose : un passage, un secret, une convergence. La rivière des Galets forme la couche basse, qui a toujours de l'eau en bas.

**Esthétiques (MDA).** Découverte (le cirque se révèle), Défi (précision) et Sensation au moment du grand saut. Arc émotionnel : *vertige* (descente) → *calme habité* (îlet) → *concentration* (passerelles) → *émerveillement* (grande cascade) → *soulagement* et *élan* (sortie vers l'océan).

**Moment unique.** **Le grand saut de la cascade.** Les trois routes se rejoignent sur la lèvre de la grande chute, à l'îlet de la cascade. On peut descendre par les corniches le long de l'eau, ou plonger : une chute verticale d'environ 240 px le long du rideau d'eau, avec une colonne d'éclats, jusque dans le bassin. C'est le seul grand plongeon du jeu.

**Ce que l'acte enseigne et teste.** Il apprend à *lire une couche* (ce qui est au-dessus est plus rapide, ce qui est en dessous rattrape), à sauter avec précision à vitesse de base et à doser la roulade pour garder l'élan d'une pente. **Ce qu'il ne refait pas :** pas de longue ascension par ressorts (c'est le volcan), au plus **1 looping** et **0 accélérateur sur la route principale** (c'est Saint-Gilles), pas d'évents de lave.

## 3. Système des routes

| Couche | Support | Rôle | Entrée | Sortie | Coûte | Rapporte |
|---|---|---|---|---|---|---|
| **Haute : la crête du rempart** | rails Y 300–360 | la plus rapide, la plus exposée | *active* : saut d'élan au-dessus d'un vide de 420 px (il faut ≥ 600 px/s, élan gagné en roulant dans les lacets) | redescente passive sur le sentier | précision à pleine vitesse, peu d'éclats, aucun bouclier | **−5 à −7 s** |
| **Principale : le sentier des îlets** | rails Y 440–500 (passerelles) + îlets plats | la référence, la plus riche | par défaut | — | — | le plus d'éclats, les 2 réserves/boucliers, les reprises |
| **Basse : la rivière des Galets** | sol Y 640–700, gués et rochers | filet de sécurité, peuplé | *passive* : chute d'une passerelle ratée | 1 ressort au bout de chaque bief (2 biefs courts de ≤ 900 px) | **+4 à +6 s**, crabes, gouffres (largeur 125 / 135, mortels) | **emblème 1** (sous la cascade du bief 1) + 1 bouclier |
| **Secrète** (2 tronçons) | rail court ou îlot | curiosité | *saut volontaire* | chute contrôlée | un écart de trajectoire | **emblèmes 2 et 3** |

Secrets :
- **S1, la grotte derrière la grande cascade.** Une corniche Y 560 cachée derrière le rideau d'eau. On y arrive par un petit saut vers le bas depuis la deuxième corniche du sentier. L'emblème brille à travers l'eau.
- **S2, l'îlet perché.** Un îlot Y 230 avec un tamarin et une case. On l'atteint par un ressort posé sur une **marche latérale de 80 px**, donc seulement si l'on saute dessus, jamais en passant.

Règles anti-dominance :
- **Aucun ressort ni accélérateur sur une route obligatoire**, sauf la sortie finale qui réunit volontairement tout le monde. Tout ressort facultatif est posé sur une marche qu'il faut sauter.
- Chaque route a sa monnaie : la crête rapporte du temps, la rivière un emblème et un bouclier, les secrets des emblèmes, le sentier les éclats et la sécurité. Prendre la crête fait perdre 2 emblèmes sur 3, ce qui crée la tension Achiever/Competitor (Bartle).
- Rater une couche haute fait tomber sur la couche juste en dessous (≥ 75 px plus bas, ≥ 110 px pour qu'elles restent indépendantes). Seuls les gouffres de la rivière et la ravine du balcon sont mortels.

Lisibilité :
- La récompense est **visible depuis le point de choix**, dans les 1440 px de l'écran : emblème en hauteur, arc d'éclats qui monte vers l'entrée.
- Chaque couche a sa matière. Crête : basalte nu et ciel. Sentier : passerelles de cordes et de planches, fougères. Rivière : galets clairs et eau.
- Les éclats ne sont plus en lignes uniformes : ils dessinent les **trajectoires** (arcs de saut, colonne du plongeon).
- Les panneaux parlent du lieu : « Îlet à Malheur », « Passerelle », « Rempart · garde l'élan ».

## 4. Séquences et rythme

| Séq. | X | Couches | Contenu |
|---|---|---|---|
| I. Descente du rempart | 16800–18600 | 1 → 2 | Sol de Y 450 à Y 640 en 3 lacets (pentes et paliers). La roulade garde l'élan. Lèvre à 17700 puis vide de 420 px vers la crête (18120, Y 380). Raté : on atterrit sur le lacet suivant. |
| II. Îlet 1 et passerelles | 18600–21300 | 3 | Îlet 1 (reprise, case, bouclier). 4 passerelles séparées de 180 à 230 px (jouables à 330 px/s). Raté : on tombe dans la rivière, bief 1, avec cascade et emblème 1. Ressort de sortie à environ 20900 (P ≈ 900, h ≈ 260). La crête redescend vers 21000. S2 vers 20300. |
| III. La grande cascade | 21300–23400 | 3 → 1 → 2 | **Convergence** sur l'îlet de la cascade (reprise). **Grand saut** dans le bassin (Y 700) ou corniches. S1 derrière le rideau. Bassin plat, puis **seul looping** de l'acte (22600, il faut ≥ 590 : la récompense du plongeon). Bief 2 de la rivière (gouffre 135). |
| IV. Canalisation des Orangers | 23400–25200 | 1 | Ressort de remontée unique (convergence forcée). Mur de sol derrière lui, comme le B10 actuel. Balcon taillé dans le rempart, plat, Y 420. **Ravine 145** au milieu (test final, à vitesse de course). Ouverture sur l'océan, raccord Y 420. |

Tension sur la route du sentier (≈ 26 s) :

```
tension
 haut |            ##                    ######
      |       ##  ####          ##      ########      ###
 moyen|  ######## #####  ##   #####    ##########   ######
      | ###      ##   ####  ######  ##           ## ##   ##
  bas |#                                           #      #
      +--I descente--|II îlet|passerelles|III saut/bassin|IV balcon--> t
       0s      5     8     11          17   19        23   26
```

On compte trois dents de scie : la descente monte puis l'îlet 1 offre un repos ; les passerelles montent puis la convergence en offre un autre ; le saut, le bassin et le bief 2 montent avant le repos au pied du ressort, puis la dernière montée sur le balcon. Chaque pic est un peu plus haut que le précédent, et les repos coïncident avec les reprises.

## 5. Récit environnemental

- **Rempart** (I) : grande paroi verte au premier plan, lacets de terre, vacoas accrochés. On *descend* dans le cirque, et le fond (la plaine verte actuelle) est remplacé par la vue plongeante sur les îlets.
- **Îlets** (II, III) : cases créoles, tamarins des Hauts, jardins. Ce sont les seuls endroits plats et habités, donc les repos et les reprises. Le jeu dit sans texte que « les gens vivent ici ».
- **Passerelles** (II) : les fameux ponts suspendus de Mafate, qui deviennent la mécanique centrale de précision.
- **Rivière des Galets** (bas) : lit de galets, gués, eau visible. Chaque cascade *tombe dans* la rivière.
- **Grande cascade** (III) : le repère de l'acte, visible de loin dès la fin de II.
- **Canalisation des Orangers** (IV) : le vrai sentier de sortie, taillé dans la falaise vers l'ouest. Il prépare l'arrivée sur la côte. *Hypothèse :* on préfère ce clin d'œil à la sortie par la rivière, qui obligerait à descendre alors que le raccord se fait plus haut (Y 420).

## 6. Critères de réussite

| Mesure | Cible |
|---|---|
| Temps sentier / crête / rivière | 24–28 s / 18–21 s / 29–33 s ; écart crête–sentier ≥ 5 s |
| Joueurs prenant la crête au 1er essai | 15–30 % (aucun en roulant mal, tous en roulant les 3 lacets) |
| Chutes dans la rivière, novices / au 3e essai | ≤ 50 % / ≤ 20 % |
| Découverte S1 / S2 (sessions bar, 3 essais) | 25–40 % / 35–50 % ; emblème 1 : ≥ 50 % |
| Morts par session dans l'acte (médiane) | ≤ 1, toutes sur les gouffres ou la ravine du balcon |
| Ressort franchi sans action du joueur | 1 seul (sortie IV) ; test automatique sur `level.springs` de la zone 2 |
| Verrou de la crête | raté à 450 px/s, réussi à 620 px/s, sans aucun accélérateur sur le chemin (simulation) |
| Lisibilité | en playtest, 4 joueurs sur 5 désignent correctement « la route rapide » et « où est l'emblème » sur une capture de chaque point de choix |
| Identité | ≤ 1 looping et 0 accélérateur sur la route principale de Mafate |
| Questionnaire de sortie | « je traversais Mafate » cité spontanément par ≥ 50 % des joueurs (décor reconnu) |

*Hypothèses signalées :* durée cible ramenée à environ 25 s (contrainte des 8400 px) ; sortie par la Canalisation des Orangers ; un looping conservé comme récompense du plongeon. Les positions et puissances de ressort (P = √(3100·h)) sont à valider avec le simulateur `scratchpad/sim.mjs` avant placement.
