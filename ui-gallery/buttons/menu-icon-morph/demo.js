let nextMenuId = 0;

/** One state controls the glyph, accessible name, and small disclosure panel. */
export function createDemo(root, { signal, reducedMotion = false }) {
  const id = `menu-icon-morph-panel-${++nextMenuId}`;
  root.innerHTML = `<section class="menu-icon-morph" aria-label="メニューアイコンの開閉デモ"><div class="menu-icon-morph__top"><span>CONTROL STUDY / 04</span><span>Same place, next action</span></div><div class="menu-icon-morph__body"><div class="menu-icon-morph__copy"><h2>Open.<br>Explore.<br>Return.</h2><p>開く場所が、閉じる場所になる。<br>次の操作を迷わせない、小さな変化。</p></div><div class="menu-icon-morph__example"><div class="menu-icon-morph__toolbar"><span data-toggle-label>Menu</span><button class="menu-icon-morph__toggle" type="button" aria-expanded="false" aria-controls="${id}" aria-label="メニューを開く"><span class="menu-icon-morph__glyph" aria-hidden="true"><i></i><i></i></span></button></div><div class="menu-icon-morph__well"><p class="menu-icon-morph__placeholder">A little space<br>for the next step.</p><div id="${id}" class="menu-icon-morph__panel" hidden><p>CHOOSE A CHAPTER</p><button type="button">Overview <span aria-hidden="true">01</span></button><button type="button">Process <span aria-hidden="true">02</span></button><button type="button">Notes <span aria-hidden="true">03</span></button></div></div></div></div><div class="menu-icon-morph__bottom"><span>Click · Enter · Space · Escape</span><span role="status" aria-live="polite">メニューは閉じています</span></div></section>`;
  const lifecycle = new AbortController();
  const stage = root.querySelector(".menu-icon-morph");
  const button = root.querySelector(".menu-icon-morph__toggle");
  const panel = root.querySelector(".menu-icon-morph__panel");
  const placeholder = root.querySelector(".menu-icon-morph__placeholder");
  const label = root.querySelector("[data-toggle-label]");
  const status = root.querySelector('[role="status"]');
  let open = false;
  let timer = 0;
  let destroyed = false;
  const on = (target, event, handler) =>
    target.addEventListener(event, handler, { signal: lifecycle.signal });
  function stopPreview() {
    clearTimeout(timer);
    timer = 0;
  }
  function setOpen(value) {
    open = value;
    stage.classList.toggle("is-open", open);
    panel.hidden = !open;
    placeholder.hidden = open;
    button.setAttribute("aria-expanded", String(open));
    button.setAttribute(
      "aria-label",
      open ? "メニューを閉じる" : "メニューを開く",
    );
    label.textContent = open ? "Close" : "Menu";
    status.textContent = open
      ? "メニューを開きました。Escape でも閉じます"
      : "メニューは閉じています";
  }
  on(button, "click", () => {
    stopPreview();
    setOpen(!open);
  });
  on(stage, "keydown", (event) => {
    if (event.key === "Escape" && open) {
      event.preventDefault();
      stopPreview();
      setOpen(false);
      button.focus();
    }
  });
  [...panel.querySelectorAll("button")].forEach((item) =>
    on(item, "click", () => {
      stopPreview();
      setOpen(false);
      button.focus();
      status.textContent = `${item.firstChild.textContent.trim()} を選びました`;
    }),
  );
  function reset() {
    stopPreview();
    const focusInside = panel.contains(document.activeElement);
    setOpen(false);
    if (focusInside) button.focus();
  }
  function replay() {
    stopPreview();
    setOpen(true);
    timer = setTimeout(
      () => {
        if (panel.contains(document.activeElement)) return;
        setOpen(false);
      },
      reducedMotion ? 1000 : 1600,
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
