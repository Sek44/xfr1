# ADR-0001 — Compatibilité durable des données locales

- **Statut :** Accepté (politique déjà appliquée)
- **Date :** 28 octobre 2026 (formalisation)
- **Portée :** scores et sessions d'Entraînement

## Contexte

Les jeux vivent sans serveur ni compte. Les utilisateurs peuvent posséder des scores anciens dans `exercices_francais_scores` avec des champs et formats hétérogènes ; une évolution de l'application ne doit pas faire disparaître cet historique. Les sessions en cours ont un cycle de vie différent des scores achevés.

## Options envisagées

1. Remplacer le stockage par un nouveau format et effacer les anciennes données : simple, mais perte irréversible de progression.
2. Réécrire toutes les données à chaque ouverture : migrations centralisées, mais risque d'altérer les champs inconnus ou des données invalides.
3. Conserver les anciennes données sans réécriture, ajouter seulement les nouvelles entrées et afficher des valeurs de repli au besoin : davantage de lecture défensive, mais rétrocompatibilité maximale.

## Décision

Retenir l'**option 3**. Garder la clé `exercices_francais_scores` et les champs inconnus. Ajouter un score seulement si l'historique existant peut être lu correctement. Une suppression individuelle exige un dialogue de confirmation et un contrôle d'obsolescence ; elle ne supprime aucun autre score.

Une heure absente s'affiche d'après la date ISO si elle est exploitable, sinon `00:00`. Séparer les sessions temporaires `exercices_in_progress_<jeu>` des résultats durables. Sauvegarder/reprendre sans faire progresser un jeu pendant l'affichage des scores et sans enregistrer deux fois la fin de partie.

## Conséquences

- **Bénéfice :** conservation de l'historique et adaptation aux anciens enregistrements.
- **Compromis :** code de lecture/validation défensif et tests des mélanges de formats.
- **Invariants :** ne jamais écraser silencieusement un historique illisible ; une erreur `localStorage` ne doit pas bloquer le jeu.

## Références

- [Architecture transversale](../ARCHITECTURE.md)
- `AGENTS.md`, `scores.js`, `game-state.js`, `score-view.js`
