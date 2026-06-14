import { bindReplay } from "../_shared/detail-shell.js";
import { easingFunctions } from "../../src/scripts/easing-functions.js";
import { initSmoothScroll } from "../../src/scripts/smooth-scroll.js";

initSmoothScroll({
  lerp: 0.075,
  wheelMultiplier: 0.88
});

const panels = [...document.querySelectorAll("[data-glitch-panel]")];
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const state = new Map(
  panels.map((panel, index) => [
    panel,
    {
      id: panel.dataset.glitchId || `dummy_${index + 1}`,
      index: index + 1,
      triggered: false,
      animationFrame: null,
      canvas: null,
      scratch: null
    }
  ])
);

function logTrigger(entryState) {
  console.log("[pixel-glitch]", {
    id: entryState.id,
    index: entryState.index,
    triggered: entryState.triggered
  });
}

function ensureCanvas(panel, entryState) {
  if (entryState.canvas) {
    return entryState.canvas;
  }

  const canvas = document.createElement("canvas");
  canvas.className = "pixel-glitch-canvas";
  canvas.setAttribute("aria-hidden", "true");
  (panel.querySelector(".pixel-panel__media") || panel).append(canvas);
  entryState.canvas = canvas;

  return canvas;
}

function resizeCanvas(canvas) {
  const size = canvas.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(1, Math.round(size.width * ratio));
  const height = Math.max(1, Math.round(size.height * ratio));

  canvas.width = width;
  canvas.height = height;

  return { height, width };
}

function drawPixelatedImage(context, scratch, image, width, height, blockSize, flicker) {
  const smallWidth = Math.max(1, Math.round(width / blockSize));
  const smallHeight = Math.max(1, Math.round(height / blockSize));
  const scratchContext = scratch.getContext("2d");

  if (!scratchContext) {
    return;
  }

  scratch.width = smallWidth;
  scratch.height = smallHeight;

  context.clearRect(0, 0, width, height);
  scratchContext.clearRect(0, 0, smallWidth, smallHeight);
  scratchContext.imageSmoothingEnabled = true;
  drawImageCover(scratchContext, image, smallWidth, smallHeight);

  context.imageSmoothingEnabled = false;
  context.globalAlpha = 1;
  context.drawImage(scratch, 0, 0, smallWidth, smallHeight, 0, 0, width, height);

  if (flicker > 0) {
    const sliceCount = 8;
    for (let index = 0; index < sliceCount; index += 1) {
      const y = Math.random() * height;
      const sliceHeight = Math.max(2, Math.random() * 18 * flicker);
      const offset = (Math.random() - 0.5) * blockSize * 3.2;

      context.globalAlpha = 0.28 * flicker;
      context.drawImage(context.canvas, 0, y, width, sliceHeight, offset, y, width, sliceHeight);
    }

    context.globalAlpha = 1;
  }
}

function drawImageCover(context, image, width, height) {
  const imageRatio = image.naturalWidth / image.naturalHeight;
  const canvasRatio = width / height;
  let sourceWidth = image.naturalWidth;
  let sourceHeight = image.naturalHeight;
  let sourceX = 0;
  let sourceY = 0;

  if (imageRatio > canvasRatio) {
    sourceWidth = image.naturalHeight * canvasRatio;
    sourceX = (image.naturalWidth - sourceWidth) / 2;
  } else {
    sourceHeight = image.naturalWidth / canvasRatio;
    sourceY = (image.naturalHeight - sourceHeight) / 2;
  }

  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, width, height);
}

function animateGlitch(panel, entryState) {
  const image = panel.querySelector("img");
  const canvas = ensureCanvas(panel, entryState);
  const scratch = entryState.scratch || document.createElement("canvas");
  const context = canvas.getContext("2d");
  const duration = 1500;
  const blockSizes = [84, 72, 56, 44, 32, 24, 16, 10, 6, 4, 2, 1];
  const startTime = performance.now();
  let lastFlickerStep = -1;
  let flicker = 1;

  if (!image || !context) {
    return;
  }

  entryState.scratch = scratch;
  cancelAnimationFrame(entryState.animationFrame);
  panel.dataset.glitching = "true";
  panel.dataset.triggered = "true";
  panel.dataset.revealed = "false";
  image.style.opacity = "0";
  canvas.style.opacity = "1";

  const render = (time) => {
    const progress = Math.max(0, Math.min((time - startTime) / duration, 1));
    const eased = easingFunctions.easeOutCubic(progress);
    const blockIndex = Math.min(blockSizes.length - 1, Math.floor(eased * blockSizes.length));
    const flickerStep = Math.floor(progress * 18);
    const { height, width } = resizeCanvas(canvas);
    const flickerAmount = progress < 0.68 ? flicker * (1 - progress / 0.68) : 0;

    if (flickerStep !== lastFlickerStep) {
      flicker = Math.random();
      lastFlickerStep = flickerStep;
    }

    drawPixelatedImage(context, scratch, image, width, height, blockSizes[blockIndex], flickerAmount);

    if (progress < 1) {
      entryState.animationFrame = requestAnimationFrame(render);
      return;
    }

    panel.dataset.glitching = "false";
    panel.dataset.revealed = "true";
    image.style.opacity = "1";
    canvas.style.opacity = "0";
    context.clearRect(0, 0, width, height);
  };

  if (image.complete && image.naturalWidth > 0 && image.naturalHeight > 0) {
    entryState.animationFrame = requestAnimationFrame(render);
    return;
  }

  image.decode()
    .then(() => {
      entryState.animationFrame = requestAnimationFrame(render);
    })
    .catch(() => {
      panel.dataset.glitching = "false";
      panel.dataset.revealed = "true";
      image.style.opacity = "1";
      canvas.style.opacity = "0";
    });
}

function triggerPanel(panel, entryState) {
  entryState.triggered = true;
  logTrigger(entryState);

  if (prefersReducedMotion) {
    panel.dataset.triggered = "true";
    panel.dataset.revealed = "true";
    panel.querySelector("img")?.style.setProperty("opacity", "1");
    return;
  }

  animateGlitch(panel, entryState);
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      const entryState = state.get(entry.target);

      if (!entryState || entryState.triggered || !entry.isIntersecting) {
        return;
      }

      triggerPanel(entry.target, entryState);
      observer.unobserve(entry.target);
    });
  },
  {
    root: null,
    rootMargin: "-10% 0px -10% 0px",
    threshold: 0
  }
);

panels.forEach((panel) => observer.observe(panel));

bindReplay(() => {
  state.forEach((entryState, panel) => {
    entryState.triggered = true;
    logTrigger(entryState);
    animateGlitch(panel, entryState);
  });
});
