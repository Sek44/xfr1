# Typographie — état actuel

Source de vérité : [`styles/typography.css`](../../styles/typography.css). Les composants visuels se trouvent dans [`classic.css`](../../styles/themes/magical-academy/classic.css) et [`home-v3.css`](../../styles/themes/magical-academy/home-v3.css).

## Familles

- `--font-ui` : police système, contrôles, onglets, claviers, compteurs et texte courant.
- `--font-display` : Georgia (repli serif), grands titres, questions classiques et titre/valeurs de « Mes progrès ».

Aucune police externe n'est téléchargée.

## Échelle

| Token | Taille pour une base de 16 px |
| --- | --- |
| `--text-xs` | 14 px |
| `--text-sm` | 16 px |
| `--text-md` | 18 px |
| `--text-lg` | 22 px |
| `--text-xl` | 28 px |
| `--text-2xl` | 36 px |
| `--text-3xl` | 44 px |
| `--text-4xl` | 52 px |

Graisses : `--weight-normal` (400), `--weight-medium` (600), `--weight-bold` (700) et `--weight-heavy` (800).

Préférer les rôles `--type-*` (`home-title`, `page-title`, `card-title`, `question`, `tab`, `score-tab`, `stat`, etc.) à de nouvelles tailles arbitraires. Les rôles communs s'adaptent à 520 px et 360 px. Les missions conservent leurs propres placements de HUD.

Sur l'accueil, « Mes progrès » partage `--type-card-title`, `--type-stat`, `--daily-icon-size` et `--daily-divider-gap` pour équilibrer titres, icônes et espacements. Les ajustements de mise en page restent dans `home-v3.css`.
