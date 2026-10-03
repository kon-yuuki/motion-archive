# Akaru upward curtain correction

Source: https://www.akaru.fr/ (live 2026-10-02,1180×757)

Confirmed: the menu opens upward with top inset100%→0; it closes upward with bottom inset0→100%. Four navigation items rise in sequence during opening; five logo letters reveal separately. Closing content stays fixed while the lower clip edge rises. The old implementation opened downward from the same lower edge it closed with.

Layout uses the observed black full-panel menu, upper-left navigation, small address/social columns, lower-left preview and large lower-right five-letter mark. FRAME typography and repository photography replace the source logo/assets.

Still estimated: the exact clip duration/ease, letter transform decomposition/amplitude, content delay/stagger and source interruption rules. The850ms cubic-bezier(.76,0,.24,1) curtain and staggered letter rise/skew are explicit approximations, not source-verified timings. Mobile layout and interruption continuity are local enhancements.

`UI_CHROMIUM_EXECUTABLE_PATH=/path/to/chromium node scripts/motion/rail-bundle-curtain/verify.mjs` verifies opening/closing direction, static closing content, repeated interruptions, focus/Escape/Tab, reduced motion, Reset/Abort and mobile layout. It does not claim temporal fidelity for this source.
