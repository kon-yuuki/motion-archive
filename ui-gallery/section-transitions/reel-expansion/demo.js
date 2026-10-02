import { makeArt, listen } from "../../_motion/demo-helpers.js";

/** Scroll distance, not elapsed time, opens the media and separates the heading. */
export function createDemo(root, { signal, reducedMotion }) {
  root.innerHTML = `<section class="reel-expansion"><header><span>WORK IN MOTION</span><span>Scroll inside ↓</span></header><div class="reel-expansion__scroller" tabindex="0" role="region" aria-label="リールが広がるスクロールデモ"><div class="reel-expansion__runway"><div class="reel-expansion__sticky"><div class="reel-expansion__media">${makeArt(2, "広がる彫刻のスタディ")}<span class="reel-expansion__play" aria-hidden="true">▶︎</span></div><h2><span data-left>See</span><span data-right>motion.</span></h2><span class="reel-expansion__caption">From a glimpse to the whole scene.</span></div></div><div class="reel-expansion__after"><p>01 / A CHANGE OF SCALE</p><h3>Give the scene<br>room to breathe.</h3><p>スクロールを戻すと、画像と文字も元の位置へ戻ります。</p></div></div><footer><span data-progress>00%</span><label>Progress <input type="range" min="0" max="100" value="0" aria-label="展開の進み具合" /></label></footer></section>`;
  const scroller = root.querySelector(".reel-expansion__scroller"),
    runway = root.querySelector(".reel-expansion__runway"),
    media = root.querySelector(".reel-expansion__media"),
    left = root.querySelector("[data-left]"),
    right = root.querySelector("[data-right]"),
    caption = root.querySelector(".reel-expansion__caption"),
    progress = root.querySelector("[data-progress]"),
    range = root.querySelector("input");
  let frame = 0;
  const distance = () =>
    Math.max(1, runway.clientHeight - scroller.clientHeight);
  function render() {
    const p = Math.min(1, Math.max(0, scroller.scrollTop / distance()));
    const visual = reducedMotion ? 1 : p;
    media.style.width = `${54 + visual * 46}%`;
    media.style.height = `${60 + visual * 40}%`;
    media.style.borderRadius = `${10 * (1 - visual)}px`;
    left.style.transform = `translateX(${-visual * 33}%)`;
    right.style.transform = `translateX(${visual * 33}%)`;
    caption.style.opacity = String(1 - visual * 0.6);
    progress.textContent = `${String(Math.round(p * 100)).padStart(2, "0")}%`;
    range.value = String(Math.round(p * 100));
    root.dataset.progress = p.toFixed(3);
  }
  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
  }
  listen(scroller, "scroll", render, signal, { passive: true });
  ["wheel", "pointerdown", "keydown", "touchstart"].forEach((type) =>
    listen(scroller, type, stop, signal, { passive: true }),
  );
  listen(
    range,
    "input",
    () => {
      stop();
      scroller.scrollTop = (Number(range.value) / 100) * distance();
      render();
    },
    signal,
  );
  const resize = new ResizeObserver(render);
  resize.observe(scroller);
  function reset() {
    stop();
    scroller.scrollTop = 0;
    render();
  }
  function replay() {
    reset();
    if (reducedMotion) {
      scroller.scrollTop = distance();
      render();
      return;
    }
    const start = performance.now();
    function tick(time) {
      const p = Math.min(1, (time - start) / 1600);
      const eased = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      scroller.scrollTop = eased * distance();
      render();
      if (p < 1) frame = requestAnimationFrame(tick);
      else frame = 0;
    }
    frame = requestAnimationFrame(tick);
  }
  function destroy() {
    stop();
    resize.disconnect();
  }
  signal.addEventListener("abort", destroy, { once: true });
  render();
  return { replay, reset, destroy };
}
