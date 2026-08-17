import "../_shared/detail-shell.js";
import image1 from "../../src/assets/images/sculptural-still-lifes/blush-pastel-forms.webp";
import image2 from "../../src/assets/images/sculptural-still-lifes/navy-stone-sculptures.webp";
import image3 from "../../src/assets/images/sculptural-still-lifes/burgundy-copper-forms.webp";
import image4 from "../../src/assets/images/sculptural-still-lifes/emerald-forms.webp";
import image5 from "../../src/assets/images/sculptural-still-lifes/terracotta-arches.webp";
import image6 from "../../src/assets/images/sculptural-still-lifes/blue-black-geometry.webp";
import image7 from "../../src/assets/images/sculptural-still-lifes/sage-glass-forms.webp";

const stage = document.querySelector("[data-stage]");
const layer = document.querySelector("[data-image-layer]");
const sources = [image1, image2, image3, image4, image5, image6, image7];
const itemCount = 7;
const cycleDistance = 920;
const positionZones = [
  [17, 21], [50, 18], [82, 25], [23, 51],
  [76, 50], [38, 80], [81, 78]
];
const random = (min, max) => Math.random() * (max - min) + min;
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const wrap = (value) => ((value % 1) + 1) % 1;

let targetScroll = 0;
let currentScroll = 0;
let targetCameraX = 0;
let targetCameraY = 0;
let currentCameraX = 0;
let currentCameraY = 0;
let lastTouchY = null;
let previousTime = performance.now();

function randomize(item, imageIndex, slotIndex) {
  const image = item.querySelector("img");
  const portrait = Math.random() > 0.56;
  const width = portrait ? random(68, 108) : random(90, 145);
  const [zoneX, zoneY] = positionZones[slotIndex % positionZones.length];

  item.style.setProperty("--x", `${(zoneX + random(-4, 4)).toFixed(2)}%`);
  item.style.setProperty("--y", `${(zoneY + random(-4, 4)).toFixed(2)}%`);
  item.style.setProperty("--width", `${width.toFixed(0)}px`);
  item.style.setProperty("--ratio", portrait ? "3 / 4" : "4 / 3");
  image.src = sources[imageIndex % sources.length];
}

function createItems() {
  if (!layer) return [];

  return Array.from({ length: itemCount }, (_, index) => {
    const item = document.createElement("figure");
    const image = document.createElement("img");
    item.className = "scale-image";
    item.dataset.cycle = "0";
    image.alt = "";
    image.decoding = "async";
    item.append(image);
    layer.append(item);
    randomize(item, index, index);
    return item;
  });
}

const items = createItems();

function updateItem(item, index, scroll, cameraX, cameraY) {
  const rawProgress = scroll / cycleDistance + index / itemCount;
  const cycle = Math.floor(rawProgress);
  const progress = wrap(rawProgress);

  if (Number(item.dataset.cycle) !== cycle) {
    item.dataset.cycle = String(cycle);
    const imageIndex = Math.abs(cycle * itemCount + index) % sources.length;
    randomize(item, imageIndex, index);
  }

  const scale = progress * 4;
  const clarity = scale <= 1
    ? scale
    : scale <= 3
      ? 1
      : 4 - scale;
  const easedOpacity = clarity * clarity * (3 - 2 * clarity);

  item.style.setProperty("--scale", scale.toFixed(4));
  item.style.setProperty("--blur", `${((1 - clarity) * 10).toFixed(2)}px`);
  item.style.setProperty("--opacity", easedOpacity.toFixed(4));
  const cameraDepth = 7 + scale * 8;
  item.style.setProperty("--camera-x", `${(-cameraX * cameraDepth).toFixed(2)}px`);
  item.style.setProperty("--camera-y", `${(-cameraY * cameraDepth).toFixed(2)}px`);
  item.style.zIndex = String(Math.round(scale * 100));
}

function render(time) {
  const deltaTime = Math.min(time - previousTime, 48);
  previousTime = time;
  const follow = 1 - Math.exp(-deltaTime * 0.014);
  const cameraFollow = 1 - Math.exp(-deltaTime * 0.009);
  currentScroll += (targetScroll - currentScroll) * follow;
  currentCameraX += (targetCameraX - currentCameraX) * cameraFollow;
  currentCameraY += (targetCameraY - currentCameraY) * cameraFollow;
  items.forEach((item, index) => updateItem(item, index, currentScroll, currentCameraX, currentCameraY));
  window.requestAnimationFrame(render);
}

stage?.addEventListener("pointermove", (event) => {
  if (event.pointerType === "touch") return;
  const bounds = stage.getBoundingClientRect();
  targetCameraX = clamp((event.clientX - bounds.left) / bounds.width * 2 - 1, -1, 1);
  targetCameraY = clamp((event.clientY - bounds.top) / bounds.height * 2 - 1, -1, 1);
});

stage?.addEventListener("pointerleave", () => {
  targetCameraX = 0;
  targetCameraY = 0;
});

stage?.addEventListener("wheel", (event) => {
  event.preventDefault();
  targetScroll += clamp(event.deltaY, -180, 180);
}, { passive: false });

stage?.addEventListener("touchstart", (event) => {
  lastTouchY = event.touches[0]?.clientY ?? null;
}, { passive: true });

stage?.addEventListener("touchmove", (event) => {
  const nextY = event.touches[0]?.clientY;
  if (nextY == null || lastTouchY == null) return;
  event.preventDefault();
  targetScroll += (lastTouchY - nextY) * 1.4;
  lastTouchY = nextY;
}, { passive: false });

stage?.addEventListener("touchend", () => {
  lastTouchY = null;
}, { passive: true });

window.requestAnimationFrame(render);
