/** Each source .span-line wraps ONE WORD. Never substitute three full-line masks. */
export function createDemo(root, { signal, reducedMotion = false } = {}) {
  const copy = "Helping brands to stand out in the digital era. Together we will set the new status quo. No nonsense, always on the cutting edge.";
  root.innerHTML = `<section class="masked-lines" aria-label="Dennis Snellenberg の単語マスクによる紹介文">
    <div class="masked-lines__scroll" tabindex="0" role="region" aria-label="紹介文。スクロールまたは Replay で出現を確認できます">
      <div class="masked-lines__composition">
        <h2 class="masked-lines__heading"><span class="masked-lines__accessible">${copy}</span><span class="masked-lines__visual" aria-hidden="true">${copy.split(" ").map(word => `<span class="masked-lines__word"><span>${word}</span></span>`).join("")}</span></h2>
        <div class="masked-lines__aside"><p>Working across design and development, I bring ideas into focus through thoughtful detail and expressive interaction.</p><span class="masked-lines__about" aria-hidden="true">About me</span></div>
      </div>
      <div class="masked-lines__work"><span>RECENT WORK</span><div><span>TWICE</span><span>Interaction &amp; Development</span></div></div>
    </div>
    <p class="masked-lines__status" role="status" aria-live="polite">スクロールで紹介文へ進むと、単語が順番に現れます</p>
  </section>`;
  const lifecycle = new AbortController();
  const stage = root.querySelector(".masked-lines");
  const scrollport = root.querySelector(".masked-lines__scroll");
  const heading = root.querySelector(".masked-lines__heading");
  const words = [...root.querySelectorAll(".masked-lines__word > span")];
  const status = root.querySelector('[role="status"]');
  // Estimated from 864 live DOM observations, not claimed source constants.
  const duration = 1000, stagger = 11, power = 3.6;
  let frame = 0, started = false, destroyed = false, resetLocked = false;
  function paint(elapsed) {
    words.forEach((word, index) => {
      const progress = Math.max(0, Math.min(1, (elapsed - index * stagger) / duration));
      word.style.transform = `translateY(${Math.pow(1 - progress, power) * 100}%)`;
    });
  }
  function stop() { cancelAnimationFrame(frame); frame = 0; }
  function reveal() {
    if (destroyed || started) return;
    started = true;
    stage.classList.add("is-revealed");
    if (reducedMotion) { paint(Infinity); return; }
    const start = performance.now();
    function tick(now) {
      if (destroyed) return;
      const elapsed = now - start;
      paint(elapsed);
      if (elapsed < duration + stagger * (words.length - 1)) frame = requestAnimationFrame(tick);
      else { frame = 0; status.textContent = "24個の単語を表示しました。上へ戻っても隠れません"; }
    }
    frame = requestAnimationFrame(tick);
  }
  const observer = new IntersectionObserver(entries => {
    if (!resetLocked && entries.some(entry => entry.isIntersecting && entry.intersectionRatio >= .5)) reveal();
  }, { threshold: [0, .5] });
  observer.observe(heading);
  function onScroll() {
    if (resetLocked && scrollport.scrollTop > 1) { resetLocked = false; reveal(); }
  }
  scrollport.addEventListener("scroll", onScroll, { passive: true, signal: lifecycle.signal });
  // The real site is page-scrolled. The isolated version also accepts outer scroll.
  window.addEventListener("scroll", () => {
    if (!resetLocked) return;
    const bounds = heading.getBoundingClientRect();
    if (bounds.top < innerHeight * .85 && bounds.bottom > 0) { resetLocked = false; reveal(); }
  }, { passive: true, signal: lifecycle.signal });
  function reset() {
    if (destroyed) return;
    stop(); started = reducedMotion; resetLocked = true;
    stage.classList.toggle("is-revealed", reducedMotion);
    paint(reducedMotion ? Infinity : 0);
    scrollport.scrollTop = 0;
    status.textContent = reducedMotion ? "動きを省いて全文を表示しています" : "最初の状態に戻しました。Replay またはスクロールで開始";
  }
  function replay() {
    if (destroyed) return;
    reset(); resetLocked = false; reveal();
  }
  function destroy() {
    if (destroyed) return;
    destroyed = true; stop(); observer.disconnect(); lifecycle.abort();
    signal?.removeEventListener("abort", destroy);
  }
  paint(reducedMotion ? Infinity : 0);
  if (reducedMotion) { started = true; status.textContent = "動きを省いて全文を表示しています"; }
  signal?.addEventListener("abort", destroy, { once: true });
  if (signal?.aborted) destroy();
  return { replay, reset, destroy };
}
