/** Visual flourish and actual selection are separate states. */
export function createDemo(root, { signal, reducedMotion = false }) {
  const spark =
    '<svg viewBox="0 0 32 32" width="30" height="30" fill="none"><path d="m16 1 4 10 11 5-11 4-4 11-5-11-10-4 10-5Z" fill="currentColor"/><circle cx="16" cy="16" r="3" fill="#f8e8a2"/></svg>';
  root.innerHTML = `<section class="icon-sequence" aria-label="図形の順序で応えるボタンのデモ"><div class="icon-sequence__top"><span>BUTTON STUDY / 05</span><span>A brief interlude</span></div><div class="icon-sequence__body"><div class="icon-sequence__copy"><h2>A little<br>spark.</h2><p>一瞬の合図で、<br>次へ進む気持ちをつくる。</p></div><div class="icon-sequence__field"><button type="button" aria-label="アイデアを選択" aria-pressed="false" class="icon-sequence__button"><span class="icon-sequence__first" aria-hidden="true">Explore an idea</span><span class="icon-sequence__sparks" aria-hidden="true">${[0, 1, 2, 3].map((i) => `<span style="--delay:${130 + i * 105}ms">${spark}</span>`).join("")}</span><span class="icon-sequence__last" aria-hidden="true">Take a look</span></button><span>Hover · Focus · Tap</span></div></div><div class="icon-sequence__bottom"><span>Four sparks. One short response.</span><span role="status" aria-live="polite">まだ選択されていません</span></div></section>`;
  const lifecycle = new AbortController();
  const stage = root.querySelector(".icon-sequence");
  const button = root.querySelector("button");
  const status = root.querySelector('[role="status"]');
  let timer = 0;
  let selected = false;
  let hovered = false;
  let focused = false;
  let destroyed = false;
  const on = (target, type, handler) =>
    target.addEventListener(type, handler, { signal: lifecycle.signal });
  function stop() {
    clearTimeout(timer);
    timer = 0;
    stage.classList.remove("is-playing");
    stage
      .getAnimations({ subtree: true })
      .forEach((animation) => animation.cancel());
  }
  function play() {
    stop();
    if (destroyed) return;
    stage.classList.remove("is-settled");
    if (reducedMotion) {
      stage.classList.add("is-settled");
      return;
    }
    void button.offsetWidth;
    stage.classList.add("is-playing");
    timer = setTimeout(() => {
      stage.classList.remove("is-playing");
      stage.classList.add("is-settled");
      timer = 0;
    }, 850);
  }
  function rest() {
    if (hovered || focused || selected) return;
    stop();
    stage.classList.remove("is-settled");
  }
  on(button, "pointerenter", (event) => {
    if (event.pointerType === "touch") return;
    hovered = true;
    play();
  });
  on(button, "pointerleave", () => {
    hovered = false;
    rest();
  });
  on(button, "pointercancel", () => {
    hovered = false;
    rest();
  });
  on(button, "focus", () => {
    focused = true;
    if (!hovered) play();
  });
  on(button, "blur", () => {
    focused = false;
    rest();
  });
  on(button, "click", () => {
    selected = !selected;
    button.setAttribute("aria-pressed", String(selected));
    status.textContent = selected
      ? "アイデアを選択しました"
      : "選択を解除しました";
    if (
      selected &&
      !stage.classList.contains("is-playing") &&
      !stage.classList.contains("is-settled")
    )
      play();
    else rest();
  });
  function reset() {
    stop();
    selected = false;
    hovered = false;
    focused = false;
    stage.classList.remove("is-settled");
    button.setAttribute("aria-pressed", "false");
    status.textContent = "まだ選択されていません";
  }
  function replay() {
    reset();
    play();
  }
  function destroy() {
    if (destroyed) return;
    destroyed = true;
    stop();
    lifecycle.abort();
    signal?.removeEventListener("abort", destroy);
  }
  signal?.addEventListener("abort", destroy, { once: true });
  if (signal?.aborted) destroy();
  return { replay, reset, destroy };
}
