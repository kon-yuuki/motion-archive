import { listen } from "../../_motion/demo-helpers.js";

/** Independent horizontal masks reveal a text bitmap with uneven digital edges. */
export function createDemo(root, { signal, reducedMotion }) {
  root.innerHTML = `<section class="scan-band-reveal"><header><span>DIGITAL / TYPE STUDY</span><span data-percent>00%</span></header><div class="scan-band-reveal__scene"><h2 class="motion-sr-only">Clear direction.</h2><canvas aria-hidden="true"></canvas><p>Many small signals. One clear thought.</p></div><footer><button type="button" data-play>文字を表示する <span aria-hidden="true">↗︎</span></button><label>Reveal <input type="range" min="0" max="100" value="0" aria-label="文字の出現の進み具合" /></label></footer></section>`;
  const scene = root.querySelector(".scan-band-reveal__scene"),
    canvas = root.querySelector("canvas"),
    ctx = canvas.getContext("2d"),
    range = root.querySelector("input"),
    percent = root.querySelector("[data-percent]"),
    buffer = document.createElement("canvas"),
    bufferContext = buffer.getContext("2d");
  let width = 0,
    height = 0,
    progress = reducedMotion ? 1 : 0,
    frame = 0,
    canAutoPlay = true;
  const random = (seed) => {
    const n = Math.sin(seed * 127.1 + 315.9) * 43758.5453;
    return n - Math.floor(n);
  };
  function prepare() {
    width = scene.clientWidth;
    height = scene.clientHeight;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buffer.width = width;
    buffer.height = height;
    const size = Math.min(110, width * 0.115);
    bufferContext.font = `600 ${size}px 'Libre Franklin',Arial,sans-serif`;
    bufferContext.fillStyle = "#e9eedf";
    bufferContext.textBaseline = "middle";
    bufferContext.fillText("Clear", width * 0.08, height * 0.34);
    bufferContext.fillText(
      "direction.",
      width * 0.08,
      height * 0.34 + size * 1.03,
    );
    draw();
  }
  function draw() {
    ctx.clearRect(0, 0, width, height);
    const band = 5;
    for (let y = 0; y < height; y += band) {
      const delay = random(y + 5) * 0.2;
      const local = Math.max(0, Math.min(1, (progress - delay) / (1 - delay)));
      let edge = width * local;
      edge = Math.min(width, Math.max(0, Math.floor(edge / 6) * 6));
      if (edge > 0) ctx.drawImage(buffer, 0, y, edge, band, 0, y, edge, band);
      if (local > 0 && local < 0.98) {
        const gap = 5 + random(y + 9) * 12,
          fragment = Math.min(10 + random(y + 17) * 22, width - edge - gap);
        if (fragment > 0) {
          ctx.globalAlpha = 0.45;
          ctx.drawImage(
            buffer,
            edge + gap,
            y,
            fragment,
            band,
            edge + gap,
            y,
            fragment,
            band,
          );
          ctx.globalAlpha = 1;
        }
      }
    }
    range.value = String(Math.round(progress * 100));
    percent.textContent = `${String(Math.round(progress * 100)).padStart(2, "0")}%`;
    root.dataset.progress = progress.toFixed(3);
  }
  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
  }
  function reset() {
    canAutoPlay = false;
    observer.disconnect();
    stop();
    progress = reducedMotion ? 1 : 0;
    draw();
  }
  function replay() {
    stop();
    if (reducedMotion) {
      progress = 1;
      draw();
      return;
    }
    progress = 0;
    const start = performance.now();
    function tick(time) {
      progress = Math.min(1, (time - start) / 1600);
      draw();
      if (progress < 1) frame = requestAnimationFrame(tick);
      else frame = 0;
    }
    frame = requestAnimationFrame(tick);
  }
  listen(root.querySelector("[data-play]"), "click", replay, signal);
  listen(
    range,
    "input",
    () => {
      stop();
      progress = Number(range.value) / 100;
      draw();
    },
    signal,
  );
  const resize = new ResizeObserver(prepare);
  resize.observe(scene);
  document.fonts.ready.then(() => {
    if (!signal.aborted) prepare();
  });
  const observer = new IntersectionObserver(
    (entries) => {
      if (canAutoPlay && entries.some((entry) => entry.isIntersecting)) {
        canAutoPlay = false;
        replay();
        observer.disconnect();
      }
    },
    { threshold: 0.2 },
  );
  observer.observe(scene);
  function destroy() {
    stop();
    resize.disconnect();
    observer.disconnect();
  }
  signal.addEventListener("abort", destroy, { once: true });
  prepare();
  return { replay, reset, destroy };
}
