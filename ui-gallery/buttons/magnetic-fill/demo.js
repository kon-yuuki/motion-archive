/** Original study: fixed hit area, two spring layers, and a clipped color fill. */
export function createDemo(root, { signal, reducedMotion = false }) {
  root.innerHTML = `
    <section class="magnetic-fill" aria-label="引き寄せる円形ボタンのデモ">
      <div class="magnetic-fill__top"><span>01 / INTERACTION STUDY</span><span>FIXED HIT AREA · SOFT RESPONSE</span></div>
      <div class="magnetic-fill__body">
        <div class="magnetic-fill__copy"><p class="magnetic-fill__eyebrow">A small invitation</p><h2>Make the<br>next move.</h2><p>近づく。色が変わる。<br>小さな反応で、次の一歩を伝える。</p></div>
        <div class="magnetic-fill__field">
          <div class="magnetic-fill__orbit" aria-hidden="true"></div>
          <button class="magnetic-fill__target" type="button" aria-pressed="false" aria-label="アイデアを選択">
            <span class="magnetic-fill__orb"><span class="magnetic-fill__fill"></span><span class="magnetic-fill__label"><span data-label>Make a move</span><svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14" stroke="currentColor" stroke-width="1.5"/></svg></span></span>
          </button>
          <span class="magnetic-fill__hint">Hover, focus, or tap ↗︎</span>
        </div>
      </div>
      <div class="magnetic-fill__bottom"><span>Move gently. Stay easy to reach.</span><span class="magnetic-fill__status" role="status" aria-live="polite">まだ選択されていません</span></div>
    </section>`;

  const lifecycle = new AbortController();
  const stage = root.querySelector(".magnetic-fill");
  const button = root.querySelector("button");
  const orb = root.querySelector(".magnetic-fill__orb");
  const label = root.querySelector(".magnetic-fill__label");
  const text = root.querySelector("[data-label]");
  const status = root.querySelector('[role="status"]');
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
  const state = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    tx: 0,
    ty: 0,
    labelX: 0,
    labelY: 0,
  };
  let selected = false;
  let hovering = false;
  let focused = false;
  let previewing = false;
  let frame = 0;
  let timer = 0;
  let lastTime = 0;
  let destroyed = false;
  const on = (target, event, handler) =>
    target.addEventListener(event, handler, { signal: lifecycle.signal });
  const clamp = (value, max) => Math.max(-max, Math.min(max, value));

  function render() {
    orb.style.transform = `translate3d(${state.x}px, ${state.y}px, 0)`;
    label.style.transform = `translate3d(${state.labelX}px, ${state.labelY}px, 0)`;
  }

  function tick(time) {
    const dt = Math.min((time - (lastTime || time - 16)) / 1000, 0.032);
    lastTime = time;
    // Damped spring: a little give on the return, no perpetual loop when still.
    state.vx += ((state.tx - state.x) * 240 - state.vx * 21) * dt;
    state.vy += ((state.ty - state.y) * 240 - state.vy * 21) * dt;
    state.x += state.vx * dt;
    state.y += state.vy * dt;
    const blend = 1 - Math.exp(-12 * dt);
    state.labelX += (state.tx * 0.58 - state.labelX) * blend;
    state.labelY += (state.ty * 0.58 - state.labelY) * blend;
    render();
    const unsettled =
      Math.abs(state.tx - state.x) +
      Math.abs(state.ty - state.y) +
      Math.abs(state.vx) +
      Math.abs(state.vy) +
      Math.abs(state.tx * 0.58 - state.labelX) +
      Math.abs(state.ty * 0.58 - state.labelY);
    if (unsettled > 0.025 && !destroyed) frame = requestAnimationFrame(tick);
    else {
      frame = 0;
      lastTime = 0;
    }
  }

  function move(x = 0, y = 0) {
    state.tx = reducedMotion ? 0 : x;
    state.ty = reducedMotion ? 0 : y;
    if (!reducedMotion && !frame && !destroyed)
      frame = requestAnimationFrame(tick);
  }

  function updateAppearance() {
    stage.classList.toggle(
      "is-active",
      hovering || focused || selected || previewing,
    );
    button.setAttribute("aria-pressed", String(selected));
    button.setAttribute(
      "aria-label",
      selected ? "アイデアの選択を解除" : "アイデアを選択",
    );
    text.textContent = selected ? "Selected" : "Make a move";
  }

  function stopPreview() {
    clearTimeout(timer);
    timer = 0;
    previewing = false;
  }

  on(button, "pointerenter", (event) => {
    if (!finePointer.matches || event.pointerType === "touch") return;
    stopPreview();
    hovering = true;
    updateAppearance();
  });
  on(button, "pointermove", (event) => {
    if (!finePointer.matches || event.pointerType === "touch" || reducedMotion)
      return;
    const bounds = button.getBoundingClientRect();
    move(
      clamp((event.clientX - bounds.left - bounds.width / 2) * 0.24, 24),
      clamp((event.clientY - bounds.top - bounds.height / 2) * 0.24, 24),
    );
  });
  on(button, "pointerleave", () => {
    hovering = false;
    move();
    updateAppearance();
  });
  on(button, "pointercancel", () => {
    hovering = false;
    move();
    updateAppearance();
  });
  on(button, "focus", () => {
    stopPreview();
    focused = true;
    updateAppearance();
  });
  on(button, "blur", () => {
    focused = false;
    move();
    updateAppearance();
  });
  on(button, "click", () => {
    stopPreview();
    selected = !selected;
    updateAppearance();
    status.textContent = selected
      ? "選択しました。もう一度押すと解除します"
      : "選択を解除しました";
  });
  on(finePointer, "change", () => {
    hovering = false;
    move();
    updateAppearance();
  });

  function reset() {
    stopPreview();
    cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
    Object.keys(state).forEach((key) => {
      state[key] = 0;
    });
    selected = false;
    hovering = false;
    focused = document.activeElement === button;
    render();
    updateAppearance();
    status.textContent = "まだ選択されていません";
  }

  function replay() {
    reset();
    previewing = true;
    updateAppearance();
    move(21, -14);
    status.textContent = "引き寄せと色の変化をプレビューしています";
    timer = window.setTimeout(
      () => {
        previewing = false;
        updateAppearance();
        move();
        status.textContent = "ボタンに触れて、動きを確かめてください";
      },
      reducedMotion ? 700 : 1100,
    );
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    clearTimeout(timer);
    cancelAnimationFrame(frame);
    lifecycle.abort();
    signal?.removeEventListener("abort", destroy);
  }
  signal?.addEventListener("abort", destroy, { once: true });
  if (signal?.aborted) destroy();
  return { replay, reset, destroy };
}
