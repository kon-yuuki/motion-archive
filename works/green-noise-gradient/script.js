import "../_shared/detail-shell.js";

const canvas = document.querySelector("[data-noise-canvas]");
const stage = document.querySelector(".noise-stage");
const context = canvas.getContext("2d", { alpha: true, willReadFrequently: true });
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let width = 0;
let height = 0;
let frame = 0;

function resize() {
  width = Math.max(360, Math.floor(window.innerWidth / 2));
  height = Math.max(320, Math.floor(window.innerHeight / 2));
  canvas.width = width;
  canvas.height = height;
}

function radial(x, y, radius, color) {
  const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
}

function grain(seed) {
  const image = context.getImageData(0, 0, width, height);
  const data = image.data;
  for (let index = 0; index < data.length; index += 4) {
    const value = (Math.random() * 34) - 17;
    data[index] += value;
    data[index + 1] += value;
    data[index + 2] += value;
    data[index + 3] = 255;
  }
  context.putImageData(image, 0, 0);
}

function render(time = 0) {
  const t = reducedMotion.matches ? 0.4 : time * 0.00018;
  context.clearRect(0, 0, width, height);
  const base = context.createLinearGradient(0, 0, width, height);
  base.addColorStop(0, "#17ec61");
  base.addColorStop(0.42, "#00c847");
  base.addColorStop(1, "#00a634");
  context.fillStyle = base;
  context.fillRect(0, 0, width, height);
  radial(width * (0.18 + Math.sin(t * 2.1) * 0.08), height * (0.2 + Math.cos(t * 1.4) * 0.12), width * 0.42, "rgba(235,255,225,0.58)");
  radial(width * (0.46 + Math.sin(t * 1.5) * 0.12), height * (0.52 + Math.cos(t * 2.2) * 0.1), width * 0.36, "rgba(0,112,44,0.42)");
  radial(width * (0.78 + Math.cos(t * 1.9) * 0.1), height * (0.7 + Math.sin(t * 1.2) * 0.12), width * 0.5, "rgba(205,255,198,0.5)");
  radial(width * (0.56 + Math.cos(t * 1.1) * 0.08), height * (0.35 + Math.sin(t * 1.8) * 0.1), width * 0.32, "rgba(0,160,62,0.48)");
  grain(Math.floor(frame / 2));
  stage.style.setProperty("--ring-rotate", `${Math.sin(t) * 22}deg`);
  frame += 1;
  requestAnimationFrame(render);
}

window.addEventListener("resize", resize);
resize();
render();
