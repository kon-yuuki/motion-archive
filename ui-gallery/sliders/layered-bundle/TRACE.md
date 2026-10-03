# More Nutrition bundle correction

Source: https://more-nutrition.webflow.io/ (live 2026-10-02,1180×757)

Five looping variants replace the old four bounded variants. The whole right-hand bundle has a300ms CSS `ease` creative transition. Forward entry: translate(50%,15%),rotate35°,scale.6→identity; exit: identity→translate(-60%,15%),rotate-15°,scale.35. Title is a separate357×147.109px layer with±40%/15% translation and scale.5. These are not three independent760ms piece motions.

Inside the bundle, a295×250.922px tub and two266.312×194.938px sachets use their own950ms entry spring,600ms exit curve and250ms opacity transition. Resting rotations are−5.5°,8°,28°. The measured CSS linear() spring is reproduced. Left base remains fixed.

All labels and package illustration are original substitutes matched to the measured silhouettes. No reference-site logo, photo, product artwork, claims or source code is copied. Typography and packaging texture are therefore different.

`UI_CHROMIUM_EXECUTABLE_PATH=/path/to/chromium node scripts/motion/rail-bundle-curtain/verify.mjs` compares15 source phases using opacity-derived phase alignment and independent transform-matrix channels after removing Swiper layout offsets. This checks the geometric transition, not absolute input latency or photographic pixel identity. It also checks the nested spring, looping, rapid reversal, mouse/real touch, keyboard, reduced motion and lifecycle.

Gallery readability adaptation: heading #687d4c and helper caption #526b37 replace pale source greens; geometry and timed transforms unchanged.
