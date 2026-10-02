import { makeArt, listen } from "../../_motion/demo-helpers.js";

/** A changing radius and card width turn one broad image into a vertical wheel. */
export function createDemo(root, { signal, reducedMotion }) {
  const names = [
    "Quiet geometry",
    "Open passage",
    "Collected forms",
    "Soft horizon",
    "Golden hour",
  ];
  root.innerHTML = `<section class="ferris-wheel"><header><p>THE SHAPE OF A MOMENT</p><span>Selected studies / 2026</span></header><div class="ferris-wheel__gallery" tabindex="0" role="region" aria-roledescription="カルーセル" aria-label="縦に回る5枚の絵"><div class="ferris-wheel__wheel" aria-hidden="true">${names.map((name, i) => `<div class="ferris-wheel__picture">${makeArt(i, name)}</div>`).join("")}</div><div class="ferris-wheel__caption"><h2 data-title>${names[0]}</h2><span>ABSTRACT ARCHIVE ↗</span></div></div><footer><button type="button" data-previous aria-label="前の作品">↑</button><label><span>作品を選ぶ</span><input type="range" min="0" max="4" step="1" value="0" aria-label="作品の位置" /></label><button type="button" data-next aria-label="次の作品">↓</button><span data-status role="status" aria-live="polite">01 / 05</span></footer><p class="ferris-wheel__hint">矢印、位置バー、左右スワイプで作品を送れます</p></section>`;
  const gallery = root.querySelector(".ferris-wheel__gallery");
  const wheel = root.querySelector(".ferris-wheel__wheel");
  const pictures = [...root.querySelectorAll(".ferris-wheel__picture")];
  const title = root.querySelector("[data-title]");
  const status = root.querySelector("[data-status]");
  const range = root.querySelector("input");
  const previous = root.querySelector("[data-previous]");
  const next = root.querySelector("[data-next]");
  let position = 0,
    selected = 0,
    compression = 0,
    frame = 0;
  let pointer = null,
    startX = 0,
    startY = 0;
  const clamp = (value) => Math.max(0, Math.min(names.length - 1, value));

  function render() {
    // Neighboring pictures become visible only while the central picture narrows.
    const radius = 120 + compression * 55;
    pictures.forEach((picture, i) => {
      const distance = i - position;
      const angle = Math.max(-170, Math.min(170, distance * 40));
      const radians = (angle * Math.PI) / 180;
      const focused = Math.max(0, 1 - Math.abs(distance));
      const side = Math.max(0, 1 - Math.abs(angle) / 130) * compression;
      picture.style.width = `${76 - compression * 45}%`;
      picture.style.height = `${250 - compression * 130}px`;
      picture.style.transform = `translateY(${Math.sin(radians) * radius}px) translateZ(${(Math.cos(radians) - 1) * radius}px) rotateX(${-angle}deg)`;
      picture.style.opacity = String(Math.max(focused, side));
      picture.style.zIndex = String(10 - Math.round(Math.abs(distance)));
    });
    title.style.opacity = String(1 - compression * 0.65);
    root.dataset.position = String(selected);
    root.dataset.compression = compression.toFixed(3);
  }
  function updateState() {
    title.textContent = names[selected];
    range.value = String(selected);
    range.setAttribute(
      "aria-valuetext",
      `${selected + 1} / 5: ${names[selected]}`,
    );
    status.textContent = `${String(selected + 1).padStart(2, "0")} / 05`;
    previous.disabled = selected === 0;
    next.disabled = selected === names.length - 1;
  }
  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
  }
  function go(index) {
    const target = Math.round(clamp(index));
    if (target === selected) return;
    stop();
    selected = target;
    if (reducedMotion) {
      position = selected;
      compression = 0;
      updateState();
      render();
      return;
    }
    const from = position,
      oldCompression = compression,
      start = performance.now();
    function tick(time) {
      const p = Math.min(1, (time - start) / 900);
      // Narrow first, rotate through the middle, then broaden the selected picture.
      const travel = Math.max(0, Math.min(1, (p - 0.15) / 0.7));
      const ease = travel * travel * (3 - 2 * travel);
      position = from + (selected - from) * ease;
      compression = Math.max(
        oldCompression * (1 - p),
        Math.pow(Math.sin(p * Math.PI), 0.65),
      );
      if (p >= 0.5) updateState();
      render();
      if (p < 1) frame = requestAnimationFrame(tick);
      else {
        frame = 0;
        compression = 0;
        updateState();
        render();
      }
    }
    frame = requestAnimationFrame(tick);
  }
  listen(previous, "click", () => go(selected - 1), signal);
  listen(next, "click", () => go(selected + 1), signal);
  listen(range, "input", () => go(Number(range.value)), signal);
  listen(
    gallery,
    "keydown",
    (event) => {
      if (
        ![
          "ArrowLeft",
          "ArrowRight",
          "ArrowUp",
          "ArrowDown",
          "Home",
          "End",
        ].includes(event.key)
      )
        return;
      event.preventDefault();
      go(
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? names.length - 1
            : selected +
              (["ArrowRight", "ArrowDown"].includes(event.key) ? 1 : -1),
      );
    },
    signal,
  );
  listen(
    gallery,
    "pointerdown",
    (event) => {
      if (event.button !== 0) return;
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
      if (Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy))
        go(selected + (dx < 0 ? 1 : -1));
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
  function reset() {
    stop();
    pointer = null;
    position = selected = compression = 0;
    updateState();
    render();
  }
  function replay() {
    reset();
    go(1);
  }
  function destroy() {
    stop();
    pointer = null;
    wheel.style.willChange = "";
  }
  signal.addEventListener("abort", destroy, { once: true });
  updateState();
  render();
  return { replay, reset, destroy };
}
