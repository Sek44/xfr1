# Conjugaison — Architecture actuelle

## Fichiers et modules

- `conjugaison.html` : structure de la page et navigation fournie par `academy-header.js` ; `styles/themes/magical-academy/conjugaison.css` : uniquement le cartouche du temps, la disposition du verbe et les adaptations du clavier AZERTY et de la zone de saisie. Les cadres, boutons, pastilles Question/Score, marges, fontes et illustrations de navigation sont partagés via `styles/themes/magical-academy/classic.css`. Les touches et le comportement du clavier restent mutualisés dans `keyboard.css` et `game-ui.js` (racine). Les anciennes feuilles `conjugaison-v3.css` et `conjugaison.css` de la racine ont été supprimées.
- `conjugaison-data.js` (`ConjugaisonData`) : listes de verbes, compléments, personnes et sujets, conjugaison, validation de chaque question et comparaison des réponses saisies avec suppression des espaces de bord.
- `conjugaison.js` : session, saisie, suivi de première erreur, sauvegarde et récompense de fin de série.
- `game-ui.js` (`GameUI`) : `editWord` et `azertyKeyboard` (accents groupés par voyelle, lignes AZERTY et « espace », réutilisables par les futurs exercices) ; `game-common.js` (`ExerciseGame`) : vérification, feedback, compteur sur 10 et délai de 3 secondes partagé avec les jeux Français et Calcul.
- `exercise-weighting.js` (`ExerciseWeighting`) : suivi des apparitions/erreurs et tirage pondéré sans remise, utilisé aussi par Français.
- `game-state.js`, `score-view.js`, `scores.js` et `daily-exercises.js` : reprise, suspension pour scores, historique et crédits.

## Contrats et invariants

- Une question est un objet `{type, verb, person, subject, complement, answer}`. L’infinitif, son complément, le sujet et la réponse sont contrôlés à la restauration via `ConjugaisonData.valid`.
- La clé de pondération est JSON `[type, verb, person]`. Les différentes formulations de sujets d’un triplet partagent le même poids, indépendamment du nombre de variantes.
- `ExerciseWeighting` utilise les clés `entrainement_conjugaison_counts_v1` et `entrainement_conjugaison_errors_v1`, avec la formule `(1 + 3 × erreurs) / (1 + max(0, apparitions − erreurs))²`.
- `GameState.create("conjugaison")` garde le mode `present-1`, les dix questions, la réponse en cours, un index de dernier comptage et un `ExerciseGame.snapshot()`. La restauration ne compte pas deux fois une apparition.
- Seule la dernière question validée déclenche `ExerciseScores.save` puis `DailyExercises.award("conjugaison")`. Le checkpoint est alors supprimé. Les données de Français ne sont ni réécrites ni effacées.

Voir l’[architecture transversale](../../ARCHITECTURE.md) pour les services communs.
