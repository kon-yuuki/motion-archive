# Numeral outline and original product material

- `numeral-outline.svg`: reconstructed outline from the official publicly viewed recording's initial black 8 silhouette. Black pixel threshold (<80), 1.2px Gaussian boundary smoothing, periodic spline trace. Not an extracted font or source website asset. Script: `scripts/motion/recorded-section-trace/measure-numeral.py`.
- `trace.js`: similarity-transform registration fits against sampled recording masks, with error values. These are recording image measurements, not original CSS or scroll parameters.
- `original-drawer.webp`: original built-in image-tool generation, 2026-10-03. A charcoal anodized drawer detail on pure black, oblique upper-left rim leading to corner near center, open dark interior at lower-left, right half empty. Generated source `exec-be373599-b7a7-49a6-baa4-973b4d7e4bfe.png`. WebP format conversion only. CSS darkens this material to match the observed black-on-black contrast; it is not GRASS product photography.

Photo, product construction and body copy differ from the source. The measured numeral silhouette and staged motion are the object of this study.

The implementation renders the path inside a fixed-size SVG viewport to avoid large raster allocations at high zoom. The near-black 3.573s endpoint uses a constrained image fit: scale 18.47407, clockwise rotation 79.50701°, x translation −216.67844px and y −3px in the 1600×1200 recording frame. Late transforms are not uniquely recoverable from almost-all-black pixels.
