import * as THREE from "three";
import "../_shared/detail-shell.js";

const slides = [
  { src: new URL("../../src/assets/images/misty-veiled-portraits/misty-veiled-portrait-01.webp", import.meta.url).href, primary: "Veiled", secondary: "Silence", caption: "Soft study, I" },
  { src: new URL("../../src/assets/images/misty-veiled-portraits/misty-veiled-portrait-06.webp", import.meta.url).href, primary: "Faded", secondary: "Memory", caption: "Soft study, II" },
  { src: new URL("../../src/assets/images/misty-veiled-portraits/misty-veiled-portrait-05.webp", import.meta.url).href, primary: "Quiet", secondary: "Gesture", caption: "Soft study, III" },
  { src: new URL("../../src/assets/images/misty-veiled-portraits/misty-veiled-portrait-08.webp", import.meta.url).href, primary: "Pale", secondary: "Distance", caption: "Soft study, IV" },
  { src: new URL("../../src/assets/images/misty-veiled-portraits/misty-veiled-portrait-10.webp", import.meta.url).href, primary: "Still", secondary: "Presence", caption: "Soft study, V" }
];

const stage = document.querySelector("[data-stage]");
const canvas = document.querySelector("[data-canvas]");
const fallback = document.querySelector("[data-fallback]");
const currentLabel = document.querySelector("[data-current]");
const primaryTitle = document.querySelector("[data-title-primary]");
const secondaryTitle = document.querySelector("[data-title-secondary]");
const caption = document.querySelector("[data-caption]");
const live = document.querySelector("[data-live]");
const cursor = document.querySelector("[data-cursor]");
const cursorArrow = document.querySelector("[data-cursor-arrow]");
const previousButton = document.querySelector("[data-prev]");
const nextButton = document.querySelector("[data-next]");
const gui = document.querySelector("[data-gui]");
const progressInput = document.querySelector("[data-progress]");
const progressOutput = document.querySelector("[data-progress-output]");
const progressReset = document.querySelector("[data-progress-reset]");
const copyValuesButton = document.querySelector("[data-copy-values]");
const copyStatus = document.querySelector("[data-copy-status]");
const uniformControls = [...document.querySelectorAll("[data-uniform-control]")];
const coarsePointer = window.matchMedia("(pointer: coarse)");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let index = 0;
let isAnimating = false;
let direction = 1;
let pointerStart = null;
let cursorTargetX = window.innerWidth / 2;
let cursorTargetY = window.innerHeight / 2;
let cursorX = cursorTargetX;
let cursorY = cursorTargetY;
let renderer;
let scene;
let camera;
let material;
let textures = [];
let animationRun = 0;
let previewingNext = false;
let queuedStep = 0;

const vertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;
  uniform sampler2D uFrom;
  uniform sampler2D uTo;
  uniform float uProgress;
  uniform float uDirection;
  uniform vec2 uFromSize;
  uniform vec2 uToSize;
  uniform vec2 uViewport;
  uniform float uTwistStrength;
  uniform float uRippleStrength;
  uniform float uRippleFrequency;
  uniform float uRangeScale;
  uniform float uSlideScale;
  uniform float uWaveScale;
  varying vec2 vUv;

  vec2 coverUv(vec2 uv, vec2 imageSize) {
    float imageAspect = imageSize.x / imageSize.y;
    float viewAspect = uViewport.x / uViewport.y;
    vec2 scale = vec2(1.0);
    if (viewAspect > imageAspect) {
      scale.y = imageAspect / viewAspect;
    } else {
      scale.x = viewAspect / imageAspect;
    }
    return (uv - 0.5) * scale + 0.5;
  }

  void main() {
    float p = uProgress;
    float pulse = sin(p * 3.14159265);
    vec2 centered = vUv - 0.5;
    centered.x *= uViewport.x / uViewport.y;
    float distanceFromCenter = length(centered);
    vec2 radialDirection = normalize(centered + vec2(0.0001));
    float maxRadius = length(vec2(0.5 * uViewport.x / uViewport.y, 0.5));
    float waveEnvelope = pow(pulse, 0.68);
    float waveWidth = mix(0.065, 0.125, waveEnvelope) * uRangeScale;
    float radiusProgress = p - 0.56 * p * (1.0 - p);
    float waveRadius = mix(-waveWidth, maxRadius + waveWidth, radiusProgress);
    float ring = exp(-pow((distanceFromCenter - waveRadius) / waveWidth, 2.0));
    float effectEnvelope =
      smoothstep(0.0, 0.002, uProgress) *
      (1.0 - smoothstep(0.8, 1.0, uProgress));
    float ripple =
      sin((distanceFromCenter - waveRadius) * uRippleFrequency) *
      ring *
      effectEnvelope;
    float outsideWave =
      smoothstep(waveRadius - waveWidth, waveRadius + waveWidth, distanceFromCenter);
    vec2 tangent = vec2(-radialDirection.y, radialDirection.x);

    vec2 fromUv = coverUv(vUv, uFromSize);
    vec2 toUv = coverUv(vUv, uToSize);
    float slideScale = mix(uSlideScale, 1.0, radiusProgress);
    float localWaveScale = mix(slideScale, uWaveScale, outsideWave);
    toUv = (toUv - 0.5) / localWaveScale + 0.5;
    vec2 radialWarp = radialDirection * ripple * uRippleStrength;
    vec2 circularWarp =
      tangent * ring * effectEnvelope * uTwistStrength * uDirection;
    fromUv += radialWarp + circularWarp;
    toUv -= radialWarp * 0.72 - circularWarp;

    float lens = ring * pulse * 0.12;
    fromUv = (fromUv - 0.5) * (1.0 - lens) + 0.5;
    toUv = (toUv - 0.5) * (1.0 + lens * 0.7) + 0.5;

    vec4 fromColor = texture2D(uFrom, fromUv);
    vec4 toColor = texture2D(uTo, toUv);
    float reveal = 1.0 - outsideWave;
    vec3 color = mix(fromColor.rgb, toColor.rgb, reveal);
    color *= 1.0 + ring * 0.045;
    gl_FragColor = vec4(color, 1.0);
  }
`;

function imageSize(texture) {
  const image = texture.image;
  return new THREE.Vector2(
    image.naturalWidth || image.videoWidth || image.width,
    image.naturalHeight || image.videoHeight || image.height
  );
}

function render() {
  if (renderer && scene && camera) renderer.render(scene, camera);
}

function resize() {
  if (!renderer || !material) return;
  const rect = canvas.getBoundingClientRect();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(rect.width, rect.height, false);
  camera.aspect = rect.width / rect.height;
  camera.updateProjectionMatrix();
  material.uniforms.uViewport.value.set(rect.width, rect.height);
  render();
}

function updateContent(nextIndex) {
  const slide = slides[nextIndex];
  currentLabel.textContent = String(nextIndex + 1).padStart(2, "0");
  primaryTitle.textContent = slide.primary;
  secondaryTitle.textContent = slide.secondary;
  caption.textContent = slide.caption;
  fallback.src = slide.src;
  live.textContent = `${nextIndex + 1}枚目、${slide.primary} ${slide.secondary}`;
}

function setProgressUi(progress) {
  progressInput.value = String(progress);
  progressOutput.value = `${Math.round(progress * 100)}%`;
}

function setShaderPair(nextIndex, fromTexture = textures[index]) {
  material.uniforms.uFrom.value = fromTexture;
  material.uniforms.uTo.value = textures[nextIndex];
  material.uniforms.uFromSize.value.copy(imageSize(fromTexture));
  material.uniforms.uToSize.value.copy(imageSize(textures[nextIndex]));
  material.uniforms.uDirection.value = direction;
}

function easeOutExpo(progress) {
  return progress >= 1 ? 1 : 1 - 2 ** (-10 * progress);
}

function move(step) {
  if (textures.length === 0) return;
  if (isAnimating) {
    queuedStep = Math.sign(step);
    return;
  }

  const nextIndex = (index + step + slides.length) % slides.length;
  const run = ++animationRun;
  direction = Math.sign(step);
  isAnimating = true;
  previewingNext = false;
  updateContent(index);
  setProgressUi(0);
  stage.setAttribute("data-changing", "");

  setShaderPair(nextIndex);

  const duration = reducedMotion.matches ? 320 : 2000;
  const startedAt = performance.now();
  let contentChanged = false;

  function frame(now) {
    if (run !== animationRun) return;
    const timeProgress = Math.min((now - startedAt) / duration, 1);
    const visualProgress = easeOutExpo(timeProgress);
    material.uniforms.uProgress.value = visualProgress;
    setProgressUi(visualProgress);
    render();

    if (!contentChanged && visualProgress >= 0.6) {
      contentChanged = true;
      updateContent(nextIndex);
      stage.removeAttribute("data-changing");
    }

    if (timeProgress < 1) {
      requestAnimationFrame(frame);
      return;
    }

    index = nextIndex;
    material.uniforms.uFrom.value = textures[index];
    material.uniforms.uTo.value = textures[index];
    material.uniforms.uFromSize.value.copy(imageSize(textures[index]));
    material.uniforms.uToSize.value.copy(imageSize(textures[index]));
    material.uniforms.uProgress.value = 0;
    setProgressUi(0);
    render();
    isAnimating = false;

    const nextStep = queuedStep;
    queuedStep = 0;
    if (nextStep) move(nextStep);
  }

  requestAnimationFrame(frame);
}

function scrubTransition(progress) {
  if (textures.length === 0) return;
  animationRun += 1;
  isAnimating = false;
  queuedStep = 0;
  direction = 1;

  const nextIndex = (index + 1) % slides.length;
  setShaderPair(nextIndex);
  material.uniforms.uProgress.value = progress;
  setProgressUi(progress);

  if (progress > 0.001 && progress < 0.999) {
    stage.setAttribute("data-changing", "");
  } else {
    stage.removeAttribute("data-changing");
  }

  const shouldPreviewNext = progress >= 0.6;
  if (shouldPreviewNext !== previewingNext) {
    previewingNext = shouldPreviewNext;
    updateContent(shouldPreviewNext ? nextIndex : index);
  }

  render();
}

function resetProgress() {
  previewingNext = false;
  scrubTransition(0);
  updateContent(index);
}

function setDirectionFromPointer(clientX) {
  const rect = stage.getBoundingClientRect();
  direction = clientX < rect.left + rect.width / 2 ? -1 : 1;
  cursorArrow.textContent = direction < 0 ? "←" : "→";
}

function animateCursor() {
  cursorX += (cursorTargetX - cursorX) * 0.18;
  cursorY += (cursorTargetY - cursorY) * 0.18;
  cursor.style.left = `${cursorX}px`;
  cursor.style.top = `${cursorY}px`;
  requestAnimationFrame(animateCursor);
}

stage.addEventListener("pointerenter", (event) => {
  if (coarsePointer.matches) return;
  cursorTargetX = event.clientX;
  cursorTargetY = event.clientY;
  cursorX = event.clientX;
  cursorY = event.clientY;
  setDirectionFromPointer(event.clientX);
  cursor.setAttribute("data-visible", "");
});

stage.addEventListener("pointermove", (event) => {
  if (coarsePointer.matches) return;
  cursorTargetX = event.clientX;
  cursorTargetY = event.clientY;
  setDirectionFromPointer(event.clientX);
});

stage.addEventListener("pointerleave", () => cursor.removeAttribute("data-visible"));
stage.addEventListener("pointerdown", (event) => {
  pointerStart = { x: event.clientX, y: event.clientY };
  if (!coarsePointer.matches) cursor.setAttribute("data-pressed", "");
});
stage.addEventListener("pointerup", (event) => {
  cursor.removeAttribute("data-pressed");
  if (!pointerStart) return;
  const deltaX = event.clientX - pointerStart.x;
  const deltaY = event.clientY - pointerStart.y;
  pointerStart = null;

  if (coarsePointer.matches && Math.abs(deltaX) > 46 && Math.abs(deltaX) > Math.abs(deltaY)) {
    move(deltaX < 0 ? 1 : -1);
    return;
  }

  if (!coarsePointer.matches && event.target.closest(".experiment-nav, .veiled-touch-control")) return;
  if (!coarsePointer.matches) move(direction);
});
stage.addEventListener("pointercancel", () => {
  pointerStart = null;
  cursor.removeAttribute("data-pressed");
});
stage.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    move(-1);
  }
  if (event.key === "ArrowRight") {
    event.preventDefault();
    move(1);
  }
});

previousButton.addEventListener("click", (event) => {
  event.stopPropagation();
  move(-1);
});
nextButton.addEventListener("click", (event) => {
  event.stopPropagation();
  move(1);
});

["pointerdown", "pointerup", "click"].forEach((eventName) => {
  gui.addEventListener(eventName, (event) => event.stopPropagation());
});
gui.addEventListener("pointerenter", () => {
  cursor.removeAttribute("data-visible");
});
gui.addEventListener("pointerleave", (event) => {
  if (coarsePointer.matches) return;
  cursorTargetX = event.clientX;
  cursorTargetY = event.clientY;
  setDirectionFromPointer(event.clientX);
  cursor.setAttribute("data-visible", "");
});
progressInput.addEventListener("input", () => {
  scrubTransition(Number(progressInput.value));
});
progressReset.addEventListener("click", resetProgress);

function getGuiValues() {
  return {
    progress: Number(progressInput.value),
    twist: Number(document.querySelector('[data-uniform-control="uTwistStrength"]').value),
    sineStrength: Number(document.querySelector('[data-uniform-control="uRippleStrength"]').value),
    sineFrequency: Number(document.querySelector('[data-uniform-control="uRippleFrequency"]').value),
    waveRange: Number(document.querySelector('[data-uniform-control="uRangeScale"]').value),
    slideScale: Number(document.querySelector('[data-uniform-control="uSlideScale"]').value),
    waveOutsideScale: Number(document.querySelector('[data-uniform-control="uWaveScale"]').value)
  };
}

copyValuesButton.addEventListener("click", async () => {
  const text = JSON.stringify(getGuiValues(), null, 2);

  try {
    await navigator.clipboard.writeText(text);
    copyStatus.textContent = "Copied";
  } catch {
    copyStatus.textContent = "Copy failed";
  }

  window.setTimeout(() => {
    copyStatus.textContent = "Ready";
  }, 1600);
});

uniformControls.forEach((control) => {
  control.addEventListener("input", () => {
    const uniformName = control.dataset.uniformControl;
    const value = Number(control.value);
    const output = document.querySelector(`[data-uniform-output="${uniformName}"]`);

    if (output) {
      output.value =
        uniformName === "uRippleFrequency"
          ? String(Math.round(value))
          : value.toFixed(["uRangeScale", "uSlideScale", "uWaveScale"].includes(uniformName) ? 2 : 3);
    }
    if (material?.uniforms[uniformName]) {
      material.uniforms[uniformName].value = value;
      render();
    }
  });
});

async function init() {
  const context = canvas.getContext("webgl2") || canvas.getContext("webgl");
  if (!context) {
    stage.setAttribute("data-unsupported", "");
    return;
  }

  const loader = new THREE.TextureLoader();
  textures = await Promise.all(
    slides.map(
      (slide) =>
        new Promise((resolve, reject) => {
          loader.load(slide.src, (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            resolve(texture);
          }, undefined, reject);
        })
    )
  );

  renderer = new THREE.WebGLRenderer({ canvas, context, antialias: true, powerPreference: "high-performance" });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(32, 1, 0.1, 20);
  camera.position.z = 4.66;
  material = new THREE.ShaderMaterial({
    uniforms: {
      uFrom: { value: textures[0] },
      uTo: { value: textures[0] },
      uProgress: { value: 0 },
      uDirection: { value: 1 },
      uFromSize: { value: imageSize(textures[0]) },
      uToSize: { value: imageSize(textures[0]) },
      uViewport: { value: new THREE.Vector2(1, 1) },
      uTwistStrength: { value: Number(document.querySelector('[data-uniform-control="uTwistStrength"]').value) },
      uRippleStrength: { value: Number(document.querySelector('[data-uniform-control="uRippleStrength"]').value) },
      uRippleFrequency: { value: Number(document.querySelector('[data-uniform-control="uRippleFrequency"]').value) },
      uRangeScale: { value: Number(document.querySelector('[data-uniform-control="uRangeScale"]').value) },
      uSlideScale: { value: Number(document.querySelector('[data-uniform-control="uSlideScale"]').value) },
      uWaveScale: { value: Number(document.querySelector('[data-uniform-control="uWaveScale"]').value) }
    },
    vertexShader,
    fragmentShader
  });
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2.675, 96, 128), material));
  resize();
  stage.setAttribute("data-webgl-ready", "");
}

window.addEventListener("resize", resize);
animateCursor();
init().catch(() => stage.setAttribute("data-unsupported", ""));
