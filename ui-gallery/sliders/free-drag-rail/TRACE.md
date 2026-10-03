# REJOUICE rail correction

Source: https://www.rejouice.com/ (live 2026-10-02, 1180×757)

The current source is a continuously moving, two-copy rail of nine heterogeneous widgets. Desktop widths440px, heights325/503/325/503/325/325/440/325/503px, top aligned, intra-group gap30px. Measured group span4237.59375px. Before interaction, a262ms observation moved left13.7299px (52.4px/s). The old finite five-card, centered, non-idling implementation did not match this.

The correction uses the observed layout and short-sample idle rate. Direct drag stops idle; no unobserved release inertia is added. The observed post-drag pause is retained, with an explicit Play control because the source's eventual restart rule is unknown. Arrows, keys, pause, visibility suspension and mobile sizing are disclosed enhancements.

Photography is existing repository material. Copy, names and mock-project labels are original replacements, with no real client-performance claims.

Run `UI_CHROMIUM_EXECUTABLE_PATH=/path/to/chromium node scripts/motion/rail-bundle-curtain/verify.mjs`. The script compares source geometry/speed, tests mouse and real touch input, interruption/cancellation, loop boundaries, keyboard, reduced motion and cleanup. It does not establish source mobile fidelity or the unmeasured restart rule.
