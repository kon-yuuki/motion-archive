let nextTextureId = 0;

/** A glyph clip and moving aperture intersect over an original material image. */
export function createDemo(root, { signal, reducedMotion = false }) {
  const id = `texture-mask-${++nextTextureId}`;
  const materials = [
    {
      name: "Silver",
      colors: ["#343b3c", "#e8eded", "#77868b", "#f6f7f1", "#3c494b"],
    },
    {
      name: "Brass",
      colors: ["#62401b", "#ead3a0", "#93713c", "#f5e4ba", "#5e421f"],
    },
    {
      name: "Graphite",
      colors: ["#111d22", "#737f82", "#26393e", "#a3afab", "#101c20"],
    },
  ];
  root.innerHTML = `<section class="texture-mask" aria-label="文字の中で素材を見せるデモ"><div class="texture-mask__top"><span>MATERIAL STUDY / 06</span><span>Two masks, one texture</span></div><div class="texture-mask__intro"><h2>Feel the surface.</h2><p>文字の形はそのまま。<br>動く窓から、素材をのぞく。</p></div><button type="button" class="texture-mask__surface" aria-label="素材の窓を固定する" aria-pressed="false"><svg class="texture-mask__canvas" viewBox="0 0 640 280" aria-hidden="true"><defs><clipPath id="${id}-glyph"><text x="320" y="205" text-anchor="middle" font-family="Arial, sans-serif" font-size="175" font-weight="700">FORM</text></clipPath><linearGradient id="${id}-metal" x1="0" y1="0" x2="1" y2=".6">${materials[0].colors.map((color, index) => `<stop offset="${index * 25}%" stop-color="${color}"/>`).join("")}</linearGradient><pattern id="${id}-brush" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0 1H8M0 5H8" stroke="#fff" stroke-width=".6" opacity=".25"/><path d="M0 3H8M0 7H8" stroke="#132023" stroke-width=".5" opacity=".2"/></pattern><mask id="${id}-aperture" maskUnits="userSpaceOnUse" x="0" y="0" width="640" height="280"><path data-aperture fill="white" d=""/></mask></defs><g clip-path="url(#${id}-glyph)"><rect width="640" height="280" fill="#f8f5eb"/><g data-texture mask="url(#${id}-aperture)"><rect width="640" height="280" fill="url(#${id}-metal)"/><rect width="640" height="280" fill="url(#${id}-brush)"/><path d="M-30 230 670 55M-30 190 670 15" stroke="#fff" stroke-width="15" opacity=".09"/></g></g></svg><span class="texture-mask__surface-hint">Move across the letters · Tap to hold</span></button><div class="texture-mask__controls"><div class="texture-mask__materials" aria-label="素材を選択">${materials.map((material, index) => `<button type="button" aria-pressed="${index === 0}" data-material="${index}">${material.name}</button>`).join("")}</div><label class="texture-mask__position">表示する位置<input type="range" min="0" max="100" value="50" aria-label="素材の窓の横位置"></label></div><div class="texture-mask__bottom"><span>Original procedural material</span><span role="status" aria-live="polite">Silver · 文字に触れると素材が見えます</span></div></section>`;
  const lifecycle = new AbortController();
  const stage = root.querySelector(".texture-mask");
  const surface = root.querySelector(".texture-mask__surface");
  const canvas = root.querySelector(".texture-mask__canvas");
  const aperture = root.querySelector("[data-aperture]");
  const texture = root.querySelector("[data-texture]");
  const stops = [...root.querySelectorAll("stop")];
  const materialButtons = [...root.querySelectorAll("[data-material]")];
  const range = root.querySelector("input");
  const status = root.querySelector('[role="status"]');
  let selected = 0;
  let pinned = false;
  let hovered = false;
  let focused = false;
  let preview = false;
  let x = 320;
  let y = 140;
  let targetX = 320;
  let targetY = 140;
  let frame = 0;
  let timer = 0;
  let last = 0;
  let destroyed = false;
  const on = (target, type, handler) =>
    target.addEventListener(type, handler, { signal: lifecycle.signal });
  function draw() {
    if (reducedMotion) {
      texture.removeAttribute("mask");
      return;
    }
    texture.setAttribute("mask", `url(#${id}-aperture)`);
    if (!pinned && !hovered && !focused && !preview) {
      aperture.setAttribute("d", "");
      return;
    }
    const points = Array.from({ length: 48 }, (_, index) => {
      const angle = (index / 48) * Math.PI * 2;
      const wave = Math.sin(angle * 3 + x / 120) * 13;
      return `${x + Math.cos(angle) * (137 + wave)},${y + Math.sin(angle) * (113 + wave)}`;
    });
    aperture.setAttribute("d", `M${points.join(" L")}Z`);
  }
  function tick(time) {
    const elapsed = Math.min(50, time - (last || time - 16));
    last = time;
    const blend = 1 - Math.exp(-elapsed / 115);
    x += (targetX - x) * blend;
    y += (targetY - y) * blend;
    draw();
    if (Math.abs(targetX - x) + Math.abs(targetY - y) > 0.1 && !destroyed)
      frame = requestAnimationFrame(tick);
    else {
      frame = 0;
      last = 0;
    }
  }
  function move(nextX, nextY = 140) {
    targetX = Math.max(0, Math.min(640, nextX));
    targetY = Math.max(0, Math.min(280, nextY));
    if (reducedMotion) {
      x = targetX;
      y = targetY;
      draw();
      return;
    }
    if (!frame && !destroyed) frame = requestAnimationFrame(tick);
  }
  function stopPreview() {
    clearTimeout(timer);
    timer = 0;
    preview = false;
  }
  function point(event) {
    const matrix = canvas.getScreenCTM();
    if (!matrix) return [320, 140];
    const position = new DOMPoint(event.clientX, event.clientY).matrixTransform(
      matrix.inverse(),
    );
    return [position.x, position.y];
  }
  on(surface, "pointerenter", (event) => {
    if (event.pointerType === "touch") return;
    stopPreview();
    hovered = true;
    move(...point(event));
  });
  on(surface, "pointermove", (event) => {
    if (event.pointerType === "touch" || reducedMotion || pinned) return;
    move(...point(event));
  });
  on(surface, "pointerleave", () => {
    hovered = false;
    draw();
  });
  on(surface, "pointercancel", () => {
    hovered = false;
    draw();
  });
  on(surface, "focus", () => {
    stopPreview();
    focused = true;
    draw();
  });
  on(surface, "blur", () => {
    focused = false;
    draw();
  });
  on(surface, "click", (event) => {
    stopPreview();
    pinned = !pinned;
    surface.setAttribute("aria-pressed", String(pinned));
    if (pinned) {
      const [nextX, nextY] = event.detail ? point(event) : [320, 140];
      move(nextX, nextY);
    }
    draw();
    status.textContent = `${materials[selected].name} · ${pinned ? "窓を固定しました" : "固定を解除しました"}`;
  });
  on(range, "input", () => {
    stopPreview();
    pinned = true;
    surface.setAttribute("aria-pressed", "true");
    move(Number(range.value) * 6.4);
  });
  on(range, "focus", () => {
    pinned = true;
    surface.setAttribute("aria-pressed", "true");
    move(Number(range.value) * 6.4);
  });
  on(range, "change", () => {
    status.textContent = `${materials[selected].name} · 表示位置 ${range.value}%`;
  });
  function setMaterial(index) {
    selected = index;
    materialButtons.forEach((button, i) =>
      button.setAttribute("aria-pressed", String(i === index)),
    );
    stops.forEach((stop, i) =>
      stop.setAttribute("stop-color", materials[index].colors[i]),
    );
  }
  materialButtons.forEach((button, index) =>
    on(button, "click", () => {
      setMaterial(index);
      pinned = true;
      surface.setAttribute("aria-pressed", "true");
      draw();
      status.textContent = `${materials[index].name} の素材を表示しています`;
    }),
  );
  function reset() {
    stopPreview();
    cancelAnimationFrame(frame);
    frame = 0;
    last = 0;
    x = targetX = 320;
    y = targetY = 140;
    pinned = hovered = focused = false;
    setMaterial(0);
    range.value = "50";
    surface.setAttribute("aria-pressed", "false");
    draw();
    status.textContent = reducedMotion
      ? `${materials[selected].name} · 素材全体を表示しています`
      : `${materials[selected].name} · 文字に触れると素材が見えます`;
  }
  function replay() {
    reset();
    preview = true;
    x = 80;
    targetX = 560;
    draw();
    move(560);
    timer = setTimeout(
      () => {
        preview = false;
        pinned = true;
        surface.setAttribute("aria-pressed", "true");
        range.value = "88";
        draw();
        status.textContent = `${materials[selected].name} · 窓の位置を固定しました`;
      },
      reducedMotion ? 0 : 1000,
    );
  }
  function destroy() {
    if (destroyed) return;
    destroyed = true;
    stopPreview();
    cancelAnimationFrame(frame);
    lifecycle.abort();
    signal?.removeEventListener("abort", destroy);
  }
  signal?.addEventListener("abort", destroy, { once: true });
  draw();
  if (signal?.aborted) destroy();
  return { replay, reset, destroy };
}
