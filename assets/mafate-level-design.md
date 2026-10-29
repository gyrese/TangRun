# Mafate (acte 2, X 16800 → 25200) — Level Design Document v3 « dense et lisible »

La v3 part de la v2 appliquée dans le dépôt : récit de la traversée à pied, choix visibles, pas de
ressort imposé, filet de sécurité court. Elle ajoute la **densité de la carte de référence** :
4 routes colorées, des couches empilées par paliers jusqu'à 4, 7 embranchements dont un croisement
en X, 3 loopings, 5 cascades liées chacune à un ouvrage, 2 fois plus de rencontres et un vrai
verrou de vitesse.

**Validation (copie sandbox, dépôt intact).** `patch-v3.mjs` lit l'état v2 du dépôt et écrit la v3
dans la sandbox. Les 73/73 tests Node passent, avec le nombre total de loopings attendu porté de 4 à 5.
Les simulations par route (`sim3.mjs`) donnent 15 parcours complets : aucune chute, aucun blocage.

Fichiers (dossier scratchpad) :
- `patch-v3.mjs` (données v3 en tête de fichier) ;
- `sim3.mjs` (routes, verrou, ressorts) ;
- `plan.mjs` (contrôle des décors).

---

## 0. Hypothèses (non validées par l'utilisateur)

| # | Décision | Raison |
|---|---|---|
| H1 | **3 loopings dans Mafate**, 5 dans tout le jeu. Le test passe de `loops.length` 4 à 5 (`tests/adventure.test.js` l.23 et l.52 ; fait par le patch dans la sandbox). | Chaque looping a un rôle distinct : apprendre l'élan, récompenser la route rapide, célébrer la convergence. Un 4e transformerait l'acte en Saint-Gilles. |
| H2 | On garde les 2 accélérateurs de la v2 (17850 avant le looping 1, 24780 à la convergence finale). **Aucun accélérateur** ne sert le verrou de vitesse. | Le looping 1 exige 590 px/s, ce que la pente seule ne donne pas. La convergence finale est l'exception prévue par le game design. |
| H3 | Le verrou de vitesse repose sur la **roulade volontaire dans une pente douce** (pente ≤ 0,10 : le moteur n'y roule pas automatiquement). Avant le verrou, une montée à l'îlet fait retomber tout le monde sous 220 px/s. | Mesuré : en roulant, on arrive au bord à 553 px/s ; sans rouler, à 335 px/s. Le seuil est d'environ 470 px/s. Aucun autre levier ne sépare les joueurs, puisque la vitesse se conserve partout ailleurs. |
| H4 | Le croisement en X est **un rail croisé par une trajectoire** : le jet du ressort jaune traverse le canal orange par en dessous, puis l'arche jaune retombe sur le canal. | Deux rails qui se croisent violeraient la règle des 75 px entre routes superposées. |
| H5 | Les cascades restent à `top −180` (code actuel). La source visible de chaque cascade est une recommandation d'art (§9). | Il n'y a pas de décor de lèvre dans le dépôt. |
| H6 | E1 (rivière 1) et E2 (îlot flottant) s'excluent dans un même run. E3 (canal) se combine avec l'un ou l'autre. | C'est le dilemme du collectionneur (« prendre la crête fait perdre un emblème »). Un run « 1+3 » ou « 2+3 » est possible. Les trois emblèmes demandent deux runs. |

## 1. Ce qui manquait à la v2 et ce que la v3 ajoute

| v2 | v3 |
|---|---|
| Au plus 2 couches | Montée 1 → 2 → 3 → 1 (relâche) → 3 → **4** → 1 (convergence) |
| 4 embranchements | **7 embranchements** et 5 jonctions de retour, dont un **croisement en X** |
| 2 loopings | 3 loopings, chacun avec un rôle |
| 4 cascades | 5 cascades : pont, brèche, ravine sous passerelle, brèche, déversoir |
| 7 ennemis, 2 évents | 9 ennemis (5 au sol, 4 sur route), 2 vannes, ennemis placés pour forcer une décision |
| Verrou = saut au bon moment | **Verrou de vitesse réel**, ouvert par la roulade (553 contre 335 px/s, seuil ≈ 470) |
| 1 secret | 3 raccourcis jaunes (pont de lianes, îlot flottant, arche de Trois-Roches) |
| Une seule rivière | 2 biefs courts, chacun avec sa sortie |

## 2. Intention (reprise de la v2, densifiée)

- **Fantasme** : traverser Mafate à pied. On saute de passerelle en passerelle, on lit le terrain et
  on choisit sa route (rivière, sentier, îlot ou canal).
- **Moment mémorable** : les **étages de Trois-Roches**, X 23500–24300. Quatre couches sont visibles
  dans le même cadre : la rivière et sa gorge, la passerelle et sa brèche, le canal et son déversoir,
  l'arche jaune. La cascade du déversoir tombe à travers les quatre.
- **Ce que l'acte teste** : la précision (brèches, ravines à 330 px/s), la lecture d'une couche, la
  roulade dosée (verrou). Il ne refait ni la montée par ressorts du volcan, ni l'enchaînement de
  loopings de Saint-Gilles.
- **Durée** : 14 à 21 s pour le robot de test (mesuré). Pour un joueur humain, estimation de 25 à 40 s.

## 3. Les 4 routes

| Couleur | Support | Étendue X (% de l'acte) | Rôle | Récompense | Coût |
|---|---|---|---|---|---|
| **Rouge** | sol, passerelles (Y 500), îlet (Y 230), passerelle de Trois-Roches (Y 500) | 16800–25200 (100 %) | chemin principal balisé | sécurité, réserve | 2 brèches à sauter, 3 ennemis |
| **Rose** | sol de la rivière des Galets (Y 660) | bief 1 : 18550–20220 (21–40 %) · bief 2 : 22400–24550 (67–92 %) | filet de sécurité : on y tombe | **E1** (bief 1), bouclier (bief 2) | ravines 2 et 3, mortelles |
| **Orange** | canal des Orangers, rail Y 248–350 | 22675–24700 (70–94 %) | route rapide et de maîtrise | **E3**, looping du canal, évite la ravine 3 et la brèche 2 | 2 vannes, 1 crabe ; accès uniquement par le verrou de vitesse |
| **Jaune** | J1 pont de lianes (Y 370) · J3 îlot flottant (Y 200) · J5 arche de Trois-Roches (Y 220) | 16960–17330 · 19700–20720 · 23000–24300 | raccourcis secrets, toujours atteints par un saut volontaire | J1 : franchir la ravine 1 sans risque · J3 : **E2** · J5 : rejoint l'orange **sans le verrou** | — |

Couches simultanées : 3 à 19700–20220 (rivière, passerelle, rocher), 3 à 22675–23500 (rivière,
passerelle, canal), **4 à 23500–24300** (rivière, passerelle, canal, arche).

## 4. Diagramme de flux (couleurs : R rouge, P rose, O orange, J jaune)

```
X 16800      17160      18150  18550  18900    19500   20130 20220     21000   21400       22400  22675   23050  23230  23350  23900     24350 24550  25000 25200
   │ R═══════╦══ravine1══╦═R══LOOP1═R══╦═R══brèche1══R═════════R══════╦R═montée═R îlet═R══lacet══bord═══R(passerelle Y500)═══brèche2══R═══════════════╦R═══LOOP3══►
   │         ║J1 pont    ║             ║     │ (rate)       J3 rocher ║                     (roule!)│                   │J5 rocher    │(rate)          ║
   │         ╚══J═lianes═╝             ║     ▼                ↑ressort ║                          │saut ≥470 px/s     ↑ressort      ▼                ║
   │                                   ║  P══E1══ravine2══P═ressort═▲  ║                          ▼                   ┊X            P═══ravine3══P═ressort═▲
   │                                   ║                   J══îlot E2══╝(retombe sur l'îlet)  O═LOOP2══vanne═════════┊═E3 déversoir═══vanne══O══(chute)═╝
   │                                   ║                                                                            J═══arche═══════════╗(retombe sur O)
   └ 1 couche ───────────────┘ 2 ───────────── 3 ─────────────┘ 1 (relâche + élan) ┘ 3 ─────────────── 4 ─────────────────────┘ 1 convergence
```

Coupe des couches à X 23700 (le moment mémorable), Y vers le bas :

```
Y 220  J ═══ arche de Trois-Roches ═══════════  (on y arrive par le ressort du rocher 2, en traversant le canal = X)
Y 330  O ═══ canal ═══ E3 ═▼ déversoir ═══════  (cascade C5 de 120 px sous le rail)
Y 500  R ═══ passerelle ══╡brèche╞══ passerelle  (C4 tombe dans la brèche 23350–23500)
Y 660  P ███ rivière ███▓ravine 3▓███ ressort ┃mur 24550
écarts : 110 / 170 / 160 px (≥ 75 entre routes, ≥ 65 au-dessus du sol : minimum mesuré 80)
```

## 5. Embranchements (choix visible depuis le point de choix)

| ID | X | Principal (clair) | Option | Ce qu'on voit depuis le point de choix | Gain |
|---|---|---|---|---|---|
| J1 | 16960 | sauter la ravine 1 (125 px) | sauter sur la marche (80 px), puis le **pont de lianes** Y 370 au-dessus de la ravine et de sa cascade | arc d'éclats qui monte, pont sur la cascade | franchissement sans risque, éclats |
| J2 | 18900 | sauter la **brèche 1** (150 px) | tomber dans la rivière (bief 1) | E1 sur les galets, 105 px plus bas | **E1** (vulnérable à la ravine 2) |
| J3 | 19700 | rester sur la passerelle | sauter sur le **rocher** (+80), puis ressort (P 900) vers l'**îlot flottant** | panneau, arc d'éclats, îlot avec E2 à 220 px au-dessus | **E2**, la passerelle évite le crabe 20100 |
| J4 | 22400 | ne pas sauter, retomber sur la passerelle de Trois-Roches | **sauter au bord** à ≥ 470 px/s → **canal** (orange) | entrée du canal à 275 px du bord, arc d'éclats | **E3**, looping 2, évite la brèche 2 et la ravine 3 |
| J5 | 23000 | rester sur la passerelle (crabe 23150 en dessous) | sauter sur le **rocher 2** (+80), ressort, **croisement en X** à travers le canal, arche jaune | rocher, jet d'éclats qui traverse le canal, arche au-dessus | rejoindre l'orange **sans le verrou**, éviter le crabe |
| J6 | 23350 | sauter la **brèche 2** (150 px) | tomber dans le bief 2 | cascade C4 dans la brèche, rivière, bouclier | bouclier (ravine 3 mortelle) |
| J7 | 24350–24700 | **convergence** : passerelle à fleur, ressort du bief 2, chute du canal, chute de l'arche sur le canal | — | balises, accélérateur, looping final | looping 3 |

Jonctions de retour :
- ressort du bief 1 (20020) → îlet ;
- chute de l'îlot flottant (20720) → montée ;
- arche → canal (24300) ;
- ressort du bief 2 (24350) → convergence ;
- chute du canal (24700) → convergence.

## 6. Rencontres

| ID | X (surface) | Type | Décision imposée |
|---|---|---|---|
| E-1 | 17550 (pente) | crabe | apprendre que la roulade le détruit (roulade automatique en pente) |
| E-2 | 20100 (passerelle) | crabe | le prendre en roulant, ou le contourner par le rocher J3 |
| E-3 | 20330 (pied de la montée) | crabe | rouler, ou sauter avant la montée |
| E-4 | 21700 (lacet) | crabe | **roulade** : on le détruit et on garde l'élan ; **sans roulade** : il faut le sauter et on perd la vitesse du verrou |
| E-5 | 22080 (lacet) | crabe | idem, plus près du bord |
| E-6 | 22250 (plat avant le bord) | drone | punit le saut trop tôt (il vole à hauteur de saut) |
| E-7 | 23150 (passerelle, sous le rocher 2) | crabe | rouler, ou monter sur le rocher (J5) |
| E-8 | 23650 (canal) | crabe | route rapide : rouler ou sauter à grande vitesse |
| E-9 | 24150 (passerelle après la brèche 2) | drone | rester au sol après la brèche |
| V-1 / V-2 | 23450 / 24250 (canal) | vannes, préavis 0,9 s | temporiser sur la route rapide. V-1 est à 400 px de la sortie du looping. |
| R1 / R2 / R3 | 17160 / 19500 / 23900 | ravines de 125 / 135 / 145 px | sauter ; chaque ravine a une cascade, un panneau et un arc d'éclats |

Mesures (robot, éclats ramassés) :
- **avec roulade** : 0 coup sur toutes les routes ;
- **sans roulade** : 2 coups (E-4 et E-7), survivables, pour environ 21 s au lieu de 18.

Réserve à 18350 (avant la passerelle), bouclier à 23500 (zone de chute du bief 2).
Ennemis dans tout le jeu : 25.

## 7. Rythme (temps robot, route rouge avec roulade et route orange)

```
tension ▁▃▂▄▅▆▅▃▂▃▄▅▆▇▅▆█▇▅▄▃
t (s)   0   1   3   5   6   7   8   10  12  13  14  15  16  17  18
        porte·L1│passerelle/rivière│îlot│relâche îlet│lacet│bord│Trois-Roches 4 couches│convergence·L3
```

| t | X | Moment | Tension |
|---|---|---|---|
| 0,9 | 17160 | J1 ou ravine 1 | moyenne |
| 3,1 | 18150 | looping 1 | moyenne |
| 5,1 | 18900 | brèche 1 (J2) | haute |
| 5,8–6,8 | 19500–20220 | ravine 2 en bas, rocher J3 en haut (3 couches) | haute |
| 7,9 | 20800 | montée à l'îlet | moyenne (frein) |
| 9,7 | 21400 | îlet de Marla (case créole, reprise) | **basse (relâche)** |
| 9,7–11,9 | 21400–22400 | lacet : rouler ou pas, 2 crabes, 1 drone | montante |
| 11,9 | 22400 | **bord (J4)** | haute |
| 13–15,4 | 23050–23900 | looping 2 ou brèche 2, rocher 2, 4 couches, déversoir | **pic** |
| 15,8–16,8 | 24550–25000 | convergence, looping 3 | moyenne |
| 18 | 25200 | vers Saint-Gilles | basse |

## 8. Récit et repères

- **Balises GR** blanc-rouge sur le rouge. Marques jaunes sur la marche J1, les rochers J3 et J5,
  l'îlot et l'arche. Le canal porte un garde-corps de conduite.
- Les **passerelles cassées** (planches arrachées, cordes pendantes) ont chacune une cascade qui tombe
  dans la brèche (C2, C4) : la crue a emporté le tablier.
- **Îlet de Marla** (21000–21400) : case créole, fougère arborescente, reprise. C'est le seul endroit
  plat et habité, donc le moment de relâche.
- **Lacet** : un sentier de terre en pente douce, avec un panneau « Roule dans le lacet ». C'est l'élan
  qu'on gagne soi-même.
- **Canal des Orangers** : de l'eau court sur le rail. Le déversoir (C5) tombe dans la gorge de
  Trois-Roches, c'est-à-dire la ravine 3.
- **Audio** :
  - grondement de la rivière qui monte sur les passerelles ;
  - craquement de bois avant chaque brèche ;
  - relâche (kayamb) sur l'îlet ;
  - montée sonore au bord ;
  - eau du canal et sifflement 0,9 s avant chaque vanne ;
  - pic sonore à la cascade de Trois-Roches ;
  - fondu vers le ressac à partir de 24800.

## 9. Blockout v3 (données exactes, celles de `patch-v3.mjs`)

### 9.1 Sol (STRIPS, zone 2)
```js
[[16150,450],[17160,450]],
[[17285,450],[17400,450],[17700,500],[18550,500],[18550,660],[19500,660]],
[[19635,660],[20220,660],[20220,500],[20300,500],[21000,230],[21400,230],
 [22250,286],[22400,286],[22400,660],[23900,660]],
[[24045,660],[24550,660],[24550,500],[24750,420],[25200,420]],
```
- **Ravines** : [17160,17285] 125 · [19500,19635] 135 · [23900,24045] 145.
- **Murs voulus** : 20220 (fin du bief 1) et 24550 (fin du bief 2), chacun avec son ressort 200 px avant.
- **Montée** : 20300–21000, de Y 500 à 230. Elle fait retomber un coureur arrivé à 780 px/s sous 220 px/s, donc il cesse de rouler.
- **Lacet** : 21400–22250, de Y 230 à 286, pente maximale 0,099. Il est suivi d'un plat 22250–22400 (le bord).

### 9.2 Rails
```js
{route:'mafate-sky',  style:'ropebridge',sections:[[[20300,200],[20680,200],[20720,210]]]},  // J3 îlot flottant
{route:'mafate-crest',style:'ropebridge',sections:[[[22675,248],[22800,248],[22950,300],[23150,300],
                                                    [23250,330],[24400,330],[24600,345],[24700,350]]]}, // O canal
{route:'mafate-arch', style:'ropebridge',sections:[[[23500,220],[24150,220],[24300,250]]]},  // J5 arche
```

### 9.3 Plates-formes non-rail (découpées en morceaux de 215 px au plus)
| Route | Style | X | Y | Brèche | Rôle |
|---|---|---|---|---|---|
| mafate-gate | basalt puis ropebridge | 16960–17120 puis 17120–17330 | 370 | — | J1, marche et pont de lianes |
| mafate | ropebridge | 18552–20220 | 500 | 18900–19050 | passerelle de la rivière (J2) |
| mafate-ledge | basalt | 19700–20150 | 420 | — | rocher J3 (80 px au-dessus de la passerelle) |
| mafate-trois | ropebridge | 22402–24550 | 500 | 23350–23500 | passerelle de Trois-Roches (J6) |
| mafate-ledge2 | basalt | 23000–23250 | 420 | — | rocher J5 (90 px sous le canal) |

### 9.4 Mécanismes
| Élément | Données | Mesure |
|---|---|---|
| Ressort J3 | x 20130, sur `mafate-ledge`, P 900 | atterrit sur l'îlot de 330 à 780 px/s ; E2 ramassé à toutes les vitesses (en vol à 780) |
| Ressort bief 1 | x 20020, au sol, P 900 | franchit le mur de 20220 et atterrit sur la montée |
| Ressort J5 | x 23230, sur `mafate-ledge2`, P 900 | traverse le canal par en dessous (X) et atterrit sur l'arche de 330 à 500 px/s ; à 780, le joueur saute trop loin et reste rouge |
| Ressort bief 2 | x 24350, au sol, P 900 | franchit le mur de 24550 et atterrit dans la convergence |
| Looping 1 `col-loop` | x 18150, baseY 500 (sol) | accélérateur 17850 |
| Looping 2 `canal-loop` | x 23050, baseY 300, surface `mafate-crest` | la descente du canal 248→300 donne ≈ 700 px/s à l'entrée |
| Looping 3 `maido-loop` | x 25000, baseY 420 (sol) | accélérateur 24780 |
| Verrou J4 | bord 22400 (Y 286) → canal à 22675 (Y 248) | **passe à partir de 470 px/s** (saut au bord) et de 510 px/s (saut 40 px avant) ; échoue en dessous de 450 |

### 9.5 Vitesse au bord (mesurée)
| Arrivée sur l'îlet | Sans roulade | Roulade dans le lacet |
|---|---|---|
| à l'arrêt (reprise) | 335 | 553 |
| 330 | 335 | 553 |
| 780 en roulant (passerelle) | 335 | 553 |
| 420 (sortie de ressort) | 335 | 553 |

Le résultat ne dépend pas de la route d'arrivée : seule la roulade dans le lacet compte. C'est donc
une action volontaire, sans accélérateur.

### 9.6 Reprises, emblèmes, ennemis, vannes, moniteurs, décors
- **Reprises** (sol plat) : 16900, 17400, 18450, 21050 (îlet), 22320 (plat du bord), 24800.
- **Emblèmes** :
  - E1 : `[19200, floor−55]`, rivière 1 ;
  - E2 : `[20660, rail('mafate-sky')−50]` ;
  - E3 : `[23972, rail('mafate-crest')−40]`, au déversoir.
- **Ennemis au sol** (`enemySockets` zone 2, dans cet ordre, car le type dépend de l'indice) :
  `17550, 21700, 22250, 20330, 22080`, soit crabe, crabe, drone, crabe, crabe.
- **Ennemis sur route** :
  `['mafate',20100,'crab'], ['mafate-trois',23150,'crab'], ['mafate-crest',23650,'crab'], ['mafate-trois',24150,'drone']`.
- **Vannes** : `['mafate-crest',23450], ['mafate-crest',24250]`.
- **Moniteurs** (cibles) : `18350` (réserve), `23700`, placé automatiquement en 23500 (bouclier).
- **Cascades** `[x,largeur]`, chacune liée à un ouvrage :

  | Cascade | Position | Ouvrage |
  |---|---|---|
  | C1 | `[17222,64]` | pont de lianes J1 sur la ravine 1 |
  | C2 | `[18975,48]` | brèche 1 |
  | C3 | `[19567,64]` | ravine 2 sous la passerelle |
  | C4 | `[23425,48]` | brèche 2 |
  | C5 | `[23972,120]` | déversoir du canal dans la ravine 3 |

  Sources d'art recommandées (top) : 150, 280, 300, 300, et 270 pour C5 (sous le rail du canal).
- **Repères de décor** (acceptés par `planScenery`) : `['tamarin',17800,.8]`, `['case-creole',21250,.6]`, `['fern',21500,.6]`.
- **Arcs d'éclats** (guidage) :
  - marche J1 ;
  - brèche 1 ;
  - descente vers E1 ;
  - montée sur le rocher J3 ;
  - trajectoire du ressort vers l'îlot ;
  - bord → canal (6 éclats) ;
  - montée sur le rocher J5 ;
  - **jet en X à travers le canal** (23300,380 → 23480,190).

### 9.7 Panneaux
| x | Texte |
|---|---|
| 18350 | Passerelle cassée ↗ saute · ou descends à la rivière ↓ |
| 19600 | ↗ Rocher · îlot flottant |
| 19850 | ↑ Ressort · remonte au sentier |
| 21000 | ↓ Roule dans le lacet · élan pour le canal |
| 22150 | Saute au bord ↗ si tu as l'élan |
| 22850 | ↗ Rocher · arche des Trois-Roches |
| 24300 | ↑ Ressort · rejoins la sortie |
| 24800 | Dernier looping → Saint-Gilles |

Les panneaux automatiques « Ravine » restent à 16860, 19200 et 23600.

### 9.8 Chapitres
| X | Nom |
|---|---|
| 16800–18550 | La porte du cirque |
| 18550–21100 | La Rivière des Galets |
| 21100–25200 | Les étages de Trois-Roches |

## 10. Résultats de simulation (robot qui saute aux ravines signalées ; éclats ramassés)

| Route | Temps | Coups | Emblèmes | Loopings |
|---|---|---|---|---|
| Défaut (ne fait que courir) | 19,6 s | 2 | E1 | 1, 3 |
| Défaut + roulade | 17,7 | 0 | E1 | 1, 3 |
| Rouge + roulade | 17,9 | 0 | — | 1, 3 |
| Rouge sans roulade | 21,3 | 2 | — | 1, 3 |
| **Orange** (roulade + saut au bord) | 18,1 | 0 | E3 | 1, 2, 3 |
| Saut au bord sans roulade | 21,1 | 2 | — (reste rouge) | 1, 3 |
| Rivière 1 + orange | 16,3 | 0 | **E1 + E3** | 1, 2, 3 |
| Îlot J3 + orange | 14,8 | 1 | **E2 + E3** | 1, 2, 3 |
| Arche J5 (X) → canal | 18,2 | 0 | — | 1, 3 |
| Rivière 2 (brèche 2 ratée) | 17,8 | 0 | — | 1, 3 |

Aucune chute ni blocage, y compris depuis chaque reprise (tests).

## 11. Ce qu'il reste à faire hors données
1. Appliquer le patch au dépôt, puis lancer `npm run build` et faire de nouvelles captures (`verify-adventure.mjs`). Ni le build navigateur ni l'essai humain n'ont été faits.
2. Art : bouts cassés des brèches, eau sur le canal, galets et eau dans les biefs, balises jaunes sur les rochers.
3. Optionnel : une hauteur de départ par cascade (H5).
4. Essai humain : vérifier que la roulade dans le lacet se comprend sans tutoriel (panneau 21000 et arc d'éclats).

---

## Corrections du game designer appliquées (29 octobre 2026)

1. **Identité distincte de Saint-Gilles** : `col-loop` et `maido-loop` sont supprimés, ainsi que les accélérateurs 17850 et 24780. Il reste un seul looping à Mafate (`canal-loop`), 3 au total dans le jeu (test mis à jour).
2. **Canal = chrono, arche = emblème** : E3 est déplacé au sommet de l'arche (23800, Y 172). L'écart de 4 s visé entre le canal et la route rouge avec roulade n'est pas atteignable : le canal ne couvre qu'environ 2000 px en fin d'acte. Mesuré : 18,1 s contre 18,7 s. Deux accélérateurs sur le canal n'apportaient que 0,2 s ; ils ont été retirés.
3. **Rivière et canal lisibles** : le lit des deux biefs (`level.rivers`) est fait de galets sous une bande d'eau. La route `mafate-crest` prend le style `canal` : mur maçonné et lame d'eau. Des reflets animés courent sur les deux (`ravine-art.js`).
4. **Bief 2** : la ravine 3 passe à 24100–24245, avec un arc d'élan avant le bord. Le ressort de sortie passe à 24430, la cascade 5 à 24172, et le drone de la passerelle 2 à 23800.
5. **Éclats guidés** : plus de lignes automatiques sur les plates-formes de Mafate. Les passerelles ont 1 éclat / 100 px, le canal 1 / 250 px, et le lit de la rivière n'en a qu'autour de E1. Les arcs d'appel sont posés à la main.

Évents de Mafate : vannes en pierre avec jet d'eau (`adventure-art.js`).
