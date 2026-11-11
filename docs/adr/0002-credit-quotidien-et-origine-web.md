# ADR-0002 — Crédit quotidien inter-sites sur une même origine

- **Date :** 2026-10-31
- **Portée :** compte quotidien et partage entre xfr1 et d'autres projets
- **Statut :** Accepté

## Contexte

Les exercices d'Entraînement donnent droit à un quota de temps de jeu journalier. Plusieurs jeux ont des fins différentes : séries de questions bornées ou missions continues. Le total doit rester consultable par d'autres pages publiées sous la même origine GitHub Pages, dont un futur site du dépôt rblx.

## Options envisagées

- Compter les sessions à partir de l'historique des scores : simple, mais les missions continues ne terminent pas nécessairement et les scores anciens ne représentent pas le crédit du jour.
- Héberger une API et synchroniser les comptes : partage entre origines et appareils, mais nécessite serveur et authentification.
- Conserver un contrat `localStorage` dédié et versionné, commun à l'origine web.

## Décision

Utiliser la clé `entrainement_daily_exercises_v1` : `version`, `date` locale (`YYYY-MM-DD`), `points` quotidiens, `minutes` autorisées, `progress` de séries d'arcade et `events` de déduplication. `daily-exercises.js` conserve le ratio de **10 minutes par point**, effectue la remise à zéro logique au changement de date et fournit `award`, `recordProgress` et `milestones`. Chaque contrôleur décide quand un calcul ou une session est terminé et choisit son seuil. Le score historique reste séparé.

Les lectures externes doivent vérifier la date ; un navigateur fermé ne peut pas effectuer une écriture à minuit. Les jeux GitHub Pages sur `https://sek44.github.io/` peuvent partager la clé si leurs pages ont le même protocole, domaine et port, même dans des dépôts différents.

**Note de portée historique :** les 10 minutes ci-dessus correspondent au ratio initial. Le ratio actuel est de **3 minutes par point**, configuré dans `daily-exercises.js` et décrit dans l'[architecture active](../ARCHITECTURE.md). Le contrat de stockage reste identique.

## Conséquences

- Pas de compte, pas de serveur, pas de synchronisation entre appareils ni entre origines différentes.
- Une suppression des données du navigateur efface le compteur. Une modification manuelle du stockage n'est pas protégée : le quota est un mécanisme local, pas une sécurité anti-contournement.
- Les séries incomplètes sont conservées **par jeu** pendant la journée et perdues le lendemain ; les anciennes parties sauvegardées restent lisibles sans crédits rétroactifs.
- Le crédit `minutes` indique le quota gagné, **pas** le temps consommé. Les jeux externes décideront de l'utilisation de ce quota lors de leur intégration.

## Barème progressif (2026-11-11)

La clé historique `entrainement_daily_exercises_v1` conserve tous ses champs publics.
Les crédits récents utilisent `seconds` en entier et `minutes = floor(seconds / 60)`,
compatibles avec les consommateurs GMR. Ne plus recalculer les minutes à partir
des seuls points dès que `seconds` est présent ; les anciennes données sans
`seconds` conservent leur conversion historique. Les champs facultatifs
`starts` et `receipts` empêchent de rejouer une série ou de dépasser la limite
quotidienne. La maîtrise durable (`entrainement_mastery_v1`) a son propre
journal idempotent ; un échec d'écriture entraîne une reprise du checkpoint,
jamais un deuxième versement.

Le barème de difficulté, les seuils et les limites se règlent dans
`reward-rules.js`. Chaque sous-catégorie de « Tout » conserve sa propre maîtrise.
Les séries commencées sont comptées à la première réponse et les séries
terminées participent à la progression même si elles ne créditent aucune minute.
Le cap global est de 3600 secondes de crédits quotidiens.
