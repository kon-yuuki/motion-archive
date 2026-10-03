import { listen } from "../../_motion/demo-helpers.js";

/** Four independent text clocks over a reconstructed ASCII line field. */
export function createDemo(root, { signal, reducedMotion }) {
  root.innerHTML = `<section class="scan-band-reveal" data-recorded-scene><div class="scan-band-reveal__surface" tabindex="0" role="group" aria-label="Fine Thought。Enterで読み込みの動きを再生、Escapeで戻します"><h2 class="motion-sr-only">Web engineer & creative coder. Fine Thought.</h2><canvas aria-hidden="true"></canvas></div></section>`;
  const scene = root.querySelector("section"),
    surface = root.querySelector("[tabindex]"),
    canvas = root.querySelector("canvas"),
    ctx = canvas.getContext("2d");
  let time = 0,
    frame = 0,
    destroyed = false,
    loaded = false,
    autoplay = true,
    layers = [];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const random = (n) => {
    const v = Math.sin(n * 127.1 + 315.9) * 43758.5453;
    return v - Math.floor(v);
  };
  function textLayer(text, x, baseline, size, width, start, duration) {
    const c = document.createElement("canvas");
    c.width = 1600;
    c.height = 1200;
    const g = c.getContext("2d");
    g.font = `700 ${size}px "Recorded Grotesk"`;
    g.letterSpacing = `${-size * 0.0325}px`;
    g.textBaseline = "alphabetic";
    const metrics = g.measureText(text);
    g.save();
    g.translate(x, baseline);
    g.scale(width / metrics.width, 1);
    g.fillStyle = "#bcbcbc";
    g.fillText(text, 0, 0);
    g.restore();
    return {
      canvas: c,
      x,
      y: baseline - size * 0.76,
      width,
      height: size * 0.8,
      start,
      duration,
      seed: Math.round(x),
    };
  }
  function prepare() {
    if (destroyed) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(scene.clientWidth * dpr);
    canvas.height = Math.round(scene.clientHeight * dpr);
    ctx.setTransform(canvas.width / 1600, 0, 0, canvas.height / 1200, 0, 0);
    draw();
  }
  function build() {
    if (destroyed) return;
    layers = [
      textLayer("Web engineer", 187, 309, 62, 337, 650, 650),
      textLayer("& creative coder", 187, 374, 62, 398, 730, 650),
      textLayer("Thought", 427, 960, 295, 1075, 1040, 1950),
      textLayer("Fine", 942, 717, 295, 551, 1720, 1250),
    ];
    loaded = true;
    draw();
  }
  function field(t, inside) {
    ctx.save();
    if (inside) {
      ctx.beginPath();
      ctx.rect(116, 239, 1368, 745);
      ctx.clip();
    }
    const alpha = inside ? clamp((t - 730) / 1000) * 0.75 : 0.62;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#626262";
    ctx.font = "9px monospace";
    const symbols = ["-", "/", "*", "+"];
    for (let row = 0; row < 95; row++) {
      const y = row * 12.7;
      let x = -50;
      for (let col = 0; col < 6; col++) {
        const n = row * 13 + col * 41;
        const width = 190 + random(col + 4) * 250;
        const cutoff = random(Math.floor(row / 2) * 7 + col * 5);
        const phase = clamp(t / 3000);
        const symbol = symbols[Math.floor(random(n) * 4)];
        if (cutoff < 0.38) {
          const count = Math.floor(width / 5.5);
          ctx.fillText(symbol.repeat(count), x, y);
        } else {
          ctx.fillText("/", x, y);
        }
        x += width + 10 + Math.sin(phase * 2 + row * 0.05) * 2;
      }
    }
    ctx.restore();
  }
  function reveal(layer) {
    const raw = clamp((time - layer.start) / layer.duration),
      p =
        1 -
        Math.pow(
          1 - raw,
          layer.start === 1720 ? 2 : layer.start === 1040 ? 1.35 : 1,
        );
    if (p === 0) return;
    if (p === 1) {
      ctx.drawImage(layer.canvas, 0, 0);
      return;
    }
    let y = Math.max(0, Math.floor(layer.y)),
      i = 0;
    while (y < layer.y + layer.height) {
      const bh = 8 + Math.floor(random(i + layer.seed) * 16);
      const jitter = (random(i * 7 + layer.seed) - 0.5) * 0.32;
      const local = clamp(p + jitter * Math.sin(p * Math.PI));
      const edge = layer.x + layer.width * local;
      const left = layer.x - 2;
      const length = Math.max(0, edge - left);
      if (length > 0)
        ctx.drawImage(layer.canvas, left, y, length, bh, left, y, length, bh);
      const detailScale = Math.min(1, layer.height / 230),
        gap = (18 + random(i + 21) * 35) * detailScale;
      const fragment = Math.min(
        (30 + random(i + 71) * 50) * detailScale,
        layer.x + layer.width - edge - gap,
      );
      if (fragment > 0 && p > 0.03) {
        ctx.drawImage(
          layer.canvas,
          edge + gap,
          y,
          fragment,
          bh,
          edge + gap,
          y,
          fragment,
          bh,
        );
      }
      y += bh;
      i++;
    }
  }
  function draw() {
    if (destroyed) return;
    ctx.clearRect(0, 0, 1600, 1200);
    ctx.fillStyle = "#1e1e1e";
    ctx.fillRect(0, 0, 1600, 1200);
    field(time, false);
    ctx.save();
    ctx.shadowColor = "#0009";
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 8;
    ctx.fillStyle = "#272727";
    ctx.beginPath();
    ctx.roundRect(112, 213, 1376, 776, 12);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(114, 215, 1372, 772, 10);
    ctx.clip();
    ctx.fillStyle = "#3a3a3a";
    ctx.fillRect(114, 215, 1372, 23);
    field(time, true);
    ctx.fillStyle = "#999";
    ctx.font = "10px monospace";
    ctx.fillText("fine-thought.js", 125, 231);
    ctx.fillText("☼  ▯", 1440, 231);
    ctx.fillStyle = "#686868";
    ctx.font = "9px monospace";
    for (let i = 1; i <= 58; i++)
      ctx.fillText(String(i), i < 10 ? 130 : 124, 247 + (i - 1) * 12.7);
    ctx.strokeStyle = "#79789a";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(116, 237);
    ctx.lineTo(223, 237);
    ctx.stroke();
    if (loaded) layers.forEach(reveal);
    ctx.restore();
    ctx.strokeStyle = "#050505";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(112, 213, 1376, 776, 12);
    ctx.stroke();
    root.dataset.time = String(Math.round(time));
    root.dataset.progress = (time / 3220).toFixed(3);
    root.dataset.phase =
      time === 0 ? "rest" : time >= 3220 ? "settled" : "revealing";
  }
  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
  }
  function reset() {
    if (destroyed) return;
    autoplay = false;
    observer.disconnect();
    stop();
    time = reducedMotion ? 3220 : 0;
    draw();
    if (reducedMotion) root.dataset.phase = "rest";
  }
  function seek(ms) {
    if (destroyed) return;
    autoplay = false;
    observer.disconnect();
    stop();
    time = clamp(ms, 0, 3220);
    draw();
  }
  function replay() {
    if (destroyed) return;
    autoplay = false;
    observer.disconnect();
    stop();
    if (reducedMotion) {
      time = 3220;
      draw();
      return;
    }
    time = 0;
    const start = performance.now();
    const tick = (now) => {
      if (destroyed) return;
      time = Math.min(3220, now - start);
      draw();
      frame = time < 3220 ? requestAnimationFrame(tick) : 0;
    };
    frame = requestAnimationFrame(tick);
  }
  listen(
    surface,
    "keydown",
    (e) => {
      if (!["Enter", " ", "Escape"].includes(e.key)) return;
      e.preventDefault();
      e.key === "Escape" ? reset() : replay();
    },
    signal,
  );
  const observer = new IntersectionObserver(
    (entries) => {
      if (loaded && autoplay && entries.some((e) => e.isIntersecting)) replay();
    },
    { threshold: 0.2 },
  );
  observer.observe(scene);
  const resize = new ResizeObserver(prepare);
  resize.observe(scene);
  const ready = document.fonts.load('700 306px "Recorded Grotesk"').then(() => {
    if (destroyed) return;
    build();
    if (reducedMotion) {
      time = 3220;
      draw();
    } else if (autoplay) replay();
  });
  function destroy() {
    if (destroyed) return;
    destroyed = true;
    stop();
    observer.disconnect();
    resize.disconnect();
  }
  signal.addEventListener("abort", destroy, { once: true });
  prepare();
  return { replay, reset, seek, destroy, ready };
}
