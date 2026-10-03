# Ciel Rose film-aperture reconstruction / WIP

## Reference and scope

- Official record: https://www.awwwards.com/inspiration/home-projects-slider-ciel-rose
- Direct official media: https://assets.awwwards.com/awards/element/2025/02/67a0a6892fdf8710587744.mp4
- Source site: https://cielrose.tv/ (read-only current text shows ten works; the recording has seven)
- 1600×1200 H.264 recording, 60fps, exactly4 seconds. Clip length is not a transition-duration measurement.
- Only the recording's visible plane, seam movement, bowed edges, ruler placement and page proportions are reconstructed. Source interaction trigger/inertia/easing remain unknown.

## Shape and timing

The inset page is (195,234)–(1405,965), or1210×731 pixels. The film window is approximately55% of this page's width. Near rest its straight top/bottom and sharp corner coordinates describe an approximately16:9 image plane. Forward movement makes the sides bow slightly outward. Reversing contracts the plane and bows the sides inward: at2.6s the top starts atx498,y423 rather than the initialx466,y392. This is a deformation of the photographic plane, not rounded-corner masking.

`trace.js` stores measured shape and seam position at0.2-second sample intervals, with shape-preserving Hermite interpolation. `demo.js` draws horizontal texture slices whose endpoints follow the measured side curve. Continuous positions traverse all seven scenes and wrap; replay runs the recorded forward/reverse trace once. The source film changes internally during playback, which generated stills cannot reproduce.

Readable seams include y634 at0.0s, y471 at0.6s, y687 at1.0s, y496 at1.8s, y640 at2.4s and y593 at3.8s. The final4.0s table entry approximates the video endpoint; fully covered or pale scenes lack a reliable seam and use visual estimates. Interpolated values between samples are reconstruction, not proof of the original mathematical model.

## Intentional additions / remaining mismatch

- Seven original generated photorealistic stills replace film footage. Asset composition, actors, colors and internal motion differ; see assets/README.md.
- Native ruler buttons, arrows, keyboard, horizontal drag, a trace scrubber and reduced-motion behavior are added demo controls. Source support for those inputs was not established.
- Explicit control selection uses360ms cubic-out response; recorded replay uses the measured time table. These are separate paths.
- Ruler selection uses the nearest visible scene. The source's leading target/index timing and moving fine-tick emphasis remain unmatched.
- Small-screen image width expands toabout86% to preserve useful visual/tap size. There is no source mobile recording.
- Stage masthead preserves relative tiny-text composition but uses the original label FILM STUDIES instead of the source brand.
- Generated imagery and sampled geometry are why this remainsWIP, even though behavior and phase geometry have focused checks.

## Evidence and repeatable checks

Scripts live at `scripts/motion/recorded-slider-trace/vertical-aperture/`. The correction evidence folder contains source/render phase pairs, metadata, measurements and test results. Source recordings are evidence only and are not app runtime assets.

Run from repository root:

1. `python scripts/motion/recorded-slider-trace/vertical-aperture/extract.py`
2. Start Vite and run `node scripts/motion/recorded-slider-trace/vertical-aperture/verify.mjs` in the same shell/network namespace. Chromium executable `/tmp/chromium`, launch arg `--disable-dev-shm-usage`.
3. `python scripts/motion/recorded-slider-trace/vertical-aperture/compare.py`
4. `node --check ui-gallery/sliders/vertical-aperture/demo.js`, same for trace.js/meta.js/script.js; `npm run build`

The comparison script evaluates stage-normalized plane bounds and local row-gradient seam alignment, not photographic similarity. It intentionally does not give an overall fidelity score.
