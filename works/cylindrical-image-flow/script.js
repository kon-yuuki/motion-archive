import "../_shared/detail-shell.js";
import { initSmoothScroll } from "../../src/scripts/smooth-scroll.js";

initSmoothScroll({ lerp: 0.08, wheelMultiplier: 0.9 });

const ring = document.querySelector("[data-ring]");
const panels = [...ring.querySelectorAll("figure")];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let rotation = 0;
let lastScroll = window.scrollY;
let velocity = 0;
let lastTime = performance.now();

function render(time) {
  const delta = Math.min(40, time - lastTime) / 16.67;
  const scrollDelta = window.scrollY - lastScroll;
  lastScroll = window.scrollY;
  lastTime = time;

  velocity += scrollDelta * 0.05;
  velocity *= 0.88;
  const base = reducedMotion.matches ? 0 : 0.18;
  rotation += (base + velocity) * delta;
  panels.forEach((panel, index) => {
    const angle = ((rotation + index * (360 / panels.length)) * Math.PI) / 180;
    const depth = (Math.cos(angle) + 1) / 2;
    const x = Math.sin(angle) * Math.min(window.innerWidth * 0.22, 330);
    const y = Math.cos(angle) * 52;
    panel.style.setProperty("--tx", `${x}px`);
    panel.style.setProperty("--ty", `${y}px`);
    panel.style.setProperty("--scale", `${0.48 + depth * 0.52}`);
    panel.style.setProperty("--z", `${Math.round(depth * 100)}`);
    panel.style.opacity = String(0.18 + depth * 0.82);
  });
  requestAnimationFrame(render);
}

requestAnimationFrame(render);
