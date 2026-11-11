# Entraînement project rules

## Preserve existing scores (explicit user requirement, 2026-10-18)

Every site change must remain compatible with all existing user scores in localStorage.
- Preserve the `exercices_francais_scores` key, all existing records and unknown fields.
- Never clear, reset, truncate or silently overwrite users' score history.
- Explicit exception (2026-10-18): a user may delete one chosen score only after an in-app confirmation. Preserve all other records and unknown fields; refuse a stale selection if storage changed.
- Add fields without requiring legacy records to contain them. Use display placeholders for missing fields; missing score time must display `00:00`.
- Read historical ISO timestamps when available; do not rewrite old records merely to add display fields.
- If stored JSON is unreadable, do not overwrite it when saving a new score.
- Verify mixed legacy/current records when changing storage or display.

## Daily exercise credits

- Preserve the shared key `entrainement_daily_exercises_v1` and its versioned contract (`date`, `points`, `minutes`, `progress`, `events`). Other pages/projects on the same origin may depend on it. Do not conflate these credits with the historical score list.
- Keep each game’s award rule in its controller, using `DailyExercises.award` for completed sessions or `DailyExercises.milestones` for open-ended games. Rewards must not duplicate after reload; partial arcade progress is shared across sessions of the same game for the current browser-local day only.
- Preserve compatibility with older in-progress sessions that lack `rewardProgress`; never grant retroactive credits from an old score.
- Treat an out-of-date localStorage record as zero on external readers; the browser cannot run xfr1 at midnight when its pages are closed.

## Navigation

Opening scores and returning must preserve the exact ongoing game state: typed answers, correction status, timers, enemies, missiles, lives, bombs and level. Scores visits must not advance gameplay timers or save duplicate results.

## Maintien de la documentation (méthode GMR)

Avant de modifier le code, lire [les conventions](docs/README.md) et les documents du jeu concerné :
- global : `docs/ARCHITECTURE.md`, `docs/BACKLOG.md` et, si pertinent, `docs/adr/` ;
- par jeu : `docs/games/<id>/SPECIFICATIONS.md`, `ARCHITECTURE.md`, `BACKLOG.md`, avec `<id>` parmi `francais`, `conjugaison`, `calcul`, `monnaie`, `space`, `magic`.

Le code reste actuellement à la **racine** du dépôt. Ne pas le déplacer dans `games/` uniquement pour imiter GMR. Les documents locaux sont regroupés dans `docs/games/<id>/`.

- Les **spécifications** décrivent exclusivement le comportement fonctionnel en vigueur, pas les projets ou corrections historiques.
- L'**architecture** décrit les fichiers, responsabilités, échanges et invariants **actuels**. Ne pas documenter les étapes passées.
- Le **backlog** contient uniquement des travaux **ouverts**, identifiés de façon permanente par `XFR1<n>` au global, `FRANCAIS<n>`, `CONJUGAISON<n>`, `CALCUL<n>`, `MONNAIE<n>`, `SPACE<n>` ou `MAGIC<n>` par jeu. Commencer chaque entrée par `- [ ] **ID — Titre.**` et conserver `Dernier identifiant attribué` dans chaque backlog. Ne jamais renuméroter, réattribuer ou réutiliser un ID ; retirer les entrées terminées sans réduire le compteur.
- Un **ADR** est réservé à une décision structurante avec contexte, options et conséquences, dans `docs/adr/` ou `docs/games/<id>/adr/`. Pour remplacer une décision acceptée, créer un nouvel ADR et marquer l'ancien comme « Remplacé » ; actualiser l'architecture active.
- **Pas de changelog ni de fichier REFACTORING.md permanent** : Git conserve l'historique ; n'ouvrir de plan de refactoring que temporairement.
- Mettre à jour la documentation affectée **dans le même changement que le code**. Ne pas dupliquer la source de vérité : faire des liens. Un souhait non livré relève du backlog, pas des spécifications.

Le cadre extérieur standard de l’accueil et des cinq sous-pages classiques est `<main class="academy-global-frame">`, stylé exclusivement dans `styles/themes/magical-academy/theme.css` (bordure, ombre, largeur maximale de 780 px et marges extérieures de l’accueil : `clamp(14px, 3vw, 32px)` sur grand écran, 7 px sur mobile). Ne pas redéfinir sa bordure, sa largeur ou ses marges extérieures dans `home-layout.css`, `styles/themes/magical-academy/home.css` ou `styles/themes/magical-academy/components.css`. Sur les sous-pages, la hauteur minimale doit tenir compte de ces marges pour préserver le dégagement en bas.

Pour les sous-pages classiques (`francais`, `conjugaison`, `calcul`, `monnaie`, `scores`), la référence graphique est Conjugaison : modifier les éléments partagés dans `styles/themes/magical-academy/components.css`, **pas** dans plusieurs CSS de jeu. Les styles réservés à Scores et à l’écran de fin sont respectivement dans `styles/themes/magical-academy/scores.css` et `styles/themes/magical-academy/results.css`, chargés après `components.css` sur les pages concernées. Les cinq bandeaux sont créés par `academy-header.js` depuis `data-academy-header` ; maintenir les identifiants de navigation, les liens Scores et le retour iframe. Réserver les CSS de page aux composants métier. Ne pas recréer les pastilles de progression par jeu : utiliser `ExerciseGame.progress()` ; ne pas dupliquer les onglets bleu saphir et doré (CSS pur, sans WebP) : utiliser `.academy-tabs .academy-tab` et `GameUI.tabs()` si interactifs, ou les mêmes classes sur les liens des filtres de Scores ; les choix et touches numériques portent `.academy-key` avec leurs dimensions spécifiques.

Vérifier les liens relatifs des documents et lancer `node --test tests/*.test.cjs` avant publication. Pour tout changement HTML/JS/CSS, conserver les conventions Prettier indiquées dans `README.md`. Signaler les tests navigateur (touch, portrait/paysage, pause/reprise) non effectués. La nouvelle documentation ne modifie en rien les exigences de compatibilité et de navigation ci-dessus.
