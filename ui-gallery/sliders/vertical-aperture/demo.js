import { listen } from "../../_motion/demo-helpers.js";
import { sampleTrace, TRACE_DURATION } from "./trace.js";

const films = [
  ["garden", "庭の午後"], ["breakfast", "朝の食卓"], ["bike", "夏のサイクリング"],
  ["monitor", "古いテレビ"], ["night", "夜の廊下"], ["steps", "階段での会話"], ["cafe", "カフェのひととき"],
].map(([file, name]) => ({ name, url: new URL(`./assets/${file}.webp`, import.meta.url).href }));
const wrap = (n) => ((n % films.length) + films.length) % films.length;
const rest = [0, 395, 769, 468, 468, 0];
const CONTROL_DURATION = 360; // Added control response; not a measured source duration.

export function createDemo(root, { signal, reducedMotion }) {
  root.innerHTML = `<section class="vertical-aperture">
    <div class="vertical-aperture__scene">
      <header class="vertical-aperture__masthead" aria-hidden="true"><span>FILM STUDIES</span><span>WE CREATE STORIES<br>SINCE 2020</span><span>ABOUT US</span><span>CONTACT</span><span>IG&nbsp; VIMEO&nbsp; IN</span></header>
      <canvas class="vertical-aperture__film" aria-hidden="true"></canvas>
      <div class="vertical-aperture__viewport" tabindex="0" role="region" aria-roledescription="カルーセル" aria-label="7つのフィルムスタディ。左右にドラッグ、または矢印キーでシーンを選択"></div>
      <div class="vertical-aperture__ruler" role="group" aria-label="シーンを選ぶ">${films.map(({ name }, i) => `<button type="button" data-index="${i}" style="--index:${i}" aria-label="${i + 1}: ${name}" aria-pressed="false">${String(i + 1).padStart(2, "0")}</button>`).join("")}</div>
      <p class="vertical-aperture__sr-only" data-status role="status" aria-live="polite"></p>
    </div>
    <div class="vertical-aperture__controls"><button type="button" data-previous aria-label="前のシーン">↑</button><button type="button" data-next aria-label="次のシーン">↓</button><label>録画の時点 <input data-trace type="range" min="0" max="4000" step="1" value="0" aria-label="参考録画の動きを時点で確認" /></label><output data-time>0.00s</output></div>
    <p class="vertical-aperture__disclosure">4秒の録画を形・境界線でトレース。画像は新しく生成した静止画に置き換えています。</p>
  </section>`;
  const listeners = new AbortController();
  const listenerSignal = listeners.signal;
  const scene = root.querySelector(".vertical-aperture__scene");
  const viewport = root.querySelector(".vertical-aperture__viewport");
  const canvas = root.querySelector("canvas");
  const context = canvas.getContext("2d");
  const buttons = [...root.querySelectorAll("[data-index]")];
  const status = root.querySelector("[data-status]");
  const scrubber = root.querySelector("[data-trace]");
  const timeLabel = root.querySelector("[data-time]");
  let alive = true, raf = 0, pointer = null, mode = "idle", selected = -1;
  let values = reducedMotion ? [1, ...rest.slice(1)] : sampleTrace(0);
  let traceTime = 0, pointerX = 0, pointerY = 0, pointerPosition = 0, moved = false;
  let width = 0, height = 0, ratio = 1;
  const images = films.map(({ url }) => { const image = new Image(); image.onload = () => alive && render(); image.onerror = () => { if (alive) root.dataset.assetError = "true"; }; image.src = url; return image; });
  function updateState(announce = true) {
    const next = wrap(Math.round(values[0]));
    if (next !== selected) {
      selected = next;
      buttons.forEach((button, i) => button.setAttribute("aria-pressed", String(i === selected)));
      if (announce) status.textContent = `${String(selected + 1).padStart(2, "0")} / 07 · ${films[selected].name}`;
    }
    root.dataset.position = String(selected);
    root.dataset.filmPosition = values[0].toFixed(5);
    root.dataset.traceTime = traceTime.toFixed(1);
    root.dataset.bow = values[5].toFixed(3);
    root.dataset.playing = String(Boolean(raf));
    root.dataset.mode = mode;
    scrubber.value = String(traceTime);
    timeLabel.value = `${(traceTime / 1000).toFixed(2)}s`;
  }
  function render() {
    if (!alive || !context || !width || !height) return;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);
    const mobile = width < 600, scale = width / 1210 * (mobile ? 1.55 : 1);
    const offsetX = (width - 1210 * scale) / 2, offsetY = mobile ? height * .45 - 350 * scale : 0;
    const [position, top, bottom, leftTop, leftBottom, bow] = values;
    const rows = Math.ceil((bottom - top) * scale * ratio), rowHeight = (bottom - top) / rows;
    // Each row is a real image slice, stretched along the observed edge curve.
    // Both top and bottom remain straight and meet the sides at sharp corners.
    for (let row = 0; row < rows; row++) {
      const u = row / rows, filmY = position + u, image = images[wrap(Math.floor(filmY))];
      if (!image.complete || !image.naturalWidth) continue;
      const x = leftTop + (leftBottom - leftTop) * u + bow * 4 * u * (1 - u);
      const sy = (filmY - Math.floor(filmY)) * image.naturalHeight;
      const sh = Math.min(image.naturalHeight - sy, image.naturalHeight / rows);
      context.drawImage(image, 0, sy, image.naturalWidth, sh,
        offsetX + (x - 195) * scale, offsetY + (top - 234 + row * rowHeight) * scale,
        (1600 - 2 * x) * scale, rowHeight * scale + .25 / ratio);
    }
    updateState(mode !== "trace");
  }
  function stop() { cancelAnimationFrame(raf); raf = 0; mode = "idle"; }
  function finish() { raf = 0; mode = "idle"; updateState(); }
  function resize() {
    width = scene.clientWidth; height = scene.clientHeight; ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio); render();
  }
  function go(target) {
    if (!alive) return;
    stop();
    const from = [...values], start = performance.now();
    const destination = [target, ...rest.slice(1)];
    if (reducedMotion) { values = destination; render(); return; }
    mode = "control";
    const direction = Math.sign(target - from[0]);
    function tick(now) {
      if (!alive) return;
      const p = Math.min(1, (now - start) / CONTROL_DURATION), eased = 1 - (1 - p) ** 3;
      values = destination.map((v, i) => from[i] + (v - from[i]) * eased);
      const pulse = Math.sin(Math.PI * p) * direction;
      values[2] += pulse * 2; values[1] -= pulse * 10;
      values[3] -= pulse * 9; values[4] -= pulse * 9; values[5] -= pulse * 5;
      render();
      if (p < 1) raf = requestAnimationFrame(tick); else finish();
    }
    raf = requestAnimationFrame(tick); updateState();
  }
  function nearest(index) { const base = Math.round(values[0]); return base + ((((index - wrap(base)) + 10) % 7) - 3); }
  function seek(milliseconds) {
    if (!alive) return;
    stop(); traceTime = Math.max(0, Math.min(TRACE_DURATION, milliseconds));
    values = sampleTrace(traceTime);
    if (reducedMotion) values = [Math.round(values[0]), ...rest.slice(1)];
    render();
  }
  function clearPointer() { const id = pointer; pointer = null; moved = false; if (id !== null && viewport.hasPointerCapture(id)) viewport.releasePointerCapture(id); viewport.removeAttribute("data-dragging"); }
  function reset() { clearPointer(); seek(0); }
  function replay() {
    if (!alive) return;
    reset();
    if (reducedMotion) { go(2); return; }
    mode = "trace";
    const start = performance.now();
    function tick(now) {
      if (!alive) return;
      traceTime = Math.min(TRACE_DURATION, now - start); values = sampleTrace(traceTime); render();
      if (traceTime < TRACE_DURATION) raf = requestAnimationFrame(tick); else { finish(); status.textContent = "録画のトレースを再生しました"; }
    }
    raf = requestAnimationFrame(tick); updateState();
  }
  listen(root.querySelector("[data-previous]"), "click", () => go(Math.round(values[0]) - 1), listenerSignal);
  listen(root.querySelector("[data-next]"), "click", () => go(Math.round(values[0]) + 1), listenerSignal);
  buttons.forEach((button) => listen(button, "click", () => go(nearest(Number(button.dataset.index))), listenerSignal));
  listen(scrubber, "input", () => seek(Number(scrubber.value)), listenerSignal);
  listen(viewport, "keydown", (event) => {
    if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    go(event.key === "Home" ? nearest(0) : event.key === "End" ? nearest(6) : Math.round(values[0]) + (["ArrowDown", "ArrowRight"].includes(event.key) ? 1 : -1));
  }, listenerSignal);
  listen(viewport, "pointerdown", (event) => {
    if (event.button !== 0) return;
    pointer = event.pointerId; pointerX = event.clientX; pointerY = event.clientY; pointerPosition = values[0]; moved = false;
  }, listenerSignal);
  listen(viewport, "pointermove", (event) => {
    if (pointer !== event.pointerId) return;
    const dx = event.clientX - pointerX, dy = event.clientY - pointerY;
    if (!moved && Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) { pointer = null; return; }
    if (!moved && Math.abs(dx) <= 8) return;
    if (!moved) { stop(); viewport.setPointerCapture(pointer); viewport.dataset.dragging = "true"; moved = true; }
    values = [pointerPosition - dx / viewport.clientWidth * 2, ...rest.slice(1)];
    if (reducedMotion) values[0] = Math.round(values[0]);
    else values[5] = Math.max(-9, Math.min(9, dx * .03));
    mode = "drag"; render();
  }, listenerSignal);
  function endPointer(event) {
    if (pointer !== event.pointerId) return;
    const wasMoving = moved; pointer = null; moved = false; viewport.removeAttribute("data-dragging");
    if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
    if (wasMoving) go(Math.round(values[0]));
  }
  listen(viewport, "pointerup", endPointer, listenerSignal);
  listen(viewport, "pointercancel", endPointer, listenerSignal);
  listen(viewport, "lostpointercapture", (event) => { if (event.target === viewport && pointer === event.pointerId) endPointer(event); }, listenerSignal);
  listen(viewport, "pointerleave", (event) => { if (!moved && pointer === event.pointerId) pointer = null; }, listenerSignal);
  listen(document, "visibilitychange", () => { if (document.hidden) { stop(); render(); } }, listenerSignal);
  const observer = new ResizeObserver(resize); observer.observe(scene);
  function destroy() {
    if (!alive) return;
    stop(); alive = false; clearPointer(); observer.disconnect(); listeners.abort();
    signal.removeEventListener("abort", destroy);
    images.forEach((image) => { image.onload = image.onerror = null; });
    root.dataset.playing = "false"; root.dataset.mode = "destroyed";
  }
  signal.addEventListener("abort", destroy, { once: true });
  resize();
  return { replay, reset, destroy, seek };
}
