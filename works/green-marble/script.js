import { bindReplay } from "../_shared/detail-shell.js";

const canvas = document.querySelector("[data-marble-canvas]");
const context = canvas.getContext("2d", { alpha: false });
const controls = document.querySelectorAll("[data-control]");
const frame = document.querySelector("[data-marble-frame]");
const slices = document.querySelector("[data-marble-slices]");
const controlsPanel = document.querySelector("[data-controls-panel]");
const controlsToggle = document.querySelector("[data-controls-toggle]");

const renderWidth = 672;
const renderHeight = 378;
const sliceCount = 21;
const sliceWidth = renderWidth / sliceCount;
const settings = {
  flow: 1,
  warp: 1,
  veins: 1,
  spacing: 1,
  randomness: 1,
  density: 1,
  contrast: 1,
  light: 1,
  darkRatio: 1,
  greenRatio: 1,
  whiteRatio: 1,
  speed: 1,
  sliceEase: 1.15,
  rippleGap: 82,
  sliceDuration: 2800
};
let animationFrame = 0;
let seed = Math.random() * 1000;
let startTime = performance.now();
let sliceContexts = [];
let sliceElements = [];

function createSlices() {
  slices.textContent = "";
  sliceContexts = [];
  sliceElements = [];

  for (let index = 0; index < sliceCount; index += 1) {
    const slice = document.createElement("div");
    const sliceCanvas = document.createElement("canvas");
    const distance = Math.abs(index - (sliceCount - 1) / 2);

    slice.className = "marble-slice";
    slice.style.setProperty("--index", index);
    slice.style.setProperty("--distance", distance.toFixed(1));
    sliceCanvas.width = sliceWidth;
    sliceCanvas.height = renderHeight;
    slice.append(sliceCanvas);
    slices.append(slice);
    sliceElements.push(slice);
    sliceContexts.push(sliceCanvas.getContext("2d", { alpha: false }));
  }
}

function fitCanvas() {
  canvas.width = renderWidth;
  canvas.height = renderHeight;

  const bounds = frame.getBoundingClientRect();
  sliceContexts.forEach((sliceContext) => {
    sliceContext.canvas.style.height = `${bounds.height}px`;
  });
}

function wave(value) {
  return (Math.sin(value) + 1) * 0.5;
}

function mix(a, b, amount) {
  return a + (b - a) * amount;
}

function softNoise(x, y, drift) {
  return (
    Math.sin(x * 1.7 + y * 2.9 + drift * 1.3 + seed) +
    Math.sin(x * 4.1 - y * 1.5 - drift * 1.8 + seed * 0.37) * 0.5 +
    Math.cos(x * 2.3 + y * 5.2 + drift * 1.1 + seed * 0.61) * 0.35
  ) / 1.85;
}

function clamp(value, min = 0, max = 255) {
  return Math.max(min, Math.min(max, value));
}

function shade(t, vein, glow) {
  const deep = [88, 50, 28];
  const moss = [158, 100, 61];
  const mint = [217, 167, 112];
  const cream = [255, 249, 232];
  const greenBias = settings.greenRatio / (settings.darkRatio + settings.greenRatio);
  const darkStop = clamp(0.74 - greenBias * 0.32, 0.34, 0.78);
  const contrastTone = clamp(0.5 + (t - 0.5) * settings.contrast + (settings.greenRatio - settings.darkRatio) * 0.08, 0, 1);
  const base = contrastTone < darkStop
    ? deep.map((channel, index) => mix(channel, moss[index], contrastTone / darkStop))
    : moss.map((channel, index) => mix(channel, mint[index], (contrastTone - darkStop) / (1 - darkStop)));
  const whiteLift = Math.pow(clamp(vein, 0, 1), 0.52);
  const whiteMix = clamp((whiteLift * 0.9 + glow * 0.12) * settings.whiteRatio, 0, 1);
  const warmth = [1.01, 0.995, 0.96];
  const color = base.map((channel, index) => mix(channel, cream[index], whiteMix) * settings.light * warmth[index]);

  return color.map((channel) => Math.round(clamp(channel)));
}

function easeInOut(progress) {
  const amount = clamp(settings.sliceEase, 0.1, 3);
  const power = amount + 1.35;

  if (progress < 0.5) {
    return Math.pow(progress * 2, power) / 2;
  }

  return 1 - Math.pow((1 - progress) * 2, power) / 2;
}

function sliceHeightAt(progress) {
  const contractionEnd = 0.42;
  const minimum = 18;
  const full = 100;

  if (progress < contractionEnd) {
    return mix(100, minimum, progress / contractionEnd);
  }

  return mix(minimum, full, (progress - contractionEnd) / (1 - contractionEnd));
}

function updateSliceAnimation(now) {
  const duration = settings.sliceDuration;
  const active = 1;

  sliceElements.forEach((slice, index) => {
    const distance = Math.abs(index - (sliceCount - 1) / 2);
    const delayed = now - startTime - distance * settings.rippleGap;
    const cycle = ((delayed % duration) + duration) % duration;
    const phase = cycle / duration;
    let height = 100;

    if (phase < active) {
      const progress = easeInOut(phase / active);
      height = sliceHeightAt(progress);
    }

    slice.style.setProperty("--slice-height", `${height.toFixed(2)}%`);
  });
}

function formatControlValue(control) {
  const step = control.step || "1";

  if (!step.includes(".")) {
    return String(Math.round(Number(control.value)));
  }

  return Number(control.value).toFixed(step.split(".")[1].length);
}

function syncControls() {
  controls.forEach((control) => {
    const key = control.dataset.control;
    const output = document.querySelector(`[data-output="${key}"]`);
    settings[key] = Number(control.value);
    if (output) {
      output.textContent = formatControlValue(control);
    }
  });

  frame.style.setProperty("--slice-ease", settings.sliceEase);
  frame.style.setProperty("--ripple-gap", `${settings.rippleGap}ms`);
}

function render(now) {
  const time = (now - startTime) * 0.00018 * settings.speed;
  const width = canvas.width;
  const height = canvas.height;
  const image = context.createImageData(width, height);
  const pixels = image.data;
  const scale = (6.7 * settings.density) / width;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const nx = (x - width * 0.5) * scale;
      const ny = (y - height * 0.5) * scale;
      const radius = Math.hypot(nx, ny);
      const drift = time + seed;
      const orbit = Math.sin(nx * 1.9 + drift * 1.1) + Math.cos(ny * 2.3 - drift * 1.4);
      const noise = softNoise(nx, ny, drift) * settings.randomness;
      const localSpacing = clamp(settings.spacing + noise * 0.18, 0.35, 2.8);
      const warpedX = nx + (Math.sin(ny * 3.4 + drift * 3.6 + orbit) * 0.18 + noise * 0.16) * settings.warp;
      const warpedY = ny + (Math.cos(nx * 3.1 - drift * 2.9 - orbit) * 0.18 - noise * 0.13) * settings.warp;
      const curl =
        Math.sin(warpedX * 1.55 + Math.cos(warpedY * 2.05 + drift * 1.8) + drift * 3.1) * settings.flow +
        Math.sin((warpedX + warpedY) * 2.35 - drift * 2.6 + noise * 0.7) * 0.58 +
        Math.cos(radius * 4.3 + orbit * 0.65 + drift * 3.2 + noise) * 0.42;
      const bandFrequency = 5.2 / localSpacing;
      const ribbon = Math.sin((warpedX + curl * 0.42 * settings.warp) * bandFrequency + Math.sin(warpedY * 2.6 + drift * 2.1 + noise) * (2 + settings.flow * 0.52) + drift * 4.7);
      const foam = Math.sin((warpedY - curl * 0.28 * settings.warp) * (8 + settings.density * 4) / localSpacing + Math.cos(warpedX * 4.6 + drift * 1.6 + noise * 1.4) * 1.7);
      const tone = wave(curl * 1.05 + ribbon * 0.68 + foam * 0.08);
      const ribbonWidth = 1.9 + settings.spacing * 1.4;
      const vein = (Math.pow(1 - Math.abs(ribbon), ribbonWidth) * 1.12 + Math.pow(1 - Math.abs(foam), 8) * 0.06) * settings.veins;
      const glow = Math.max(0, 1 - radius / 4.6);
      const [red, green, blue] = shade(tone, vein, glow);
      const index = (y * width + x) * 4;

      pixels[index] = red;
      pixels[index + 1] = green;
      pixels[index + 2] = blue;
      pixels[index + 3] = 255;
    }
  }

  context.putImageData(image, 0, 0);
  sliceContexts.forEach((sliceContext, index) => {
    sliceContext.drawImage(canvas, index * sliceWidth, 0, sliceWidth, renderHeight, 0, 0, sliceWidth, renderHeight);
  });
  updateSliceAnimation(now);
  animationFrame = requestAnimationFrame(render);
}

createSlices();
fitCanvas();
syncControls();
animationFrame = requestAnimationFrame(render);

window.addEventListener("resize", fitCanvas);
controls.forEach((control) => control.addEventListener("input", syncControls));
controlsToggle.addEventListener("click", () => {
  const collapsed = !controlsPanel.hasAttribute("data-collapsed");
  controlsPanel.toggleAttribute("data-collapsed", collapsed);
  controlsToggle.setAttribute("aria-expanded", String(!collapsed));
  controlsToggle.textContent = collapsed ? "Controls +" : "Controls";
});

bindReplay(() => {
  seed = Math.random() * 1000;
  startTime = performance.now();
});

window.addEventListener("pagehide", () => cancelAnimationFrame(animationFrame));
