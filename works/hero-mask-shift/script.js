import "../_shared/detail-shell.js";
import { initSmoothScroll } from "../../src/scripts/smooth-scroll.js";

const smoothScroll = initSmoothScroll({ lerp: 0.09, wheelMultiplier: 0.86 });
const hero = document.querySelector("[data-mask-hero]");
const sticky = document.querySelector("[data-mask-sticky]");
const visual = document.querySelector("[data-mask-visual]");
const card = document.querySelector("[data-mask-photo-card]");
const canvas = document.querySelector("[data-mask-canvas]");
const context = canvas.getContext("2d", { alpha: true, willReadFrequently: true });
const sourceImage = document.querySelector("[data-mask-source]");
const copy = document.querySelector("[data-mask-copy]");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const renderScale = 0.48;
const minDrawInterval = 1000 / 30;
let targetProgress = 0;
let currentProgress = 0;
let currentTextProgress = 0;
let lastDrawTime = 0;
let lastDrawProgress = -1;
let drawState = {
  maskWidth: 1,
  maskHeight: 1,
  radius: 38,
  edgeFade: 0,
  angle: 0,
  progress: 0
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function lerp(from, to, amount) {
  return from + (to - from) * amount;
}

function smoothstep(edge0, edge1, value) {
  const x = clamp((value - edge0) / (edge1 - edge0 || 1), 0, 1);
  return x * x * (3 - 2 * x);
}

function roundedBoxDistance(x, y, width, height, radius) {
  const qx = Math.abs(x - width / 2) - width / 2 + radius;
  const qy = Math.abs(y - height / 2) - height / 2 + radius;
  const outside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0));
  const inside = Math.min(Math.max(qx, qy), 0);
  return outside + inside - radius;
}

function rotatedMaskMetrics(x, y, width, height, boxWidth, boxHeight, radius, angle, cos = Math.cos(-angle), sin = Math.sin(-angle)) {
  const centerX = width / 2;
  const centerY = height / 2;
  const dx = x - centerX;
  const dy = y - centerY;
  const localCenteredX = dx * cos - dy * sin;
  const localCenteredY = dx * sin + dy * cos;
  const distance = -roundedBoxDistance(
    localCenteredX + boxWidth / 2,
    localCenteredY + boxHeight / 2,
    boxWidth,
    boxHeight,
    radius
  );

  return { distance, localCenteredX, localCenteredY };
}

function hash2(x, y, seed) {
  let value = (x * 374_761_393 + y * 668_265_263 + seed * 2_147_483_647) | 0;
  value = (value ^ (value >>> 13)) * 1_274_126_177;
  value = (value ^ (value >>> 16)) >>> 0;
  return value / 4_294_967_295;
}

function valueNoise(x, y, seed) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy, seed);
  const b = hash2(ix + 1, iy, seed);
  const c = hash2(ix, iy + 1, seed);
  const d = hash2(ix + 1, iy + 1, seed);
  return lerp(lerp(a, b, ux), lerp(c, d, ux), uy) * 2 - 1;
}

function animatedValueNoise(x, y, time, seed) {
  return valueNoise(x + time * 0.16, y - time * 0.11, seed) * 0.7
    + valueNoise(x * 1.83 - time * 0.07, y * 1.83 + time * 0.09, seed + 53) * 0.3;
}

function calculateDistortionOffset(metrics, config) {
  const {
    width,
    height,
    centerX,
    centerY,
    invHalfWidth,
    invHalfHeight,
    lensBandWidth,
    lensStrength,
    lensPulse,
    rippleBand,
    timePhase,
    finalReveal,
    angleCos,
    angleSin
  } = config;
  const { distance, localCenteredX, localCenteredY } = metrics;

  if (distance <= 0) {
    return [0, 0];
  }

  const cornerX = Math.abs(metrics.x - centerX) * invHalfWidth;
  const cornerY = Math.abs(metrics.y - centerY) * invHalfHeight;
  const cornerSoftness = 1 - smoothstep(0.72, 1, Math.hypot(cornerX, cornerY) / Math.SQRT2);
  const centerFalloff = 1 - smoothstep(0.58, 1, Math.hypot(cornerX, cornerY) / Math.SQRT2);
  const localNormX = localCenteredX / Math.max(1, config.maskWidth * 0.5);
  const localNormY = localCenteredY / Math.max(1, config.maskHeight * 0.5);
  const localLength = Math.max(0.001, Math.hypot(localNormX, localNormY));
  const localAngle = Math.atan2(localNormY, localNormX);
  const widthJitter = Math.sin(localAngle * 2.7 + timePhase * 0.42) * 0.5
    + Math.sin(localAngle * 5.1 - timePhase * 0.31 + 1.7) * 0.32
    + Math.sin(localAngle * 8.4 + timePhase * 0.23 + 4.1) * 0.18;
  const localLensWidth = lensBandWidth * clamp(0.82 + widthJitter * 0.16, 0.68, 1.08);
  const lensPosition = clamp(distance / localLensWidth, 0, 1);
  const edgeLens = Math.sin(lensPosition * Math.PI) * (1 - smoothstep(0.78, 1, lensPosition));
  const localDirX = localNormX / localLength;
  const localDirY = localNormY / localLength;
  const screenDirX = localDirX * angleCos - localDirY * angleSin;
  const screenDirY = localDirX * angleSin + localDirY * angleCos;
  const edgeRefraction = edgeLens * centerFalloff * cornerSoftness * lensStrength * lensPulse;
  const tangent = edgeLens
    * centerFalloff
    * cornerSoftness
    * lensStrength
    * 0.28
    * Math.sin(timePhase * 1.8 + lensPosition * Math.PI * 1.6);
  const noiseFront = lerp(1.28, -0.08, finalReveal);
  const noiseArea = smoothstep(noiseFront - 0.34, noiseFront + 0.28, localLength);
  const outerDetail = smoothstep(0.16, 1.04, localLength);
  const centerQuiet = smoothstep(0.01, 0.24, localLength);
  const centerPresence = 1 - outerDetail;
  const noiseScale = lerp(0.82, 11.6, outerDetail);
  const noisePower = finalReveal
    * noiseArea
    * lerp(0.58, 1, centerQuiet)
    * lerp(0.56, 1.08, outerDetail)
    * rippleBand
    * 0.5;
  const noiseX = animatedValueNoise(
    localNormX * noiseScale + localAngle * 0.18,
    localNormY * noiseScale,
    timePhase,
    17
  );
  const noiseY = animatedValueNoise(
    localNormX * noiseScale,
    localNormY * noiseScale - localAngle * 0.16,
    timePhase,
    79
  );
  const fineNoiseScale = lerp(3.6, 19.5, outerDetail);
  const fineNoiseX = animatedValueNoise(
    localNormX * fineNoiseScale + localAngle * 0.71,
    localNormY * fineNoiseScale - localAngle * 0.27,
    timePhase * 1.28,
    313
  );
  const fineNoiseY = animatedValueNoise(
    localNormX * fineNoiseScale - localAngle * 0.33,
    localNormY * fineNoiseScale + localAngle * 0.68,
    timePhase * 1.19,
    397
  );
  const directionJitter = animatedValueNoise(
    localNormX * lerp(1.6, 8.8, outerDetail),
    localNormY * lerp(1.6, 8.8, outerDetail),
    timePhase * 0.85,
    131
  ) * Math.PI * lerp(0.65, 1.8, outerDetail);
  const dirCos = Math.cos(directionJitter);
  const dirSin = Math.sin(directionJitter);
  const fineMix = outerDetail * finalReveal;
  const centerNoiseX = animatedValueNoise(localNormX * 0.48, localNormY * 0.48, timePhase * 0.86, 211)
    + animatedValueNoise(localNormX * 1.15, localNormY * 1.15, timePhase * 0.64, 419) * 0.42;
  const centerNoiseY = animatedValueNoise(localNormX * 0.48, localNormY * 0.48, timePhase * 0.86, 283)
    + animatedValueNoise(localNormX * 1.15, localNormY * 1.15, timePhase * 0.64, 467) * 0.42;
  const centerMix = centerPresence * 0.58;
  const combinedX = noiseX * (1 - centerMix) + centerNoiseX * centerMix + fineNoiseX * fineMix * 0.58;
  const combinedY = noiseY * (1 - centerMix) + centerNoiseY * centerMix + fineNoiseY * fineMix * 0.58;
  const randomDirX = combinedX * dirCos - combinedY * dirSin;
  const randomDirY = combinedX * dirSin + combinedY * dirCos;

  return [
    screenDirX * edgeRefraction + -screenDirY * tangent + randomDirX * noisePower,
    screenDirY * edgeRefraction + screenDirX * tangent + randomDirY * noisePower
  ];
}

function createOffsetGrid(width, height, config) {
  const step = 12;
  const columns = Math.ceil(width / step) + 2;
  const rows = Math.ceil(height / step) + 2;
  const values = new Float32Array(columns * rows * 2);

  for (let row = 0; row < rows; row += 1) {
    const y = Math.min(height, row * step);
    for (let column = 0; column < columns; column += 1) {
      const x = Math.min(width, column * step);
      const metrics = rotatedMaskMetrics(
        x,
        y,
        width,
        height,
        config.maskWidth,
        config.maskHeight,
        config.radius,
        config.angle,
        config.maskCos,
        config.maskSin
      );
      metrics.x = x;
      metrics.y = y;
      const [offsetX, offsetY] = calculateDistortionOffset(metrics, config);
      const index = (row * columns + column) * 2;
      values[index] = offsetX;
      values[index + 1] = offsetY;
    }
  }

  return { columns, rows, step, values };
}

function calculateCoverDrawSize(width, height, sourceRatio, sampleMargin) {
  const canvasRatio = width / height;
  let baseWidth = width;
  let baseHeight = height;

  if (sourceRatio > canvasRatio) {
    baseWidth = baseHeight * sourceRatio;
  } else {
    baseHeight = baseWidth / sourceRatio;
  }

  const requiredScale = Math.max(
    1,
    (width + sampleMargin * 2) / baseWidth,
    (height + sampleMargin * 2) / baseHeight
  );

  return {
    width: baseWidth * requiredScale,
    height: baseHeight * requiredScale
  };
}

function calculateStableSampleMargin(lensStrength, rippleBand, finalNoiseSpread) {
  const edgeMargin = lensStrength * 1.34;
  const noiseMargin = rippleBand * (0.72 + finalNoiseSpread * 0.42);
  return Math.ceil(edgeMargin + noiseMargin + 4);
}

function calculateMaskAlpha(x, y, config) {
  const distance = calculateMaskDistance(x, y, config);

  if (config.edgeFade > 0) {
    return smoothstep(0, config.edgeFade, distance);
  }

  return distance >= 0 ? 1 : 0;
}

function calculateMaskDistance(x, y, config) {
  const metrics = rotatedMaskMetrics(
    x,
    y,
    config.width,
    config.height,
    config.maskWidth,
    config.maskHeight,
    config.radius,
    config.angle,
    config.maskCos,
    config.maskSin
  );

  return metrics.distance;
}

function calculateAntialiasedMaskAlpha(x, y, config) {
  const distance = calculateMaskDistance(x, y, config);
  const alpha = config.edgeFade > 0
    ? smoothstep(0, config.edgeFade, distance)
    : distance >= 0 ? 1 : 0;

  if (config.edgeFade > 0 || Math.abs(distance) > 1.8) {
    return alpha;
  }

  const sampleOffset = 1.05;
  return (
    calculateMaskAlpha(x - sampleOffset, y - sampleOffset, config)
    + calculateMaskAlpha(x + sampleOffset, y - sampleOffset, config)
    + calculateMaskAlpha(x - sampleOffset, y + sampleOffset, config)
    + calculateMaskAlpha(x + sampleOffset, y + sampleOffset, config)
  ) * 0.25;
}

function sampleOffsetGrid(grid, x, y) {
  const gx = clamp(x / grid.step, 0, grid.columns - 1.001);
  const gy = clamp(y / grid.step, 0, grid.rows - 1.001);
  const x0 = Math.floor(gx);
  const y0 = Math.floor(gy);
  const x1 = Math.min(grid.columns - 1, x0 + 1);
  const y1 = Math.min(grid.rows - 1, y0 + 1);
  const tx = gx - x0;
  const ty = gy - y0;
  const i00 = (y0 * grid.columns + x0) * 2;
  const i10 = (y0 * grid.columns + x1) * 2;
  const i01 = (y1 * grid.columns + x0) * 2;
  const i11 = (y1 * grid.columns + x1) * 2;
  const topX = lerp(grid.values[i00], grid.values[i10], tx);
  const bottomX = lerp(grid.values[i01], grid.values[i11], tx);
  const topY = lerp(grid.values[i00 + 1], grid.values[i10 + 1], tx);
  const bottomY = lerp(grid.values[i01 + 1], grid.values[i11 + 1], tx);

  return [lerp(topX, bottomX, ty), lerp(topY, bottomY, ty)];
}

function sampleBilinear(data, width, height, x, y, target, index, alpha) {
  const sx = clamp(x, 0, width - 1);
  const sy = clamp(y, 0, height - 1);
  const x0 = Math.floor(sx);
  const y0 = Math.floor(sy);
  const x1 = Math.min(width - 1, x0 + 1);
  const y1 = Math.min(height - 1, y0 + 1);
  const tx = sx - x0;
  const ty = sy - y0;
  const i00 = (y0 * width + x0) * 4;
  const i10 = (y0 * width + x1) * 4;
  const i01 = (y1 * width + x0) * 4;
  const i11 = (y1 * width + x1) * 4;

  for (let channel = 0; channel < 4; channel += 1) {
    const top = lerp(data[i00 + channel], data[i10 + channel], tx);
    const bottom = lerp(data[i01 + channel], data[i11 + channel], tx);
    target[index + channel] = channel === 3
      ? Math.round(lerp(top, bottom, ty) * alpha)
      : Math.round(lerp(top, bottom, ty));
  }
}

function drawCanvas(time = performance.now()) {
  const dpr = renderScale;
  const width = Math.max(1, Math.round(window.innerWidth));
  const height = Math.max(1, Math.round(window.innerHeight));
  const pixelWidth = Math.round(width * dpr);
  const pixelHeight = Math.round(height * dpr);

  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }

  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, width, height);

  if (!sourceImage.complete || sourceImage.naturalWidth === 0) {
    return;
  }

  const sourceRatio = sourceImage.naturalWidth / sourceImage.naturalHeight;
  const edgeFade = drawState.edgeFade;
  const rippleBand = drawState.rippleBand;
  const radius = drawState.radius;
  const centerX = width / 2;
  const centerY = height / 2;
  const invHalfWidth = 1 / Math.max(1, width / 2);
  const invHalfHeight = 1 / Math.max(1, height / 2);
  const timePhase = time * 0.001;
  const edgeDistortion = edgeFade * 0.18;
  const lensStrength = (rippleBand * 1.25 + edgeDistortion) * drawState.progress;
  const finalNoiseSpread = smoothstep(0.48, 0.98, drawState.progress);
  const lensBandWidth = Math.max(1, Math.min(edgeFade * 0.56, 104) + rippleBand * (0.74 + finalNoiseSpread * 1.25));
  const lensPulse = 0.68 + Math.sin(timePhase * 1.35) * 0.32;
  const angleCos = Math.cos(drawState.angle);
  const angleSin = Math.sin(drawState.angle);
  const maskCos = Math.cos(-drawState.angle);
  const maskSin = Math.sin(-drawState.angle);
  const offsetGrid = createOffsetGrid(width, height, {
    width,
    height,
    centerX,
    centerY,
    invHalfWidth,
    invHalfHeight,
    maskWidth: drawState.maskWidth,
    maskHeight: drawState.maskHeight,
    radius,
    angle: drawState.angle,
    maskCos,
    maskSin,
    angleCos,
    angleSin,
    lensBandWidth,
    lensStrength,
    lensPulse,
    rippleBand,
    timePhase,
    finalReveal: finalNoiseSpread,
    progress: drawState.progress
  });
  const sampleMargin = calculateStableSampleMargin(lensStrength, rippleBand, finalNoiseSpread);
  const drawSize = calculateCoverDrawSize(width, height, sourceRatio, sampleMargin);
  context.filter = "brightness(0.9) saturate(0.96)";
  context.drawImage(
    sourceImage,
    (width - drawSize.width) / 2,
    (height - drawSize.height) / 2,
    drawSize.width,
    drawSize.height
  );
  context.filter = "none";

  const source = context.getImageData(0, 0, pixelWidth, pixelHeight);
  const sourceData = source.data;
  const output = context.createImageData(pixelWidth, pixelHeight);
  const data = output.data;
  const alphaConfig = {
    width,
    height,
    maskWidth: drawState.maskWidth,
    maskHeight: drawState.maskHeight,
    radius,
    angle: drawState.angle,
    maskCos,
    maskSin,
    edgeFade,
    progress: drawState.progress
  };

  for (let py = 0; py < pixelHeight; py += 1) {
    const y = py / dpr;
    for (let px = 0; px < pixelWidth; px += 1) {
      const x = px / dpr;
      const baseAlpha = calculateAntialiasedMaskAlpha(x, y, alphaConfig);
      const index = (py * pixelWidth + px) * 4;

      if (baseAlpha <= 0) {
        continue;
      }

      const alpha = baseAlpha;
      const [offsetX, offsetY] = sampleOffsetGrid(offsetGrid, x, y);
      sampleBilinear(
        sourceData,
        pixelWidth,
        pixelHeight,
        px + offsetX * dpr,
        py + offsetY * dpr,
        data,
        index,
        alpha
      );
    }
  }

  context.setTransform(1, 0, 0, 1, 0, 0);
  context.putImageData(output, 0, 0);
}

function readScrollState() {
  const rect = hero.getBoundingClientRect();
  const total = Math.max(1, rect.height - window.innerHeight);
  targetProgress = reducedMotion.matches ? 0 : clamp(-rect.top / total, 0, 1);
}

function applyProgress(progress) {
  const eased = 1 - Math.pow(1 - progress, 3);
  const targetTextProgress = clamp(progress / 0.2, 0, 1);
  currentTextProgress = reducedMotion.matches
    ? targetTextProgress
    : lerp(currentTextProgress, targetTextProgress, 0.11);

  if (Math.abs(currentTextProgress - targetTextProgress) < 0.0008) {
    currentTextProgress = targetTextProgress;
  }

  const textProgress = currentTextProgress;
  const textEased = smoothstep(0, 1, textProgress);
  const open = clamp((progress - 0.08) / 0.58, 0, 1);
  const revealNext = clamp((progress - 0.92) / 0.08, 0, 1);

  sticky.style.setProperty("--hero-opacity", `${1 - revealNext}`);
  sticky.style.setProperty("--photo-blur", `${14 - open * 7}px`);
  sticky.style.setProperty("--photo-bg-scale", `${1.12 + eased * 0.1}`);
  visual.style.setProperty("--visual-scale", `${1 + eased * 0.42}`);

  const rotateStart = 0.05;
  const turnProgress = 1 - Math.pow(1 - clamp((progress - rotateStart) / 0.57, 0, 1), 2.4);
  const growProgress = smoothstep(0, 1, clamp(progress / 0.92, 0, 1));
  const maskTurn = turnProgress;
  const initialAspect = 0.68;
  const targetInitialWidth = window.innerWidth * 0.38;
  const maxInitialHeight = Math.min(window.innerHeight * 0.62, 640);
  const initialHeight = Math.min(targetInitialWidth / initialAspect, maxInitialHeight);
  const initialWidth = initialHeight * initialAspect;
  const finalWidth = window.innerHeight * 1.68;
  const finalHeight = window.innerWidth * 1.68;
  const maskWidth = lerp(initialWidth, finalWidth, growProgress);
  const maskHeight = lerp(initialHeight, finalHeight, growProgress);
  const edgeFade = lerp(0, 232, smoothstep(0, 1, clamp((progress - rotateStart) / 0.34, 0, 1)));
  const rippleBand = lerp(0, 52, clamp((progress - rotateStart) / 0.36, 0, 1));
  const maskRadius = clamp(
    lerp(72, Math.min(maskWidth, maskHeight) * 0.32, growProgress) + edgeFade * 0.72,
    72,
    Math.min(maskWidth, maskHeight) * 0.48
  );
  card.style.setProperty("--edge-fade", `${edgeFade}px`);
  drawState = {
    maskWidth,
    maskHeight,
    radius: maskRadius,
    edgeFade,
    rippleBand,
    angle: maskTurn * Math.PI / -4,
    progress
  };
  copy.style.setProperty("--copy-scale", `${1 + textEased * 16.4}`);
  copy.style.opacity = String(1 - textProgress);
}

function render() {
  const now = performance.now();
  readScrollState();

  if (reducedMotion.matches) {
    currentProgress = targetProgress;
  } else {
    currentProgress = lerp(currentProgress, targetProgress, 0.14);

    if (Math.abs(currentProgress - targetProgress) < 0.0005) {
      currentProgress = targetProgress;
    }
  }

  applyProgress(currentProgress);
  const shouldDraw = now - lastDrawTime >= minDrawInterval
    || Math.abs(currentProgress - lastDrawProgress) > 0.002;
  if (shouldDraw) {
    drawCanvas(now);
    lastDrawTime = now;
    lastDrawProgress = currentProgress;
  }
  requestAnimationFrame(render);
}

smoothScroll.onScroll(readScrollState);
window.addEventListener("resize", readScrollState);
reducedMotion.addEventListener("change", readScrollState);
readScrollState();
currentProgress = targetProgress;
currentTextProgress = clamp(currentProgress / 0.2, 0, 1);
applyProgress(currentProgress);
drawCanvas();
requestAnimationFrame(render);
