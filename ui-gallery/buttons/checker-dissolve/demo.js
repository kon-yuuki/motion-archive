/** Deterministic cell stagger: the content and hit target stay stationary. */
export function createDemo(root, { signal, reducedMotion = false }) {
  const columns = 44;
  const rows = 10;
  const cells = Array.from({ length: columns * rows }, (_, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const delay = Math.round(column * 8.1 + ((row + column) % 2) * 68);
    return `<span style="--cell-delay:${delay}ms"></span>`;
  }).join("");
  root.innerHTML = `<section class="checker-dissolve" aria-label="格子で色を変えるボタンのデモ"><div class="checker-dissolve__top"><span>BUTTON STUDY / 03</span><span>From an observed recording</span></div><div class="checker-dissolve__body"><div class="checker-dissolve__copy"><p>Small pieces.<br>One clear move.</p><span>ひとつずつ切り替えて、<br>ひとつの反応にする。</span></div><div class="checker-dissolve__field"><div class="checker-dissolve__rings" aria-hidden="true"></div><button type="button" class="checker-dissolve__button" aria-pressed="false"><span class="checker-dissolve__cells" aria-hidden="true">${cells}</span><span class="checker-dissolve__label"><span data-label>Explore the idea</span><span aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14" stroke="currentColor" stroke-width="1.5"/></svg></span></span></button><p>Hover · Focus · Tap</p></div></div><div class="checker-dissolve__bottom"><span>Fixed shape. Changing surface.</span><span role="status" aria-live="polite">まだ選択されていません</span></div></section>`;
  const lifecycle = new AbortController();
  const stage = root.querySelector(".checker-dissolve");
  const button = root.querySelector("button");
  const label = root.querySelector("[data-label]");
  const status = root.querySelector('[role="status"]');
  let selected = false;
  let hovered = false;
  let focused = false;
  let preview = false;
  let timer = 0;
  let destroyed = false;
  const on = (target, type, handler) =>
    target.addEventListener(type, handler, { signal: lifecycle.signal });
  function render() {
    stage.classList.toggle(
      "is-active",
      selected || hovered || focused || preview,
    );
    button.setAttribute("aria-pressed", String(selected));
    label.textContent = selected ? "Idea selected" : "Explore the idea";
  }
  function stopPreview() {
    clearTimeout(timer);
    timer = 0;
    preview = false;
  }
  on(button, "pointerenter", (event) => {
    if (event.pointerType === "touch") return;
    stopPreview();
    hovered = true;
    render();
  });
  on(button, "pointerleave", () => {
    hovered = false;
    render();
  });
  on(button, "pointercancel", () => {
    hovered = false;
    render();
  });
  on(button, "focus", () => {
    stopPreview();
    focused = true;
    render();
  });
  on(button, "blur", () => {
    focused = false;
    render();
  });
  on(button, "click", () => {
    stopPreview();
    selected = !selected;
    render();
    status.textContent = selected
      ? "選択しました。もう一度押すと解除します"
      : "選択を解除しました";
  });
  function reset() {
    stopPreview();
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
    status.textContent = "格子の切り替えをプレビューしています";
    timer = setTimeout(
      () => {
        preview = false;
        render();
        status.textContent = "ボタンに触れて確かめてください";
      },
      reducedMotion ? 700 : 1100,
    );
  }
  function destroy() {
    if (destroyed) return;
    destroyed = true;
    stopPreview();
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
