/** REJOUICE header CTA, measured on 2026-10-02.
 * Only Replay/Reset and the gallery's input fallbacks need JavaScript.
 * Desktop entry/exit use CSS transitions, including interrupted reversals.
 */
export function createDemo(root, { signal, reducedMotion = false } = {}) {
  root.innerHTML = `
    <section class="arrow-swap" aria-label="REJOUICE の Let's talk リンクの再現">
      <a class="arrow-swap__link" href="https://www.rejouice.com/contact" target="_blank" rel="noopener noreferrer" aria-label="Let's talk — 参照サイトを新しいタブで開く">
        <span class="arrow-swap__left" aria-hidden="true">↗</span>
        <span class="arrow-swap__label">Let's talk</span>
        <span class="arrow-swap__right" aria-hidden="true">↗</span>
      </a>
    </section>`;

  const stage = root.querySelector(".arrow-swap");
  const link = root.querySelector(".arrow-swap__link");
  const label = root.querySelector(".arrow-swap__label");
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
  const lifecycle = new AbortController();
  let hovered = false;
  let preview = false;
  let timer = 0;
  let frame = 0;
  let destroyed = false;
  const on = (element, type, handler) =>
    element.addEventListener(type, handler, { signal: lifecycle.signal });

  // The default parameter also makes isolated component tests respect the setting.
  stage.dataset.reducedMotion = String(reducedMotion);
  function render() {
    stage.classList.toggle("is-active", hovered || preview);
  }
  function stopPreview() {
    clearTimeout(timer);
    cancelAnimationFrame(frame);
    timer = frame = 0;
    preview = false;
  }
  function snapToRest() {
    stage.dataset.snap = "true";
    hovered = false;
    preview = false;
    render();
    // Commit rest before re-enabling transitions; Replay always begins here.
    void getComputedStyle(label).transform;
    delete stage.dataset.snap;
  }
  on(link, "pointerenter", (event) => {
    if (event.pointerType === "touch" || !finePointer.matches) return;
    stopPreview();
    hovered = true;
    render();
  });
  const leave = () => {
    hovered = false;
    render();
  };
  on(link, "pointerleave", leave);
  on(link, "pointercancel", () => {
    stopPreview();
    leave();
  });
  on(finePointer, "change", () => {
    stopPreview();
    snapToRest();
  });
  // The link keeps ordinary navigation semantics: no click cancellation or toggle.
  // Focus and touch presentation are separate, static CSS gallery fallbacks.
  function reset() {
    if (destroyed) return;
    stopPreview();
    snapToRest();
  }
  function replay() {
    if (destroyed) return;
    reset();
    frame = requestAnimationFrame(() => {
      frame = 0;
      preview = true;
      render();
      timer = window.setTimeout(() => {
        timer = 0;
        preview = false;
        render();
      }, 1100);
    });
  }
  function destroy() {
    if (destroyed) return;
    destroyed = true;
    stopPreview();
    lifecycle.abort();
    stage.getAnimations({ subtree: true }).forEach((animation) => animation.cancel());
    signal?.removeEventListener("abort", destroy);
  }
  signal?.addEventListener("abort", destroy, { once: true });
  if (signal?.aborted) destroy();
  return { replay, reset, destroy };
}
