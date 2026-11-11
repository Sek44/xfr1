# Monnaie — Spécifications fonctionnelles actuelles

## Principe

Le joueur doit **rendre la monnaie à un client**. Chaque question affiche un prix aléatoire compris entre **1,00 € et 199,99 €**, et un billet utilisé par le client, parmi **5 €, 10 €, 20 €, 50 €, 100 € et 200 €**. Le billet est toujours strictement supérieur au prix : le rendu est positif. Le prix est tiré au centime près ; dix couples prix/billet différents composent une série.

Le joueur constitue le rendu de monnaie en touchant autant de fois que nécessaire les pièces **1c, 2c, 5c, 10c, 20c, 50c, 1€ et 2€**, et les billets **5€, 10€, 20€, 50€, 100€ et 200€**. Chaque ajout fait apparaître une pièce ou un billet dans « Mon rendu de monnaie ». Toucher l'un des éléments déjà choisis le retire individuellement, même si plusieurs éléments ont la même valeur. Les pièces et billets sont représentés par des SVG simplifiés avec leur forme, des couleurs proches de l'euro et leur valeur inscrite dessus. Les pièces sont directement cliquables sans cadre autour du cercle, dans le choix des valeurs comme dans le rendu ; les billets conservent un support discret. Les grilles et le billet de la question sont compacts, avec une seule rangée par type sur écran assez large.

**Le total du rendu sélectionné n'est jamais affiché** : le calcul mental fait partie de l'exercice. Seuls les éléments ajoutés sont visibles ; leur nombre est annoncé aux lecteurs d’écran, sans prendre de place sur la page. Le bouton « Vérifier » ne devient disponible qu'après au moins un ajout. La bonne réponse est la somme exacte en centimes de `billet – prix`, quel que soit le nombre de pièces/billets utilisés.

## Progression et score

La série comporte **10 questions** ; « Question x/10 » et « Score x » utilisent les composants communs. Une réponse exacte dès la première validation rapporte 1 point. Après un essai incorrect, le joueur peut ajouter ou retirer des éléments pour corriger, mais ne gagne plus de point sur cette question. Le résultat de la vérification apparaît sur le bouton d'action, sans afficher la somme attendue. Une fois la réponse validée, les valeurs ne sont plus modifiables ; la question suivante arrive automatiquement après environ **3 secondes**, ou avec « Suivant ».

Le bandeau fournit le retour à l'accueil, la confirmation de redémarrage et l'accès aux scores. L'écran de fin et les résultats dans le filtre **Monnaie** de Scores sont identiques aux autres exercices classiques. Terminer une série crédite **un exercice quotidien** (actuellement **3 minutes** de jeu), indépendamment du score ; une série abandonnée n'est pas créditée.

## Persistance

Les prix, billets, éléments sélectionnés, validation, score et délai de passage sont conservés dans le navigateur pour permettre le rechargement et la consultation temporaire des scores. Une interruption ne doit pas enregistrer de résultat ; un réessai après échec d'enregistrement ne doit ni dupliquer le score ni le crédit quotidien. Les données historiques des autres exercices sont conservées.

Voir [architecture](ARCHITECTURE.md) et [backlog](BACKLOG.md).
