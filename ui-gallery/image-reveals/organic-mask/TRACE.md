# Recorded-mask trace / WIP

This is a time-field trace of Stuuudio's official Awwwards recording, not a reconstruction of its unknown original shader or a procedural-noise approximation.

- Recording: https://www.awwwards.com/inspiration/image-reveal-animation-mask-stuuudio
- Source clip: 5.067 seconds, 30 fps, 918 × 656 pixels
- Trace window: starts at 3.933 seconds (frame 119, using 1-based frame filenames)
- Photo rectangle: x=288, y=69, width=375, height=534
- Asset: reveal-time.png, 375 × 534, grayscale
- Decode: gray / 255 × 900ms is the half-visible time of each pixel
- Photo: existing repository src/assets/images/nature.jpg, center-cropped to the same portrait ratio
- No original photograph, logo, source code, or recording is shipped with the demo

## Method and limitations

Project RGB differences away from the lettering's measured ink direction, estimate image alpha against a fully revealed reference, reject low-contrast / high-residual pixels, and recover each pixel's first persistent 50% crossing. A 7-pixel median and 2-pixel Gaussian suppress compression speckles. About 85.9% of the field is directly estimated with the chosen confidence test; 14.1% is nearest-neighbor filled before smoothing. Neither number guarantees exact contours.

The source frame interval is 33.3ms. Map quantization is 3.53ms, which does not improve source temporal accuracy. Tiny islands, thin necks, lettering overlap, weak-color regions and the final holes remain approximate. The 8ms runtime edge is an interpolation choice. Completion forces a normal img at 900ms.

Confidence-masked IoU values compare the trace against the same recording that generated it, and exclude ambiguous pixels. They are not an independent benchmark, a full-image accuracy score, or proof that the original algorithm was recovered. The original scrolling implementation and mobile behavior are unknown.

## Reproduce

Requires Python with numpy, scipy and Pillow; Node project dependencies; and a Chromium executable.

1. Obtain the official recording separately. Keep it outside the repository.
2. Decode its original 30fps frames with ffmpeg into <audit>/analysis/fullframes/frame-%03d.png.
3. python scripts/motion/organic-trace/extract.py --audit <audit>
4. ORGANIC_TRACE_OUTPUT=<audit>/browser node scripts/motion/organic-trace/verify.mjs
5. python scripts/motion/organic-trace/compare.py --audit <audit>

Verification defaults to /tmp/chromium with --disable-dev-shm-usage. UI_CHROMIUM_EXECUTABLE_PATH can select another installed Chromium. It creates and closes a dedicated local Vite fixture on port 4191.

## Reuse

createDemo(root, { signal, reducedMotion }) returns replay(), reset(), destroy(), ready, and seek(ms). A replay requested before decode waits for the image and field; a reset or abort during decode cancels the deferred action. destroy() is idempotent. Normal playback is one-shot on first visibility; buttons replay it. seek(ms) makes temporal comparisons deterministic.

The mobile layout is an explicit adaptation; the fixed 375:534 mask is never stretched. Reduced motion shows the entire image, including on replay/reset. If the trace fails to load, the photograph remains visible.
