# Français — Architecture actuelle

## Fichiers et responsabilités

- `francais.html` : écran, sélecteur de famille, score courant, zone de réponse et styles locaux.
- `francais.js` : banque interne de phrases, découpage en préfixe / choix / suffixe, sélection des mots, pondération, correction et persistance des apparitions/erreurs.
- `game-common.js` (`ExerciseGame`) : machine de session (index, premier échec, réussite, score), temporisateur de 3 secondes, instantané et reprise.
- `game-ui.js`, `scores.js`, `game-state.js`, `score-view.js` : interface, historique, session et suspension/réouverture des scores.

Tous les chemins source ci-dessus sont relatifs à la **racine** du dépôt, pas à ce dossier documentaire.

## Sélection par mot et données locales

Chaque question de `sets.g` ou `sets.c` est un triplet `[avant, après, réponse]`. La clé logique d'un mot est le JSON `[famille, mot reconstitué en minuscules]` : elle assemble le suffixe alphabétique de `avant`, la réponse et le préfixe alphabétique de `après`.

`shuffleSession` groupe les phrases par clé de mot, puis tire au plus 10 **clés distinctes** sans remise. Pour un mot avec `a` apparitions et `e` erreurs au premier essai, la pondération est :

`poids = (1 + 3 × e) / (1 + max(0, a − e))²`.

La variante de phrase est ensuite choisie uniformément parmi les variantes du mot. Voir [ADR-0001 — pondération par mot](adr/0001-ponderation-par-mot.md).

Clés `localStorage` : `entrainement_francais_word_counts_v1`, `entrainement_francais_word_errors_v1`. À la première lecture si le compteur de mots n'existe pas, `entrainement_francais_sentence_counts_v1` peut être agrégé vers les mots (sans supprimer l'ancienne clé). Les écritures de suivi sont non bloquantes. Une migration ponctuelle, marquée par `entrainement_francais_vowel_u_reset_v1`, retire uniquement les apparitions et erreurs de `légume` et `dégustation` au premier chargement de cette version, sans toucher aux scores ni aux autres mots.

## Cycle d'une session

`GameState.create("francais")` stocke famille active, questions choisies, option sélectionnée, progression `ExerciseGame` et marqueur d'apparition. Une restauration vérifie les données et adapte certains triplets anciens corrigés. Si la réponse attendue de la question courante change, cette question est rejouée et son éventuel point est annulé sans modifier les points précédents. `ScoreView.bind` suspend/reprend le décompte ; `pagehide` persiste la session. `ExerciseScores.save` et `DailyExercises.award("francais")` sont appelés une seule fois en fin de session, quel que soit le score.

Règles partagées et format des scores : [architecture transversale](../../ARCHITECTURE.md). Contrôles à renforcer : [backlog](BACKLOG.md).
