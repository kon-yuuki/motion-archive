import "../_shared/detail-shell.js";
import image1 from "../../src/assets/images/optimized/dummy_1-480.webp";
import image2 from "../../src/assets/images/optimized/dummy_2-480.webp";
import image3 from "../../src/assets/images/optimized/dummy_3-480.webp";
import image4 from "../../src/assets/images/optimized/dummy_4-480.webp";

const stage = document.querySelector("[data-burst-stage]");
const layer = document.querySelector("[data-burst-layer]");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const images = [image1, image2, image3, image4];
let last = null;
let imageIndex = 0;

function spawn(x, y, offset = 0) {
  const card = document.createElement("span");
  const img = document.createElement("img");
  card.className = "burst-card";
  card.style.setProperty("--x", `${x - offset * 28}px`);
  card.style.setProperty("--y", `${y - offset * 4}px`);
  card.style.setProperty("--drift-x", `${-20 - offset * 12}px`);
  card.style.setProperty("--drift-y", `${(Math.random() - 0.5) * 24}px`);
  card.style.setProperty("--alpha", `${1 - offset * 0.12}`);
  card.style.animationDelay = `${offset * 26}ms`;
  img.src = images[(imageIndex + offset) % images.length];
  img.alt = "";
  card.append(img);
  layer.append(card);
  card.addEventListener("animationend", () => card.remove(), { once: true });
}

stage.addEventListener("pointermove", (event) => {
  const rect = stage.getBoundingClientRect();
  const current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
  if (!last) {
    last = current;
    return;
  }
  const dx = current.x - last.x;
  const dy = current.y - last.y;
  const distance = Math.hypot(dx, dy);
  if (distance < (reducedMotion.matches ? 130 : 112)) {
    return;
  }
  spawn(current.x, current.y);
  imageIndex += 1;
  last = current;
  while (layer.children.length > 18) {
    layer.firstElementChild?.remove();
  }
});

stage.addEventListener("pointerleave", () => {
  last = null;
});
