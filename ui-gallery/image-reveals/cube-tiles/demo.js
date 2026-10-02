import { makeArt } from "../../_motion/demo-helpers.js";

/** CSS perspective slices assemble into one original image. */
export function createDemo(root, { signal, reducedMotion = false }) {
  const art = makeArt(4, "An arch in a warm field");
  const tiles = Array.from({ length: 12 }, (_, index) => {
    const column = index % 4;
    const row = Math.floor(index / 4);
    const order = (index * 5) % 12;
    return `<div class="cube-tiles__tile" style="--column:${column};--row:${row};--delay:${order * 40}ms;--rx:${(row - 1) * 45}deg;--ry:${column % 2 ? -62 : 62}deg;--y:${(row - 1) * 25}px;--z:${50 + (index % 3) * 30}px"><div class="cube-tiles__slice">${art}</div></div>`;
  }).join("");
  root.innerHTML = `<section class="cube-tiles" aria-label="画像片が組み上がるデモ"><div class="cube-tiles__top"><span>IMAGE STUDY / 04</span><span>A whole, in pieces</span></div><div class="cube-tiles__body"><div class="cube-tiles__copy"><p class="cube-tiles__eyebrow">Build a point of view</p><h2>Piece by<br>piece.</h2><p>断片が戻って、<br>ひとつの風景になる。</p><button type="button">画像を組み立てる</button></div><figure class="cube-tiles__figure"><div class="cube-tiles__frame" aria-hidden="true"><div class="cube-tiles__grid">${tiles}</div><div class="cube-tiles__complete">${art}</div></div><figcaption>Arch / Original geometric study</figcaption></figure></div><div class="cube-tiles__bottom"><span>12 pieces · One image</span><span role="status" aria-live="polite">画像を組み立てる準備ができました</span></div></section>`;
  const lifecycle = new AbortController();
  const stage = root.querySelector(".cube-tiles");
  const frameElement = root.querySelector(".cube-tiles__frame");
  const button = root.querySelector("button");
  const status = root.querySelector('[role="status"]');
  let observer;
  let frame = 0;
  let timer = 0;
  let destroyed = false;
  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    clearTimeout(timer);
    timer = 0;
    observer?.disconnect();
  }
  function reset() {
    stop();
    stage.classList.add("is-resetting");
    stage.classList.remove("is-revealed", "is-complete");
    if (reducedMotion) stage.classList.add("is-revealed", "is-complete");
    status.textContent = reducedMotion
      ? "画像全体を表示しています"
      : "再生ボタンで画像を組み立てます";
  }
  function replay() {
    reset();
    if (destroyed) return;
    if (reducedMotion) return;
    // Commit the starting pose once; subsequent interactions replace this replay.
    void frameElement.offsetWidth;
    frame = requestAnimationFrame(() => {
      frame = 0;
      stage.classList.remove("is-resetting");
      stage.classList.add("is-revealed");
      status.textContent = "画像片が揃っています";
      timer = setTimeout(() => {
        stage.classList.add("is-complete");
        status.textContent = "一枚の画像になりました";
        timer = 0;
      }, 1500);
    });
  }
  button.addEventListener("click", replay, { signal: lifecycle.signal });
  function destroy() {
    if (destroyed) return;
    destroyed = true;
    stop();
    lifecycle.abort();
    stage
      .getAnimations({ subtree: true })
      .forEach((animation) => animation.cancel());
    signal?.removeEventListener("abort", destroy);
  }
  signal?.addEventListener("abort", destroy, { once: true });
  if (reducedMotion) reset();
  else {
    observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) replay();
      },
      { threshold: 0.25 },
    );
    observer.observe(stage);
  }
  if (signal?.aborted) destroy();
  return { replay, reset, destroy };
}
