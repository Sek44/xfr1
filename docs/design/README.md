# Magical Academy V3 — image assets (concept extraction)

This package includes text-free illustrative crops from the generated reference sheet.
They are **concept assets**, not production-ready scalable components.

- background-scene.webp: scene/banner artwork
- icon-*.webp: activity illustrations (with their decorative tile backgrounds)
- parchment-ornament.webp: blank decorative plaque
- *-decoration.webp: additional illustrative props

All interactive controls, labels, charts, forms and dialogs should be implemented with HTML/CSS/SVG and shared semantic theme tokens, not cropped from the reference image.
The original reference sheet is included for implementation guidance only and contains example text.

## Cadres 9-slice utilisés sur les pages classiques

Les cadres avec parchemin intégré sont les seules versions conservées dans `styles/themes/magical-academy/assets/` :

- `title-frame-filled-9slice.webp` (1200 × 230 px), pour les cartouches de titre ou de temps : `border-image-slice: 55 110 55 110 fill`.
- `question-frame-filled-9slice.webp` (1000 × 495 px), pour les questions : `border-image-slice: 100 110 100 110 fill`.

Ces images contiennent la bordure dorée et le centre parchemin ; seules les zones externes irrégulières restent transparentes. Le rendu `border-image` conserve les proportions des coins. Les anciennes images à centre transparent et la plume illustrée inutilisée ont été retirées.

## Illustrations du bandeau Conjugaison — 3 novembre 2026

La plume et les trois boutons illustrés sont des images WebP RGBA recadrées, sans fond opaque extérieur, dans `styles/themes/magical-academy/assets/` :

- `parchment.webp`, décoration du titre Conjugaison.
- `nav-back-academy.webp` (320 × 320), flèche retour sur bouton bleu nuit et or.
- `nav-restart-academy.webp` (320 × 320), relancer la série.
- `nav-scores-academy.webp` (320 × 320), accès aux scores.

Le bandeau et ces assets sont désormais partagés par **Conjugaison, Français, Calcul et Scores** : `academy-header.js` crée les éléments de navigation accessibles, et `styles/themes/magical-academy/classic.css` applique les illustrations, la typographie, les marges et les états interactifs. `conjugaison-nav-art.css` a été supprimé pour éviter les doublons. Le bouton de redémarrage garde l’identifiant `restart-series`, et la navigation de Scores garde `scores-back` pour le retour au jeu.

## Icônes d'action Conjugaison — Vérifier, Réessaie, Réussite

Trois WebP transparents optimisés (320 × 320, alpha préservé), issus des images générées le 3 novembre 2026, sont stockés dans `styles/themes/magical-academy/assets/` :
`verifier-wand.webp` (bleu « Vérifier »), `verifier-retry.webp` (rouge « Incorrect · Réessaie ») et `verifier-success.webp` (vert « Bravo ! Suivant » ou « Bien corrigé ! Suivant »). Les icônes sont intégrées par `::before` CSS, sans changer les libellés HTML, le clavier, la logique de correction, le score ni la hauteur fixe du bouton. Les glyphes décoratifs précédents ont été retirés. L'image reste visible lorsque le bouton initial est désactivé.
