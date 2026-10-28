# Mission calcul — Architecture actuelle

## Moteur et présentation

| Fichier | Responsabilité |
| --- | --- |
| `space-engine.js` | `SpaceGame` : simulation indépendante du DOM, tirage des additions, niveaux, ennemis, alignement du vaisseau, missiles, bombes, collisions et snapshots |
| `space.js` | Contrôleur navigateur : événements clavier/tactiles, pause, cycle de vie, sauvegarde, mises à jour visuelles et boucle d'animation |
| `space-enemies.js` | Paramètres d'apparence des ennemis selon le niveau |
| `space.html`, `space.css` | Structure, HUD, commandes et rendu SVG/CSS |

Les fichiers sont situés à la racine. `GameUI`, `GameState`, `ScoreView`, `AppConfirm` et `ExerciseScores` proviennent des modules communs.

## Flux de jeu

`SpaceGame.step(dt)` intègre l'avancée des ennemis, la perte de vie, les déplacements/missiles, la destruction et le score. `shoot(answer)` cible un ennemi dont le résultat correspond ; `bomb()` consomme une bombe et nettoie la vague sans score. La propriété calculée `level` dépend du score et `operation()` définit la progression par niveaux.

`space.js` exécute la boucle d'affichage et synchronise DOM/sprites à partir de l'état du moteur ; la progression arithmétique et le calcul des points restent dans le moteur. Le contrôleur désactive les commandes selon `running`, `paused` et les confirmations en cours.

## Persistance et fin

`GameState.create("space")` conserve `game.snapshot()`, la réponse partiellement saisie et l'état de pause. Le moteur valide le snapshot à la restauration. Le chargement d'une session restaurée affiche une pause plutôt que de laisser avancer les ennemis.

Le contrôleur sauvegarde pendant les actions importantes et le cycle de vie navigateur. `ScoreView.bind` suspend/reprend l'animation sans détruire les objets du jeu. La fin est protégée contre le double enregistrement par `saved`, puis appelle `ExerciseScores.save` avec `tab: "space"` et `mode: "arcade"`, en séparant la session du résultat pérenne.

Invariants et stockage communs : [architecture transversale](../../ARCHITECTURE.md). Validations restantes : [backlog](BACKLOG.md).
