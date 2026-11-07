# Français — Architecture actuelle

## Fichiers et responsabilités

- `francais.html` : structure de la page et liens vers les composants standards ; `francais.css` : styles spécifiques aux choix et aux phrases. Le bandeau provient de `academy-header.js` ; les panneaux et boutons de `styles/themes/magical-academy/classic.css`.
- `francais.js` : banque interne de phrases, découpage en préfixe / choix / suffixe, clés par mot et migration des anciennes statistiques. Une phrase de référence invisible est composée avec la graphie la plus longue du mot. Le navigateur en détermine les retours à la ligne, puis `francais.js` reconstruit des lignes de largeur fixe (`.sentence-line`) : le texte est aligné à gauche à l’intérieur de chaque ligne centrée. La graphie choisie garde sa largeur naturelle, immédiatement accolée aux autres lettres ; l'espace inutilisé se retrouve à la fin de la ligne, sans modifier les retours à la ligne lors d'un choix. Les lignes sont recalculées à chaque question, au changement de largeur et après le chargement des fontes. Seule la phrase visible est exposée aux lecteurs d'écran.
- `exercise-weighting.js` : pondération, tirage et suivi des apparitions/erreurs du français, avec ses clés historiques inchangées.
- `game-common.js` (`ExerciseGame`) : machine de session (index, premier échec, réussite, score), temporisateur de 3 secondes, instantané et reprise.
- `GameUI.tabs()` génère les quatre onglets accessibles (dont « Tout ») (style CSS partagé avec Conjugaison et Scores), et les choix portent la classe partagée `.academy-key` ; `ExerciseGame.progress()` affiche `Question x/10` et `Score x` comme Conjugaison. `classic.css` conserve seul le design commun.
- `game-ui.js`, `scores.js`, `game-state.js`, `score-view.js` : interface, historique, session et suspension/réouverture des scores.

Tous les chemins source ci-dessus sont relatifs à la **racine** du dépôt, pas à ce dossier documentaire.

## Sélection par mot et données locales

Chaque question de `sets.g`, `sets.c` ou `sets.s` est un triplet `[avant, après, réponse]`. La clé logique d'un mot est le JSON `[famille, mot reconstitué en minuscules]` : elle assemble le suffixe alphabétique de `avant`, la réponse et le préfixe alphabétique de `après`.

`shuffleSession` groupe les phrases par clé de mot, puis tire au plus 10 **clés distinctes** sans remise. Pour un mot avec `a` apparitions et `e` erreurs au premier essai, la pondération est :

`poids = (1 + 3 × e) / (1 + max(0, a − e))²`.

L’onglet « Tout » réunit les mots des trois familles sans dupliquer les clés ni leurs compteurs. La famille d’origine d'une question mélangée est retrouvée via son alphabet de réponses disjoint (g/gu/ge, c/ç ou s/ss) pour enregistrer les apparitions, les erreurs et afficher les bonnes touches. La variante de phrase est ensuite choisie uniformément parmi les variantes du mot. Pour `sets.s`, le blanc se situe entre deux voyelles pour opposer les sons [z] (`s`) et [s] (`ss`). Cet algorithme est partagé avec Conjugaison par `ExerciseWeighting`. Voir [ADR-0001 — pondération par mot](adr/0001-ponderation-par-mot.md).

Clés `localStorage` : `entrainement_francais_word_counts_v1`, `entrainement_francais_word_errors_v1`. À la première lecture si le compteur de mots n'existe pas, `entrainement_francais_sentence_counts_v1` peut être agrégé vers les mots (sans supprimer l'ancienne clé). Les écritures de suivi sont non bloquantes. Une migration ponctuelle, marquée par `entrainement_francais_vowel_u_reset_v1`, retire uniquement les apparitions et erreurs de `légume` et `dégustation` au premier chargement de cette version, sans toucher aux scores ni aux autres mots.

## Cycle d'une session

`GameState.create("francais")` stocke famille active, questions choisies, option sélectionnée, progression `ExerciseGame` et marqueur d'apparition. Une restauration vérifie les données et adapte certains triplets anciens corrigés. Si la réponse attendue de la question courante change, cette question est rejouée et son éventuel point est annulé sans modifier les points précédents. `ScoreView.bind` suspend/reprend le décompte ; `pagehide` persiste la session. `switchTab` ignore l’onglet courant et délègue la confirmation conditionnelle à `ExerciseGame.changeSettings`, tandis que `restart` relance explicitement la famille courante depuis l’en-tête ou l’écran de résultat. `ExerciseScores.save` et `DailyExercises.award("francais")` sont appelés une seule fois en fin de session, quel que soit le score.

Règles partagées et format des scores : [architecture transversale](../../ARCHITECTURE.md). Contrôles à renforcer : [backlog](BACKLOG.md).
