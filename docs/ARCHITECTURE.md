# Entraînement — Architecture transversale actuelle

## Contexte et points d'entrée

Site statique HTML/CSS/JavaScript, sans serveur applicatif, compilation ni dépendance d'exécution. Publication GitHub Pages sous `/xfr1/`. Les chemins des pages sont relatifs et les jeux fonctionnent sur téléphone, tablette et ordinateur.

- `index.html` : accueil avec quatre liens vers `francais.html`, `calcul.html`, `space.html` et `magic.html`.
- `scores.html` : historique général et filtres par jeu, avec courbe uniquement sur les pages de scores filtrées par jeu.
- Chaque page de jeu charge ses modules communs puis son contrôleur propre. Les fichiers des jeux restent dans la racine du dépôt ; leurs documents sont dans `docs/games/<id>/`.

## Modules réutilisables

| Fichier | API / responsabilité |
| --- | --- |
| `game-common.js` | `ExerciseGame` : déroulement des questions, validation, score de premier essai, délai avant question suivante, snapshot et reprise du délai |
| `game-ui.js` | `GameUI` : éléments DOM, pavé numérique et édition de réponse |
| `game-state.js` | `GameState` : lecture/écriture/suppression prudentes des sessions en `localStorage` |
| `scores.js` | `ExerciseScores` : historique compatible, date/heure, filtres, graphique SVG, suppression ciblée confirmée |
| `score-view.js` | `ScoreView` : scores en iframe sans détruire le jeu, suspension/reprise et navigation par l'historique |
| `app-confirm.js` | `AppConfirm` : dialogue de confirmation interne |
| `shared.css`, `score-view.css`, `app-confirm.css` | Styles partagés et de navigation |

`francais.js` et `calcul.js` utilisent `ExerciseGame`. Les jeux d'arcade délèguent leurs règles à des moteurs isolables (`space-engine.js` et `magic-engine.js`) tandis que leurs contrôleurs gèrent interface, événements, rendu et persistance. Voir leurs architectures dédiées.

Les scripts sont chargés dans l'ordre des dépendances. Les modules communs exposent leurs APIs sur `window` ; les contrôleurs de jeux restent dans des portées privées. Les fichiers HTML contiennent encore une partie des styles/du comportement de page ; ne pas présumer d'une architecture à base de répertoires par jeu.

## Données locales et compatibilité

Les données restent sur l'appareil et le navigateur ; aucune synchronisation ni compte utilisateur.

| Clé | Propriétaire | Usage |
| --- | --- | --- |
| `exercices_francais_scores` | `scores.js` | Historique commun pérenne, y compris les enregistrements anciens et leurs champs inconnus |
| `exercices_in_progress_<jeu>` | `game-state.js` | Session temporaire versionnée par jeu (`francais`, `calcul`, `space`, `magic`) |
| `entrainement_francais_word_counts_v1` | `francais.js` | Nombre d'apparitions par mot |
| `entrainement_francais_word_errors_v1` | `francais.js` | Premières erreurs par mot |
| `entrainement_francais_sentence_counts_v1` | ancien format lu par `francais.js` | Migration des anciennes apparitions par phrase, sans effacement de la clé historique |

`ExerciseScores` ajoute les scores sans supprimer ni réécrire les anciens ; une suppression individuelle demande confirmation et vérifie que la sélection n'est pas devenue obsolète. Une heure absente se déduit d'une date ISO exploitable, sinon vaut `00:00`. Les données malformées ne doivent pas entraîner l'écrasement silencieux de l'historique. Voir [ADR-0001](adr/0001-compatibilite-des-donnees.md).

Les sessions temporaires sont distinctes des scores. Une navigation vers les scores suspend le jeu sans avancer les minuteries ; un rechargement/retour restaure les informations prévues par chaque jeu. Une session terminée ne doit pas générer un second score.

## Qualité, livraison et limites

Les tests Node intégrés au dépôt (`node --test tests/*.test.cjs`) couvrent des moteurs, contrôleurs et API partagées. Prettier 3.6.2 sert au formatage HTML/JS/CSS. Le site n'a pas de build obligatoire.

La validation visuelle/tactile sur mobile et tablette, le comportement selon l'orientation et l'intégration réelle du navigateur nécessitent des vérifications supplémentaires : voir [backlog transversal](BACKLOG.md). L'architecture propre à chaque jeu est documentée dans `docs/games/<id>/ARCHITECTURE.md`.
