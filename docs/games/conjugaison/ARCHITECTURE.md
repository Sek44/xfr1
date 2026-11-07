# Conjugaison — Architecture actuelle

## Fichiers et modules

- `conjugaison.html` : structure de la page et navigation fournie par `academy-header.js` ; `styles/themes/magical-academy/conjugaison.css` : uniquement le cartouche du temps, la disposition du verbe et les adaptations du clavier AZERTY et de la zone de saisie. Les cadres, boutons, pastilles Question/Score, marges, fontes et illustrations de navigation sont partagés via `styles/themes/magical-academy/classic.css`. Les touches et le comportement du clavier restent mutualisés dans `keyboard.css` et `game-ui.js` (racine). Les deux onglets de groupe sont produits par `GameUI.tabs()` dans `#conjugaison-tabs`, avec les plaques CSS-only `.academy-tabs .academy-tab` bleu saphir et doré, partagées avec Français et Scores, tandis que la progression `Question x/10` et `Score x` est produite directement par `ExerciseGame.progress()` sans ajustement propre à Conjugaison. Les anciennes feuilles `conjugaison-v3.css` et `conjugaison.css` de la racine ont été supprimées.
- `conjugaison-data.js` (`ConjugaisonData`) : banques du 1er groupe et de 22 verbes réguliers du 2e groupe (`ir`), compléments, personnes, règles de conjugaison, sélection par mode (`possibleQuestions(mode)`), validation et comparaison des réponses.
- `conjugaison.js` : sélection d’onglet `present-1` / `present-2`, session, saisie, suivi de première erreur, sauvegarde, catégorie de score par groupe et récompense de fin de série. `switchMode` ignore le groupe actif et fait confirmer le changement par `ExerciseGame.changeSettings` seulement après une progression effective.
- `game-ui.js` (`GameUI`) : `editWord` et `azertyKeyboard` (accents groupés par voyelle, lignes AZERTY et « espace », réutilisables par les futurs exercices) ; `game-common.js` (`ExerciseGame`) : vérification, feedback, compteur sur 10 et délai de 3 secondes partagé avec les jeux Français et Calcul.
- `exercise-weighting.js` (`ExerciseWeighting`) : suivi des apparitions/erreurs et tirage pondéré sans remise, utilisé aussi par Français.
- `game-state.js`, `score-view.js`, `scores.js` et `daily-exercises.js` : reprise, suspension pour scores, historique et crédits.

## Contrats et invariants

- Une question est un objet `{type, verb, person, subject, complement, answer}`. L’infinitif, son complément, le sujet et la réponse sont contrôlés à la restauration via `ConjugaisonData.valid`.
- La clé de pondération est JSON `[type, verb, person]`. Les différentes formulations de sujets d’un triplet partagent le même poids, indépendamment du nombre de variantes.
- `ExerciseWeighting` utilise les clés `entrainement_conjugaison_counts_v1` et `entrainement_conjugaison_errors_v1`, avec la formule `(1 + 3 × erreurs) / (1 + max(0, apparitions − erreurs))²`.
- `GameState.create("conjugaison")` garde le mode `present-1` ou `present-2`, les dix questions du groupe correspondant, la réponse en cours, un index de dernier comptage et un `ExerciseGame.snapshot()`. Les sessions historiques `present-1` restent compatibles ; la restauration ne compte pas deux fois une apparition.
- Seule la dernière question validée déclenche `ExerciseScores.save` puis `DailyExercises.award("conjugaison")`. Le checkpoint est alors supprimé. Les données de Français ne sont ni réécrites ni effacées.

Voir l’[architecture transversale](../../ARCHITECTURE.md) pour les services communs.
