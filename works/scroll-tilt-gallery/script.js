import "../_shared/detail-shell.js";
import { initSmoothScroll } from "../../src/scripts/smooth-scroll.js";

const smoothScroll = initSmoothScroll({ lerp: 0.075, wheelMultiplier: 0.86 });
const section = document.querySelector("[data-tilt-section]");
const frame = document.querySelector("[data-tilt-frame]");
const chips = [...document.querySelectorAll("[data-tilt-chip]")];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let raf = null;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function update() {
  raf = null;
  const rect = section.getBoundingClientRect();
  const total = Math.max(1, rect.height - window.innerHeight);
  const progress = reducedMotion.matches ? 0.5 : clamp(-rect.top / total, 0, 1);
  const centerProgress = (progress - 0.5) * 2;
  frame.style.setProperty("--stage-y", `${(0.5 - progress) * 520}px`);
  frame.style.setProperty("--stage-tilt", `${centerProgress * 28}deg`);

  chips.forEach((chip, index) => {
    const phase = index / Math.max(1, chips.length - 1);
    const local = clamp((progress - phase) * 2.2 + 0.5, -1, 1);
    chip.style.setProperty("--tilt", `${local * -42}deg`);
    chip.style.setProperty("--z", `${(1 - Math.abs(local)) * 130}px`);
  });
}

function requestUpdate() {
  if (!raf) {
    raf = requestAnimationFrame(update);
  }
}

smoothScroll.onScroll(requestUpdate);
window.addEventListener("resize", requestUpdate);
reducedMotion.addEventListener("change", requestUpdate);
requestUpdate();
