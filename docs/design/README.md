# Magical Academy V3 — image assets (concept extraction)

This package includes text-free illustrative crops from the generated reference sheet.
They are **concept assets**, not production-ready scalable components.

- background-scene.webp: scene/banner artwork
- icon-*.webp: activity illustrations (with their decorative tile backgrounds)
- parchment-ornament.webp: blank decorative plaque
- *-decoration.webp: additional illustrative props

All interactive controls, labels, charts, forms and dialogs should be implemented with HTML/CSS/SVG and shared semantic theme tokens, not cropped from the reference image.
The original reference sheet is included for implementation guidance only and contains example text.

## Nine-slice frames in use (conjugation)

Two newly generated frames, cropped to remove unused transparent margins and exported as alpha-preserving WebP, are installed under `styles/themes/magical-academy/assets/`:

- `title-frame-9slice.webp` (840 × 149): the « Présent de l’indicatif » plaque. CSS `border-image-slice: 48 112 48 112`.
- `question-frame-9slice.webp` (840 × 410): the framed verb-and-sentence block. CSS `border-image-slice: 128 140 128 140`.

The source images were generated without text, backgrounds, or icons. The center remains **transparent**, so each actual parchment fill, verb, sentence, and button is implemented separately in HTML/CSS. Use `border-image` on decorative pseudo-elements rather than `background-size: 100% 100%`, which distorts corners. Border widths are controlled separately through `border-image-width` to work at different screen sizes. The existing `parchment-ornament.webp` is not used in these two frames.

## Frames with integrated parchment (November 3, 2026)

The conjugation page now uses two **new** alpha-preserving WebP images in `styles/themes/magical-academy/assets/`:

- `title-frame-filled-9slice.webp` — 1200 × 230 px; CSS `border-image-slice: 55 110 55 110 fill`.
- `question-frame-filled-9slice.webp` — 1000 × 495 px; CSS `border-image-slice: 100 110 100 110 fill`.

Each image contains the gold border **and** parchment interior; only the pixels *outside* the irregular contour are transparent. Nine-slice `fill` renders the centre from the same picture, so no independently rounded CSS background can protrude behind the ornate corners. The frames are applied to pseudo-elements; real text and inputs render above them.

The conjugation question and AZERTY keyboard/validation are now **separate sibling panels** (`.question-frame` and `.keyboard-panel`) inside the transparent playing layout host. The older border-only frames are retained for history but are no longer referenced by the conjugation page.

## Illustrations du bandeau Conjugaison — 3 novembre 2026

La plume et les trois boutons illustrés sont des images WebP RGBA recadrées, sans fond opaque extérieur, dans `styles/themes/magical-academy/assets/` :

- `quill-academy.webp` (256 × 328), plume dorée indépendante du fond de la page.
- `nav-back-academy.webp` (320 × 320), flèche retour sur bouton bleu nuit et or.
- `nav-restart-academy.webp` (320 × 320), relancer la série.
- `nav-scores-academy.webp` (320 × 320), accès aux scores.

`conjugaison-nav-art.css` applique les images sans fond CSS additionnel. Les vrais éléments `a` et `button` ainsi que leurs libellés accessibles, liens, gestionnaires d'événements et styles de focus restent actifs. Les glyphes SVG redondants sont seulement masqués dans la page Conjugaison. Ces assets pourront être réutilisés par les autres jeux avec les classes correspondantes, après validation de leur bandeau.

## Icônes d'action Conjugaison — Vérifier, Réessaie, Réussite

Trois WebP transparents optimisés (320 × 320, alpha préservé), issus des images générées le 3 novembre 2026, sont stockés dans `styles/themes/magical-academy/assets/` :
`verifier-wand.webp` (bleu « Vérifier »), `verifier-retry.webp` (rouge « Incorrect · Réessaie ») et `verifier-success.webp` (vert « Bravo ! Suivant » ou « Bien corrigé ! Suivant »). Les icônes sont intégrées par `::before` CSS, sans changer les libellés HTML, le clavier, la logique de correction, le score ni la hauteur fixe du bouton. Les glyphes décoratifs précédents ont été retirés. L'image reste visible lorsque le bouton initial est désactivé.
