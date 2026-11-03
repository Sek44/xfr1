# V3 — Académie magique : design et intégration

> **Statut : première intégration visuelle réalisée (2 novembre 2026), à compléter.** La version actuelle **V1** doit rester accessible : commit `dc834368265255a943ba45d76b6937f05c55a14c`. L'intégration visuelle n'a pas modifié les générateurs d'exercices ni la logique de progression.

## Intention et périmètre

Identité immersive « académie de magie » : nuit bleu profond, silhouettes de château, étoiles discrètes, lumière de lanterne, parchemin ivoire, touches dorées, pictogrammes illustrés. L'ensemble doit rester beau, professionnel, lisible et utilisable sur téléphone/tablette, sans surcharge visuelle. Le thème englobe **l'accueil, Français, Conjugaison, Calcul, Scores**, ainsi que les dialogues et messages communs. Les deux missions peuvent conserver leur propre rendu de gameplay, mais les éléments partagés (navigation, scores, dialogues) doivent pouvoir utiliser les composants génériques lorsque pertinent.

Aucun bouton de changement de thème n'est présenté à l'utilisateur : le thème actif est défini **dans le code**.

## Structure de l'interface

### Accueil
- Titre du site : **Entraînement**.
- Compteur du jour (exercices terminés et minutes de jeu) en encart informatif, non cliquable.
- Liste **verticale** de toutes les activités ; une carte rectangulaire par exercice, avec icône à gauche, titre au centre, chevron à droite. Ajouter une activité consiste à déclarer une nouvelle entrée dans les données de navigation, sans reconstruire la grille.
- Accès aux scores ; mise en page fluide et compatible mobile/paysage.

### En-tête des sous-pages
- Bandeau commun : retour, titre, redémarrage (si applicable), scores. Même logique et mêmes zones tactiles sur Français, Conjugaison, Calcul et Scores.
- Conserver les comportements actuels des boutons, dont le redémarrage avec confirmation.

### Français
- Sélecteur de série **en boutons radio visuels** : g/gu/ge, c/ç et, à l'avenir, autres familles. Une seule valeur active.
- Ces choix sont un **groupe de boutons indépendant**, avec un espacement visible **au-dessus du panneau de question** : pas des onglets fusionnés au bord du panneau.
- Cadre de question en parchemin, **sans illustration incorporée à la question**. Les mots ne se coupent pas de façon illisible ; la réponse sélectionnée reste visible.
- Réponses sous forme de touches sélectionnables, puis bouton principal de validation.

### Conjugaison
- Même composant de sélection radio si plusieurs temps ou groupes sont ajoutés ; compatible avec un groupe unique actuel.
- Deux zones visuellement cohérentes dans le panneau : **verbe à conjuguer en gras** et **phrase normale**, avec **réponse tapée en gras**.
- Conserver le clavier AZERTY commun (accents, disposition et actions), sa largeur utile, l'édition et la sauvegarde en cours.

### Calcul
- Les choix **Catégorie** et **Difficulté** utilisent des **listes déroulantes natives stylisées**, pas des onglets ni des boutons radio. Deux contrôles réutilisables, avec labels explicites, choix courants visibles, accessibles au clavier et au tactile.
- Question dans le même cadre de contenu ; pavé numérique partagé ; bouton de validation identique.

### Scores
- Filtres cohérents avec les composants communs ; historique et suppression avec confirmation conservés.
- Évolution des scores par exercice en **graphique en ligne avec points** (pas d'histogramme). États vides et affichage mobile prévus. Ne pas inventer d'historique.

## Feedback et confirmations

### Réponse correcte
- **Message discret dans le contenu, jamais une popup ni une modale** ; la question et la réponse restent totalement visibles.
- Exemple : « Bravo ! Bonne réponse ! » ; message court, accessible (`role=status`), sans masquer l'écran.
- Dès que la réponse est validée, le bouton **« Valider » disparaît** et le bouton **« Question suivante → » apparaît au même emplacement**. Le délai d'avancement automatique existant peut rester actif (3 secondes), avec possibilité d'avancer manuellement.
- Après une réponse fausse, conserver la correction possible mais ne pas attribuer de point ; afficher un retour concis et non bloquant dans la même zone.
- Respecter le calcul des scores actuels et les points d'exercice quotidiens.

### Confirmation
- Les actions destructrices / abandon / redémarrage utilisent un **dialogue modal partagé** : titre descriptif, conséquence claire, boutons **Annuler** et action confirmée.
- Fond assombri, panneau parchemin, focus clavier cohérent, Échap et annulation sûrs. Pas de confirmation sur les réponses normales.

## Architecture de thème — changer d'apparence sans réécrire les jeux

Séparer explicitement :

1. **Comportements / données** : générateurs de questions, scoring, persistance et routage, indépendants du CSS et des images.
2. **Composants UI** : `PageHeader`, `ActivityRow`, `ProgressSummary`, `QuestionPanel`, `RadioGroup`, `SelectField`, `PrimaryButton`, `AnswerChoice`, `VirtualKeyboard`, `Keypad`, `InlineFeedback`, `ConfirmDialog`, `ScoreLineChart`. Les HTML/JS et API d'interaction ne dépendent pas du thème.
3. **Thème** : une configuration nommée `magical-academy` rassemble palette, bordures, courbes, ombres, fontes, images et icônes. Les futurs thèmes (`nature`, `space`, `minimal`) reprennent les mêmes noms de tokens et les mêmes composants.

### Répartition proposée

```text
styles/
  tokens.css                 # Contrat de tokens sémantiques
  layout.css                 # Responsive et mises en page génériques
  components.css             # Boutons, cartes, onglets radio, selects, dialogues…
  themes/
    magical-academy/
      theme.css              # Valeurs des tokens
      assets/
        background.webp
        header.webp
        decoration.webp
        icons/...
```

*Cette arborescence est une proposition d'architecture, pas un dossier déjà créé dans V1.*

### Contrat de tokens CSS

```css
/* Valeurs indicatives à ajuster au rendu final. */
:root[data-theme="magical-academy"] {
  --color-background: #102b54;
  --color-surface: #fff3dc;
  --color-surface-muted: #e9f1f7;
  --color-text: #1d2841;
  --color-primary: #1b5d9a;
  --color-on-primary: #ffffff;
  --color-accent: #d5a04e;
  --color-border: #bf8a3d;
  --color-success: #276a42;
  --color-danger: #b43a40;

  --font-ui: system-ui, Arial, sans-serif;
  --font-display: Georgia, serif;
  --radius-panel: 18px;
  --radius-control: 12px;
  --border-panel: 2px solid var(--color-border);
  --shadow-panel: 0 6px 24px #071e4a50;

  --image-background: url("./assets/background.webp");
  --image-header: url("./assets/header.webp");
  --image-decoration: url("./assets/decoration.webp");
}
```

Définir aussi les tailles minimales tactiles, espacements, états `hover/focus/active/disabled`, les contrastes, et des variantes de densité pour les tablettes en paysage. Éviter les couleurs codées en dur dans chaque exercice. Les illustrations doivent être des **assets remplaçables** ; les textes, graphiques et contrôles demeurent en HTML/SVG/CSS accessibles. Ne jamais incorporer du texte de question ou des boutons fonctionnels dans les images.

## Exigences de migration et qualité

- **Ne pas modifier V1 en place avant validation** du nouveau thème ; implémenter dans une branche de travail ou via un mécanisme de sélection **uniquement interne au code**.
- Sauvegardes `localStorage`, anciens scores, pondérations, crédits quotidiens, reprise après rechargement, confirmations et navigation : préserver exactement les contrats existants.
- Le système doit accepter de nouvelles familles de Français, de nouveaux temps de conjugaison et de nouvelles difficultés sans ajustements manuels de CSS.
- Vérifier téléphone étroit, tablette portrait/paysage, longs libellés, clavier visible, scroll, orientation, contrastes, focus, lecteur d'écran et `prefers-reduced-motion`.
- Tester particulièrement l'interaction entre feedback inline, bouton « Question suivante », minuteur automatique et sauvegarde/reprise.

## Références

- Version de départ **V1** : [commit conservé](https://github.com/Sek44/xfr1/commit/dc834368265255a943ba45d76b6937f05c55a14c).
- Concept visuel : « Académie magique — système de design Entraînement » élaboré dans la conversation du 2 novembre 2026. Les images sources sont jointes à cette conversation ; elles ne sont pas embarquées dans ce fichier Markdown.

## Suivi de l'intégration V3 (2 novembre 2026)

- Thème `magical-academy` activé dans le code sur accueil, Français, Conjugaison, Calcul et Scores, via `data-theme` sur `html`.
- Feuille de thème centralisée : `styles/themes/magical-academy/theme.css`. Palette et tokens sémantiques, parchemins, boutons bleus et or, en-têtes nocturnes, choix radio, listes déroulantes, messages inline et confirmations natives.
- Mise en page verticale des activités sur l'accueil, sans toucher aux liens ni aux données de progression.
- Intégration actuelle en CSS uniquement : **des illustrations SVG de remplacement (château, livre, lanterne) sont désormais intégrées ; les images originales de la maquette ne sont pas encore importées en fichiers binaires**. L'image de la maquette ne doit pas être utilisée en fond car elle contient des contrôles et des textes.
- À vérifier avant clôture : tests automatisés et captures réelles mobile/tablette, ajustements visuels, éventuels changements de DOM pour les composants totalement génériques.

### Assets illustrés ajoutés

- `styles/themes/magical-academy/assets/castle.svg` : fond panoramique nocturne.
- `styles/themes/magical-academy/assets/book.svg` : livre décoratif.
- `styles/themes/magical-academy/assets/lantern.svg` : lanterne décorative.

Ces illustrations sont des recréations SVG, et non des extractions pixel à pixel de la maquette. Les éléments interactifs restent du HTML et du CSS.

## Intégration des assets WebP (2 novembre 2026)

Les images de `docs/design/` sont désormais utilisées par le thème via les variables `--art-*` de `styles/themes/magical-academy/theme.css` : scène panoramique, cinq pictogrammes de jeux, livres et lanterne. Les autres illustrations (potion, plume, parchemin) sont déclarées et disponibles pour des décorations ciblées. Les contrôles, textes et messages demeurent de vrais éléments HTML/CSS ; aucune interface n'est pré-rendue depuis `design_v3.png`. V1 reste accessible par son commit historique.

## Raffinement visuel du 2 novembre 2026

La feuille `styles/themes/magical-academy/theme.css` a été restructurée pour se rapprocher de la référence V3 : décor panoramique concentré en haut de page, bandeaux bleu nuit affinés, surfaces parchemin à **bordure dorée simple**, meilleure hiérarchie typographique et cartes d'activités plus compactes en vue téléphone. Les fichiers WebP existants servent au château, aux pictogrammes des cinq activités, aux livres, à la lanterne et à la potion de progression. Les en-têtes, réponses, sélecteurs, boutons, messages et confirmations des pages scolaires utilisent une palette partagée.

**Validation restante :** vérifier le rendu et les zones tactiles sur de vrais téléphones/tablettes (portrait et paysage), les tailles de textes et la concordance fine avec `design_v3.png`. Aucun changement n'a été apporté à la génération des questions, au score ou aux clés de persistance.

## Accueil V3 : bannière et progression (état courant)

- L'accueil utilise un **bandeau illustré unique** (`.academy-hero`) : livre ouvert centré, titre « Entraînement » dans un cartouche violet et or, raccourci circulaire vers les scores et bouton circulaire de préférences d'affichage. L'ancien bandeau horizontal et le grand panneau d'introduction ont été supprimés.
- Le bouton de préférences ouvre un panneau natif accessible avec une option fonctionnelle « Afficher les descriptions des activités », enregistrée dans la clé distincte `entrainement_home_descriptions_v1`. Cette option **ne change pas le thème** et n'interfère pas avec les scores ou la progression.
- « Mes progrès aujourd'hui » est désormais un **panneau parchemin en deux colonnes** : trophée et titre, puis cible et nombre d'exercices, horloge et minutes autorisées. Les deux compteurs sont mis à jour par `DailyExercises.mountStats` à partir du même stockage `entrainement_daily_exercises_v1` (1 point = 5 min). L'ancien `DailyExercises.mount` reste disponible pour les consommateurs existants.
- L'organisation propre à l'accueil est dans `index.html` et `styles/themes/magical-academy/home-v3.css` ; la feuille `theme.css` reste commune aux exercices.
- À valider encore : rendu exact et lisibilité sur mobiles/tablettes réels, fonctionnement du menu de préférences au tactile et conformité fine aux proportions de `design_v3.png`.

## Conjugaison V3 — bandeau et cadre de question (2 novembre 2026)

- Le bandeau `.conjugaison-banner` affiche la plume `--art-quill` auprès du titre, avec trois contrôles circulaires (accueil, recommencer, scores). Les **identifiants, liens et gestionnaires existants restent inchangés** ; le lien Scores garde le filtre `?game=conjugaison`.
- Le temps courant est présenté sur un cartouche parchemin indépendant et les blocs Question/Score sont deux plaques arrondies.
- L'élément `.question-frame` regroupe **uniquement** le verbe et la phrase. Il utilise `--art-parchment` (fichier `docs/design/parchment-ornament.webp`) comme illustration de cadre, avec une bordure et un fond CSS de secours ; les textes et la réponse restent de vrais éléments DOM.
- Le clavier AZERTY commun et la validation restent **à l'extérieur** du sous-cadre afin de préserver la largeur des dix touches, notamment sur téléphone. Un fichier dédié `styles/themes/magical-academy/conjugaison-v3.css` isole ces règles visuelles.
- Vérifications statiques effectuées : structure HTML, syntaxe JavaScript, liens des contrôles, ressources du thème et règles responsive. **Vérification visuelle réelle et exécution complète des tests Node encore nécessaires.**

## Correctif cadres 9-slice transparents (3 novembre 2026)

Les deux cadres générés pour Conjugaison remplacent l’ancien `parchment-ornament.webp` étiré : fichiers WebP RGBA optimisés `styles/themes/magical-academy/assets/title-frame-9slice.webp` et `question-frame-9slice.webp`. Le cartouche du temps et le cadre de la question sont dessinés en **9-slice CSS (`border-image-slice`)**, avec conservation des quatre coins, étirement limité aux segments rectilignes et centre transparent. Les fonds parchemin sont désormais des dégradés CSS indépendants des images. Les textes et contrôles restent dans le DOM, le clavier garde sa largeur. Sources, dimensions et valeurs de découpe : voir `docs/design/README.md`.

## Conjugaison — cadres avec fond intégré et clavier séparé (3 novembre 2026)

Les assets `title-frame-filled-9slice.webp` et `question-frame-filled-9slice.webp` remplacent les cadres sans remplissage. Leur **centre parchemin est intégré** à l'image et rendu par `border-image-slice: ... fill` ; les surfaces CSS arrondies qui débordaient derrière les contours sont supprimées. Les bords droits s'étirent sans déformer les coins. Pour les dimensions exactes et la découpe, voir `docs/design/README.md`.

Le panneau en cours de jeu est un conteneur transparent avec deux composants distincts : `question-frame` (verbe et phrase) et `keyboard-panel` (AZERTY, retour de réponse et bouton Vérifier/Suivant). Le panneau final reste inchangé ; scores, contrôles, sauvegardes et API des exercices ne sont pas modifiés. Tests visuels réels téléphone/tablette encore à effectuer.

## Conjugaison — bordure globale de la page (3 novembre 2026)

La maquette présente un **cadre extérieur unique**, qui englobe le titre, ses boutons de navigation, le cartouche du temps, les scores, la question et le clavier. Le cadre local du bandeau `Conjugaison` a donc été supprimé (aucun fond ni bordure autour du titre et de ses boutons). La bordure extérieure est appliquée à `main` en CSS avec un liseré ivoire/or, des angles arrondis et de discrets ornements centraux ; elle s'adapte automatiquement à la hauteur du contenu et au défilement.

La décoration et les zones tactiles sont indépendantes. Les quatre nouveaux WebP du bandeau, les cadres parchemin 9-slice, le clavier, les scores, la navigation et les sauvegardes restent inchangés. Sur téléphone, les marges du cadre sont réduites pour préserver la largeur des dix colonnes du clavier AZERTY. Aucun nouvel asset n'est nécessaire pour la bordure extérieure.

## Conjugaison — compacité sur téléphone (3 novembre 2026)

Le panneau extérieur est désormais rempli d'un bleu nuit **translucide** `rgba(6, 23, 58, .58)` pour laisser transparaître le décor sans perdre le contraste des éléments clairs. Les marges verticales ont été réduites dans l'en-tête, autour du cartouche du temps, des panneaux Question/Score, du cadre du verbe et sous la phrase. Le cadre du verbe place maintenant **« Verbe à conjuguer » et l'infinitif sur une même ligne**, avec typographie adaptative pour les petits écrans.

La zone de feedback vide ne réserve plus inutilement de hauteur : elle reprend son espace lorsque des messages sont affichés. Les hauteurs minimales des touches AZERTY et le fonctionnement des boutons Vérifier/Suivant, Reset, Scores et de la persistance n'ont pas été changés. Le travail est contenu dans `styles/themes/magical-academy/conjugaison-v3.css` ; aucun changement de données ni de logique métier.

## Conjugaison — typographie et dimensions du 3 novembre 2026

Le cartouche « Présent de l’indicatif · 1er groupe » a désormais une largeur adaptée à son texte (`width: max-content` limité à `100%`) et garde les bordures 9-slice sans étirement excessif. Les étiquettes **Question** et **Score** utilisent une typographie commune, plus grande et plus épaisse ; le chiffre du score et l'étoile sont renforcés.

Dans le cadre de la question, les libellés et l'infinitif sont plus lisibles sur une même ligne, avec une réduction contrôlée sur les écrans étroits. La phrase en police d'affichage est agrandie. Le cadre n'impose plus de hauteur minimale : l'espace sous la phrase est déterminé par la marge intérieure nécessaire au contour doré, et augmente naturellement si la phrase revient à la ligne.

Les caractères des touches AZERTY deviennent plus grands et plus gras, sans changer les dimensions tactiles des touches ni la disposition commune. Les touches d'actions (« Tout effacer », « Espace », suppression) conservent une taille de texte spécifique pour ne pas déborder. Tous ces réglages sont limités à Conjugaison, dans `styles/themes/magical-academy/conjugaison-v3.css`. Aucun changement de score, logique de jeu ou stockage.

## Conjugaison — stabilité de la réponse et touches d'édition (3 novembre 2026)

- Le cartouche bleu « Verbe à conjuguer … » possède davantage de marge intérieure à gauche et à droite, sans changer sa position ni le cadre doré extérieur.
- La réponse est composée d'un emplacement `inline-grid` contenant une **réserve invisible de la largeur réelle de la bonne conjugaison** (`.answer-reserve`) et une valeur saisie visible (`.answer-visible`) superposée. La largeur initiale est donc suffisante pour la bonne réponse, même lorsqu'aucune lettre n'a été saisie. Une saisie incorrecte plus large peut agrandir l'emplacement normalement. Le texte de la réponse attendue n'est pas affiché et la réserve est ignorée par les lecteurs d'écran.
- `updateAnswer()` ne remplace plus le conteneur : elle met à jour seulement la valeur visible et son libellé accessible. Cela conserve la réserve pendant toute la saisie ainsi qu'après rechargement de la partie.
- La touche « Tout effacer » affiche désormais **Tout / effacer** sur deux lignes avec des marges latérales, tout en conservant `aria-label="Tout effacer"` et son action. La touche « Espace » possède une police plus grande et le symbole de retour arrière est agrandi.
- Les proportions particulières des touches d'édition sont limitées au jeu Conjugaison ; le clavier AZERTY générique, ses commandes et les données persistantes restent inchangés.

## Conjugaison — score et espacement du 3 novembre 2026

- Le bloc **Score** affiche uniquement les points gagnés (ex. `Score 3`) ; le compteur **Question** conserve son total `4/10`. Cette différence est propre à Conjugaison et n'affecte pas le composant `ExerciseGame.progress` partagé.
- L'étoile du score est agrandie, avec une adaptation sur petit écran.
- Le cartouche **Verbe à conjuguer** est légèrement moins haut (padding vertical et hauteur minimale réduits), mais dispose d'une marge extérieure inférieure plus grande pour mieux séparer le cartouche de la phrase.
- Le pictogramme de suppression du clavier est légèrement réduit. Les fonctions et les autres touches restent inchangées.

**Feedback sans décalage de page — implémenté :** le bouton principal conserve sa position et sa hauteur dans les trois états : « Vérifier » (bleu), « Incorrect · Réessaie » (rouge), « Bravo ! Suivant » (vert). Une bonne réponse obtenue après une erreur affiche « Bien corrigé ! Suivant » et ne donne pas de point. À la prochaine modification de la réponse, le bouton rouge repasse immédiatement au bleu. L'ancienne notification visible au-dessus du bouton a été supprimée. Une zone permanente `role="status"`, `aria-live="polite"` et masquée visuellement annonce les informations complètes sans occuper d'espace. Le délai de progression automatique existant et le clic sur Suivant sont conservés.


## Conjugaison — pastilles équilibrées et notification dans le bouton (3 novembre 2026)

Les pastilles Question et Score ont maintenant deux colonnes intrinsèques de même taille. Leur largeur est fixée par le texte le plus large, au lieu d'occuper systématiquement toute la page ; le groupe reste centré et peut se réduire sur les petits écrans. Les marges horizontales internes sont proches des marges verticales. L'étoile du score est agrandie et alignée verticalement par flexbox.

Le libellé du verbe se termine par « : » avant l'infinitif. Le comportement du bouton principal dépend du résultat : erreur rouge, reprise de la saisie en bleu, réussite verte, sans panneau d'information supplémentaire ni changement de hauteur. La zone accessible `conjugaison-feedback-live` porte l'annonce vocale. Aucun autre exercice ne reçoit ces styles ou ce comportement.
