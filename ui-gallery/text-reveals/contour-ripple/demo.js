import { listen } from "../../_motion/demo-helpers.js";

/** Measured recording field bounds + independently drawn DICH silhouette and local mesh displacement. */
export function createDemo(root, { signal, reducedMotion }) {
  root.innerHTML = `<section class="contour-ripple" data-recorded-scene><div class="contour-ripple__surface" tabindex="0" role="group" aria-label="DICHの細い輪郭線。矢印キーで局所的なゆがみを動かし、Escapeで戻します"><h2 class="motion-sr-only">INTO THE FUTURE. DICH.</h2><canvas aria-hidden="true"></canvas></div></section>`;
  const scene = root.querySelector("section"),
    surface = root.querySelector("[tabindex]"),
    canvas = root.querySelector("canvas"),
    ctx = canvas.getContext("2d");
  const mask = document.createElement("canvas");
  mask.width = 1600;
  mask.height = 1200;
  const m = mask.getContext("2d", { willReadFrequently: true });
  // A broad block silhouette drawn from the observed proportions; no source bitmap or font is bundled.
  const lettering = new Path2D(
    "M430 498H542C610 498 644 533 644 593C644 654 610 698 542 698H430ZM497 554V641H534C562 641 578 621 578 593C578 567 562 554 534 554ZM659 498H721V698H659ZM947 546C933 515 902 498 851 498C779 498 738 538 738 598C738 660 780 698 851 698C900 698 934 674 949 643L884 620C878 638 864 645 850 645C820 645 807 624 807 598C807 571 820 551 850 551C865 551 878 557 884 573ZM963 498H1029V569H1108V498H1176V698H1108V626H1029V698H963Z",
  );
  m.setTransform(1, 0, 0, 0.94, 0, 22.88);
  m.fillStyle = "#fff";
  m.filter = "blur(3px)";
  m.fill(lettering, "evenodd");
  const field = m.getImageData(0, 0, 1600, 1200).data;
  let frame = 0,
    last = 0,
    preview = 0,
    destroyed = false,
    active = false;
  const pointer = { x: 800, y: 600, tx: 800, ty: 600, amount: 0, vx: 0, vy: 0 };
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  function prepare() {
    if (destroyed) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(scene.clientWidth * dpr);
    canvas.height = Math.round(scene.clientHeight * dpr);
    ctx.setTransform(canvas.width / 1600, 0, 0, canvas.height / 1200, 0, 0);
    draw();
  }
  function line(x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  function label(text, x, y, align = "left", size = 11) {
    ctx.textAlign = align;
    ctx.font = `${size}px monospace`;
    text.split("\n").forEach((s, i) => ctx.fillText(s, x, y + i * 14));
  }
  function draw() {
    if (destroyed) return;
    ctx.fillStyle = "#282828";
    ctx.fillRect(0, 0, 1600, 1200);
    ctx.fillStyle = "#595959";
    for (let x = 8; x < 1600; x += 22)
      for (let y = 5; y < 1200; y += 22) ctx.fillRect(x, y, 1, 1);
    ctx.fillStyle = "#060606";
    ctx.fillRect(73, 198, 1453, 804);
    ctx.fillStyle = "#111";
    for (let x = 89; x < 1510; x += 15)
      for (let y = 216; y < 986; y += 15) ctx.fillRect(x, y, 0.6, 0.6);
    ctx.strokeStyle = "#272727";
    ctx.lineWidth = 1;
    line(89, 358, 1509, 358);
    line(89, 842, 1509, 842);
    line(362, 215, 362, 986);
    line(1235, 215, 1235, 986);
    ctx.fillStyle = "#b7afa6";
    label("DICH // BOTTOM", 800, 218, "center", 10);
    label("~~~~~~ OFF", 102, 236, "left", 10);
    label("MENU", 1495, 236, "right", 10);
    label("STUDY: 404 PAGE", 144, 272);
    label("BACK TO TOP", 1454, 272, "right");
    const alphabet = {
      I: "M0 0H30M15 0V26M0 26H30",
      N: "M0 26V0H4L29 26H32V0",
      T: "M0 0H32M16 0V26",
      O: "M12 0H20Q32 0 32 13Q32 26 20 26H12Q0 26 0 13Q0 0 12 0",
      H: "M0 0V26M32 0V26M0 13H32",
      E: "M32 0H7Q0 0 0 7V19Q0 26 7 26H32M0 13H27",
      F: "M32 0H7Q0 0 0 7V26M0 13H27",
      U: "M0 0V17Q0 26 9 26H23Q32 26 32 17V0",
      R: "M0 26V0H23Q32 0 32 7Q32 14 23 14H14L32 26",
    };
    ctx.save();
    ctx.translate(548, 268);
    ctx.strokeStyle = "#e6cbb4";
    ctx.lineWidth = 5;
    ctx.lineCap = "butt";
    ctx.lineJoin = "round";
    let hx = 0;
    for (const ch of "INTO THE FUTURE") {
      if (ch === " ") {
        hx += 17;
        continue;
      }
      ctx.save();
      ctx.translate(hx, 0);
      ctx.stroke(new Path2D(alphabet[ch]));
      ctx.restore();
      hx += 38;
    }
    ctx.restore();
    label(
      "C://SYSTEM_FILES\n...PROTOCOL_BL/S\n/////...2045\n<ACCESS GRANTED>",
      144,
      583,
    );
    label(
      "D://DATA_CORE\n...D!CH\n/////...2045\n<FILE DECRYPTED>",
      1454,
      583,
      "right",
    );
    ctx.strokeStyle = "#9a958d";
    line(89, 483, 89, 720);
    line(1509, 483, 1509, 720);
    ctx.fillStyle = "#b7afa6";
    label("SITE BY:\nSERHII POLYUANYI\nBL/S®", 144, 913);
    label("PROJECT:\nNEW ERA OF DICH", 485, 913);
    label("LEGAL:\n©2025–2045", 1056, 913);
    label("AWWWARDS\nMASTERCLASS BY:\nNICCOLO MIRANDA", 1454, 913, "right");
    ctx.fillStyle = "#111";
    ctx.strokeStyle = "#8a8774";
    ctx.beginPath();
    ctx.moveTo(729, 900);
    ctx.lineTo(872, 900);
    ctx.lineTo(887, 914);
    ctx.lineTo(887, 936);
    ctx.lineTo(874, 948);
    ctx.lineTo(729, 948);
    ctx.lineTo(716, 935);
    ctx.lineTo(716, 914);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#f7ff6d";
    ctx.beginPath();
    ctx.moveTo(854, 903);
    ctx.lineTo(871, 903);
    ctx.lineTo(883, 914);
    ctx.lineTo(883, 935);
    ctx.lineTo(871, 945);
    ctx.lineTo(851, 945);
    ctx.lineTo(841, 935);
    ctx.lineTo(841, 914);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#dad4ba";
    label("SUBMIT_IDEA", 738, 928, "left", 12);
    ctx.fillStyle = "#121212";
    label("›››", 864, 928, "center", 15);
    ctx.fillStyle = "#b7afa6";
    label(
      `X.${String(Math.round(pointer.x)).padStart(4, "0")}  //  Y.${String(Math.round(pointer.y)).padStart(4, "0")}`,
      800,
      988,
      "center",
      10,
    );
    ctx.strokeStyle = "#938b80";
    ctx.lineWidth = 0.75;
    ctx.globalAlpha = 0.84;
    // 60 centerline peaks measured at the undistorted left edge, ~8.14 recorded pixels apart.
    const rows = [];
    for (let row = 0; row < 60; row++) {
      const baseline = 358 + row * (480 / 59);
      const points = [];
      for (let x = 362; x <= 1235; x += 2) {
        const a =
          field[(Math.round(baseline) * 1600 + Math.round(x)) * 4 + 3] / 255;
        let y = baseline - a * 26;
        const dx = x - pointer.x,
          dy = y - pointer.y,
          radius = 106;
        const g = Math.exp(-(dx * dx + dy * dy) / (radius * radius));
        // Compact two-dimensional fold; the bend turns with motion instead of a page-wide sine wave.
        const vertical =
          pointer.amount *
          g *
          (55 * Math.tanh((pointer.y - 550) / 70) +
            pointer.vy * 0.3 -
            dy * 0.12);
        const horizontal = pointer.amount * g * (dx * 0.1 + pointer.vx * 0.3);
        points.push({ x: x + horizontal, y: y + vertical, visible: true });
      }
      rows.push(points);
    }
    // Approximate hidden-line removal: a raised front row hides the rear row
    // rather than drawing self-crossing loops through the solid letter surface.
    const horizon = new Float64Array(rows[0].length).fill(Infinity);
    for (let i = rows.length - 1; i >= 0; i--) {
      rows[i].forEach((point, column) => {
        point.visible = point.y < horizon[column] - 0.6;
        if (point.visible) horizon[column] = point.y;
      });
    }
    for (const points of rows) {
      ctx.beginPath();
      let connected = false;
      for (const point of points) {
        if (!point.visible) {
          connected = false;
          continue;
        }
        if (connected) ctx.lineTo(point.x, point.y);
        else ctx.moveTo(point.x, point.y);
        connected = true;
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "#ddd9cd";
    ctx.lineWidth = 2;
    for (const [x, y, sx, sy] of [
      [365, 356, -1, -1],
      [1233, 356, 1, -1],
      [365, 845, -1, 1],
      [1233, 845, 1, 1],
    ]) {
      line(x, y, x + sx * 5, y);
      line(x + sx * 5, y, x + sx * 5, y + sy * 5);
    }
    root.dataset.distortion = pointer.amount.toFixed(3);
    root.dataset.phase = pointer.amount > 0.001 ? "active" : "rest";
  }
  function tick(now) {
    if (destroyed) return;
    const dt = Math.min(50, now - (last || now - 16));
    last = now;
    if (preview) {
      const p = clamp((now - preview) / 2400, 0, 1);
      pointer.tx = 450 + 710 * p;
      pointer.ty = 580 + 150 * Math.sin(p * Math.PI * 2);
      if (p === 1) {
        preview = 0;
        active = false;
      }
    }
    const a = reducedMotion ? 1 : 1 - Math.exp(-dt / 100);
    pointer.vx = (pointer.tx - pointer.x) * 0.5;
    pointer.vy = (pointer.ty - pointer.y) * 0.5;
    pointer.x += (pointer.tx - pointer.x) * a;
    pointer.y += (pointer.ty - pointer.y) * a;
    pointer.amount += ((active ? 1 : 0) - pointer.amount) * a;
    const unsettled =
      Math.abs(pointer.tx - pointer.x) +
        Math.abs(pointer.ty - pointer.y) +
        Math.abs(pointer.amount - (active ? 1 : 0)) * 100 >
      0.08;
    if (!unsettled) {
      pointer.amount = active ? 1 : 0;
      pointer.vx = pointer.vy = 0;
    }
    draw();
    frame = preview || unsettled ? requestAnimationFrame(tick) : 0;
    if (!frame) last = 0;
  }
  function wake() {
    if (!destroyed && !frame) frame = requestAnimationFrame(tick);
  }
  function aim(x, y) {
    if (destroyed) return;
    preview = 0;
    active = true;
    pointer.tx = clamp(x, 362, 1235);
    pointer.ty = clamp(y, 330, 870);
    wake();
  }
  function pointerEvent(e) {
    const b = surface.getBoundingClientRect();
    aim(
      ((e.clientX - b.left) / b.width) * 1600,
      ((e.clientY - b.top) / b.height) * 1200,
    );
  }
  listen(surface, "pointermove", pointerEvent, signal);
  listen(surface, "pointerdown", pointerEvent, signal);
  listen(
    surface,
    "pointerleave",
    (event) => {
      if (event.pointerType === "touch") return;
      active = false;
      preview = 0;
      wake();
    },
    signal,
  );
  listen(
    surface,
    "pointercancel",
    () => {
      preview = 0;
      active = false;
      wake();
    },
    signal,
  );
  listen(surface, "focus", () => aim(800, 600), signal);
  listen(
    surface,
    "blur",
    () => {
      active = false;
      preview = 0;
      wake();
    },
    signal,
  );
  listen(
    surface,
    "keydown",
    (e) => {
      if (
        !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Escape"].includes(
          e.key,
        )
      )
        return;
      e.preventDefault();
      if (e.key === "Escape") return reset();
      aim(
        pointer.tx +
          (e.key === "ArrowRight" ? 40 : e.key === "ArrowLeft" ? -40 : 0),
        pointer.ty +
          (e.key === "ArrowDown" ? 40 : e.key === "ArrowUp" ? -40 : 0),
      );
    },
    signal,
  );
  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    preview = last = 0;
  }
  function reset() {
    if (destroyed) return;
    stop();
    active = false;
    Object.assign(pointer, {
      x: 800,
      y: 600,
      tx: 800,
      ty: 600,
      amount: 0,
      vx: 0,
      vy: 0,
    });
    draw();
  }
  function replay() {
    if (destroyed) return;
    reset();
    active = true;
    if (reducedMotion) {
      pointer.amount = 1;
      draw();
      return;
    }
    preview = performance.now();
    wake();
  }
  function inspectAt(x, y) {
    if (destroyed) return;
    stop();
    active = true;
    Object.assign(pointer, { x, y, tx: x, ty: y, amount: 1, vx: 0, vy: 0 });
    draw();
  }
  const resize = new ResizeObserver(prepare);
  resize.observe(scene);
  function destroy() {
    if (destroyed) return;
    destroyed = true;
    stop();
    resize.disconnect();
  }
  signal.addEventListener("abort", destroy, { once: true });
  prepare();
  return { replay, reset, inspectAt, destroy };
}
