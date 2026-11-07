# Français — Spécifications fonctionnelles actuelles

## Objectif et déroulement

Compléter une phrase en choisissant les lettres manquantes. La page affiche directement les onglets et l'exercice, sans texte d'introduction séparé (comme Conjugaison). Trois onglets : **g / gu / ge**, **c / ç** et **Tout** (mélange des deux familles). Le groupe de lettres choisi remplace intégralement la zone vide ; une lettre faisant partie de la solution (`u` de `gu`, `e` de `ge`) ne doit pas être révélée à l'avance. Quand le `u` est la voyelle prononcée après `g`, il reste au contraire visible et la réponse est `g` : « lé_ume » → « légume », « dé_ustation » → « dégustation ». Il ne faut pas demander `gu` devant une consonne.

Chaque ligne doit conserver la disposition calculée pour la graphie la plus longue du mot, quel que soit le choix fait ensuite. Les lettres restent accolées au mot (par exemple « neige » et non « nei g e »), et l’espace supplémentaire est réservé **à la fin de la ligne**, jamais entre ce mot et le suivant. Les variantes servant à mesurer la largeur ne sont pas visibles. La zone de phrase visible réserve en permanence la hauteur de deux lignes : une phrase d’une ligne est centrée verticalement, et le cadre grandit uniquement si la phrase dépasse deux lignes.

Une session comporte **10 phrases**. Dans « Tout », chaque phrase garde les choix de sa famille d'origine (g / gu / ge ou c / ç). Le joueur choisit une réponse et la vérifie ; en cas d'erreur, il peut corriger. **Seule une bonne réponse au premier essai rapporte un point.** Après correction réussie, la progression continue sans point supplémentaire. Une bonne réponse passe à la suivante automatiquement après environ **3 secondes**, ou immédiatement par le bouton d'avancement. Le résultat final est noté sur 10. Une session menée jusqu’à son terme vaut **1 point d’exercice quotidien**, quel que soit le score (y compris avec des corrections), et ajoute actuellement **3 minutes de jeu autorisées** au compteur commun. Une session interrompue ne compte pas. Le bouton d’icône « Recommencer la série », placé dans l’en-tête juste à gauche des scores, ouvre une confirmation interne : annuler reprend la partie, confirmer crée une nouvelle série avec un score nul, sans enregistrer ni créditer la série abandonnée.

Après validation, le retour est affiché uniquement sur le bouton d'action : bleu « Vérifier », rouge « Incorrect · Réessaie », vert « Bravo ! Suivant » ou « Bien corrigé ! Suivant ». Le choix d'une autre réponse après un échec remet le bouton au bleu ; aucune notification visible distincte n'est affichée.

## Répartition des questions

Le tirage sélectionne d'abord des **mots distincts** (pas des phrases) ; plusieurs phrases utilisant le même mot ne le rendent donc pas plus fréquent. Une variante de phrase est ensuite tirée pour chaque mot choisi. Les apparitions sont comptabilisées par mot et famille d'origine dans l'espace local du navigateur. « Tout » tire parmi l'union des mots, sans historique de poids séparé : afficher ou rater un mot dans « Tout » modifie son poids pour les prochains tirages dans sa famille d'origine, et inversement.

Les mots peu rencontrés sont privilégiés ; une erreur de premier essai augmente le poids de réapparition pour retravailler les difficultés. Les mots ne sont pas répétés au sein d'une même session, dans la limite du nombre de mots disponibles.

## Navigation, stockage et scores

Un clic sur l’onglet déjà actif ne modifie rien. Changer de famille commence une nouvelle série : si le joueur a déjà sélectionné une réponse, validé une question ou avancé dans la série, une confirmation demande d’abord l’autorisation d’abandonner la progression. Annuler conserve le choix, le score, la question et le délai éventuel ; confirmer abandonne uniquement la série en cours, sans enregistrer de résultat ni attribuer de crédit quotidien. Si aucune question n’a encore été commencée, ou si la série est terminée, le changement est immédiat. La question, les choix, l'état de correction, la progression et le délai restant sont sauvegardés pour la reprise. La consultation des scores suspend la session et permet de revenir sans perdre son état.

Les résultats alimentent l'historique commun (catégories `g`, `c` et `all`), consultable sans supprimer les autres sessions, avec une courbe d'évolution sur la page de scores Français.

Voir [architecture](ARCHITECTURE.md) pour les clés de stockage et la formule exacte de tirage ; voir [backlog](BACKLOG.md) pour les vérifications à faire.
