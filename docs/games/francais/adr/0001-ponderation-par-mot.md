# ADR-0001 — Pondérer les exercices par mot plutôt que par phrase

- **Statut :** Accepté (déjà implémenté)
- **Date :** 28 octobre 2026 (formalisation)
- **Portée :** Français — constitution des séries

## Contexte

Plusieurs phrases peuvent exercer le même mot. Un tirage parmi toutes les phrases favoriserait mécaniquement les mots les plus représentés et ferait revenir trop souvent une même difficulté. Les erreurs doivent au contraire conduire à davantage d'entraînement.

## Options envisagées

1. Tirer toutes les phrases uniformément : simple, mais répétition excessive de mots avec beaucoup de variantes.
2. Pondérer chaque phrase par son historique : réduit des répétitions de phrases, mais conserve le biais des variantes d'un même mot.
3. Tirer des mots distincts en tenant compte de leur historique et des erreurs, puis choisir une phrase variante : plus de suivi local mais un tirage pédagogique plus équitable.

## Décision

Retenir l'**option 3**. Identifier le mot par famille et orthographe reconstituée, tirer jusqu'à 10 mots sans remise selon le poids `(1 + 3 × erreurs) / (1 + max(0, apparitions − erreurs))²`, puis choisir une phrase parmi ses variantes. Enregistrer une apparition lorsque le mot est effectivement présenté ; comptabiliser une erreur au premier essai incorrect.

Conserver les compteurs de mots et d'erreurs dans `localStorage` et migrer les anciens compteurs de phrases uniquement si le compteur de mots n'existe pas.

## Conséquences

- **Avantages :** diversification des mots, révision accrue des mots mal maîtrisés, absence de biais lié au nombre de phrases.
- **Compromis :** historique local sans synchronisation, besoin de normaliser les mots et de vérifier la qualité des triplets de phrases.
- **Invariant :** ne pas afficher une partie de `gu` ou `ge` dans la question à trous.

## Références

- [Spécifications Français](../SPECIFICATIONS.md) · [Architecture Français](../ARCHITECTURE.md)
- `francais.js`, `AGENTS.md`
