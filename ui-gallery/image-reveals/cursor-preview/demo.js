import { makeArt } from "../../_motion/demo-helpers.js";

/** Original artwork and labels; the reference supplies the observed motion idea. */
export function createDemo(root, { signal, reducedMotion = false }) {
  const items = [
    {
      title: "Open terrain",
      type: "Landscape / 01",
      description: "山の重なりと、淡い緑の太陽",
      art: 0,
    },
    {
      title: "Soft structure",
      type: "Architecture / 02",
      description: "暖かな色で重なる、三つのアーチ",
      art: 1,
    },
    {
      title: "Everyday orbit",
      type: "Objects / 03",
      description: "青い台座と、積み重なる丸いかたち",
      art: 2,
    },
  ];
  root.innerHTML = `
    <section class="cursor-preview" aria-label="画像プレビュー付きの作品一覧">
      <div class="cursor-preview__heading"><span>SELECTED STUDIES</span><p>First the name.<br>Then the feeling.</p></div>
      <div class="cursor-preview__list" aria-label="プレビューする作品">
        ${items.map((item, index) => `<button type="button" class="cursor-preview__row" data-index="${index}" aria-pressed="false" aria-label="${item.title} のプレビューを表示"><span class="cursor-preview__number">0${index + 1}</span><span class="cursor-preview__title">${item.title}</span><span class="cursor-preview__type">${item.type}</span><span class="cursor-preview__arrow" aria-hidden="true">↗︎</span></button>`).join("")}
      </div>
      <div class="cursor-preview__floating" aria-hidden="true">
        <div class="cursor-preview__card"><div class="cursor-preview__track">${items.map((item, index) => `<div class="cursor-preview__slide cursor-preview__slide--${index}">${makeArt(item.art, item.description)}<span>${item.title}</span></div>`).join("")}</div><span class="cursor-preview__view">View<br><span>↗︎</span></span></div>
      </div>
      <div class="cursor-preview__footer"><span>Hover to explore · Tap to keep</span><span role="status" aria-live="polite">作品を選ぶと画像が表示されます</span></div>
    </section>`;

  const lifecycle = new AbortController();
  const stage = root.querySelector(".cursor-preview");
  const list = root.querySelector(".cursor-preview__list");
  const rows = [...root.querySelectorAll(".cursor-preview__row")];
  const floating = root.querySelector(".cursor-preview__floating");
  const track = root.querySelector(".cursor-preview__track");
  const status = root.querySelector('[role="status"]');
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
  let active = 0;
  let selected = -1;
  let compact = false;
  let visible = false;
  let pointerInside = false;
  let destroyed = false;
  let frame = 0;
  let lastTime = 0;
  let timers = [];
  const position = { x: 0, y: 0, targetX: 0, targetY: 0 };
  const on = (element, type, handler) =>
    element.addEventListener(type, handler, { signal: lifecycle.signal });
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const stopReplay = () => {
    timers.forEach(clearTimeout);
    timers = [];
  };

  function draw() {
    floating.style.transform = compact
      ? "none"
      : `translate3d(${position.x}px, ${position.y}px, 0)`;
  }

  function tick(time) {
    const dt = Math.min((time - (lastTime || time - 16)) / 1000, 0.05);
    lastTime = time;
    const blend = 1 - Math.exp(-14 * dt);
    position.x += (position.targetX - position.x) * blend;
    position.y += (position.targetY - position.y) * blend;
    draw();
    if (
      Math.abs(position.targetX - position.x) +
        Math.abs(position.targetY - position.y) >
        0.05 &&
      !destroyed
    )
      frame = requestAnimationFrame(tick);
    else {
      frame = 0;
      lastTime = 0;
    }
  }

  function locate(event, snap = false) {
    if (compact) {
      draw();
      return;
    }
    const bounds = stage.getBoundingClientRect();
    const size = floating.offsetWidth;
    const pointer = event && event.pointerType !== "touch" && !reducedMotion;
    position.targetX = clamp(
      pointer
        ? event.clientX - bounds.left - size / 2
        : bounds.width * 0.66 - size / 2,
      18,
      bounds.width - size - 18,
    );
    position.targetY = clamp(
      pointer
        ? event.clientY - bounds.top - size / 2
        : bounds.height * 0.51 - size / 2,
      24,
      bounds.height - size - 32,
    );
    if (snap || reducedMotion) {
      cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;
      position.x = position.targetX;
      position.y = position.targetY;
      draw();
    } else if (!frame && !destroyed) frame = requestAnimationFrame(tick);
  }

  function show(index, event, announce = false) {
    active = index;
    track.style.transform = `translateY(-${index * (100 / items.length)}%)`;
    rows.forEach((row, rowIndex) => {
      row.classList.toggle("is-active", rowIndex === index);
      row.setAttribute("aria-pressed", String(rowIndex === selected));
    });
    locate(event, !visible || !event);
    visible = true;
    stage.classList.add("is-visible");
    if (announce)
      status.textContent = `${items[index].title}：${items[index].description}`;
  }

  function hide() {
    if (compact || selected >= 0 || list.contains(document.activeElement))
      return;
    visible = false;
    stage.classList.remove("is-visible");
    rows.forEach((row) => row.classList.remove("is-active"));
  }

  rows.forEach((row, index) => {
    on(row, "pointerenter", (event) => {
      if (!finePointer.matches || event.pointerType === "touch") return;
      stopReplay();
      pointerInside = true;
      show(index, event);
    });
    on(row, "pointermove", (event) => {
      if (!finePointer.matches || event.pointerType === "touch") return;
      locate(event);
    });
    on(row, "focus", () => {
      stopReplay();
      show(index, null, true);
    });
    on(row, "click", () => {
      stopReplay();
      selected = index;
      show(index, null, true);
    });
    on(row, "keydown", (event) => {
      if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
        event.preventDefault();
        const next =
          event.key === "Home"
            ? 0
            : event.key === "End"
              ? rows.length - 1
              : (index + (event.key === "ArrowDown" ? 1 : -1) + rows.length) %
                rows.length;
        rows[next].focus();
      }
      if (event.key === "Escape") {
        event.preventDefault();
        reset();
        status.textContent = "選択を解除しました";
      }
    });
  });
  on(list, "pointerleave", () => {
    pointerInside = false;
    selected >= 0 ? show(selected) : hide();
  });
  on(list, "pointercancel", () => {
    pointerInside = false;
    hide();
  });
  on(list, "focusout", (event) => {
    if (list.contains(event.relatedTarget) || pointerInside) return;
    // relatedTarget is more reliable than activeElement during focusout.
    if (selected < 0 && !compact) {
      visible = false;
      stage.classList.remove("is-visible");
      rows.forEach((row) => row.classList.remove("is-active"));
    }
  });

  function resize() {
    compact = stage.clientWidth < 680 || !finePointer.matches;
    stage.classList.toggle("is-compact", compact);
    if (compact) {
      cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;
      show(active);
    } else {
      locate(null, true);
      if (
        !pointerInside &&
        selected < 0 &&
        !list.contains(document.activeElement)
      )
        hide();
    }
  }
  const observer = new ResizeObserver(resize);
  observer.observe(stage);
  on(finePointer, "change", resize);

  function reset() {
    stopReplay();
    cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
    selected = -1;
    pointerInside = false;
    active = 0;
    rows.forEach((row) => {
      row.classList.remove("is-active");
      row.setAttribute("aria-pressed", "false");
    });
    track.style.transform = "translateY(0)";
    visible = compact;
    stage.classList.toggle("is-visible", compact);
    locate(null, true);
    if (compact) rows[0].classList.add("is-active");
    status.textContent = compact
      ? `${items[0].title}：${items[0].description}`
      : "作品を選ぶと画像が表示されます";
  }

  function replay() {
    reset();
    show(0, null, true);
    timers.push(
      window.setTimeout(() => show(1, null, true), reducedMotion ? 600 : 850),
    );
    timers.push(
      window.setTimeout(
        () => {
          if (compact) show(0, null, true);
          else hide();
        },
        reducedMotion ? 1200 : 1800,
      ),
    );
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    stopReplay();
    cancelAnimationFrame(frame);
    observer.disconnect();
    lifecycle.abort();
    signal?.removeEventListener("abort", destroy);
  }
  resize();
  signal?.addEventListener("abort", destroy, { once: true });
  if (signal?.aborted) destroy();
  return { replay, reset, destroy };
}
