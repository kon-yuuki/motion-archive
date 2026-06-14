import { bindReplay } from "../_shared/detail-shell.js";

const field = document.querySelector("[data-pixel-field]");
const layer = document.querySelector("[data-pixels]");
const product = document.querySelector("[data-pixel-product]");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let last = null;

function spawnBlock(x, y, index = 0) {
  const block = document.createElement("span");
  const size = 38 + Math.random() * 42;
  block.className = "pixel-block";
  block.style.setProperty("--left", `${x}px`);
  block.style.setProperty("--top", `${y}px`);
  block.style.setProperty("--size", `${size}px`);
  block.style.setProperty("--dx", `${(Math.random() - 0.5) * 24}px`);
  block.style.setProperty("--dy", `${(Math.random() - 0.5) * 24}px`);
  block.style.animationDelay = `${index * 24}ms`;
  layer.append(block);
  block.addEventListener("animationend", () => block.remove(), { once: true });
  while (layer.children.length > 34) {
    layer.firstElementChild?.remove();
  }
}

field.addEventListener("pointermove", (event) => {
  const rect = field.getBoundingClientRect();
  const point = { x: event.clientX - rect.left, y: event.clientY - rect.top };
  const rx = ((point.y / rect.height) - 0.5) * -18;
  const ry = ((point.x / rect.width) - 0.5) * 24;
  product.style.setProperty("--rx", `${rx}deg`);
  product.style.setProperty("--ry", `${ry}deg`);

  if (!last) {
    last = point;
    return;
  }
  const distance = Math.hypot(point.x - last.x, point.y - last.y);
  if (distance < (reducedMotion.matches ? 120 : 52)) {
    return;
  }
  const steps = reducedMotion.matches ? 1 : 4;
  for (let i = 0; i < steps; i += 1) {
    const t = i / steps;
    const x = last.x + (point.x - last.x) * t;
    const y = last.y + (point.y - last.y) * t;
    spawnBlock(Math.round(x / 38) * 38, Math.round(y / 38) * 38, i);
  }
  last = point;
});

field.addEventListener("pointerleave", () => {
  last = null;
  product.style.setProperty("--rx", "0deg");
  product.style.setProperty("--ry", "0deg");
});

bindReplay(() => {
  layer.replaceChildren();
  last = null;
});
