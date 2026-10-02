/** Two decorative arrows exchange sides while one readable label stays intact. */
export function createDemo(root, { signal, reducedMotion = false }) {
  const arrow =
    '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14" stroke="currentColor" stroke-width="1.5"/></svg>';
  root.innerHTML = `<section class="arrow-swap" aria-label="矢印を入れ替えるボタンのデモ"><div class="arrow-swap__top"><span>LINK STUDY / 06</span><span>A nudge in the right direction</span></div><div class="arrow-swap__body"><div class="arrow-swap__copy"><h2>The next<br>conversation.</h2><p>言葉の前に、小さな矢印を。<br>位置の変化で、先へ誘う。</p></div><div class="arrow-swap__field"><button type="button" class="arrow-swap__button" aria-pressed="false"><span class="arrow-swap__left" aria-hidden="true">${arrow}</span><span class="arrow-swap__label">Start a conversation</span><span class="arrow-swap__right" aria-hidden="true">${arrow}</span></button><span>Hover · Focus · Tap</span></div></div><div class="arrow-swap__bottom"><span>One label. Two positions.</span><span role="status" aria-live="polite">まだ選択されていません</span></div></section>`;
  const lifecycle = new AbortController(),
    stage = root.querySelector(".arrow-swap"),
    button = root.querySelector("button"),
    status = root.querySelector('[role="status"]');
  let selected = false,
    hovered = false,
    focused = false,
    preview = false,
    timer = 0,
    destroyed = false;
  const on = (type, handler) =>
    button.addEventListener(type, handler, { signal: lifecycle.signal });
  function render() {
    stage.classList.toggle(
      "is-active",
      selected || hovered || focused || preview,
    );
    button.setAttribute("aria-pressed", String(selected));
  }
  function stop() {
    clearTimeout(timer);
    timer = 0;
    preview = false;
  }
  on("pointerenter", (event) => {
    if (event.pointerType === "touch") return;
    stop();
    hovered = true;
    render();
  });
  on("pointerleave", () => {
    hovered = false;
    render();
  });
  on("pointercancel", () => {
    hovered = false;
    render();
  });
  on("focus", () => {
    stop();
    focused = true;
    render();
  });
  on("blur", () => {
    focused = false;
    render();
  });
  on("click", () => {
    stop();
    selected = !selected;
    render();
    status.textContent = selected
      ? "会話のきっかけを選択しました"
      : "選択を解除しました";
  });
  function reset() {
    stop();
    selected = false;
    hovered = false;
    focused = document.activeElement === button;
    render();
    status.textContent = "まだ選択されていません";
  }
  function replay() {
    reset();
    preview = true;
    render();
    timer = setTimeout(
      () => {
        preview = false;
        render();
      },
      reducedMotion ? 600 : 1100,
    );
  }
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
  if (signal?.aborted) destroy();
  return { replay, reset, destroy };
}
