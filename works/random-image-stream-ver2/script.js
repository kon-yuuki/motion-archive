import "../_shared/detail-shell.js";
import "../_shared/version-navigation.js";
import object1 from "../../src/assets/images/sculptural-still-lifes/blush-pastel-forms.webp";
import object2 from "../../src/assets/images/sculptural-still-lifes/navy-stone-sculptures.webp";
import object3 from "../../src/assets/images/sculptural-still-lifes/burgundy-copper-forms.webp";
import object4 from "../../src/assets/images/sculptural-still-lifes/emerald-forms.webp";
import object5 from "../../src/assets/images/sculptural-still-lifes/terracotta-arches.webp";
import object6 from "../../src/assets/images/sculptural-still-lifes/blue-black-geometry.webp";
import object7 from "../../src/assets/images/sculptural-still-lifes/charcoal-amber-forms.webp";
import object8 from "../../src/assets/images/sculptural-still-lifes/sage-glass-forms.webp";
import object9 from "../../src/assets/images/sculptural-still-lifes/warm-ivory-sculptures.webp";
import object10 from "../../src/assets/images/sculptural-still-lifes/neutral-stone-monuments.webp";

const layer = document.querySelector("[data-stream-layer]");
const stage = document.querySelector("[data-stream-stage]");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const images = [object1, object2, object3, object4, object5, object6, object7, object8, object9, object10];
const random = (min, max) => Math.random() * (max - min) + min;
let imageIndex = 0;
let lastTouchY = null;
let coverageFrame;
let scrollCurrent = 0;
let scrollTarget = 0;
let previousFrameTime = performance.now();
let depthIndex = 0;
const depths = [0.62, 0.78, 0.96, 1.18];

function randomizeFrame(frame, image) {
  const depth = Number(frame.dataset.depth || 1);
  const width = random(240, 390) * depth;
  const verticalSide = Number(frame.dataset.verticalSide || 1);
  const verticalBands = [6, 10, 14, 18, 22, 26, 30, 34];
  const verticalBand = verticalBands[Number(frame.dataset.verticalBand || 0)];
  const verticalOffset = verticalSide * (verticalBand + random(-1.25, 1.25));

  frame.style.setProperty("--frame-width", `${width.toFixed(0)}px`);
  frame.style.setProperty("--frame-y-offset", `${verticalOffset.toFixed(1)}vh`);
  frame.style.setProperty("--depth-opacity", `${(0.58 + depth * 0.34).toFixed(2)}`);
  frame.style.zIndex = String(1000 - Math.round(width));
  image.src = images[imageIndex % images.length];
  imageIndex += 1;
}

function createFrame(progress = 0) {
  if (!layer || layer.childElementCount >= 16) return;

  const frame = document.createElement("figure");
  const image = document.createElement("img");
  const verticalSlot = layer.childElementCount;
  const depth = depths[depthIndex % depths.length];
  const duration = reducedMotion.matches ? 48 : 34;
  depthIndex += 1;

  frame.className = "stream-frame";
  frame.dataset.depth = depth.toFixed(2);
  frame.dataset.verticalSide = verticalSlot % 2 === 0 ? "-1" : "1";
  frame.dataset.verticalBand = String(Math.floor(verticalSlot / 2));
  frame.style.setProperty("--frame-duration", `${duration.toFixed(2)}s`);
  frame.style.setProperty("--frame-delay", `${(-duration * progress).toFixed(2)}s`);

  image.alt = "";
  image.decoding = "async";
  randomizeFrame(frame, image);
  frame.append(image);
  layer.append(frame);

  frame.addEventListener("animationiteration", () => randomizeFrame(frame, image));
}

function start() {
  layer?.replaceChildren();
  depthIndex = 0;
  const initialCount = 16;
  for (let index = 0; index < initialCount; index += 1) {
    createFrame(index / initialCount);
  }
}

function moveWithScroll(amount) {
  layer?.querySelectorAll(".stream-frame").forEach((frame) => {
    const animation = frame.getAnimations()[0];
    const timing = animation?.effect.getTiming();
    if (!animation || typeof timing.duration !== "number") return;

    const currentTime = typeof animation.currentTime === "number" ? animation.currentTime : 0;
    const localTime = currentTime - timing.delay;
    const shiftedTime = localTime + amount * timing.duration * 0.00065;
    const wrappedTime = ((shiftedTime % timing.duration) + timing.duration) % timing.duration;
    animation.currentTime = timing.delay + wrappedTime;
  });
}

function ensureCoverage() {
  if (!layer) return;

  const frames = [...layer.querySelectorAll(".stream-frame")];
  const visible = frames.filter((frame) => {
    const progress = frame.getAnimations()[0]?.effect.getComputedTiming().progress;
    return progress != null && progress > 0.18 && progress < 0.82;
  });

  const minimum = 8;
  for (let index = visible.length; index < minimum; index += 1) {
    const frame = frames.find((candidate) => !visible.includes(candidate));
    const animation = frame?.getAnimations()[0];
    const timing = animation?.effect.getTiming();
    if (!frame || !animation || typeof timing.duration !== "number") return;

    randomizeFrame(frame, frame.querySelector("img"));
    const targetProgress = 0.24 + ((index + 1) / (minimum + 1)) * 0.52;
    animation.currentTime = timing.delay + timing.duration * targetProgress;
    visible.push(frame);
  }
}

function updateCoverage(time) {
  const deltaTime = Math.min(time - previousFrameTime, 48);
  previousFrameTime = time;
  const lerp = reducedMotion.matches ? 1 : 1 - Math.exp(-deltaTime * 0.012);
  const nextScroll = scrollCurrent + (scrollTarget - scrollCurrent) * lerp;
  const scrollDelta = nextScroll - scrollCurrent;

  if (Math.abs(scrollDelta) > 0.001) {
    moveWithScroll(scrollDelta);
    scrollCurrent = nextScroll;
  } else {
    scrollCurrent = scrollTarget;
  }

  ensureCoverage();
  coverageFrame = window.requestAnimationFrame(updateCoverage);
}

stage?.addEventListener("wheel", (event) => {
  event.preventDefault();
  scrollTarget += event.deltaY;
}, { passive: false });
stage?.addEventListener("touchstart", (event) => {
  lastTouchY = event.touches[0]?.clientY ?? null;
}, { passive: true });
stage?.addEventListener("touchmove", (event) => {
  const y = event.touches[0]?.clientY;
  if (y == null || lastTouchY == null) return;
  event.preventDefault();
  scrollTarget += lastTouchY - y;
  lastTouchY = y;
}, { passive: false });
stage?.addEventListener("touchend", () => {
  lastTouchY = null;
}, { passive: true });

reducedMotion.addEventListener("change", start);
start();
window.cancelAnimationFrame(coverageFrame);
coverageFrame = window.requestAnimationFrame(updateCoverage);

window.addEventListener("work:before-version-change", () => {
  window.cancelAnimationFrame(coverageFrame);
  reducedMotion.removeEventListener("change", start);
}, { once: true });
