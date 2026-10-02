import { makeArt } from "../../_motion/demo-helpers.js";

/** Nested strips share their hinge edges, rather than scattering independently. */
export function createDemo(root, { signal, reducedMotion = false }) {
  const art = makeArt(0, "Quiet landscape");
  let strips = "";
  for (let index = 7; index >= 0; index -= 1) {
    const angle = index === 0 ? 62 : index % 2 ? -124 : 124;
    strips = `<div class="accordion-unfold__strip" style="--angle:${angle}deg;--column:${index}"><div class="accordion-unfold__slice">${art}<span class="accordion-unfold__shade" style="--shade:${index % 2 ? 0.26 : 0.07}"></span></div>${strips}</div>`;
  }
  root.innerHTML = `<section class="accordion-unfold" aria-label="折り畳んだ画像が開くデモ"><div class="accordion-unfold__top"><span>IMAGE STUDY / 05</span><span>A connected surface</span></div><div class="accordion-unfold__body"><figure class="accordion-unfold__figure"><div class="accordion-unfold__frame" aria-hidden="true"><div class="accordion-unfold__plane">${strips}</div><div class="accordion-unfold__complete">${art}</div></div><figcaption>Landscape / Original geometric study</figcaption></figure><div class="accordion-unfold__copy"><p class="accordion-unfold__eyebrow">A wider view</p><h2>Unfold the<br>landscape.</h2><p>折り目が消えて、<br>見える世界が広がる。</p><button type="button">画像を開く</button></div></div><div class="accordion-unfold__bottom"><span>Eight connected folds</span><span role="status" aria-live="polite">画像を開く準備ができました</span></div></section>`;
  const lifecycle = new AbortController();
  const stage = root.querySelector(".accordion-unfold");
  const frameElement = root.querySelector(".accordion-unfold__frame");
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
      ? "一枚の画像を表示しています"
      : "再生ボタンで画像を開きます";
  }
  function replay() {
    reset();
    if (destroyed || reducedMotion) return;
    void frameElement.offsetWidth;
    frame = requestAnimationFrame(() => {
      frame = 0;
      stage.classList.remove("is-resetting");
      stage.classList.add("is-revealed");
      status.textContent = "折り目をほどいています";
      timer = setTimeout(() => {
        stage.classList.add("is-complete");
        status.textContent = "画像全体が開きました";
        timer = 0;
      }, 1200);
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
