import "../_shared/detail-shell.js";
import image1 from "../../src/assets/images/sunlit-floral-portraits/sunlit-floral-portrait-01.webp";
import image2 from "../../src/assets/images/sunlit-floral-portraits/sunlit-floral-portrait-02.webp";
import image3 from "../../src/assets/images/sunlit-floral-portraits/sunlit-floral-portrait-03.webp";
import image4 from "../../src/assets/images/sunlit-floral-portraits/sunlit-floral-portrait-04.webp";
import image5 from "../../src/assets/images/sunlit-floral-portraits/sunlit-floral-portrait-05.webp";
import image6 from "../../src/assets/images/sunlit-floral-portraits/sunlit-floral-portrait-06.webp";
import image7 from "../../src/assets/images/sunlit-floral-portraits/sunlit-floral-portrait-07.webp";
import image8 from "../../src/assets/images/sunlit-floral-portraits/sunlit-floral-portrait-08.webp";
import image9 from "../../src/assets/images/sunlit-floral-portraits/sunlit-floral-portrait-09.webp";

const stage = document.querySelector("[data-burst-stage]");
const layer = document.querySelector("[data-burst-layer]");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const images = [image1, image2, image3, image4, image5, image6, image7, image8, image9];
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
