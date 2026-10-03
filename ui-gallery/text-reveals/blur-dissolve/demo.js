import { listen } from "../../_motion/demo-helpers.js";

/** Source-relative title + soft, seeded density diffusion. No recorded raster is used. */
export function createDemo(root, { signal, reducedMotion }) {
  root.innerHTML = `<section class="blur-dissolve" data-recorded-scene><h2 class="motion-sr-only">검은 개 / BLACK DOG</h2><canvas aria-hidden="true"></canvas><button type="button" class="blur-dissolve__target" aria-label="검은 개、Black Dogの文字をほどく"></button></section>`;
  const scene = root.querySelector("section"),
    canvas = root.querySelector("canvas"),
    ctx = canvas.getContext("2d"),
    button = root.querySelector("button");
  const mask = document.createElement("canvas");
  mask.width = 918;
  mask.height = 656;
  const m = mask.getContext("2d", { willReadFrequently: true });
  const fog = document.createElement("canvas");
  fog.width = 918;
  fog.height = 656;
  const f = fog.getContext("2d", { willReadFrequently: true });
  const random = (seed) => {
    const n = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
    return n - Math.floor(n);
  };
  let time = 0,
    frame = 0,
    destroyed = false,
    loaded = false;
  function prepare() {
    if (destroyed) return;
    const dpr = Math.min(devicePixelRatio || 1, 2),
      w = scene.clientWidth,
      h = scene.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(canvas.width / 918, 0, 0, canvas.height / 656, 0, 0);
    draw();
  }
  function makeMask() {
    m.clearRect(0, 0, 918, 656);
    m.fillStyle = "#e6e6e6";
    m.textBaseline = "alphabetic";
    m.textAlign = "center";
    m.font = '400 50px "Recorded Korean"';
    m.fillText("검은 개", 461, 345);
    m.font = "8px Georgia,serif";
    m.textAlign = "left";
    const subtitle = "BLACK DOG",
      spacing = 2.1;
    const sw =
      [...subtitle].reduce(
        (sum, c) => sum + m.measureText(c).width + spacing,
        0,
      ) - spacing;
    let x = 461 - sw / 2;
    for (const c of subtitle) {
      m.fillText(c, x, 374);
      x += m.measureText(c).width + spacing;
    }
    loaded = true;
    draw();
  }
  function draw() {
    if (destroyed) return;
    ctx.clearRect(0, 0, 918, 656);
    const p = Math.min(1, Math.max(0, time / 1850));
    root.dataset.time = String(Math.round(time));
    root.dataset.phase = p === 0 ? "rest" : p === 1 ? "hidden" : "dissolving";
    if (!loaded || p === 1) return;
    const fadeKeys = [
      [0, 1],
      [0.15, 0.94],
      [0.35, 0.9],
      [0.61, 0.78],
      [0.93, 0.34],
      [1, 0],
    ];
    let fade = 0;
    for (let i = 1; i < fadeKeys.length; i++) {
      if (p <= fadeKeys[i][0]) {
        const [a, av] = fadeKeys[i - 1],
          [b, bv] = fadeKeys[i];
        fade = av + ((bv - av) * (p - a)) / (b - a);
        break;
      }
    }
    f.clearRect(0, 0, 918, 656);
    f.filter = `blur(${p === 0 ? 0 : 4 + Math.pow(p, 0.55) * 18}px)`;
    f.drawImage(mask, 0, p * 10);
    f.filter = "none";
    const field = f.getImageData(0, 0, 918, 656),
      original = new Uint8ClampedArray(field.data);
    for (let y = 260; y < 440; y++)
      for (let x = 340; x < 582; x++) {
        const at = (y * 918 + x) * 4,
          dx = Math.round(Math.sin(y * 0.11 + p * 4) * p * 4),
          dy = Math.round(Math.sin(x * 0.09 - p * 2) * p * 8);
        const a = original[((y + dy) * 918 + x + dx) * 4 + 3];
        // Fine density noise modulates a continuous blurred field instead of visible square particles.
        const grain = 0.5 + random(y * 918 + x + Math.floor(p * 8));
        field.data[at] = field.data[at + 1] = field.data[at + 2] = 230;
        field.data[at + 3] = Math.min(255, a * fade * grain * 1.12);
      }
    f.putImageData(field, 0, 0);
    ctx.globalAlpha = 1;
    ctx.drawImage(fog, 0, 0);
  }
  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
  }
  function reset() {
    if (destroyed) return;
    stop();
    time = 0;
    draw();
  }
  function seek(ms) {
    if (destroyed) return;
    stop();
    time = Math.max(0, Math.min(1850, ms));
    draw();
  }
  function replay() {
    if (destroyed) return;
    stop();
    if (reducedMotion) {
      time = 1850;
      draw();
      return;
    }
    time = 0;
    const start = performance.now();
    const tick = (now) => {
      if (destroyed) return;
      time = Math.min(1850, now - start);
      draw();
      frame = time < 1850 ? requestAnimationFrame(tick) : 0;
    };
    frame = requestAnimationFrame(tick);
  }
  listen(button, "click", replay, signal);
  listen(
    button,
    "keydown",
    (e) => {
      if (e.key === "Escape") reset();
    },
    signal,
  );
  const observer = new ResizeObserver(prepare);
  observer.observe(scene);
  const ready = document.fonts.load('400 50px "Recorded Korean"').then(() => {
    if (!destroyed) makeMask();
  });
  function destroy() {
    if (destroyed) return;
    destroyed = true;
    stop();
    observer.disconnect();
  }
  signal.addEventListener("abort", destroy, { once: true });
  prepare();
  return { replay, reset, seek, destroy, ready };
}
