# Français — Spécifications fonctionnelles actuelles

## Objectif et déroulement

Compléter une phrase en choisissant les lettres manquantes. Deux familles d'exercices : **g / gu / ge** et **c / ç**. Le groupe de lettres choisi remplace intégralement la zone vide ; une lettre faisant partie de la solution (`u` de `gu`, `e` de `ge`) ne doit pas être révélée à l'avance.

Une session comporte **10 phrases**. Le joueur choisit une réponse et la vérifie ; en cas d'erreur, il peut corriger. **Seule une bonne réponse au premier essai rapporte un point.** Après correction réussie, la progression continue sans point supplémentaire. Une bonne réponse passe à la suivante automatiquement après environ **3 secondes**, ou immédiatement par le bouton d'avancement. Le résultat final est noté sur 10. Une session menée jusqu’à son terme vaut **1 point d’exercice quotidien**, quel que soit le score (y compris avec des corrections), et ajoute actuellement **10 minutes de jeu autorisées** au compteur commun. Une session interrompue ne compte pas.

## Répartition des questions

Le tirage sélectionne d'abord des **mots distincts** (pas des phrases) ; plusieurs phrases utilisant le même mot ne le rendent donc pas plus fréquent. Une variante de phrase est ensuite tirée pour chaque mot choisi. Les apparitions sont comptabilisées par mot et famille d'exercices dans l'espace local du navigateur.

Les mots peu rencontrés sont privilégiés ; une erreur de premier essai augmente le poids de réapparition pour retravailler les difficultés. Les mots ne sont pas répétés au sein d'une même session, dans la limite du nombre de mots disponibles.

## Navigation, stockage et scores

L'onglet peut être changé pour choisir une famille et repartir sur une série correspondante. La question, les choix, l'état de correction, la progression et le délai restant sont sauvegardés pour la reprise. La consultation des scores suspend la session et permet de revenir sans perdre son état.

Les résultats alimentent l'historique commun (catégories `g` et `c`), consultable sans supprimer les autres sessions, avec une courbe d'évolution sur la page de scores Français.

Voir [architecture](ARCHITECTURE.md) pour les clés de stockage et la formule exacte de tirage ; voir [backlog](BACKLOG.md) pour les vérifications à faire.
