# Entraînement

Site statique d'exercices de français, de mathématiques et de deux missions ludiques, publié sur GitHub Pages. Aucun serveur, bundler ni dépendance d'exécution n'est nécessaire.

## Activités

- **Orthographe** (`francais.html`) : g/gu/ge, c/ç, s/ss, ou mode « Tout ».
- **Conjugaison** (`conjugaison.html`) : présent des 1er et 2e groupes, ou mode « Tout ».
- **Calcul** (`calcul.html`) : additions par plage de valeurs et difficulté.
- **Monnaie** (`monnaie.html`) : rendre la monnaie avec des pièces et billets en euros, sans total affiché.
- **Mission calcul** (`space.html`) : jeu spatial avec calculs.
- **Mission magique** (`magic.html`) : jeu de forêt avec calculs.
- **Scores** (`scores.html`) : historique et courbes, consultables pendant une partie.

## Code

| Fichiers | Responsabilité |
| --- | --- |
| `index.html`, `home-layout.css`, `styles/themes/magical-academy/home.css` | Accueil et progression du jour |
| `styles/themes/magical-academy/theme.css` | Palette, scène de fond, cadre extérieur partagé |
| `styles/themes/magical-academy/components.css`, `academy-header.js` | Navigation et composants communs aux exercices et Scores |
| `styles/themes/magical-academy/results.css`, `styles/themes/magical-academy/scores.css` | Écran de résultat partagé et styles propres à la page Scores |
| `styles/themes/magical-academy/assets/` | Ressources graphiques de production (WebP, SVG) |
| `game-common.js`, `game-ui.js`, `exercise-weighting.js` | Sessions, corrections, saisie et pondération |
| `francais.js`, `francais-data.js`, `conjugaison.js`, `conjugaison-data.js`, `calcul.js` | Contrôleurs et banques de questions distincts
| `monnaie.js`, `monnaie-model.js`, `monnaie-art.js`, `monnaie.css` | Contrôleur, modèle en centimes, rendu SVG et disposition de Monnaie |
| `space-engine.js`, `space-enemies.js`, `space.js` | Mission calcul |
| `magic-engine.js`, `magic.js` | Mission magique |
| `scores.js`, `score-view.js`, `game-state.js` | Historique, visite Scores et reprise |
| `daily-exercises.js`, `app-confirm.js` | Crédit quotidien et confirmations |
| `tests/` | Vérifications automatisées |

Les scripts communs exposent leurs API sur `window`. Les contrôleurs restent dans des portées privées. Les fichiers source des jeux sont à la racine du dépôt ; chaque page charge ses dépendances avant son contrôleur.

## Progression et stockage

Une série terminée d'Orthographe, Conjugaison, Calcul ou Monnaie rapporte **1 point d'exercice**, quel que soit le score. Mission calcul rapporte **1 point par 10 calculs réussis**, Mission magique **1 point par 20 calculs réussis**. Chaque point accorde actuellement **3 minutes** de jeu autorisées. Les reliquats des missions sont gardés pour la journée locale.

Le contrat stable `entrainement_daily_exercises_v1` comporte `version`, `date`, `points`, `minutes`, `progress` et `events`. Il peut être lu depuis d'autres pages de la **même origine** web, qui doivent vérifier la date locale. Il indique le temps autorisé, pas le temps consommé.

L'historique des scores reste stocké sous `exercices_francais_scores` ; ne jamais effacer les données existantes ni leurs champs inconnus. Les heures absentes sont affichées `00:00` si aucune date utilisable n'existe. Les sessions doivent rester reprenables après consultation des scores ou rechargement, sans double sauvegarde. Voir [AGENTS.md](AGENTS.md) et l'[architecture](docs/ARCHITECTURE.md).

## Développement et validation

- Exécuter `node --test tests/*.test.cjs` (Node.js 22 recommandé).
- Formater HTML, JS et CSS avec `npx prettier@3.6.2 --write "**/*.{html,js,cjs,css}"` ; utiliser `--check` pour contrôler le format.
- GitHub Actions lance les tests Node sur `main` et les pull requests.
- Vérifier aussi manuellement le tactile, la navigation, le portrait/paysage et la reprise des parties.

Les [documents maintenus](docs/README.md) contiennent les spécifications et architectures de chaque jeu, les backlogs et les ADR. Les [assets de production](docs/design/README.md) et la [typographie](docs/design/TYPOGRAPHY.md) y sont décrits ; les maquettes abandonnées ne sont pas conservées. Git garde l'historique.
