import { makeArt, listen } from "../../_motion/demo-helpers.js";

/** One panel grows while its neighbors remain visible as selectable strips. */
export function createDemo(root, { signal, reducedMotion }) {
  const items = [
    {
      title: "A clear direction",
      label: "Strategy",
      color: "#95b6ef",
      lines: [
        "Find the useful question",
        "Choose what matters",
        "Make a shared starting point",
      ],
    },
    {
      title: "Room for ideas",
      label: "Identity",
      color: "#b5a1dc",
      lines: [
        "Explore a distinct voice",
        "Shape a visual language",
        "Keep the system flexible",
      ],
    },
    {
      title: "Made to be used",
      label: "Experience",
      color: "#e4dfc9",
      lines: [
        "Understand the next step",
        "Design for real situations",
        "Make every state clear",
      ],
    },
    {
      title: "Bring it to life",
      label: "Motion",
      color: "#ecaa76",
      lines: [
        "Show what changed",
        "Connect each moment",
        "Give movement a purpose",
      ],
    },
    {
      title: "Keep it moving",
      label: "Build",
      color: "#b9cd9b",
      lines: [
        "Start with the essentials",
        "Test it in context",
        "Learn from everyday use",
      ],
    },
  ];
  root.innerHTML = `<section class="lateral-panels"><header><p>SMALL STUDIO / FIVE WAYS TO HELP</p><h2>From a thought<br>to a thing.</h2></header><div class="lateral-panels__gallery" tabindex="0" role="region" aria-roledescription="カルーセル" aria-label="幅が切り替わる5つのパネル">${items.map((item, i) => `<article class="lateral-panels__panel${i === 0 ? " is-active" : ""}" style="--panel-color:${item.color}"><button class="lateral-panels__handle" type="button" data-index="${i}" aria-label="${i + 1}: ${item.label}" aria-pressed="${i === 0}"><span>${String(i + 1).padStart(2, "0")}</span><span>${item.label}</span></button><div class="lateral-panels__content" aria-hidden="${i !== 0}"><h3>${item.title}</h3><div class="lateral-panels__details"><ul>${item.lines.map((line) => `<li>${line}</li>`).join("")}</ul><div class="lateral-panels__art">${makeArt(i, item.label)}</div></div></div></article>`).join("")}</div><footer><span data-status role="status" aria-live="polite">01 / 05 · Strategy</span><div><button type="button" data-previous aria-label="前のパネル">←</button><button type="button" data-next aria-label="次のパネル">→</button></div><p>色の帯を選ぶ / 横にスワイプ</p></footer></section>`;
  const gallery = root.querySelector(".lateral-panels__gallery");
  const panels = [...root.querySelectorAll(".lateral-panels__panel")];
  const handles = [...root.querySelectorAll("[data-index]")];
  const previous = root.querySelector("[data-previous]");
  const next = root.querySelector("[data-next]");
  const status = root.querySelector("[data-status]");
  let selected = 0,
    pointer = null,
    startX = 0,
    startY = 0,
    suppressClick = false;
  root
    .querySelector(".lateral-panels")
    .classList.toggle("is-reduced", reducedMotion);
  function measure() {
    // Keep copy laid out at its final width while the outer panel squeezes it.
    const strip =
      parseFloat(getComputedStyle(gallery).getPropertyValue("--strip")) || 38;
    gallery.style.setProperty(
      "--content-width",
      `${Math.max(0, gallery.clientWidth - strip * (items.length - 1))}px`,
    );
  }
  function go(index) {
    selected = Math.max(0, Math.min(items.length - 1, index));
    panels.forEach((panel, i) => {
      panel.classList.toggle("is-active", i === selected);
      panel
        .querySelector(".lateral-panels__content")
        .setAttribute("aria-hidden", String(i !== selected));
      handles[i].setAttribute("aria-pressed", String(i === selected));
    });
    previous.disabled = selected === 0;
    next.disabled = selected === items.length - 1;
    status.textContent = `${String(selected + 1).padStart(2, "0")} / 05 · ${items[selected].label}`;
    root.dataset.position = String(selected);
  }
  handles.forEach((button) =>
    listen(button, "click", () => go(Number(button.dataset.index)), signal),
  );
  // A swipe that begins on a narrow handle must not also select that handle.
  listen(
    gallery,
    "click",
    (event) => {
      if (!suppressClick) return;
      suppressClick = false;
      event.preventDefault();
      event.stopPropagation();
    },
    signal,
    { capture: true },
  );
  listen(previous, "click", () => go(selected - 1), signal);
  listen(next, "click", () => go(selected + 1), signal);
  listen(
    gallery,
    "keydown",
    (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
        return;
      event.preventDefault();
      go(
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? items.length - 1
            : selected + (event.key === "ArrowRight" ? 1 : -1),
      );
    },
    signal,
  );
  listen(
    gallery,
    "pointerdown",
    (event) => {
      if (event.button !== 0) return;
      suppressClick = false;
      pointer = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
    },
    signal,
  );
  listen(
    gallery,
    "pointerup",
    (event) => {
      if (pointer !== event.pointerId) return;
      const dx = event.clientX - startX,
        dy = event.clientY - startY;
      pointer = null;
      if (Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy)) {
        suppressClick = true;
        go(selected + (dx < 0 ? 1 : -1));
      }
    },
    signal,
  );
  listen(
    gallery,
    "pointercancel",
    () => {
      pointer = null;
    },
    signal,
  );
  listen(
    gallery,
    "pointerleave",
    () => {
      pointer = null;
    },
    signal,
  );
  const resize = new ResizeObserver(measure);
  resize.observe(gallery);
  let replayFrame = 0;
  function reset() {
    cancelAnimationFrame(replayFrame);
    replayFrame = 0;
    pointer = null;
    gallery.classList.add("is-resetting");
    go(0);
    gallery.getBoundingClientRect();
    gallery.classList.remove("is-resetting");
  }
  function replay() {
    reset();
    replayFrame = requestAnimationFrame(() => {
      replayFrame = 0;
      go(1);
    });
  }
  function destroy() {
    cancelAnimationFrame(replayFrame);
    pointer = null;
    resize.disconnect();
    gallery
      .getAnimations({ subtree: true })
      .forEach((animation) => animation.cancel());
  }
  signal.addEventListener("abort", destroy, { once: true });
  measure();
  go(0);
  return { replay, reset, destroy };
}
