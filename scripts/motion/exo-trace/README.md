# Exo Ape correction verification

Run from the repository root:

```sh
node scripts/motion/exo-trace/verify.mjs
node scripts/motion/exo-trace/verify-gallery.mjs
python scripts/motion/exo-trace/compare.py
```

`verify.mjs` starts its own Vite fixture server on `127.0.0.1:4196`. The four fixtures have separate HTML proxy paths so Vite cannot reuse a previous fixture's module. `verify-gallery.mjs` separately checks the four actual gallery pages on port 4217. Both use the installed Playwright package and `/tmp/chromium`; set `UI_CHROMIUM_EXECUTABLE_PATH` for a different already-installed executable. No security-disabling flags are used.

Default output is `../motion-benchmark-correction/exo-corrections`. The local browser work was explicitly approved after the ordinary cloud-browser route could not open the local site. These tools are local QA only; they do not access the live source website.

## What is measured

- Main-menu underline, not the header's smaller 1px variant: 2px, 500ms, cubic-bezier(1,0,0,1), left entry / right exit
- Menu: source frame 251.5625 × 355.625 at (233.53125,200.6875) on 1180 × 757; source colors; image scale and rotation move with opacity
- Reel: uniform `.25 + .75p` scale and word offsets `±.2W(1-p)`, source opacity `.3`
- Footer: independent content `-.5r` and background `-r/2.2`, where r is the remaining reveal distance
- Replay/Reset, rapid menu changes, scroll interruption and reversal, keyboard, 320/390px, reduced motion, abort/destroy, gallery controls

## Limits

The menu image's precise easing, duration and trigger timestamp were not recovered. The implementation uses a disclosed one-second cubic-out fit; its initial scale 1.3 and angle 7° are inferred from the observed opacity/transform relationship. Screenshot names are nominal wait milestones: actual renderer elapsed time is in `samples.json`, and screenshot overhead is not subtracted. Source/local comparisons are labeled as geometric/phase comparisons, not synchronized frame-perfect footage.

Photo/video content and Lausanne typography are not redistributed. Existing repository photography/video and Libre Franklin 400 (optical weight approximation) replace them. The footer orbital material is an original Canvas rendering with different texture and intrinsic motion. No pixel-difference score would be meaningful with these material substitutions. The page metadata makes these limits visible.
