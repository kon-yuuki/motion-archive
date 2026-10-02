import { listen } from "../../_motion/demo-helpers.js";

/** A text-derived height field bends horizontal lines; a local pointer field adds a ripple. */
export function createDemo(root, { signal, reducedMotion }) {
  root.innerHTML = `<section class="contour-ripple"><header><span>TYPE AS A LANDSCAPE</span><span>LOCAL DISTORTION / 01</span></header><div class="contour-ripple__surface" tabindex="0" role="img" aria-label="FLOWの輪郭線。矢印キーで局所的なゆがみを動かせます"><canvas aria-hidden="true"></canvas><h2 class="motion-sr-only">FLOW</h2></div><footer><p>文字の近くに触れて、線の変化を見てください。</p><label>Position <input type="range" min="0" max="100" value="50" aria-label="波紋の横位置" /></label></footer></section>`;
  const surface = root.querySelector(".contour-ripple__surface"),
    canvas = root.querySelector("canvas"),
    ctx = canvas.getContext("2d", { willReadFrequently: true }),
    range = root.querySelector("input");
  const mask = document.createElement("canvas"),
    maskContext = mask.getContext("2d", { willReadFrequently: true });
  let width = 0,
    height = 0,
    field = null,
    frame = 0,
    lastTime = 0,
    previewStart = 0,
    active = false;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0, amount: 0 };
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  function prepare() {
    width = surface.clientWidth;
    height = surface.clientHeight;
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    mask.width = width;
    mask.height = height;
    maskContext.clearRect(0, 0, width, height);
    maskContext.font = `800 ${Math.min(210, width * 0.24)}px Arial, sans-serif`;
    maskContext.textAlign = "center";
    maskContext.textBaseline = "middle";
    maskContext.fillStyle = "white";
    maskContext.filter = "blur(2px)";
    maskContext.fillText("FLOW", width / 2, height * 0.53);
    field = maskContext.getImageData(0, 0, width, height).data;
    pointer.x = pointer.tx = width / 2;
    pointer.y = pointer.ty = height / 2;
    draw();
  }
  function draw() {
    if (!field) return;
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = "#8da898";
    ctx.lineWidth = 0.65;
    ctx.globalAlpha = 0.8;
    const radius = Math.max(55, Math.min(110, width * 0.16));
    ctx.beginPath();
    for (let y = 28; y < height - 24; y += 6) {
      for (let x = 24; x < width - 24; x += 5) {
        const alpha =
          field[(Math.round(y) * width + Math.round(x)) * 4 + 3] / 255;
        const dx = x - pointer.x,
          dy = y - pointer.y;
        const influence = Math.exp(-(dx * dx + dy * dy) / (radius * radius));
        const ripple =
          Math.sin((dx / radius) * 3.5) * influence * pointer.amount * 34;
        const displaced = y - alpha * 24 + ripple;
        if (x === 24) ctx.moveTo(x, displaced);
        else ctx.lineTo(x, displaced);
      }
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
    root.dataset.distortion = pointer.amount.toFixed(3);
  }
  function tick(time) {
    const dt = Math.min(40, time - (lastTime || time - 16));
    lastTime = time;
    if (previewStart) {
      const p = Math.min(1, (time - previewStart) / 1800);
      pointer.tx = width * (0.18 + 0.64 * p);
      pointer.ty = height * (0.55 + 0.12 * Math.sin(p * Math.PI * 2));
      if (p >= 1) {
        previewStart = 0;
        active = false;
      }
    }
    const blend = reducedMotion ? 1 : 1 - Math.exp(-dt / 90);
    pointer.x += (pointer.tx - pointer.x) * blend;
    pointer.y += (pointer.ty - pointer.y) * blend;
    pointer.amount += ((active ? 1 : 0) - pointer.amount) * blend;
    draw();
    if (
      previewStart ||
      Math.abs(pointer.x - pointer.tx) +
        Math.abs(pointer.y - pointer.ty) +
        Math.abs(pointer.amount - (active ? 1 : 0)) * 100 >
        0.1
    )
      frame = requestAnimationFrame(tick);
    else {
      frame = 0;
      lastTime = 0;
    }
  }
  function wake() {
    if (!frame) frame = requestAnimationFrame(tick);
  }
  function aim(x, y) {
    previewStart = 0;
    active = true;
    pointer.tx = clamp(x, 20, width - 20);
    pointer.ty = clamp(y, 20, height - 20);
    range.value = String(Math.round((pointer.tx / width) * 100));
    wake();
  }
  listen(
    surface,
    "pointermove",
    (event) => {
      const b = surface.getBoundingClientRect();
      aim(event.clientX - b.left, event.clientY - b.top);
    },
    signal,
  );
  listen(
    surface,
    "pointerdown",
    (event) => {
      const b = surface.getBoundingClientRect();
      aim(event.clientX - b.left, event.clientY - b.top);
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
  listen(surface, "focus", () => aim(width / 2, height / 2), signal);
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
        pointer.tx +
          (event.key === "ArrowRight"
            ? 25
            : event.key === "ArrowLeft"
              ? -25
              : 0),
        pointer.ty +
          (event.key === "ArrowDown" ? 25 : event.key === "ArrowUp" ? -25 : 0),
      );
    },
    signal,
  );
  listen(
    range,
    "input",
    () => aim((Number(range.value) / 100) * width, height * 0.52),
    signal,
  );
  const resize = new ResizeObserver(prepare);
  resize.observe(surface);
  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
    previewStart = 0;
  }
  function reset() {
    stop();
    active = false;
    pointer.amount = 0;
    pointer.x = pointer.tx = width / 2;
    pointer.y = pointer.ty = height / 2;
    range.value = "50";
    draw();
  }
  function replay() {
    reset();
    active = true;
    if (reducedMotion) {
      aim(width / 2, height / 2);
      return;
    }
    previewStart = performance.now();
    wake();
  }
  function destroy() {
    stop();
    resize.disconnect();
  }
  signal.addEventListener("abort", destroy, { once: true });
  prepare();
  return { replay, reset, destroy };
}
