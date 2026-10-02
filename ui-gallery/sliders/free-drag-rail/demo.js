import { makeArt, listen } from "../../_motion/demo-helpers.js";

/** Pointer drag sits on top of a native, keyboard-scrollable rail. */
export function createDemo(root, { signal, reducedMotion }) {
  const cards = [
    ["01", "A different perspective", "Portraits", 0, "tall"],
    ["02", "24", "Ways to explore", 1, "square"],
    ["03", "Keep moving.", "New directions", 2, "tall"],
    ["04", "Made for people", "Everyday objects", 3, "square"],
    ["05", "Find your rhythm", "Motion practice", 4, "tall"],
  ];
  root.innerHTML = `<section class="free-drag-rail"><header><div><p>AT A GLANCE</p><h2>A little room<br>to explore.</h2></div><p>ドラッグして、横へ。<br>矢印・キーボードでも進めます。</p></header><div class="free-drag-rail__viewport" tabindex="0" role="region" aria-roledescription="カルーセル" aria-label="5枚のスタディカード"><div class="free-drag-rail__track">${cards.map(([number, title, caption, art, shape], index) => `<article class="free-drag-rail__card free-drag-rail__card--${shape}" aria-label="${index + 1} / 5"><div class="free-drag-rail__art">${makeArt(art, title)}</div><div class="free-drag-rail__caption"><span>${number} / ${caption}</span><h3>${title}</h3></div></article>`).join("")}</div></div><footer><span>DRAG TO DISCOVER <span aria-hidden="true">⟷</span></span><div class="free-drag-rail__nav"><button type="button" data-previous aria-label="前のカード">←</button><span data-position role="status" aria-live="polite">Center 1 / 5</span><button type="button" data-next aria-label="次のカード">→</button></div></footer></section>`;
  const viewport = root.querySelector(".free-drag-rail__viewport");
  const items = [...root.querySelectorAll(".free-drag-rail__card")];
  const previous = root.querySelector("[data-previous]");
  const next = root.querySelector("[data-next]");
  const position = root.querySelector("[data-position]");
  let pointer = null,
    initialX = 0,
    initialY = 0,
    previousX = 0,
    previousTime = 0,
    velocity = 0,
    startScroll = 0,
    dragging = false;
  let frame = 0,
    scrollTimer = 0;
  const maxScroll = () =>
    Math.max(0, viewport.scrollWidth - viewport.clientWidth);
  const clamp = (value) => Math.min(maxScroll(), Math.max(0, value));
  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    velocity = 0;
  }
  function update() {
    const center = viewport.scrollLeft + viewport.clientWidth / 2;
    const closest = items.reduce(
      (best, item, index) =>
        Math.abs(item.offsetLeft + item.offsetWidth / 2 - center) <
        Math.abs(items[best].offsetLeft + items[best].offsetWidth / 2 - center)
          ? index
          : best,
      0,
    );
    items.forEach((item, index) =>
      item.classList.toggle("is-current", index === closest),
    );
    position.textContent = `Center ${closest + 1} / ${items.length}`;
    root.dataset.position = String(closest);
    previous.disabled = viewport.scrollLeft <= 2;
    next.disabled = viewport.scrollLeft >= maxScroll() - 2;
  }
  function moveBy(direction) {
    stop();
    const step = items[0].offsetWidth + 24;
    viewport.scrollTo({
      left: clamp(viewport.scrollLeft + direction * step),
      behavior: reducedMotion ? "instant" : "smooth",
    });
  }
  function coast(time) {
    if (!frame) return;
    const elapsed = Math.min(time - previousTime, 32);
    previousTime = time;
    velocity *= Math.pow(0.91, elapsed / 16.67);
    const target = clamp(viewport.scrollLeft - velocity * elapsed);
    viewport.scrollLeft = target;
    if (Math.abs(velocity) > 0.025 && target > 0 && target < maxScroll())
      frame = requestAnimationFrame(coast);
    else {
      frame = 0;
      update();
    }
  }
  listen(
    viewport,
    "pointerdown",
    (event) => {
      if (event.button !== 0) return;
      stop();
      pointer = event.pointerId;
      initialX = previousX = event.clientX;
      initialY = event.clientY;
      startScroll = viewport.scrollLeft;
      previousTime = performance.now();
      dragging = false;
    },
    signal,
  );
  listen(
    viewport,
    "pointermove",
    (event) => {
      if (pointer !== event.pointerId) return;
      const dx = event.clientX - initialX,
        dy = event.clientY - initialY;
      if (!dragging && Math.abs(dy) > Math.abs(dx) + 8) {
        pointer = null;
        return;
      }
      if (!dragging && Math.abs(dx) > 6) {
        dragging = true;
        viewport.setPointerCapture(pointer);
        viewport.classList.add("is-dragging");
      }
      if (!dragging) return;
      event.preventDefault();
      const now = performance.now(),
        dt = Math.max(now - previousTime, 1);
      velocity = 0.5 * velocity + (0.5 * (event.clientX - previousX)) / dt;
      previousX = event.clientX;
      previousTime = now;
      viewport.scrollLeft = clamp(startScroll - dx);
    },
    signal,
  );
  function release(event) {
    if (pointer !== event.pointerId) return;
    if (viewport.hasPointerCapture(pointer))
      viewport.releasePointerCapture(pointer);
    pointer = null;
    viewport.classList.remove("is-dragging");
    if (dragging && !reducedMotion && Math.abs(velocity) > 0.025) {
      previousTime = performance.now();
      frame = requestAnimationFrame(coast);
    }
    dragging = false;
    update();
  }
  listen(viewport, "pointerup", release, signal);
  listen(
    viewport,
    "pointercancel",
    () => {
      pointer = null;
      dragging = false;
      viewport.classList.remove("is-dragging");
      stop();
    },
    signal,
  );
  listen(
    viewport,
    "lostpointercapture",
    () => {
      pointer = null;
      dragging = false;
      viewport.classList.remove("is-dragging");
    },
    signal,
  );
  listen(
    viewport,
    "scroll",
    () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(update, 90);
    },
    signal,
    { passive: true },
  );
  listen(viewport, "wheel", stop, signal, { passive: true });
  listen(
    viewport,
    "keydown",
    (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
        return;
      event.preventDefault();
      if (event.key === "ArrowLeft" || event.key === "ArrowRight")
        moveBy(event.key === "ArrowRight" ? 1 : -1);
      else {
        stop();
        viewport.scrollTo({
          left: event.key === "Home" ? 0 : maxScroll(),
          behavior: reducedMotion ? "instant" : "smooth",
        });
      }
    },
    signal,
  );
  listen(previous, "click", () => moveBy(-1), signal);
  listen(next, "click", () => moveBy(1), signal);
  const resize = new ResizeObserver(update);
  resize.observe(viewport);
  function reset() {
    stop();
    viewport.scrollTo({ left: 0, behavior: "instant" });
    update();
  }
  function replay() {
    reset();
    moveBy(1);
  }
  function destroy() {
    stop();
    clearTimeout(scrollTimer);
    resize.disconnect();
  }
  signal.addEventListener("abort", destroy, { once: true });
  update();
  return { replay, reset, destroy };
}
