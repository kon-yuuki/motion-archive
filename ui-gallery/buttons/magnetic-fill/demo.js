import { gsap } from "gsap";

/** Dennis About me: measured geometry + observed motion, independently implemented.
 * The 600ms/1500ms curves are fitted to live transform samples, not claimed source code.
 */
export function createDemo(root, { signal, reducedMotion = false }) {
  root.innerHTML = `
    <section class="magnetic-fill" aria-label="Dennis Snellenberg の About me ボタンの再現">
      <div class="magnetic-fill__position">
        <a class="magnetic-fill__target" href="https://dennissnellenberg.com/about" target="_blank" rel="noopener noreferrer" aria-label="About me — 参照サイトを新しいタブで開く">
          <span class="magnetic-fill__fill" aria-hidden="true"></span>
          <span class="magnetic-fill__label"><span>About me</span></span>
        </a>
      </div>
    </section>`;

  const field = root.querySelector(".magnetic-fill");
  const target = root.querySelector(".magnetic-fill__target");
  const label = root.querySelector(".magnetic-fill__label");
  const fill = root.querySelector(".magnetic-fill__fill");
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
  const desktop = matchMedia("(min-width: 541px)");
  let hovering = false;
  let focused = false;
  let preview = false;
  let previewTimer = 0;
  let destroyed = false;
  const lifecycle = new AbortController();
  const on = (element, type, callback) =>
    element.addEventListener(type, callback, { signal: lifecycle.signal });
  const magneticEnabled = () => !reducedMotion && finePointer.matches && desktop.matches;
  const paint = (element, values) => gsap.set(element, values);
  const tween = (element, values) => gsap.to(element, { overwrite: true, ...values });

  function appearance(active, immediate = false) {
    field.dataset.state = active ? "active" : "rest";
    if (reducedMotion || immediate) {
      gsap.killTweensOf(fill);
      paint(fill, { yPercent: active ? 0 : -76 });
      return;
    }
    if (active) {
      // A new blue ellipse enters from below. Leaving sends it out above.
      gsap.killTweensOf(fill);
      paint(fill, { yPercent: 76 });
      tween(fill, { yPercent: 0, duration: 0.6, ease: "power2.inOut" });
    } else {
      tween(fill, { yPercent: -76, duration: 0.6, ease: "power2.inOut" });
    }
  }

  function follow(clientX, clientY) {
    if (!magneticEnabled()) return;
    // The observed source moves the actual link, and measures its current bounds.
    const bounds = target.getBoundingClientRect();
    const x = (clientX - bounds.left) / target.offsetWidth - 0.5;
    const y = (clientY - bounds.top) / target.offsetHeight - 0.5;
    tween(target, { x: x * 100, y: y * 100, duration: 1.5, ease: "power4.out" });
    // Nested label: +50 strength on top of the circle's +100 strength.
    tween(label, { x: x * 50, y: y * 50, duration: 1.5, ease: "power4.out" });
  }

  function returnHome(immediate = false) {
    for (const element of [target, label]) {
      if (reducedMotion || immediate) {
        gsap.killTweensOf(element);
        paint(element, { x: 0, y: 0 });
      } else tween(element, { x: 0, y: 0, duration: 1.5, ease: "elastic.out(1, 0.3)" });
    }
  }

  function cancelPreview() {
    clearTimeout(previewTimer);
    previewTimer = 0;
    preview = false;
  }

  on(target, "pointerenter", (event) => {
    if (event.pointerType === "touch" || !finePointer.matches) return;
    cancelPreview();
    hovering = true;
    appearance(true);
  });
  on(target, "pointermove", (event) => {
    if (event.pointerType !== "touch") follow(event.clientX, event.clientY);
  });
  const leave = () => {
    hovering = false;
    returnHome();
    appearance(focused || preview);
  };
  on(target, "pointerleave", leave);
  on(target, "pointercancel", leave);
  // Clearly documented gallery fallbacks; not presented as observed source motion.
  on(target, "focus", () => {
    focused = target.matches(":focus-visible");
    if (focused) appearance(true, true);
  });
  on(target, "blur", () => {
    focused = false;
    if (!hovering) appearance(false);
  });
  on(target, "pointerdown", (event) => {
    if (event.pointerType === "touch") appearance(true, true);
  });
  on(target, "pointerup", (event) => {
    if (event.pointerType === "touch") appearance(false, true);
  });
  const resetForDevice = () => {
    cancelPreview();
    hovering = false;
    returnHome(true);
    appearance(focused, true);
  };
  on(finePointer, "change", resetForDevice);
  on(desktop, "change", resetForDevice);

  function reset() {
    cancelPreview();
    hovering = false;
    focused = target.matches(":focus-visible");
    returnHome(true);
    appearance(focused, true);
  }

  function replay() {
    reset();
    preview = true;
    appearance(true);
    if (magneticEnabled()) {
      const bounds = target.getBoundingClientRect();
      follow(bounds.left + bounds.width / 2 + 42, bounds.top + bounds.height / 2 - 38);
    }
    previewTimer = window.setTimeout(() => {
      preview = false;
      appearance(false);
      returnHome();
    }, 1600);
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    cancelPreview();
    gsap.killTweensOf([target, label, fill]);
    lifecycle.abort();
    signal?.removeEventListener("abort", destroy);
  }
  paint(fill, { y: 0, yPercent: -76 });
  signal?.addEventListener("abort", destroy, { once: true });
  if (signal?.aborted) destroy();
  return { replay, reset, destroy };
}
