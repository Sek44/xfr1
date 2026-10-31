# Calcul — Spécifications fonctionnelles actuelles

## Principe

Le joueur résout des **additions** en saisissant le résultat avec le pavé numérique virtuel. Il choisit une catégorie pour le **premier nombre** : `0-10`, `10-100`, `100-1000`, `1000-10000` ou **Toutes catégories**, et une difficulté pour le **second nombre**.

| Difficulté | Second nombre |
| --- | --- |
| 1 | Unité de 1 à 9 |
| 2 | Dizaine de 10 à 90 |
| 3 | Centaine de 100 à 900 |
| 4 | Dizaines + unités (11 à 99, hors multiples de 10) |
| 5 | Centaines + dizaines (110 à 990, hors multiples de 100) |

Chaque session comporte au maximum **10 calculs**, sans répéter une même paire d'opérandes. Le résultat ne doit jamais dépasser la borne supérieure de la catégorie choisie. Lorsque la combinaison catégorie/difficulté est impossible, un message demande de choisir une autre combinaison ; aucune question n'est proposée.

## Score et progression

Le joueur saisit, efface et valide la réponse. Une erreur peut être corrigée mais **ne donne plus de point pour ce calcul**. Seule la réussite au premier essai ajoute un point. Après réussite, l'exercice suivant apparaît automatiquement au bout d'environ **3 secondes**, ou dès l'action d'avancement.

La série terminée vaut **1 point d’exercice quotidien**, quel que soit le nombre de réponses correctes au premier essai ; ce crédit ajoute actuellement **10 minutes de jeu autorisées** au compteur commun. Une session sans question ou interrompue ne crédite rien.

Une page de résultat clôt la série et permet de recommencer. Le score est enregistré avec la catégorie et la difficulté dans l'historique commun ; la page de scores Calcul comporte une courbe d'évolution.

## Reprise

La catégorie, la difficulté, les opérations générées, la réponse en cours et l'état de correction sont sauvegardés localement. Recharger la page ou consulter les scores doit permettre de reprendre la session sans laisser courir le délai automatique en arrière-plan.

Voir [architecture](ARCHITECTURE.md) et [backlog](BACKLOG.md).
