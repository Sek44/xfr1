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
