import { listen } from "../../_motion/demo-helpers.js";
import portrait from "../../../src/assets/images/warm-neutral-tailoring/ivory-cream-standing-long.webp";
import night from "../../../src/assets/images/rainy-neon-cityscapes/rainy-neon-cityscape-01.webp";
import sculpture from "../../../src/assets/images/sculptural-still-lifes/neutral-stone-monuments.webp";
import seated from "../../../src/assets/images/warm-neutral-tailoring/camel-tailored-seated-close.webp";

// Measured at 1180×757: 9 heterogeneous widgets in two repeated groups.
// Images, names and figures below are existing repository study material, not client claims.
const cards = [
  { shape: "small", theme: "dark", title: "Independent by design.", detail: "A collaborative studio<br>for thoughtful brands.", foot: "Meet the studio ↗" },
  { shape: "full", theme: "dark", title: "A new perspective.", detail: "Identity, image<br>and everyday life.", image: portrait, foot: "FIELD / STUDY 01" },
  { shape: "small", theme: "light", title: "Selected work.", detail: "Across disciplines,<br>across the years.", foot: "STUDIO ARCHIVE" },
  { shape: "full", theme: "dark", title: "Digital experiences.", detail: "Made to move<br>with the world.", image: night, foot: "CITY / STUDY 02" },
  { shape: "small", theme: "dark", title: "2 ways to collaborate.", detail: "Project / Partnership", foot: "Explore the approach ↗" },
  { shape: "small", theme: "light", title: "A broader view.", detail: "Strategy, design<br>and shared ambition." },
  { shape: "medium", theme: "dark", title: "Ideas made tangible.", detail: "From the first sketch<br>to the final form.", image: sculpture, foot: "FORM / STUDY 03" },
  { shape: "small", theme: "light", title: "Built for what’s next.", detail: "A clear direction<br>for new beginnings.", foot: "Case study ↗" },
  { shape: "full", theme: "light", title: "People, together.", detail: "A practice shaped<br>by different perspectives.", image: seated, foot: "PEOPLE / STUDY 04" },
];
export function createDemo(root, { signal, reducedMotion }) {
  const markup = (copy) => `<div class="free-drag-rail__group" ${copy ? 'aria-hidden="true" inert' : ""}>${cards.map((card, i) => `<article class="free-drag-rail__card free-drag-rail__card--${card.shape} free-drag-rail__card--${card.theme}${card.image ? " has-image" : ""}" aria-label="${i + 1} / 9">${card.image ? `<img src="${card.image}" alt="" draggable="false"/>` : ""}<div class="free-drag-rail__caption"><p>${card.title}<span>${card.detail}</span></p>${card.foot ? `<span class="free-drag-rail__foot">${card.foot}</span>` : ""}</div></article>`).join("")}</div>`;
  root.innerHTML = `<section class="free-drag-rail"><header><span>Studio at a Glance.</span><span>Independent motion study</span></header><div class="free-drag-rail__viewport" tabindex="0" role="region" aria-roledescription="カルーセル" aria-label="9枚のカード。左右キーで移動"><div class="free-drag-rail__track">${markup(false)}${markup(true)}</div></div><footer><span>DRAG TO EXPLORE ↔</span><div class="free-drag-rail__nav"><button type="button" data-previous aria-label="前のカード">←</button><span data-position role="status" aria-live="polite">1 / 9</span><button type="button" data-next aria-label="次のカード">→</button><button type="button" data-pause aria-pressed="false">Pause</button></div></footer></section>`;
  const viewport = root.querySelector(".free-drag-rail__viewport");
  const track = root.querySelector(".free-drag-rail__track");
  const group = track.firstElementChild;
  const position = root.querySelector("[data-position]");
  const pause = root.querySelector("[data-pause]");
  const events = new AbortController();
  let x = 0, width = 1, step = 470, frame = 0, lastTime = 0, pointer = null;
  let startX = 0, startY = 0, startOffset = 0, dragging = false;
  let paused = Boolean(reducedMotion), visible = true, destroyed = false;
  const mod = (value, size) => ((value % size) + size) % size;
  function render(announce = false) {
    x = mod(x, width);
    track.style.transform = `translate3d(${-x}px,0,0)`;
    const index = Math.min(8, Math.floor(x / step));
    root.dataset.position = String(index);
    root.dataset.offset = x.toFixed(3);
    if (announce) position.textContent = `${index + 1} / 9`;
  }
  function stop() { cancelAnimationFrame(frame); frame = 0; lastTime = 0; }
  function tick(time) {
    frame = 0;
    if (destroyed || paused || reducedMotion || !visible || document.hidden || pointer !== null) return;
    if (lastTime) x += Math.min(64, time - lastTime) * 0.0524;
    lastTime = time;
    render();
    frame = requestAnimationFrame(tick);
  }
  function start() { if (!frame && !destroyed && !paused && !reducedMotion && visible && !document.hidden && pointer === null) frame = requestAnimationFrame(tick); }
  function setPaused(value) {
    paused = value || reducedMotion;
    pause.setAttribute("aria-pressed", String(paused));
    pause.textContent = reducedMotion ? "Motion off" : paused ? "Play" : "Pause";
    pause.disabled = reducedMotion;
    root.dataset.playing = String(!paused);
    stop(); start();
  }
  function move(direction) { setPaused(true); x += direction * step; render(true); }
  function resize() {
    const previousWidth = width;
    width = group.getBoundingClientRect().width;
    step = group.children[0].offsetWidth + 30;
    if (previousWidth > 1) x = x / previousWidth * width;
    render();
  }
  listen(viewport, "pointerdown", (event) => {
    if (event.button !== 0) return;
    stop(); pointer = event.pointerId; dragging = false;
    startX = event.clientX; startY = event.clientY; startOffset = x;
  }, events.signal);
  listen(viewport, "pointermove", (event) => {
    if (pointer !== event.pointerId) return;
    const dx = event.clientX - startX, dy = event.clientY - startY;
    if (!dragging && Math.abs(dy) > Math.abs(dx) + 8) { pointer = null; start(); return; }
    if (!dragging && Math.abs(dx) > 6) {
      dragging = true; setPaused(true); viewport.setPointerCapture(pointer);
      viewport.classList.add("is-dragging");
    }
    if (!dragging) return;
    event.preventDefault(); x = startOffset - dx; render();
  }, events.signal);
  function release(event) {
    if (pointer !== event.pointerId) return;
    const id = pointer; pointer = null;
    if (viewport.hasPointerCapture(id)) viewport.releasePointerCapture(id);
    dragging = false; viewport.classList.remove("is-dragging"); render(true); start();
  }
  listen(viewport, "pointerup", release, events.signal);
  listen(viewport, "pointercancel", release, events.signal);
  listen(viewport, "lostpointercapture", (event) => { if (event.target === viewport) release(event); }, events.signal);
  listen(window, "pointerup", release, events.signal);
  listen(viewport, "wheel", (event) => {
    if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
    event.preventDefault(); setPaused(true); x += event.deltaX; render(true);
  }, events.signal, { passive: false });
  listen(viewport, "keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault(); setPaused(true);
    if (event.key === "Home" || event.key === "End") { x = event.key === "Home" ? 0 : 8 * step; render(true); }
    else move(event.key === "ArrowRight" ? 1 : -1);
  }, events.signal);
  listen(viewport, "focus", () => setPaused(true), events.signal);
  listen(root.querySelector("[data-previous]"), "click", () => move(-1), events.signal);
  listen(root.querySelector("[data-next]"), "click", () => move(1), events.signal);
  listen(pause, "click", () => setPaused(!paused), events.signal);
  listen(document, "visibilitychange", () => { stop(); start(); }, events.signal);
  const observer = new ResizeObserver(resize); observer.observe(viewport);
  const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; stop(); start(); }); intersection.observe(viewport);
  function reset() { stop(); if (pointer !== null && viewport.hasPointerCapture(pointer)) viewport.releasePointerCapture(pointer); pointer = null; dragging = false; viewport.classList.remove("is-dragging"); x = 0; render(true); setPaused(reducedMotion); }
  function replay() { reset(); }
  function destroy() { if (destroyed) return; destroyed = true; stop(); if (pointer !== null && viewport.hasPointerCapture(pointer)) viewport.releasePointerCapture(pointer); pointer = null; events.abort(); observer.disconnect(); intersection.disconnect(); signal?.removeEventListener("abort", destroy); }
  signal?.addEventListener("abort", destroy, { once: true });
  resize(); reset();
  return { replay, reset, destroy };
}
