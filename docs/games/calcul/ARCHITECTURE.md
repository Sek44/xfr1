# Calcul — Architecture actuelle

## Organisation

- `calcul.html` : structure de la page et ses dépendances ; `calcul.css` : disposition et responsive spécifiques aux listes catégorie/difficulté, à l’opération et au pavé numérique. Le bandeau provient de `academy-header.js` et les panneaux, boutons, marges et fontes communes de `styles/themes/magical-academy/components.css`.
- `calcul.js` : tables `levels` et `ranges`, génération des opérations, sélection des options, validation et restauration des données du jeu. Les sélecteurs ne déclenchent rien pour la valeur actuelle, restaurent immédiatement la sélection visuelle avant toute confirmation asynchrone et ne mettent à jour le paramètre qu’après `ExerciseGame.changeSettings` (si la série a commencé).
- `game-common.js` (`ExerciseGame`) : état de session, score au premier essai, correction, délai auto de 3 secondes, snapshot.
- `game-ui.js` : `GameUI.keypad` et `GameUI.editNumber` pour la saisie sur six chiffres au maximum. Les touches du pavé numérique utilisent `.academy-key` et l’aspect du clavier de Conjugaison, sans modifier leur disposition en trois colonnes. Le Backspace est rendu depuis la constante SVG unique `BACKSPACE_SVG` de `game-ui.js`, partagée avec le clavier AZERTY ; `keyboard.css` fournit ses dimensions et traits communs. `Tout effacer` utilise deux éléments de texte sur deux lignes, avec la typographie du contrôle `?123` adaptée dans `calcul.css`. `ExerciseGame.progress()` partage `Question x/10` et `Score x` avec les deux exercices de français ; `calcul.css` définit uniquement les espacements entre paramètres et progression.
- `game-state.js`, `score-view.js`, `scores.js` : sauvegarde de la session, suspension lors de la consultation des scores, enregistrement du résultat.

Ces fichiers sont à la racine du dépôt.

## Génération et invariants

`newSession` forme les combinaisons possibles entre plages du premier terme et valeurs autorisées du second, puis tire des paires distinctes `(a, b)`. Le tirage exige `min ≤ a ≤ max` et `a + b ≤ max`. La boucle tente d'obtenir jusqu'à 10 opérations, sans recommencer un même couple.

Si aucune combinaison n'est possible, le contrôleur crée une session sans question et l'écran présente une explication au lieu d'un calcul.

## Session et persistance

`GameState.create("calcul")` stocke `range`, `category`, `questions`, `answer` et `progress`. La restauration vérifie la validité de la catégorie, de la difficulté, des additions et de leur résultat, la taille de session et l'entrée numérique.

`ExerciseGame.create` pilote l'avancement et appelle `ExerciseScores.save` et `DailyExercises.award("calcul")` une seule fois en fin de session avec `tab: "math"` et une catégorie décrivant le choix. `ScoreView.bind` suspend/reprend la minuterie ; `pagehide` sauvegarde. La session terminée est effacée sans retirer l'historique.

La politique commune de données est dans [l'architecture transversale](../../ARCHITECTURE.md). Travaux ouverts : [backlog](BACKLOG.md).
