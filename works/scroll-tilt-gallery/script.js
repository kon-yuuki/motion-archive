import "../_shared/detail-shell.js";
import { initSmoothScroll } from "../../src/scripts/smooth-scroll.js";

const smoothScroll = initSmoothScroll({ lerp: 0.075, wheelMultiplier: 0.86 });
const section = document.querySelector("[data-tilt-section]");
const frame = document.querySelector("[data-tilt-frame]");
const chips = [...document.querySelectorAll("[data-tilt-chip]")];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let raf = null;

const maxTilt = 58;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function update() {
  raf = null;
  const rect = section.getBoundingClientRect();
  const total = Math.max(1, rect.height - window.innerHeight);
  const progress = reducedMotion.matches ? 0.5 : clamp(-rect.top / total, 0, 1);
  frame.style.setProperty("--stage-y", `${(0.5 - progress) * 520}px`);

  const frameRect = frame.getBoundingClientRect();
  const viewportCenter = window.innerHeight / 2;
  const tiltRange = Math.max(1, window.innerHeight * 0.55);
  chips.forEach((chip) => {
    const chipCenter = frameRect.top + chip.offsetTop;
    const distance = clamp((chipCenter - viewportCenter) / tiltRange, -1, 1);
    const angle = distance * maxTilt;
    chip.style.setProperty("--tilt", `${angle}deg`);
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
