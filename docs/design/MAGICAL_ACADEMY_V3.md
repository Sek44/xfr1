# V3 — Académie magique : proposition de design (non implémentée)

> **Statut : concept validé pour implémentation future.** La version actuelle **V1** doit rester accessible : commit `dc834368265255a943ba45d76b6937f05c55a14c`. Cette documentation ne modifie ni les exercices ni leur logique.

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
