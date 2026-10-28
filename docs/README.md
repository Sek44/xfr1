# Documentation d'Entraînement (xfr1)

La documentation est versionnée avec le code et décrit **l'état actuel**. L'historique des modifications est dans Git, pas dans un changelog permanent.

## Sources de vérité

| Périmètre | Document |
| --- | --- |
| Site, services communs, persistance et tests | [Architecture transversale](ARCHITECTURE.md) |
| Travaux communs encore ouverts | [Backlog transversal](BACKLOG.md) |
| Décisions techniques communes | [ADR transversaux](adr/README.md) |
| Français | [Spécifications](games/francais/SPECIFICATIONS.md) · [Architecture](games/francais/ARCHITECTURE.md) · [Backlog](games/francais/BACKLOG.md) |
| Calcul | [Spécifications](games/calcul/SPECIFICATIONS.md) · [Architecture](games/calcul/ARCHITECTURE.md) · [Backlog](games/calcul/BACKLOG.md) |
| Mission calcul | [Spécifications](games/space/SPECIFICATIONS.md) · [Architecture](games/space/ARCHITECTURE.md) · [Backlog](games/space/BACKLOG.md) |
| Mission magique | [Spécifications](games/magic/SPECIFICATIONS.md) · [Architecture](games/magic/ARCHITECTURE.md) · [Backlog](games/magic/BACKLOG.md) |

Contrairement à GMR, les fichiers HTML/JS/CSS des jeux sont aujourd'hui **à la racine** du dépôt. Leurs documents résident donc dans `docs/games/<id>/` ; cette organisation documentaire **ne déplace pas le code**.

## Méthode de maintenance

- **SPECIFICATIONS.md** : règles fonctionnelles effectivement livrées, contraintes observables et cas particuliers. Ni liste de souhaits ni récit des corrections.
- **ARCHITECTURE.md** : modules, responsabilités, interfaces, flux et invariants du code en vigueur. Ne pas recopier les règles détaillées du jeu.
- **BACKLOG.md** : uniquement problèmes identifiés, vérifications et évolutions encore ouvertes. Distinguer anomalie démontrée et piste à étudier ; retirer les tâches terminées.
- **ADR** : décision structurante durable avec contexte, options et conséquences ; ne pas réécrire l'histoire d'un ADR accepté. En cas de changement, créer son successeur et indiquer « Remplacé par ».
- **Git** : historique détaillé. Aucun `CHANGELOG.md` ni `REFACTORING.md` permanent.

Le backlog commun utilise `XFR1`, suivi d'un entier (ex. `XFR11`) ; les backlogs locaux utilisent `FRANCAIS`, `CALCUL`, `SPACE` ou `MAGIC` suivis d'un entier. Chaque tâche commence par `- [ ] **ID — Titre.**`.

Chaque backlog conserve **Dernier identifiant attribué**. Un ID est unique, stable, croissant, et n'est jamais renuméroté ni réutilisé, même si la tâche est déplacée ou supprimée. Si un sujet passe d'un backlog à l'autre, conserver une référence à l'ancien ID ; ne pas dupliquer la tâche.

Mettre à jour les spécifications/architectures **dans le même changement que le code** et supprimer les affirmations périmées. Ajouter un besoin non réalisé au backlog plutôt qu'aux spécifications. Une décision de conception durable va dans un ADR. Favoriser les liens plutôt que la duplication.

Les instructions opérationnelles pour les agents se trouvent dans [AGENTS.md](../AGENTS.md), qui conserve notamment la compatibilité des scores et des sessions.

## Contrôles

- Tests : `node --test tests/*.test.cjs`.
- Formatage : `npx prettier@3.6.2 --check "**/*.{html,js,cjs,css}"`, si Prettier est disponible.
- Vérifier les liens relatifs et les IDs de backlog.
- Signaler séparément les tests sur appareils réels (tactile, portrait/paysage, pause et reprise) non exécutés.
