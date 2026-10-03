import { listen } from "../../_motion/demo-helpers.js";
import { glyphs } from "./assets/glyphs.js";

/** Orange local inspection lens; outlines/handles are generated from licensed substitute fonts. */
export function createDemo(root, { signal, reducedMotion }) {
  const id = `xray-${Math.random().toString(36).slice(2)}`;
  root.innerHTML = `<section class="character-xray" data-recorded-scene><div class="character-xray__masthead" aria-hidden="true"><span>Intro　 Weights　 Test　 <b>● Story</b></span><span class="character-xray__brand">CASA <i>di</i> SOLARE</span><span>Purchase Solare　<span class="character-xray__sun">→</span></span></div><div class="character-xray__surface" tabindex="0" role="group" aria-label="文字の構造を丸いレンズで見る。矢印キーでレンズ、PageUpとPageDownで文字、Escapeでリセット"><svg viewBox="0 0 1600 1200" aria-hidden="true"><defs><clipPath id="${id}"><circle data-lens cx="800" cy="730" r="0"/></clipPath></defs><g class="character-xray__headline" fill="#fbb343"><text x="308" y="270" font-size="230" font-style="italic">The</text><text x="610" y="270" font-size="174" textLength="570" lengthAdjust="spacingAndGlyphs">STORY</text><text x="612" y="400" font-size="183" font-style="italic">of</text><text x="830" y="400" font-size="174" textLength="666" lengthAdjust="spacingAndGlyphs">SOLARE</text></g><path d="M550 1086V608a250 250 0 0 1 500 0v478Z" fill="none" stroke="#78675c" stroke-width="1"/><g data-solid></g><g clip-path="url(#${id})"><rect width="1600" height="1200" fill="#ffb840"/><g data-outline></g></g><text x="800" y="1040" text-anchor="middle" fill="#66574a" font-family="Arial,sans-serif" font-size="12">(HOVER TO REVEAL ILLUSTRATION)</text></svg></div><div class="character-xray__arrows"><button type="button" data-prev aria-label="前の文字">←</button><button type="button" data-next aria-label="次の文字">→</button></div></section>`;
  const surface = root.querySelector(".character-xray__surface"),
    lens = root.querySelector("[data-lens]"),
    solid = root.querySelector("[data-solid]"),
    outline = root.querySelector("[data-outline]");
  let x = 800,
    y = 730,
    tx = 800,
    ty = 730,
    r = 0,
    tr = 0,
    index = -1,
    frame = 0,
    last = 0,
    preview = 0,
    destroyed = false;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  function glyph(i) {
    if (destroyed) return;
    i = (i + glyphs.length) % glyphs.length;
    if (index === i) return;
    index = i;
    const g = glyphs[index];
    solid.innerHTML = `<path d="${g.d}" fill="#625049"/>`;
    outline.innerHTML = `<path d="${g.d}" fill="#846127" fill-opacity=".13" stroke="#af822e" stroke-width=".8"/><path d="${g.handles}" fill="none" stroke="#ad812f" stroke-width=".65"/>${g.nodes.map(([px, py]) => `<rect x="${px - 2}" y="${py - 2}" width="4" height="4" fill="none" stroke="#aa7b2d" stroke-width=".7"/>`).join("")}`;
    root.dataset.glyph = g.char;
  }
  function draw() {
    if (destroyed) return;
    lens.setAttribute("cx", x);
    lens.setAttribute("cy", y);
    lens.setAttribute("r", r);
    root.dataset.lensX = x.toFixed(1);
    root.dataset.lensY = y.toFixed(1);
    root.dataset.lensRadius = r.toFixed(1);
    root.dataset.phase = r > 0.1 ? "active" : "rest";
  }
  function tick(now) {
    if (destroyed) return;
    const dt = Math.min(50, now - (last || now - 16));
    last = now;
    if (preview) {
      const t = now - preview;
      const p = clamp(t / 11700, 0, 1);
      tx = 800 + 165 * Math.sin(p * Math.PI * 5);
      ty = 730 + 110 * Math.sin(p * Math.PI * 3 + 0.4);
      tr = t < 11700 ? 208 : 0;
      glyph(t < 2700 ? 0 : t < 5500 ? 1 : t < 8300 ? 2 : t < 10100 ? 3 : 4);
      if (t >= 12500) preview = 0;
    }
    const a = reducedMotion ? 1 : 1 - Math.exp(-dt / 90);
    x += (tx - x) * a;
    y += (ty - y) * a;
    r += (tr - r) * a;
    const unsettled =
      Math.abs(x - tx) + Math.abs(y - ty) + Math.abs(r - tr) > 0.08;
    if (!unsettled) {
      x = tx;
      y = ty;
      r = tr;
    }
    draw();
    frame = unsettled || preview ? requestAnimationFrame(tick) : 0;
    if (!frame) last = 0;
  }
  function wake() {
    if (!destroyed && !frame) frame = requestAnimationFrame(tick);
  }
  function aim(nx, ny) {
    if (destroyed) return;
    preview = 0;
    tx = clamp(nx, 0, 1600);
    ty = clamp(ny, 0, 1200);
    tr = 208;
    wake();
  }
  function pointer(e) {
    const b = surface.getBoundingClientRect(),
      nx = ((e.clientX - b.left) / b.width) * 1600,
      ny = ((e.clientY - b.top) / b.height) * 1200;
    if (nx > 475 && nx < 1125 && ny > 330 && ny < 1100) aim(nx, ny);
    else {
      preview = 0;
      tr = 0;
      wake();
    }
  }
  listen(surface, "pointermove", pointer, signal);
  listen(surface, "pointerdown", pointer, signal);
  listen(
    surface,
    "pointerleave",
    (event) => {
      if (event.pointerType === "touch") return;
      preview = 0;
      tr = 0;
      wake();
    },
    signal,
  );
  listen(
    surface,
    "pointercancel",
    () => {
      preview = 0;
      tr = 0;
      wake();
    },
    signal,
  );
  listen(surface, "focus", () => aim(800, 730), signal);
  listen(
    surface,
    "blur",
    () => {
      preview = 0;
      tr = 0;
      wake();
    },
    signal,
  );
  listen(
    surface,
    "keydown",
    (e) => {
      if (
        ![
          "ArrowLeft",
          "ArrowRight",
          "ArrowUp",
          "ArrowDown",
          "PageDown",
          "PageUp",
          "Escape",
        ].includes(e.key)
      )
        return;
      e.preventDefault();
      if (e.key === "Escape") return reset();
      if (e.key === "PageDown" || e.key === "PageUp") {
        preview = 0;
        glyph(index + (e.key === "PageDown" ? 1 : -1));
        return;
      }
      aim(
        tx + (e.key === "ArrowRight" ? 40 : e.key === "ArrowLeft" ? -40 : 0),
        ty + (e.key === "ArrowDown" ? 40 : e.key === "ArrowUp" ? -40 : 0),
      );
    },
    signal,
  );
  listen(
    root.querySelector("[data-next]"),
    "click",
    () => {
      preview = 0;
      glyph(index + 1);
    },
    signal,
  );
  listen(
    root.querySelector("[data-prev]"),
    "click",
    () => {
      preview = 0;
      glyph(index - 1);
    },
    signal,
  );
  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    preview = last = 0;
  }
  function reset() {
    if (destroyed) return;
    stop();
    x = tx = 800;
    y = ty = 730;
    r = tr = 0;
    glyph(0);
    draw();
  }
  function replay() {
    if (destroyed) return;
    reset();
    if (reducedMotion) {
      r = tr = 208;
      draw();
      return;
    }
    preview = performance.now();
    wake();
  }
  function inspectAt(nx, ny, i = 0) {
    if (destroyed) return;
    stop();
    x = tx = nx;
    y = ty = ny;
    r = tr = 208;
    glyph(i);
    draw();
  }
  function destroy() {
    if (destroyed) return;
    destroyed = true;
    stop();
  }
  signal.addEventListener("abort", destroy, { once: true });
  const ready = Promise.all([
    document.fonts.load('300 174px "Xray Cormorant"'),
    document.fonts.load('italic 300 196px "Xray Cormorant"'),
  ]);
  reset();
  return { replay, reset, inspectAt, destroy, ready };
}
