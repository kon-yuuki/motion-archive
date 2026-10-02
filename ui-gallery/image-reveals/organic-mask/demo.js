import { makeArt } from "../../_motion/demo-helpers.js";
let nextMaskId = 0;

/** Independent SVG mask islands expand and join; the source artwork is original. */
export function createDemo(root, { signal, reducedMotion = false }) {
  const id = `organic-mask-${++nextMaskId}`;
  const seeds = Array.from({ length: 20 }, (_, index) => ({
    x: (index % 5) * 160,
    y: Math.floor(index / 5) * 160,
    delay: ((index * 7) % 9) * 0.026,
    ratio: 0.72 + (index % 3) * 0.18,
  }));
  root.innerHTML = `<section class="organic-mask" aria-label="有機的なマスクで画像が現れるデモ"><div class="organic-mask__top"><span>IMAGE STUDY / 03</span><span>Separate, then together</span></div><div class="organic-mask__body"><figure class="organic-mask__figure"><svg class="organic-mask__canvas" viewBox="0 0 640 480" aria-hidden="true"><defs><mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="640" height="480"><rect width="640" height="480" fill="black"/>${seeds.map((seed) => `<ellipse cx="${seed.x}" cy="${seed.y}" rx="0" ry="0" fill="white"/>`).join("")}</mask></defs><g data-art mask="url(#${id})">${makeArt(5, "Round forms in a quiet field")}</g></svg><figcaption>Round forms / Original geometric study</figcaption></figure><div class="organic-mask__copy"><p class="organic-mask__eyebrow">A view in pieces</p><h2>Let the<br>image in.</h2><p>小さく見える。<br>つながる。全体が見える。</p><button type="button">もう一度、画像を表示</button></div></div><div class="organic-mask__bottom"><span>Viewport entry · Replay</span><span role="status" aria-live="polite">画像を表示する準備ができました</span></div></section>`;
  const lifecycle = new AbortController();
  const stage = root.querySelector(".organic-mask");
  const art = root.querySelector("[data-art]");
  const blobs = [...root.querySelectorAll("mask ellipse")];
  const button = root.querySelector("button");
  const status = root.querySelector('[role="status"]');
  let frame = 0;
  let observer;
  let destroyed = false;
  function draw(progress) {
    if (progress >= 1) {
      art.removeAttribute("mask");
      return;
    }
    art.setAttribute("mask", `url(#${id})`);
    blobs.forEach((blob, index) => {
      const seed = seeds[index];
      const local = Math.max(
        0,
        Math.min(1, (progress - seed.delay) / (1 - seed.delay)),
      );
      const eased = 1 - (1 - local) ** 3;
      blob.setAttribute("rx", String(172 * eased));
      blob.setAttribute("ry", String(172 * seed.ratio * eased));
    });
  }
  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    observer?.disconnect();
  }
  function replay() {
    stop();
    if (destroyed) return;
    if (reducedMotion) {
      draw(1);
      status.textContent = "画像全体を表示しています";
      return;
    }
    draw(0);
    status.textContent = "窓が広がり、画像が現れています";
    let start;
    const tick = (time) => {
      start ??= time;
      const progress = Math.min(1, (time - start) / 900);
      draw(progress);
      if (progress < 1 && !destroyed) frame = requestAnimationFrame(tick);
      else {
        frame = 0;
        status.textContent = "画像全体が見えました";
      }
    };
    frame = requestAnimationFrame(tick);
  }
  function reset() {
    stop();
    draw(reducedMotion ? 1 : 0);
    status.textContent = reducedMotion
      ? "画像全体を表示しています"
      : "画像を隠しました。再生ボタンで表示します";
  }
  button.addEventListener("click", replay, { signal: lifecycle.signal });
  function destroy() {
    if (destroyed) return;
    destroyed = true;
    stop();
    lifecycle.abort();
    signal?.removeEventListener("abort", destroy);
  }
  signal?.addEventListener("abort", destroy, { once: true });
  if (reducedMotion) draw(1);
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
