# Mission magique — Architecture actuelle

## Séparation des responsabilités

- `magic-engine.js` : classe `MagicGame` sans dépendance DOM, portant la génération des opérations, les créatures, déplacements, collisions, tirs, effets, temps, distance du décor et snapshots.
- `magic.js` : contrôleur navigateur, lecture des commandes, sauvegarde/reprise, navigation, dialogues de confirmation, animation, rendu des sprites et du décor.
- `magic.html` / `magic.css` : structure et présentation de la forêt, interface et contrôles.
- Modules communs : `GameUI`, `GameState`, `ScoreView`, `ExerciseScores`, `DailyExercises` et `AppConfirm`.

Les fichiers de code ci-dessus se trouvent à la racine du dépôt.

## Moteur et rendu

`MagicGame.spawn` choisit des opérations à deux chiffres unitaires et évite deux résultats simultanés identiques ainsi que la répétition immédiate de la dernière opération. `shoot(text)` associe un résultat à une cible ; `step(dt)` fait avancer le monde, résout les sorts et comptabilise le score.

`magic.js` utilise un **canvas 2D** pour le sol défilant et des éléments DOM pour les personnages, sorts et effets. Les collections de sprites sont synchronisées avec les objets du moteur à chaque frame ; la représentation visuelle ne possède pas de compteur de points indépendant.

## États, stockage et scores

Le contrôleur distingue `running`, `paused`, `saved`, `viewingScores` et `confirming`. `GameState.create("magic")` sauvegarde `game.snapshot()`, la saisie, l'état de pause et `rewardProgress` (session, date, dernier score crédité). `DailyExercises.milestones("magic", 20)` transmet chaque calcul réussi au compteur commun, qui conserve les séries incomplètes entre parties et déduplique les opérations déjà créditées. Un snapshot ancien sans `rewardProgress` ne crédite pas les points passés. `MagicGame.restore` vérifie les propriétés des objets et coordonnées. À la reprise d'une session, une pause est montrée avant tout avancement.

`ScoreView.bind` suspend la simulation durant la consultation des scores. Lors d'une fin de mission, `ExerciseScores.save` reçoit `tab: "magic"` et `mode: "arcade"` uniquement si `score > 0`. `saved` empêche un double enregistrement et la session provisoire est effacée.

Contrats de persistance communs : [architecture transversale](../../ARCHITECTURE.md). Travaux ouverts : [backlog](BACKLOG.md).
