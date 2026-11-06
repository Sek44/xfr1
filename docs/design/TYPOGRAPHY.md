# Typographie officielle — Entraînement

Source de vérité : [`styles/typography.css`](../../styles/typography.css).
Cette spécification décrit les styles actuellement appliqués. L'apparence
des composants de l'Académie magique est conservée dans
[`classic.css`](../../styles/themes/magical-academy/classic.css).

## Deux familles

- `--font-ui` : police système, utilisée par les contrôles, onglets, compteurs,
  étiquettes, pavés numériques et textes courants.
- `--font-display` : Georgia (avec repli serif), réservée aux grands titres
  décoratifs et au texte principal des questions classiques.

Les polices de l'interface ne nécessitent aucun téléchargement de police externe.

## Échelle commune

| Variable | Taille pour un `rem` à 16px | Usage |
| --- | --- | --- |
| `--text-xs` | 14px | Informations secondaires, onglets compacts |
| `--text-sm` | 16px | Texte courant |
| `--text-md` | 18px | Onglets, libellés |
| `--text-lg` | 22px | Actions principales, cartes |
| `--text-xl` | 28px | Titres de sections, nombres |
| `--text-2xl` | 36px | Titres des pages, questions |
| `--text-3xl` | 44px | Grand titre d'accueil |
| `--text-4xl` | 52px | Score final |

Les unités `rem` suivent la taille de police préférée du navigateur.
Les `clamp()` utilisent ces niveaux comme bornes pour les textes fluides.
Quelques dimensions contextuelles sont conservées pour les décorations,
graphiques et HUD des jeux d'arcade.

## Quatre graisses

- `--weight-normal` : 400
- `--weight-medium` : 600
- `--weight-bold` : 700
- `--weight-heavy` : 800

Éviter les valeurs intermédiaires non officielles comme 650, 750 et 850.

## Rôles sémantiques

Utiliser les variables `--type-*` plutôt que de choisir une taille arbitraire
pour les composants réutilisables : `home-title`, `page-title`,
`section-title`, `card-title`, `question`, `action`, `tab`,
`score-tab`, `progress-label`, `score-number`, `result-score` et `stat`.

Les rôles changent à 520px et à 360px pour protéger l'espace disponible
sur les petits écrans. Les composants de navigation, onglets, progression,
boutons et résultats sont stylés dans `classic.css` pour Français,
Conjugaison, Calcul et Scores. Les CSS propres aux jeux ne doivent pas
redéfinir ces composants communs.

La page d'accueil utilise les mêmes rôles dans `home-v3.css`. Mission Calcul
et Mission Magique réutilisent la même échelle et les mêmes graisses, tout
en conservant leurs positions et tailles de HUD propres au jeu.

Le cadre « Mes progrès aujourd'hui » de l'accueil utilise Georgia
(`--font-display`) pour son titre, ses valeurs et les libellés de progression.
Son titre utilise `--type-card-title`, comme les noms d'exercices sur
l'accueil ; ses compteurs utilisent `--type-stat`, limités au minimum
`--text-sm` sur téléphone pour éviter le débordement. Les espacements
internes et les tailles d'icônes s'adaptent à la largeur disponible
dans `home-v3.css` sans modifier les dimensions du cadre décoratif.
