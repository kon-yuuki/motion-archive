/** CSS depth study: seven nested frames share one local-scroll progress value. */
export function createDemo(root, { signal, reducedMotion }) {
  root.innerHTML = `<section class="depth-tunnel"><header><span>BETWEEN / SCENES</span><span>CSS depth study · Scroll inside ↓</span></header><div class="depth-tunnel__scroller" role="region" tabindex="0" aria-label="奥行きを進むスクロールデモ"><div class="depth-tunnel__runway"><div class="depth-tunnel__sticky"><div class="depth-tunnel__tunnel" aria-hidden="true"><div class="depth-tunnel__glow"></div>${Array.from({ length: 7 }, (_, i) => `<div class="depth-tunnel__frame" data-frame="${i}"><i></i><i></i><i></i><i></i></div>`).join("")}<div class="depth-tunnel__object"><svg viewBox="0 0 100 150"><path d="M50 5 93 54 73 134 28 142 8 57Z" fill="#b7cddd"/><path d="M50 5 53 65 8 57Z" fill="#fff9e5"/><path d="m53 65 40-11-20 80-20-13Z" fill="#7294ad"/><path d="m8 57 45 8v56l-25 21Z" fill="#cee1ed"/></svg></div></div><div class="depth-tunnel__entry"><p>01 / THE IN-BETWEEN</p><h2>A little<br>further in.</h2><p>奥行きを通って、次の場面へ</p></div><div class="depth-tunnel__contact" aria-hidden="true"><p>02 / A NEW CONNECTION</p><h2>Where ideas<br>take shape.</h2><span class="depth-tunnel__contact-link">Let’s make something <span aria-hidden="true">→</span></span><div class="depth-tunnel__orbit depth-tunnel__orbit--a" aria-hidden="true"></div><div class="depth-tunnel__orbit depth-tunnel__orbit--b" aria-hidden="true"></div><div class="depth-tunnel__orbit depth-tunnel__orbit--c" aria-hidden="true"></div></div><span class="depth-tunnel__hint" data-scene role="status" aria-live="polite">Entrance</span></div></div></div><footer><button type="button" data-next>次の場面へ →</button><label>Progress <input type="range" min="0" max="100" value="0" aria-label="トンネルの進み具合"></label><span data-progress>00%</span></footer></section>`;
  const scroller = root.querySelector(".depth-tunnel__scroller"),
    runway = root.querySelector(".depth-tunnel__runway");
  const frames = [...root.querySelectorAll("[data-frame]")],
    tunnel = root.querySelector(".depth-tunnel__tunnel"),
    object = root.querySelector(".depth-tunnel__object");
  const entry = root.querySelector(".depth-tunnel__entry"),
    contact = root.querySelector(".depth-tunnel__contact"),
    range = root.querySelector("input"),
    progress = root.querySelector("[data-progress]"),
    scene = root.querySelector("[data-scene]"),
    next = root.querySelector("[data-next]");
  const events = new AbortController();
  let raf = 0,
    lastScene = "";
  const clamp = (n, min = 0, max = 1) => Math.max(min, Math.min(max, n));
  const distance = () =>
    Math.max(1, runway.clientHeight - scroller.clientHeight);
  function render() {
    const p = clamp(scroller.scrollTop / distance());
    const depth = clamp((p - 0.06) / 0.76),
      reveal = clamp((p - 0.72) / 0.24);
    frames.forEach((frame, i) => {
      const scale = Math.pow(2, (i - 5) * 0.69 + depth * 4.1);
      frame.style.transform = `translate(-50%,-50%) rotate(${i * 7 + depth * 72}deg) scale(${scale})`;
      frame.style.opacity = String(
        clamp(scale * 1.8) * (1 - clamp((scale - 3) / 3)),
      );
    });
    object.style.transform = `translate(-50%,-50%) rotate(${-16 + depth * 74}deg) scale(${0.14 + depth * 2.8})`;
    object.style.opacity = String(1 - reveal);
    tunnel.style.opacity = String(reducedMotion ? 0 : 1 - reveal);
    const destination = reducedMotion ? p >= 0.5 : reveal > 0.5;
    entry.style.opacity = String(
      reducedMotion ? (destination ? 0 : 1) : 1 - clamp(p / 0.24),
    );
    entry.style.transform = reducedMotion ? "none" : `translateY(${-p * 55}px)`;
    entry.setAttribute("aria-hidden", String(destination));
    contact.style.opacity = String(
      reducedMotion ? (destination ? 1 : 0) : reveal,
    );
    contact.style.transform = reducedMotion
      ? "none"
      : `translateY(${(1 - reveal) * 45}px)`;
    contact.setAttribute("aria-hidden", String(!destination));
    const label = destination
      ? "Destination"
      : p > 0.15
        ? "Through the tunnel"
        : "Entrance";
    if (lastScene !== label) {
      scene.textContent = label;
      lastScene = label;
    }
    range.value = String(Math.round(p * 100));
    progress.textContent = `${String(Math.round(p * 100)).padStart(2, "0")}%`;
    next.textContent = destination ? "入口へ戻る →" : "次の場面へ →";
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
    const start = performance.now();
    function tick(time) {
      const p = clamp((time - start) / 1800),
        eased = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      scroller.scrollTop = from + (to - from) * eased;
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
    () => travel(lastScene === "Destination" ? 0 : 1),
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
