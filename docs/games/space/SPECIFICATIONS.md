# Mission calcul — Spécifications fonctionnelles actuelles

## Jeu

Jeu d'arcade spatial : des ennemis descendent en portant chacun une addition. Le joueur entre un résultat sur le pavé numérique ; s'il correspond à un ennemi non ciblé, le vaisseau s'aligne et lance un missile. La destruction réussie rapporte **1 point**. Les opérations actives ne partagent pas le même résultat et deux apparitions consécutives n'emploient pas la même addition.

Le joueur démarre avec **3 vies** et **2 bombes**. Si un ennemi atteint le bas, le joueur perd une vie et la vague est nettoyée, mais son niveau et son score restent acquis. La dernière vie perdue met fin à la mission.

Chaque **série de 10 ennemis détruits par tir** attribue **1 point d’exercice quotidien** (10 minutes de jeu autorisées au ratio actuel), indépendamment du niveau et de la fin de partie. Les séries incomplètes se poursuivent dans la prochaine partie de la même journée ; une bombe ne compte pas. Le cumul partiel est réinitialisé chaque jour.

Une bombe détruit les ennemis présents **sans attribuer de points**. Un ennemi porteur de bombe offre une bombe supplémentaire lorsqu'il est détruit par un tir.

## Difficulté

Le niveau vaut `1 + ⌊score / 5⌋` : il augmente tous les **5 ennemis détruits**. Le second opérande est toujours compris entre **1 et 9**.

| Niveau | Premier opérande | Résultat autorisé |
| --- | --- | --- |
| 1 | 1 à 9 | 2 à 10 |
| 2 | 1 à 9 | 6 à 18 |
| 3 | 1 à 9 | 11 à 18 |
| 4 | 10 à 19 | 11 à 19 |
| 5 | 10 à 19 | 11 à 28 |
| 6 | 20 à 29 | 21 à 29 |
| 7 | 20 à 29 | 21 à 38 |

Ensuite, le schéma se poursuit avec **deux niveaux par dizaine** : d'abord un résultat limité à la fin de la dizaine, puis un résultat pouvant aller jusqu'à neuf unités plus haut. Les paires générées respectent ces bornes.

## Navigation, pause et historique

Le joueur peut faire une pause, reprendre ou terminer manuellement. Une fin manuelle avec un score non nul exige une confirmation ; à zéro point, elle se termine sans confirmation. La fin de mission est enregistrée dans l'historique des scores.

Retourner à l'accueil ou consulter les scores conserve la session, y compris vies, bombes, niveau, ennemis, missiles et réponse en cours. Le jeu reste en pause lorsqu'il n'est pas visible ; la consultation des scores ne doit pas faire avancer les ennemis.

Voir [architecture](ARCHITECTURE.md) et [backlog](BACKLOG.md).
