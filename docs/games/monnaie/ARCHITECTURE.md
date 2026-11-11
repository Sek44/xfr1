# Monnaie — Architecture actuelle

## Modules

- `monnaie.html` : point d'entrée de l'exercice, bandeau commun, chargement des services et du thème ; `monnaie.css` : mise en page compacte des billets/pièces, de la zone de sélection et des grilles responsives. Les pièces sont des boutons transparents de 46 px ; les billets sélectionnables et sélectionnés sont également sans cadre. La zone de réponse réserve 96 px minimum pour deux lignes, et les choix n'ont pas de titres visibles. Les grilles passent de 4/3 à 8/6 colonnes sur écran large.
- `monnaie-model.js` : dénominations réelles en **centimes entiers**, choix des dix questions, garde-fous de validité, ajout/retrait immuables et calcul du total. Ce modèle ne manipule pas le DOM et est également exporté pour les tests Node.
- `monnaie-art.js` : représentation SVG des pièces circulaires (cuivre, jaune, bimétallique, contour plus fin pour les centimes) et billets rectangulaires (couleur distinctive par valeur, détails gravés et cartouche clair qui isole le montant), sans images distantes.
- `monnaie.js` : contrôleur, affichage de la question et du panier, vérification, sauvegarde/reprise et navigation. Le billet de la question est réduit à 69 % de sa largeur de référence et placé à droite du texte sur deux lignes « Le client donne ». Le nombre d'éléments du panier reste annoncé au lecteur d'écran sans être affiché. Les boutons de dénomination restent dans le DOM entre deux ajouts consécutifs pour prendre en charge les taps rapides.
- `game-common.js` : `ExerciseGame.progress()`, score du premier essai, validation, minuteur et écran de fin. `ExerciseGame.resultTracker("monnaie", …)` sauvegarde et crédite la série de façon idempotente.
- `game-state.js`, `scores.js`, `score-view.js`, `daily-exercises.js` : état local, historique commun, consultation des scores en iframe et crédit quotidien. Le bandeau vient de `academy-header.js`, et les styles partagés de `styles/themes/magical-academy/components.css`.

Les sources des exercices résident à la racine du dépôt.

## Invariants

`makeQuestion()` choisit d'abord un billet parmi les six valeurs, puis un prix entier en centimes dans `[100, min(19999, billet - 1)]`. Toutes les questions ont un rendu strictement positif, et les couples billet/prix ne se répètent pas dans une série. `isCorrect()` compare une somme entière à `paid - price` : ni décimales flottantes ni rendu optimal imposé.

Le panier est une liste de valeurs de dénominations autorisées, incluant les doublons. Son ordre est systématiquement croissant, même après restauration, et le retrait se fait à l'index correspondant au bouton de la valeur affichée. `sortSelection()` réalise ce tri sans muter le tableau source. Les ajouts sont limités à 200 éléments pour empêcher une croissance sans borne de la session enregistrée. L'interface montre les valeurs individuelles, jamais `sum()`.

`GameState.create("monnaie")` conserve les dix questions, le panier, l'instant de correction et le snapshot du jeu. Une restauration vérifie les bornes, les dénominations et l'unicité des questions ; les états impossibles sont écartés. Un score enregistré utilise `tab: "monnaie"`, `category: "Monnaie"` et un `resultId` stable. Les échecs d'écriture sont présentés sur la carte de résultat avec un bouton de réessai. `ScoreView.bind()` et `pagehide` suspendent et sauvegardent la progression, sans écouler de temps lors de la consultation des scores.

Voir [l'architecture transversale](../../ARCHITECTURE.md).
