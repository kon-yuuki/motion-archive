import { listen } from "../../_motion/demo-helpers.js";

/** Recording-relative composition; the freely licensed Cormorant Garamond is a named substitute for Solare. */
export function createDemo(root, { signal, reducedMotion }) {
  const lines = [
    "A SANCTUARY",
    "INSPIRED BY THE",
    "COSMIC RADIANCE",
    "OF THE SUN",
  ];
  root.innerHTML = `<section class="proximity-weight" data-recorded-scene><div class="proximity-weight__masthead" aria-hidden="true"><span>Intro　 <b>● Weights</b>　 Test　 Story</span><span class="proximity-weight__brand">CASA <i>di</i> SOLARE</span><span>Purchase Solare　<span class="proximity-weight__sun">→</span></span></div><div class="proximity-weight__surface" tabindex="0" role="group" aria-label="A sanctuary inspired by the cosmic radiance of the sun。矢印キーで太さを変え、Escapeで戻します"><span class="proximity-weight__pill" aria-hidden="true">CASA DI SOLARE</span><h2><span class="motion-sr-only">${lines.join(" ")}</span><span aria-hidden="true">${lines.map((line) => `<span class="proximity-weight__line">${[...line].map((char) => (char === " " ? '<span class="proximity-weight__space"> </span>' : `<span class="proximity-weight__letter">${char}</span>`)).join("")}</span>`).join("")}</span></h2></div></section>`;
  const surface = root.querySelector(".proximity-weight__surface");
  const letters = [...root.querySelectorAll(".proximity-weight__letter")];
  let positions = [],
    weights = letters.map(() => 300),
    targetX = 800,
    targetY = 600,
    active = false,
    frame = 0,
    last = 0,
    preview = 0,
    destroyed = false;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  function draw(time = performance.now()) {
    if (destroyed) return;
    const dt = Math.min(50, time - (last || time - 16));
    last = time;
    if (preview) {
      const p = clamp((time - preview) / 2300, 0, 1);
      targetX = 1600 * (0.23 + 0.54 * p);
      targetY = 1200 * (0.35 + 0.3 * p);
      if (p === 1) {
        preview = 0;
        active = false;
      }
    }
    let unsettled = false;
    letters.forEach((el, i) => {
      if (!positions[i]) return;
      const d = Math.hypot(positions[i].x - targetX, positions[i].y - targetY);
      const influence = active ? Math.pow(Math.max(0, 1 - d / 270), 1.5) : 0;
      const target = 300 + 170 * influence;
      weights[i] +=
        (target - weights[i]) * (reducedMotion ? 1 : 1 - Math.exp(-dt / 100));
      if (Math.abs(target - weights[i]) > 0.08) unsettled = true;
      else weights[i] = target;
      el.style.fontVariationSettings = `"wght" ${weights[i].toFixed(2)}`;
    });
    root.dataset.maxWeight = String(Math.round(Math.max(...weights)));
    root.dataset.phase = active ? "active" : "rest";
    frame = unsettled || preview ? requestAnimationFrame(draw) : 0;
    if (!frame) last = 0;
  }
  function wake() {
    if (!destroyed && !frame) frame = requestAnimationFrame(draw);
  }
  function measure() {
    if (destroyed) return;
    cancelAnimationFrame(frame);
    frame = 0;
    last = 0;
    letters.forEach((el) => {
      el.style.width = "";
      el.style.fontVariationSettings = '"wght" 300';
    });
    // Offset widths precede the horizontal optical-fit transform on the title.
    const widths = letters.map((el) => el.offsetWidth);
    letters.forEach((el, i) => (el.style.width = `${widths[i]}px`));
    const box = surface.getBoundingClientRect();
    positions = letters.map((el) => {
      const r = el.getBoundingClientRect();
      return {
        x: ((r.left - box.left + r.width / 2) / box.width) * 1600,
        y: ((r.top - box.top + r.height / 2) / box.height) * 1200,
      };
    });
    draw();
  }
  function aim(x, y) {
    if (destroyed) return;
    preview = 0;
    targetX = clamp(x, 0, 1600);
    targetY = clamp(y, 0, 1200);
    active = true;
    wake();
  }
  function pointer(e) {
    const b = surface.getBoundingClientRect();
    aim(
      ((e.clientX - b.left) / b.width) * 1600,
      ((e.clientY - b.top) / b.height) * 1200,
    );
  }
  listen(surface, "pointermove", pointer, signal);
  listen(surface, "pointerdown", pointer, signal);
  listen(
    surface,
    "pointerleave",
    (event) => {
      if (event.pointerType === "touch") return;
      active = false;
      preview = 0;
      wake();
    },
    signal,
  );
  listen(
    surface,
    "pointercancel",
    () => {
      preview = 0;
      active = false;
      wake();
    },
    signal,
  );
  listen(surface, "focus", () => aim(800, 600), signal);
  listen(
    surface,
    "blur",
    () => {
      active = false;
      preview = 0;
      wake();
    },
    signal,
  );
  listen(
    surface,
    "keydown",
    (e) => {
      if (
        !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Escape"].includes(
          e.key,
        )
      )
        return;
      e.preventDefault();
      if (e.key === "Escape") return reset();
      aim(
        targetX +
          (e.key === "ArrowRight" ? 55 : e.key === "ArrowLeft" ? -55 : 0),
        targetY + (e.key === "ArrowDown" ? 55 : e.key === "ArrowUp" ? -55 : 0),
      );
    },
    signal,
  );
  function reset() {
    if (destroyed) return;
    cancelAnimationFrame(frame);
    frame = 0;
    last = preview = 0;
    active = false;
    weights.fill(300);
    targetX = 800;
    targetY = 600;
    draw();
  }
  function replay() {
    if (destroyed) return;
    reset();
    if (reducedMotion) {
      aim(800, 600);
      return;
    }
    active = true;
    preview = performance.now();
    wake();
  }
  // Capture hook uses recording coordinates, not hidden source state.
  function inspectAt(x, y) {
    if (destroyed) return;
    cancelAnimationFrame(frame);
    frame = 0;
    preview = 0;
    active = true;
    targetX = x;
    targetY = y;
    weights = positions.map(
      (p) =>
        300 +
        170 *
          Math.pow(Math.max(0, 1 - Math.hypot(p.x - x, p.y - y) / 270), 1.5),
    );
    draw();
  }
  const observer = new ResizeObserver(measure);
  observer.observe(surface);
  const ready = document.fonts
    .load('300 120px "Recorded Cormorant"')
    .then(() => {
      if (!destroyed) measure();
    });
  function destroy() {
    if (destroyed) return;
    destroyed = true;
    cancelAnimationFrame(frame);
    frame = 0;
    observer.disconnect();
  }
  signal.addEventListener("abort", destroy, { once: true });
  measure();
  return { replay, reset, destroy, inspectAt, ready };
}
