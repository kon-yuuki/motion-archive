/** An original double-loop glyph grows around its solid waist, clearing every yellow counter. */
export function createDemo(root, { signal, reducedMotion }) {
  root.innerHTML = `<section class="numeral-mask"><header><span>FORM / 08</span><span>Scroll inside ↓</span></header><div class="numeral-mask__scroller" tabindex="0" role="region" aria-label="数字が次のセクションに変わるスクロールデモ"><div class="numeral-mask__runway"><div class="numeral-mask__sticky"><div class="numeral-mask__start"><p>ONE FORM. MANY POSSIBILITIES.</p><div class="numeral-mask__glyph" aria-hidden="true"><svg viewBox="0 0 400 500"><path fill="#202923" fill-rule="evenodd" d="M200 12C108 12 47 62 47 135c0 46 23 82 61 106-50 23-76 62-76 112 0 86 65 139 168 139s168-53 168-139c0-50-26-89-76-112 38-24 61-60 61-106C353 62 292 12 200 12Zm0 64c-44 0-72 25-72 60s28 62 72 62 72-27 72-62-28-60-72-60Zm0 208c-51 0-85 26-85 67s34 70 85 70 85-29 85-70-34-67-85-67Z"/></svg></div><span>Scroll to discover the other side</span></div><div class="numeral-mask__destination" aria-hidden="true"><div class="numeral-mask__destination-copy"><p>08 / THE OTHER SIDE</p><h2>Strength in<br>the details.</h2><p>ひとつの形から、<br>新しい視点へつながる。</p></div><svg class="numeral-mask__sculpture" viewBox="0 0 480 400" aria-hidden="true"><defs><linearGradient id="numeral-mask-metal" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#cad2c4"/><stop offset=".48" stop-color="#73846f"/><stop offset="1" stop-color="#344437"/></linearGradient></defs><ellipse cx="254" cy="334" rx="168" ry="24" fill="#101b13"/><path d="m91 128 127-53 180 58-126 61Z" fill="#d2d8c7"/><path d="m91 128 181 66v119L91 248Z" fill="url(#numeral-mask-metal)"/><path d="m272 194 126-61v117l-126 63Z" fill="#53684e"/><path d="m120 144 152 54v29l-152-55Z" fill="#43533f"/><path d="m291 196 84-40v28l-84 40Z" fill="#253c2b"/><path d="m120 198 152 55v31l-152-56Z" fill="#b6c2ac"/><path d="m291 250 84-42v28l-84 41Z" fill="#82967a"/></svg><div class="numeral-mask__destination-rule"><span>ORIGINAL FORM STUDY</span><span>08 → 09</span></div></div><span class="numeral-mask__state" data-state role="status" aria-live="polite">Numeral</span></div></div></div><footer><button type="button" data-next>次のセクションへ →</button><label>Progress <input type="range" min="0" max="100" value="0" aria-label="数字の拡大と場面転換の進み具合"></label><span data-progress>00%</span></footer></section>`;
  const scroller = root.querySelector(".numeral-mask__scroller"),
    runway = root.querySelector(".numeral-mask__runway");
  const start = root.querySelector(".numeral-mask__start"),
    glyph = root.querySelector(".numeral-mask__glyph"),
    destination = root.querySelector(".numeral-mask__destination"),
    copy = root.querySelector(".numeral-mask__destination-copy"),
    sculpture = root.querySelector(".numeral-mask__sculpture");
  const range = root.querySelector("input"),
    progress = root.querySelector("[data-progress]"),
    status = root.querySelector("[data-state]"),
    next = root.querySelector("[data-next]");
  const events = new AbortController();
  let raf = 0,
    lastState = "";
  const clamp = (p) => Math.max(0, Math.min(1, p));
  const distance = () =>
    Math.max(1, runway.clientHeight - scroller.clientHeight);
  function render() {
    const p = clamp(scroller.scrollTop / distance());
    // Zoom ends at a solid area between the loops, rather than inside a counter.
    const zoom = clamp(p / 0.76),
      reveal = clamp((p - 0.78) / 0.2);
    const scale = Math.pow(20, zoom * zoom);
    glyph.style.transform = reducedMotion ? "none" : `scale(${scale})`;
    const finished = reducedMotion ? p >= 0.5 : p >= 0.8;
    start.style.opacity = reducedMotion ? (finished ? "0" : "1") : "1";
    start.style.visibility = p >= 0.995 ? "hidden" : "visible";
    start.setAttribute("aria-hidden", String(finished));
    destination.style.opacity = String(
      reducedMotion ? (finished ? 1 : 0) : reveal,
    );
    destination.style.visibility =
      finished || reveal > 0 ? "visible" : "hidden";
    destination.setAttribute("aria-hidden", String(!finished));
    copy.style.transform = reducedMotion
      ? "none"
      : `translateY(${(1 - reveal) * 38}px)`;
    sculpture.style.transform = reducedMotion
      ? "none"
      : `translateY(${(1 - reveal) * 70}px)`;
    const label = finished
      ? "Next section"
      : p > 0.08
        ? "Growing numeral"
        : "Numeral";
    if (label !== lastState) {
      status.textContent = label;
      lastState = label;
    }
    range.value = String(Math.round(p * 100));
    progress.textContent = `${String(Math.round(p * 100)).padStart(2, "0")}%`;
    next.textContent = finished ? "数字へ戻る →" : "次のセクションへ →";
    root.dataset.progress = p.toFixed(3);
  }
  function stop() {
    cancelAnimationFrame(raf);
    raf = 0;
  }
  function travel(target) {
    stop();
    const from = scroller.scrollTop,
      to = target * distance();
    if (reducedMotion) {
      scroller.scrollTop = to;
      render();
      return;
    }
    const began = performance.now();
    function tick(time) {
      const p = clamp((time - began) / 1700),
        ease = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      scroller.scrollTop = from + (to - from) * ease;
      render();
      if (p < 1) raf = requestAnimationFrame(tick);
      else raf = 0;
    }
    raf = requestAnimationFrame(tick);
  }
  scroller.addEventListener("scroll", render, {
    signal: events.signal,
    passive: true,
  });
  ["wheel", "pointerdown", "touchstart", "keydown"].forEach((type) =>
    scroller.addEventListener(type, stop, {
      signal: events.signal,
      passive: true,
    }),
  );
  range.addEventListener(
    "input",
    () => {
      stop();
      scroller.scrollTop = (Number(range.value) / 100) * distance();
      render();
    },
    { signal: events.signal },
  );
  next.addEventListener(
    "click",
    () => travel(lastState === "Next section" ? 0 : 1),
    { signal: events.signal },
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
    travel(1);
  }
  function destroy() {
    stop();
    resize.disconnect();
    events.abort();
    signal?.removeEventListener("abort", destroy);
  }
  signal?.addEventListener("abort", destroy, { once: true });
  render();
  return { replay, reset, destroy };
}
