# Conjugaison — Architecture actuelle

## Fichiers et modules

- `conjugaison.html` : structure de la page et navigation fournie par `academy-header.js` ; `styles/themes/magical-academy/conjugaison.css` : uniquement le cartouche du temps, la disposition du verbe et les adaptations du clavier AZERTY et de la zone de saisie. Les cadres, boutons, pastilles Question/Score, marges, fontes et illustrations de navigation sont partagés via `styles/themes/magical-academy/components.css`. Les touches et le comportement du clavier restent mutualisés dans `keyboard.css` et `game-ui.js` (racine). Les trois onglets (1er groupe, 2e groupe, Tout) sont produits par `GameUI.tabs()` dans `#conjugaison-tabs`, avec les plaques CSS-only `.academy-tabs .academy-tab` bleu saphir et doré, partagées avec Français et Scores, tandis que la progression `Question x/10` et `Score x` est produite directement par `ExerciseGame.progress()` sans ajustement propre à Conjugaison.
- `conjugaison-data.js` (`ConjugaisonData`) : banques du 1er groupe et de 22 verbes réguliers du 2e groupe (`ir`), compléments, personnes, règles de conjugaison, sélection par mode (`possibleQuestions(mode)`), validation et comparaison des réponses.
- `conjugaison.js` : sélection d’onglet `present-1` / `present-2` / `all`, session, saisie, suivi de première erreur, sauvegarde, catégorie de score par groupe et récompense de fin de série. `switchMode` ignore le groupe actif et fait confirmer le changement par `ExerciseGame.changeSettings` seulement après une progression effective.
- `game-ui.js` (`GameUI`) : `editWord` et `azertyKeyboard` (deux pages d’accents dont seule la première rangée est remplacée par `fillRow`, lignes AZERTY, Shift à usage unique, retour arrière avec pictogramme SVG au même style que Shift, bascule lettres / chiffres-symboles et espace ; la page d’accents et la casse sont préservées, composants réutilisables pour les futurs exercices) ; `game-common.js` (`ExerciseGame`) : vérification, feedback, compteur sur 10 et délai de 3 secondes partagé avec les jeux Français et Calcul.
- `exercise-weighting.js` (`ExerciseWeighting`) : suivi des apparitions/erreurs et tirage pondéré sans remise, utilisé aussi par Français.
- `game-state.js`, `score-view.js`, `scores.js` et `daily-exercises.js` : reprise, suspension pour scores, historique et crédits.

## Contrats et invariants

- Une question est un objet `{type, verb, person, subject, complement, answer}`. L’infinitif, son complément, le sujet et la réponse sont contrôlés à la restauration via `ConjugaisonData.valid`.
- La clé de pondération est JSON `[type, verb, person]`. Le mode `all` mélange les banques des deux groupes avec exactement les mêmes clés/compteurs que chaque groupe, sans statistiques distinctes. Les différentes formulations de sujets d’un triplet partagent le même poids, indépendamment du nombre de variantes.
- `ExerciseWeighting` utilise les clés `entrainement_conjugaison_counts_v1` et `entrainement_conjugaison_errors_v1`, avec la formule `(1 + 3 × erreurs) / (1 + max(0, apparitions − erreurs))²`.
- `GameState.create("conjugaison")` garde le mode `present-1`, `present-2` ou `all`, les dix questions du ou des groupes correspondants, la réponse en cours, un index de dernier comptage et un `ExerciseGame.snapshot()`. Les sessions historiques `present-1` restent compatibles ; la restauration ne compte pas deux fois une apparition.
- La dernière question validée passe par `ExerciseGame.resultTracker()`, qui enregistre le score et le crédit quotidien avec un identifiant de session stable. En cas de refus du stockage, le checkpoint achevé persiste avec une action de réessai ; il n'est supprimé qu'après succès. Les données de Français ne sont ni réécrites ni effacées.

Voir l’[architecture transversale](../../ARCHITECTURE.md) pour les services communs.
