import { listen } from "../../_motion/demo-helpers.js";

/** A canvas-only visual copy dissolves; the semantic heading never changes. */
export function createDemo(root, { signal, reducedMotion }) {
  const title = "Ideas take shape.";
  root.innerHTML = `<section class="blur-dissolve"><header><span>WORDS INTO ATMOSPHERE</span><span>CLICK TO DISSOLVE</span></header><div class="blur-dissolve__scene"><h2 class="motion-sr-only">${title}</h2><canvas aria-hidden="true"></canvas><p class="blur-dissolve__caption">A thought can leave a trace.</p></div><footer><button type="button" data-dissolve>文字をほどく <span aria-hidden="true">↗︎</span></button><p role="status" aria-live="polite">文字を表示しています</p></footer></section>`;
  const canvas = root.querySelector("canvas"),
    scene = root.querySelector(".blur-dissolve__scene"),
    context = canvas.getContext("2d"),
    button = root.querySelector("[data-dissolve]"),
    status = root.querySelector("[role=status]");
  const buffer = document.createElement("canvas"),
    bufferContext = buffer.getContext("2d", { willReadFrequently: true });
  let width = 0,
    height = 0,
    frame = 0,
    progress = 0,
    points = [],
    destroyed = false;
  const random = (seed) => {
    const n = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
    return n - Math.floor(n);
  };
  function prepare() {
    width = scene.clientWidth;
    height = scene.clientHeight;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    buffer.width = Math.round(width);
    buffer.height = Math.round(height);
    const size = Math.max(24, Math.min(68, width / 10.5));
    bufferContext.clearRect(0, 0, width, height);
    bufferContext.font = `500 ${size}px Arial, sans-serif`;
    bufferContext.textAlign = "center";
    bufferContext.textBaseline = "middle";
    bufferContext.fillStyle = "#f3f0e7";
    bufferContext.fillText(title, width / 2, height * 0.46);
    const data = bufferContext.getImageData(0, 0, width, height).data;
    points = [];
    for (let y = 0; y < height; y += 2)
      for (let x = 0; x < width; x += 2) {
        const alpha = data[(y * Math.round(width) + x) * 4 + 3] / 255;
        if (alpha > 0.15) {
          const seed = y * width + x;
          points.push({
            x,
            y,
            a: alpha,
            dx: (random(seed) - 0.5) * 70,
            dy: (random(seed + 5) - 0.5) * 46,
            delay: random(seed + 7) * 0.22,
            r: 0.5 + random(seed + 9),
          });
        }
      }
    draw();
  }
  function draw() {
    context.clearRect(0, 0, width, height);
    if (progress <= 0) {
      context.drawImage(buffer, 0, 0, width, height);
      return;
    }
    if (progress >= 1) return;
    const fade = Math.max(0, 1 - progress * 3.4);
    context.save();
    context.globalAlpha = fade;
    context.filter = `blur(${progress * 10}px)`;
    context.drawImage(buffer, 0, 0, width, height);
    context.restore();
    context.fillStyle = "#e3e0d8";
    for (const point of points) {
      const p = Math.max(
        0,
        Math.min(1, (progress - point.delay) / (1 - point.delay)),
      );
      const spread = Math.pow(p, 0.72);
      context.globalAlpha = point.a * Math.min(1, progress * 5) * (1 - p) * 0.8;
      context.fillRect(
        point.x + point.dx * spread,
        point.y + point.dy * spread,
        point.r,
        point.r,
      );
    }
    context.globalAlpha = 1;
  }
  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
  }
  function reset() {
    stop();
    progress = 0;
    root.dataset.phase = "ready";
    button.disabled = false;
    draw();
    status.textContent = "文字を表示しています";
  }
  function replay() {
    stop();
    progress = 0;
    root.dataset.phase = "dissolving";
    button.disabled = true;
    if (reducedMotion) {
      progress = 1;
      draw();
      root.dataset.phase = "hidden";
      button.disabled = false;
      status.textContent =
        "動きを省いて文字の見た目を隠しました。Resetで戻せます";
      return;
    }
    const start = performance.now();
    status.textContent = "文字の輪郭がほどけています";
    function tick(time) {
      if (destroyed) return;
      progress = Math.min(1, (time - start) / 1800);
      draw();
      if (progress < 1) frame = requestAnimationFrame(tick);
      else {
        frame = 0;
        root.dataset.phase = "hidden";
        button.disabled = false;
        status.textContent = "文字の見た目が消えました。Resetで戻せます";
      }
    }
    frame = requestAnimationFrame(tick);
  }
  listen(button, "click", replay, signal);
  const observer = new ResizeObserver(prepare);
  observer.observe(scene);
  function destroy() {
    if (destroyed) return;
    destroyed = true;
    stop();
    observer.disconnect();
  }
  signal.addEventListener("abort", destroy, { once: true });
  prepare();
  root.dataset.phase = "ready";
  return { replay, reset, destroy };
}
