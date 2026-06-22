import { bindReplay } from "../_shared/detail-shell.js";

const field = document.querySelector("[data-pixel-field]");
const layer = document.querySelector("[data-pixels]");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const pixelSize = 102;
const activePixels = new Map();
let last = null;

function mixColor(from, to, amount) {
  const ratio = Math.min(Math.max(amount, 0), 1);
  return from.map((value, index) => Math.round(value + (to[index] - value) * ratio));
}

function sampleFieldColor(x, y, width, height) {
  const vertical = y / height;
  const horizontal = x / width;
  const top = [32, 49, 15];
  const middle = [127, 148, 75];
  const bottom = [195, 207, 121];
  const base = vertical < 0.72
    ? mixColor(top, middle, vertical / 0.72)
    : mixColor(middle, bottom, (vertical - 0.72) / 0.28);
  const glow = Math.max(
    0,
    1 - Math.hypot(horizontal - 0.52, vertical - 0.74) / 0.3,
    0.75 - Math.hypot(horizontal - 0.28, vertical - 0.42) / 0.34,
    0.72 - Math.hypot(horizontal - 0.72, vertical - 0.48) / 0.34
  );
  const color = mixColor(base, [232, 242, 152], glow * 0.62);
  const lifted = mixColor(color, [244, 248, 202], 0.18);
  return `rgb(${lifted.join(" ")})`;
}

function spawnBlock(col, row, rect) {
  const key = `${col}:${row}`;
  if (activePixels.has(key)) {
    return;
  }

  const block = document.createElement("span");
  block.className = "pixel-block";
  block.style.setProperty("--left", `${col * pixelSize}px`);
  block.style.setProperty("--top", `${row * pixelSize}px`);
  block.style.setProperty("--pixel-size", `${pixelSize}px`);
  block.style.setProperty(
    "--pixel-color",
    sampleFieldColor((col + 0.5) * pixelSize, (row + 0.5) * pixelSize, rect.width, rect.height)
  );
  layer.append(block);
  activePixels.set(key, block);
  block.addEventListener("animationend", () => {
    activePixels.delete(key);
    block.remove();
  }, { once: true });
  while (activePixels.size > 96) {
    const [oldestKey, oldestBlock] = activePixels.entries().next().value;
    activePixels.delete(oldestKey);
    oldestBlock.remove();
  }
}

function pointToCell(point) {
  return {
    col: Math.floor(point.x / pixelSize),
    row: Math.floor(point.y / pixelSize)
  };
}

function spawnTrace(from, to, rect) {
  const start = pointToCell(from);
  const end = pointToCell(to);
  const distance = Math.max(Math.abs(end.col - start.col), Math.abs(end.row - start.row));
  const steps = reducedMotion.matches ? 0 : distance;

  for (let i = 0; i <= steps; i += 1) {
    const ratio = steps === 0 ? 1 : i / steps;
    const col = Math.round(start.col + (end.col - start.col) * ratio);
    const row = Math.round(start.row + (end.row - start.row) * ratio);
    spawnBlock(col, row, rect);
  }
}

field.addEventListener("pointermove", (event) => {
  const rect = field.getBoundingClientRect();
  const point = { x: event.clientX - rect.left, y: event.clientY - rect.top };

  spawnTrace(last ?? point, point, rect);
  last = point;
});

field.addEventListener("pointerleave", () => {
  last = null;
});

bindReplay(() => {
  layer.replaceChildren();
  activePixels.clear();
  last = null;
});
