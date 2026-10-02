import { makeArt, listen } from "../../_motion/demo-helpers.js";

/** A sticky background scene is uncovered by a foreground sheet. */
export function createDemo(root, { signal, reducedMotion }) {
  root.innerHTML = `<section class="underlapping-footer"><header><span>A LAYER BELOW</span><span>Scroll inside ↓</span></header><div class="underlapping-footer__scroller" tabindex="0" role="region" aria-label="下から現れるフッターのデモ"><div class="underlapping-footer__stack"><div class="underlapping-footer__backdrop"><div class="underlapping-footer__scene"><span>THE NEXT CHAPTER</span><h2>Let's make<br>something<br>meaningful.</h2><div class="underlapping-footer__art">${makeArt(4, "フッターの幾何学スタディ")}</div><p>Every ending is another beginning.</p></div></div><article class="underlapping-footer__sheet"><span>FROM THE JOURNAL / 003</span><h3>A view<br>from here.</h3><p>ページの下に、もうひとつの場面が待っています。</p><div class="underlapping-footer__rule"></div><span>KEEP SCROLLING ↓</span></article><div class="underlapping-footer__space" aria-hidden="true"></div></div></div><footer><span data-progress>00% revealed</span><label>Reveal <input type="range" min="0" max="100" value="0" aria-label="フッターの見える範囲" /></label></footer></section>`;
  const scroller = root.querySelector(".underlapping-footer__scroller"),
    scene = root.querySelector(".underlapping-footer__scene"),
    progress = root.querySelector("[data-progress]"),
    range = root.querySelector("input");
  let frame = 0;
  const distance = () => scroller.clientHeight;
  function render() {
    const p = Math.max(0, Math.min(1, scroller.scrollTop / distance()));
    scene.style.transform = reducedMotion
      ? "none"
      : `translateY(${(1 - p) * -22}%)`;
    progress.textContent = `${String(Math.round(p * 100)).padStart(2, "0")}% revealed`;
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
      const p = Math.min(1, (time - start) / 1400);
      scroller.scrollTop = (1 - Math.pow(1 - p, 3)) * distance();
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
