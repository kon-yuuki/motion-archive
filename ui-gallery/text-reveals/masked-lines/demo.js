/** Scroll is local to the study. Visible line masks never split accessible text. */
export function createDemo(root, { signal, reducedMotion = false }) {
  root.innerHTML = `
    <section class="masked-lines" aria-label="行ごとに現れる見出しのデモ">
      <div class="masked-lines__bar"><span>03 / READING RHYTHM</span><span>SCROLL INSIDE ↓</span></div>
      <div class="masked-lines__scroll" tabindex="0" role="region" aria-label="見出しの出現を試すスクロール領域。下へスクロールしてください">
        <div class="masked-lines__intro">
          <p class="masked-lines__kicker">A little space to begin</p>
          <div class="masked-lines__intro-row"><h2>Let the words<br>find their place.</h2><span class="masked-lines__asterisk" aria-hidden="true">✳</span></div>
          <div class="masked-lines__intro-bottom"><p>この枠の中をスクロールすると、<br>次の見出しが行ごとに現れます。</p><button type="button" class="masked-lines__next">次の見出しへ <span aria-hidden="true">↓</span></button></div>
          <div class="masked-lines__progress" aria-hidden="true"><span></span></div>
        </div>
        <section class="masked-lines__chapter">
          <span class="masked-lines__chapter-number">01 — A CLEARER DIRECTION</span>
          <h2 class="masked-lines__heading"><span class="masked-lines__accessible">Small ideas. Clear direction. Room to grow.</span><span class="masked-lines__visual" aria-hidden="true"><span class="masked-lines__line"><span>Small ideas.</span></span><span class="masked-lines__line"><span>Clear direction.</span></span><span class="masked-lines__line"><span>Room to grow.</span></span></span></h2>
          <div class="masked-lines__after"><span class="masked-lines__marker" aria-hidden="true">↗︎</span><p>読む順序に、やさしいリズムを。<br>現れた言葉は、そのまま残ります。</p></div>
        </section>
        <div class="masked-lines__end"><span>END OF STUDY</span><p>上へ戻しても見出しは隠れません。<br>もう一度見るときは Replay を押してください。</p></div>
      </div>
      <div class="masked-lines__footer"><span>Each line has its own moment.</span><span role="status" aria-live="polite">内側をスクロールして開始</span></div>
    </section>`;

  const lifecycle = new AbortController();
  const stage = root.querySelector(".masked-lines");
  const scrollport = root.querySelector(".masked-lines__scroll");
  const chapter = root.querySelector(".masked-lines__chapter");
  const heading = root.querySelector(".masked-lines__heading");
  const status = root.querySelector('[role="status"]');
  const progress = root.querySelector(".masked-lines__progress span");
  let revealed = reducedMotion;
  let replaying = false;
  let frame = 0;
  let destroyed = false;
  stage.classList.add("is-ready");
  stage.classList.toggle("is-revealed", reducedMotion);
  const on = (element, type, handler, options = {}) =>
    element.addEventListener(type, handler, {
      ...options,
      signal: lifecycle.signal,
    });

  function reveal() {
    if (destroyed || revealed) return;
    revealed = true;
    stage.classList.add("is-revealed");
    status.textContent = reducedMotion
      ? "動きを省いて見出しを表示しています"
      : "見出しを表示しました";
  }

  const observer = new IntersectionObserver(
    (entries) => {
      if (replaying || scrollport.scrollTop < 20) return;
      if (
        entries.some(
          (entry) => entry.isIntersecting && entry.intersectionRatio >= 0.45,
        )
      )
        reveal();
    },
    { root: scrollport, threshold: [0, 0.45] },
  );
  observer.observe(heading);

  function destination() {
    // getBoundingClientRect keeps this independent of the shell's positioning.
    return (
      chapter.getBoundingClientRect().top -
      scrollport.getBoundingClientRect().top +
      scrollport.scrollTop
    );
  }

  on(root.querySelector(".masked-lines__next"), "click", () => {
    scrollport.scrollTo({
      top: destination(),
      behavior: reducedMotion ? "instant" : "smooth",
    });
    scrollport.focus({ preventScroll: true });
  });
  on(
    scrollport,
    "scroll",
    () => {
      const max = scrollport.scrollHeight - scrollport.clientHeight;
      progress.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollport.scrollTop / max) : 0})`;
    },
    { passive: true },
  );

  function reset() {
    cancelAnimationFrame(frame);
    frame = 0;
    replaying = false;
    revealed = reducedMotion;
    stage.classList.toggle("is-revealed", reducedMotion);
    scrollport.scrollTo({ top: 0, behavior: "instant" });
    progress.style.transform = "scaleX(0)";
    status.textContent = reducedMotion
      ? "動きを省いて見出しを表示しています"
      : "内側をスクロールして開始";
  }

  function replay() {
    reset();
    replaying = true;
    scrollport.scrollTo({ top: destination(), behavior: "instant" });
    frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        frame = 0;
        replaying = false;
        if (!reducedMotion) reveal();
      });
    });
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    cancelAnimationFrame(frame);
    observer.disconnect();
    lifecycle.abort();
    signal?.removeEventListener("abort", destroy);
  }
  if (reducedMotion) status.textContent = "動きを省いて見出しを表示しています";
  signal?.addEventListener("abort", destroy, { once: true });
  if (signal?.aborted) destroy();
  return { replay, reset, destroy };
}
