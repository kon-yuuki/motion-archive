import { listen } from "../../_motion/demo-helpers.js";

/** An original SVG glyph, with a second representation revealed by a circular clip. */
export function createDemo(root, { signal, reducedMotion }) {
  const glyph =
    "M164 282V78H246C302 78 335 98 335 141C335 175 313 195 284 202L353 282H298L237 207H207V282ZM207 117V170H243C275 170 292 163 292 142C292 124 277 117 244 117Z";
  const points = [
    [164, 282],
    [164, 78],
    [246, 78],
    [335, 141],
    [284, 202],
    [353, 282],
    [298, 282],
    [237, 207],
    [207, 207],
    [207, 282],
    [207, 117],
    [207, 170],
    [243, 170],
    [292, 142],
    [244, 117],
  ];
  root.innerHTML = `<section class="character-xray"><header><span>BEHIND THE LETTER</span><span>MOVE TO LOOK INSIDE</span></header><div class="character-xray__layout"><div><h2>One letter.<br>Two ways to see.</h2><p>文字の上へポインターを。<br>丸い窓の中だけ、輪郭が見えます。</p><button type="button" data-pin aria-pressed="false">レンズを固定する</button></div><div class="character-xray__surface" tabindex="0" role="img" aria-label="Rの形。矢印キーでレンズを動かせます"><svg viewBox="0 0 520 360" aria-hidden="true"><defs><clipPath id="character-xray-lens"><circle data-clip cx="260" cy="180" r="80"/></clipPath></defs><path d="M113 324V155a147 147 0 0 1 294 0v169" fill="none" stroke="#8c6549" stroke-width="1"/><path d="${glyph}" fill="#563423" fill-rule="evenodd"/><g class="character-xray__lens" clip-path="url(#character-xray-lens)"><rect width="520" height="360" fill="#e5a565"/><path d="${glyph}" fill="none" stroke="#573424" stroke-width="1.5"/><path d="M246 78H302L335 98V141M335 141V175L313 195 284 202M243 170H275L292 163V142M292 142V124L277 117 244 117" fill="none" stroke="#79553a" stroke-width=".8"/>${points.map(([x, y]) => `<rect x="${x - 2.5}" y="${y - 2.5}" width="5" height="5" fill="#f1c99e" stroke="#573424"/>`).join("")}</g><circle class="character-xray__lens" data-ring cx="260" cy="180" r="80" fill="none" stroke="#6e4226" stroke-width="1"/></svg></div></div><footer><span role="status" aria-live="polite">ポインター・矢印キーで観察できます</span><label>Lens position <input type="range" min="90" max="430" value="260" aria-label="レンズの横位置" /></label></footer></section>`;
  const section = root.querySelector(".character-xray"),
    surface = root.querySelector(".character-xray__surface"),
    svg = root.querySelector("svg"),
    clip = root.querySelector("[data-clip]"),
    ring = root.querySelector("[data-ring]"),
    pin = root.querySelector("[data-pin]"),
    range = root.querySelector("input"),
    status = root.querySelector("[role=status]");
  let x = 260,
    y = 180,
    tx = 260,
    ty = 180,
    frame = 0,
    pinned = false,
    previewStart = 0,
    previousTime = 0;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  function draw() {
    for (const circle of [clip, ring]) {
      circle.setAttribute("cx", String(x));
      circle.setAttribute("cy", String(y));
    }
    root.dataset.lensX = x.toFixed(1);
    range.value = String(Math.round(tx));
  }
  function tick(time) {
    const delta = Math.min(50, time - (previousTime || time - 16));
    previousTime = time;
    if (previewStart) {
      const p = Math.min(1, (time - previewStart) / 1600);
      tx = 130 + 260 * p;
      ty = 180 + 45 * Math.sin(p * Math.PI * 2);
      if (p >= 1) {
        previewStart = 0;
        section.classList.toggle("is-active", pinned);
      }
    }
    const blend = reducedMotion ? 1 : 1 - Math.exp(-delta / 80);
    x += (tx - x) * blend;
    y += (ty - y) * blend;
    draw();
    if (previewStart || Math.abs(tx - x) + Math.abs(ty - y) > 0.1)
      frame = requestAnimationFrame(tick);
    else {
      frame = 0;
      previousTime = 0;
    }
  }
  function move(nx, ny) {
    tx = clamp(nx, 70, 450);
    ty = clamp(ny, 75, 285);
    if (reducedMotion) {
      x = tx;
      y = ty;
      draw();
    } else if (!frame) frame = requestAnimationFrame(tick);
  }
  function activate() {
    previewStart = 0;
    section.classList.add("is-active");
  }
  listen(surface, "pointerenter", activate, signal);
  listen(
    surface,
    "pointermove",
    (event) => {
      activate();
      const box = svg.getBoundingClientRect();
      move(
        ((event.clientX - box.left) / box.width) * 520,
        ((event.clientY - box.top) / box.height) * 360,
      );
    },
    signal,
  );
  listen(
    surface,
    "pointerleave",
    () => {
      if (!pinned) section.classList.remove("is-active");
    },
    signal,
  );
  listen(
    surface,
    "pointerdown",
    (event) => {
      if (event.pointerType === "touch") {
        pinned = true;
        pin.setAttribute("aria-pressed", "true");
        pin.textContent = "レンズの固定を解除";
        activate();
      }
    },
    signal,
  );
  listen(surface, "focus", activate, signal);
  listen(
    surface,
    "blur",
    () => {
      if (!pinned) section.classList.remove("is-active");
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
      activate();
      move(
        tx +
          (event.key === "ArrowRight"
            ? 16
            : event.key === "ArrowLeft"
              ? -16
              : 0),
        ty +
          (event.key === "ArrowDown" ? 16 : event.key === "ArrowUp" ? -16 : 0),
      );
    },
    signal,
  );
  listen(
    pin,
    "click",
    () => {
      pinned = !pinned;
      previewStart = 0;
      pin.setAttribute("aria-pressed", String(pinned));
      pin.textContent = pinned ? "レンズの固定を解除" : "レンズを固定する";
      section.classList.toggle("is-active", pinned);
      status.textContent = pinned
        ? "レンズを固定しました。下のスライダーでも動かせます"
        : "ポインター・矢印キーで観察できます";
    },
    signal,
  );
  listen(
    range,
    "input",
    () => {
      activate();
      move(Number(range.value), 180);
    },
    signal,
  );
  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    previewStart = 0;
    previousTime = 0;
  }
  function reset() {
    stop();
    pinned = false;
    x = tx = 260;
    y = ty = 180;
    draw();
    section.classList.remove("is-active");
    pin.setAttribute("aria-pressed", "false");
    pin.textContent = "レンズを固定する";
    status.textContent = "ポインター・矢印キーで観察できます";
  }
  function replay() {
    reset();
    section.classList.add("is-active");
    if (reducedMotion) {
      pinned = true;
      pin.setAttribute("aria-pressed", "true");
      pin.textContent = "レンズの固定を解除";
      return;
    }
    x = tx = 130;
    previewStart = performance.now();
    frame = requestAnimationFrame(tick);
  }
  signal.addEventListener("abort", stop, { once: true });
  draw();
  return { replay, reset, destroy: stop };
}
