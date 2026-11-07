# Thème et ressources graphiques actuels

Les fichiers de référence sont [`theme.css`](../../styles/themes/magical-academy/theme.css) (palette, fond, cadre standard), [`components.css`](../../styles/themes/magical-academy/components.css) (navigation et exercices), [`home.css`](../../styles/themes/magical-academy/home.css) (accueil) et [`conjugaison.css`](../../styles/themes/magical-academy/conjugaison.css) (saisie de Conjugaison).

## Répartition des CSS

- `home-layout.css` : structure et disposition de base des cartes de l’accueil.
- `styles/themes/magical-academy/home.css` : composition illustrée de l’accueil.
- `styles/themes/magical-academy/theme.css` : couleurs, fond de page et cadre global.
- `styles/themes/magical-academy/components.css` : composants communs (navigation, onglets, progression, questions, touches).
- `styles/themes/magical-academy/results.css` : carte de résultat finale commune aux exercices classiques.
- `styles/themes/magical-academy/scores.css` : graphique, historique et adaptation mobile de Scores.
- `shared-components.css` : styles utilitaires communs et historique des scores.
- `school-base.css` : styles de base des pages scolaires ; `exercise-base.css` : contrôles classiques avant l’application du thème.
- `exercise-header.css` : bouton de redémarrage du bandeau.
- `scores-base.css` : styles de base de la page Scores ; `scores-overlay.css` : affichage plein écran des scores pendant une partie.
- `francais.css`, `calcul.css`, `keyboard.css`, `magic.css`, `space.css` et `styles/themes/magical-academy/conjugaison.css` : styles spécifiques aux jeux et à leur clavier.

Les noms distinguent les **bases de mise en page**, le **thème visuel** et les **styles propres à un jeu**. Les feuilles sont chargées dans l’ordre indiqué par chaque page HTML ; `components.css` termine la base commune ; `results.css` ou `scores.css` est ensuite chargé selon la page.

Les images utilisées en production résident uniquement dans [`styles/themes/magical-academy/assets/`](../../styles/themes/magical-academy/assets/) :

| Images | Utilisation |
| --- | --- |
| `background-scene-landscape.webp`, `background-scene-vertical.webp` | Arrière-plan selon l'orientation, sans variation liée à la hauteur du contenu |
| `home-book.webp` | Livre de l'accueil et icône Orthographe |
| `home-parchment.webp`, `home-calcul.webp`, `home-rocket.webp`, `home-magical-hat.webp` | Icônes d'activités et, pour certaines, de titres |
| `home-cup.webp`, `home-archery-target.webp`, `home-hourglass.webp` | Indicateurs « Mes progrès » |
| `nav-background.webp`, `nav-back.webp`, `nav-reset.webp`, `nav-scores.webp` | Navigation en deux calques alignés ; Scores utilise aussi le symbole sans cadre dans son titre |
| `question-frame-filled-9slice.webp` | Cadres Question et « Mes progrès » (`border-image-slice: 100 110 100 110 fill`) |
| `verifier-wand.webp`, `verifier-retry.webp`, `verifier-success.webp` | États des boutons de validation |

Les calques WebP sont des fichiers **de production**, déjà optimisés et versionnés. Aucun dossier d'import, workflow de conversion ou maquette de référence n'est requis pour construire le site. Les volutes du livre, les onglets, les flèches et le cadre global sont dessinés en CSS/SVG ; les contrôles et leurs libellés restent de vrais éléments HTML accessibles.

Lorsqu'une ressource est remplacée, préserver son chemin ou mettre à jour tous ses consommateurs. Le test `tests/repository-integrity.test.cjs` détecte les références locales manquantes ; un contrôle visuel reste nécessaire en portrait et en paysage. Voir le [guide typographique](TYPOGRAPHY.md).
