/** A label-sized rule inside a generously sized, stationary button. */
export function createDemo(root, { signal, reducedMotion = false }) {
  const items = ["Gather", "Shape", "Share"];
  root.innerHTML = `<section class="directional-underline" aria-label="下線で選択先を伝えるデモ">
    <div class="directional-underline__top"><span>LINK STUDY / 02</span><span>A quieter response</span></div>
    <div class="directional-underline__body"><div class="directional-underline__copy"><p>Small signals.<br>Clear choices.</p><span>文字はそのまま。<br>今いる場所を、線で知らせる。</span></div>
    <div class="directional-underline__list" aria-label="制作の段階を選ぶ">${items.map((label, index) => `<button type="button" class="directional-underline__item" aria-pressed="false" data-index="${index}"><span class="directional-underline__number">0${index + 1}</span><span class="directional-underline__label">${label}</span><span class="directional-underline__arrow" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14" stroke="currentColor" stroke-width="1.5"/></svg></span></button>`).join("")}</div></div>
    <div class="directional-underline__bottom"><span>Hover · Tab · Tap</span><span role="status" aria-live="polite">項目を選んでください</span></div>
  </section>`;
  const lifecycle = new AbortController();
  const buttons = [...root.querySelectorAll("button")];
  const status = root.querySelector('[role="status"]');
  let selected = -1;
  let hovered = -1;
  let focused = -1;
  let preview = -1;
  let timers = [];
  let destroyed = false;
  const on = (target, type, handler) =>
    target.addEventListener(type, handler, { signal: lifecycle.signal });
  function render() {
    buttons.forEach((button, index) => {
      button.classList.toggle(
        "is-active",
        index === hovered ||
          index === focused ||
          index === selected ||
          index === preview,
      );
      button.setAttribute("aria-pressed", String(index === selected));
    });
  }
  function stopPreview() {
    timers.forEach(clearTimeout);
    timers = [];
    preview = -1;
  }
  buttons.forEach((button, index) => {
    on(button, "pointerenter", (event) => {
      if (event.pointerType === "touch") return;
      stopPreview();
      hovered = index;
      render();
    });
    on(button, "pointerleave", () => {
      hovered = -1;
      render();
    });
    on(button, "pointercancel", () => {
      hovered = -1;
      render();
    });
    on(button, "focus", () => {
      stopPreview();
      focused = index;
      render();
    });
    on(button, "blur", () => {
      focused = -1;
      render();
    });
    on(button, "click", () => {
      stopPreview();
      selected = index;
      render();
      status.textContent = `${items[index]} を選びました`;
    });
  });
  function reset() {
    stopPreview();
    selected = -1;
    hovered = -1;
    focused = buttons.indexOf(document.activeElement);
    render();
    status.textContent = "項目を選んでください";
  }
  function replay() {
    reset();
    preview = 0;
    render();
    status.textContent = "線が項目間を移る様子をプレビューしています";
    [1, 2, -1].forEach((index, step) =>
      timers.push(
        setTimeout(
          () => {
            preview = index;
            render();
            if (index < 0)
              status.textContent = "ホバー・Tab・タップで確かめてください";
          },
          (step + 1) * (reducedMotion ? 500 : 800),
        ),
      ),
    );
  }
  function destroy() {
    if (destroyed) return;
    destroyed = true;
    stopPreview();
    lifecycle.abort();
    buttons.forEach((button) =>
      button
        .getAnimations({ subtree: true })
        .forEach((animation) => animation.cancel()),
    );
    signal?.removeEventListener("abort", destroy);
  }
  signal?.addEventListener("abort", destroy, { once: true });
  if (signal?.aborted) destroy();
  return { replay, reset, destroy };
}
