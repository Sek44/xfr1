# Mission magique — Spécifications fonctionnelles actuelles

## Concept

Jeu d'arcade dans une forêt enchantée au rendu inspiré d'une scène 2D isométrique : le décor défile vers le haut et un petit magicien lance des sorts sur des créatures qui portent des additions. Les deux opérandes sont compris entre **1 et 9**.

Le joueur saisit le résultat sur le pavé numérique. Une réponse correspondant à une créature non ciblée déclenche un tir magique. Lorsqu'un sort atteint sa cible, la créature disparaît et le score augmente de **1 point**. Plusieurs créatures peuvent apparaître et se déplacer ; les résultats affichés simultanément sont distincts. Le jeu conserve un score cumulatif, sans nombre de questions fixe. **Chaque série de 20 créatures détruites par un sort** apporte **1 point d’exercice quotidien** (10 minutes de jeu autorisées actuellement), sans attendre la fin de la partie. Une série incomplète est conservée pour la prochaine partie du même jour ; le compteur repart de zéro le lendemain. Les cibles manquées ne comptent pas.

La progression est continue : les créatures qui dépassent le bas de la zone de jeu disparaissent ; contrairement à Mission calcul, il n'y a actuellement **ni vies ni bombes**.

## Commandes et navigation

Un pavé numérique virtuel et le clavier permettent de saisir des résultats. Pause/reprise et arrêt volontaire sont proposés. Un arrêt avec score supérieur à zéro demande confirmation ; une partie abandonnée à zéro point n'est pas enregistrée.

Retourner à l'accueil pendant une partie non nulle demande confirmation puis sauvegarde la partie pour reprise. La consultation des scores suspend le jeu, sans perdre le score, les créatures, les sorts ni la saisie. Une session restaurée reprend en pause pour éviter que le monde progresse hors écran.

La page des scores Mission magique présente l'historique et sa courbe d'évolution. Voir [architecture](ARCHITECTURE.md) et [backlog](BACKLOG.md).
