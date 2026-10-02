import { listen } from "../../_motion/demo-helpers.js";

/** Local variable-font weight changes, with each glyph's advance fixed at rest. */
export function createDemo(root, { signal, reducedMotion }) {
  const lines = ["Ideas feel", "different", "when you", "get closer."];
  root.innerHTML = `<section class="proximity-weight"><header><span>TYPE HAS A PRESENCE</span><span>MOVE CLOSER</span></header><div class="proximity-weight__surface" tabindex="0" aria-label="マウスや矢印キーで文字の太さを変える"><h2><span class="motion-sr-only">${lines.join(" ")}</span><span aria-hidden="true" class="proximity-weight__visual">${lines.map((line) => `<span class="proximity-weight__line">${[...line].map((char) => (char === " " ? '<span class="proximity-weight__space"> </span>' : `<span class="proximity-weight__letter">${char}</span>`)).join("")}</span>`).join("")}</span></h2><span class="proximity-weight__point" aria-hidden="true"></span></div><footer><p>近い文字だけ、少し力強く。</p><label>Focus <input type="range" min="0" max="100" value="50" aria-label="文字を太くする位置" /></label></footer></section>`;
  const section = root.querySelector(".proximity-weight"),
    surface = root.querySelector(".proximity-weight__surface"),
    letters = [...root.querySelectorAll(".proximity-weight__letter")],
    point = root.querySelector(".proximity-weight__point"),
    range = root.querySelector("input");
  let positions = [],
    weights = letters.map(() => 220),
    targetX = 0,
    targetY = 0,
    active = false,
    frame = 0,
    previousTime = 0,
    previewStart = 0;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  function measure() {
    cancelAnimationFrame(frame);
    frame = 0;
    previousTime = 0;
    letters.forEach((letter) => {
      letter.style.width = "";
      letter.style.fontVariationSettings = '"wght" 220';
    });
    const widths = letters.map(
      (letter) => letter.getBoundingClientRect().width,
    );
    letters.forEach((letter, index) => {
      letter.style.width = `${widths[index]}px`;
      letter.style.fontVariationSettings = `"wght" ${weights[index]}`;
    });
    const bounds = surface.getBoundingClientRect();
    positions = letters.map((letter) => {
      const r = letter.getBoundingClientRect();
      return {
        x: r.left - bounds.left + r.width / 2,
        y: r.top - bounds.top + r.height / 2,
      };
    });
    targetX = surface.clientWidth / 2;
    targetY = surface.clientHeight / 2;
    render(performance.now());
  }
  function render(time) {
    const elapsed = Math.min(50, time - (previousTime || time - 16));
    previousTime = time;
    if (previewStart) {
      const p = Math.min(1, (time - previewStart) / 2000);
      targetX = surface.clientWidth * (0.2 + 0.6 * p);
      targetY = surface.clientHeight * (0.25 + 0.5 * p);
      if (p >= 1) {
        previewStart = 0;
        active = false;
      }
    }
    point.style.transform = `translate(${targetX}px,${targetY}px)`;
    point.style.opacity = active ? "1" : "0";
    const radius = Math.max(80, Math.min(180, surface.clientWidth * 0.25));
    let unsettled = false;
    letters.forEach((letter, index) => {
      const position = positions[index];
      if (!position) return;
      const distance = Math.hypot(position.x - targetX, position.y - targetY);
      const influence = active
        ? Math.pow(Math.max(0, 1 - distance / radius), 1.4)
        : 0;
      const target = 220 + influence * 660;
      const blend = reducedMotion ? 1 : 1 - Math.exp(-elapsed / 90);
      weights[index] += (target - weights[index]) * blend;
      if (Math.abs(target - weights[index]) > 0.4) unsettled = true;
      letter.style.fontVariationSettings = `"wght" ${weights[index].toFixed(1)}`;
    });
    root.dataset.maxWeight = String(Math.round(Math.max(...weights)));
    if (unsettled || previewStart) frame = requestAnimationFrame(render);
    else {
      frame = 0;
      previousTime = 0;
    }
  }
  function wake() {
    if (!frame) frame = requestAnimationFrame(render);
  }
  function aim(x, y) {
    previewStart = 0;
    active = true;
    targetX = clamp(x, 0, surface.clientWidth);
    targetY = clamp(y, 0, surface.clientHeight);
    range.value = String(Math.round((targetX / surface.clientWidth) * 100));
    wake();
  }
  listen(
    surface,
    "pointermove",
    (event) => {
      const r = surface.getBoundingClientRect();
      aim(event.clientX - r.left, event.clientY - r.top);
    },
    signal,
  );
  listen(
    surface,
    "pointerdown",
    (event) => {
      const r = surface.getBoundingClientRect();
      aim(event.clientX - r.left, event.clientY - r.top);
    },
    signal,
  );
  listen(
    surface,
    "pointerleave",
    () => {
      active = false;
      previewStart = 0;
      wake();
    },
    signal,
  );
  listen(
    surface,
    "focus",
    () => aim(surface.clientWidth * 0.5, surface.clientHeight * 0.45),
    signal,
  );
  listen(
    surface,
    "blur",
    () => {
      active = false;
      wake();
    },
    signal,
  );
  listen(
    surface,
    "keydown",
    (event) => {
      if (
        !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Escape"].includes(
          event.key,
        )
      )
        return;
      event.preventDefault();
      if (event.key === "Escape") {
        reset();
        return;
      }
      aim(
        targetX +
          (event.key === "ArrowRight"
            ? 25
            : event.key === "ArrowLeft"
              ? -25
              : 0),
        targetY +
          (event.key === "ArrowDown" ? 25 : event.key === "ArrowUp" ? -25 : 0),
      );
    },
    signal,
  );
  listen(
    range,
    "input",
    () =>
      aim(
        (Number(range.value) / 100) * surface.clientWidth,
        surface.clientHeight * 0.5,
      ),
    signal,
  );
  const resize = new ResizeObserver(() => {
    cancelAnimationFrame(frame);
    frame = 0;
    measure();
  });
  resize.observe(surface);
  document.fonts.ready.then(() => {
    if (!signal.aborted) measure();
  });
  function reset() {
    cancelAnimationFrame(frame);
    frame = 0;
    previousTime = 0;
    previewStart = 0;
    active = false;
    weights.fill(220);
    letters.forEach(
      (letter) => (letter.style.fontVariationSettings = '"wght" 220'),
    );
    point.style.opacity = "0";
    root.dataset.maxWeight = "220";
    range.value = "50";
  }
  function replay() {
    reset();
    active = true;
    if (reducedMotion) {
      aim(surface.clientWidth / 2, surface.clientHeight / 2);
      return;
    }
    previewStart = performance.now();
    wake();
  }
  function destroy() {
    cancelAnimationFrame(frame);
    resize.disconnect();
  }
  signal.addEventListener("abort", destroy, { once: true });
  measure();
  return { replay, reset, destroy };
}
