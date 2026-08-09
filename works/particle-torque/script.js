import * as THREE from "three";
import "../_shared/detail-shell.js";

const slides = [
  ["02", "Particle", "Torque", "Torque study, I"],
  ["05", "Silent", "Current", "Torque study, II"],
  ["08", "Pale", "Vortex", "Torque study, III"],
  ["04", "Soft", "Orbit", "Torque study, IV"],
  ["09", "Drift", "Form", "Torque study, V"]
].map(([number, primary, secondary, caption]) => ({
  src: new URL(`../../src/assets/images/misty-veiled-portraits/misty-veiled-portrait-${number}.webp`, import.meta.url).href,
  primary,
  secondary,
  caption
}));

const stage = document.querySelector("[data-stage]");
const frameElement = document.querySelector("[data-frame]");
const canvas = document.querySelector("[data-canvas]");
const fallback = document.querySelector("[data-fallback]");
const currentLabel = document.querySelector("[data-current]");
const primaryTitle = document.querySelector("[data-title-primary]");
const secondaryTitle = document.querySelector("[data-title-secondary]");
const caption = document.querySelector("[data-caption]");
const live = document.querySelector("[data-live]");
const previousButton = document.querySelector("[data-prev]");
const nextButton = document.querySelector("[data-next]");
const cursor = document.querySelector("[data-cursor]");
const cursorArrow = document.querySelector("[data-cursor-arrow]");
const gui = document.querySelector("[data-gui]");
const progressInput = document.querySelector("[data-progress]");
const progressOutput = document.querySelector("[data-progress-output]");
const progressReset = document.querySelector("[data-progress-reset]");
const durationInput = document.querySelector("[data-duration]");
const durationOutput = document.querySelector("[data-duration-output]");
const spiralInput = document.querySelector("[data-spiral]");
const spiralOutput = document.querySelector("[data-spiral-output]");
const noiseInput = document.querySelector("[data-noise-strength]");
const noiseOutput = document.querySelector("[data-noise-output]");
const noiseSettleInput = document.querySelector("[data-noise-settle]");
const noiseSettleOutput = document.querySelector("[data-noise-settle-output]");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const coarsePointer = window.matchMedia("(pointer: coarse)");

const vertexShader = `
  precision highp float;
  uniform float uProgress;
  uniform float uDirection;
  uniform float uSpiral;
  uniform float uNoiseStrength;
  uniform float uNoiseSettle;
  uniform float uAxisTilt;
  uniform float uPixelRatio;
  varying vec2 vUv;
  varying float vTurn;
  varying float vEnergy;

  float easeOutExpo(float value) {
    return
      (1.0 - pow(2.0, -9.0 * value)) /
      (1.0 - pow(2.0, -9.0));
  }

  float erfApprox(float value) {
    float valueSign = sign(value);
    float absoluteValue = abs(value);
    float t = 1.0 / (1.0 + 0.3275911 * absoluteValue);
    float polynomial =
      (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t;
    return valueSign * (1.0 - polynomial * exp(-absoluteValue * absoluteValue));
  }

  float gaussianRamp(float value) {
    if (value <= 0.0) return 0.0;
    if (value >= 1.0) return 1.0;
    float sigma = 0.2;
    float gaussianScale = sigma * 1.41421356;
    float lower = 0.5 * (1.0 + erfApprox(-0.5 / gaussianScale));
    float upper = 0.5 * (1.0 + erfApprox(0.5 / gaussianScale));
    float current = 0.5 * (1.0 + erfApprox((value - 0.5) / gaussianScale));
    return clamp((current - lower) / (upper - lower), 0.0, 1.0);
  }

  float random(vec2 seed) {
    return fract(sin(dot(seed, vec2(127.1, 311.7))) * 43758.5453123);
  }

  void main() {
    vUv = uv;
    float directedAxisTilt = uAxisTilt * uDirection;
    vec2 axis2d = vec2(sin(directedAxisTilt), cos(directedAxisTilt));
    float axisExtent = 0.5 * (abs(axis2d.x) + abs(axis2d.y));
    float axisPosition = dot(uv - 0.5, axis2d) / (axisExtent * 2.0) + 0.5;
    float delay = (1.0 - axisPosition) * 0.34;
    float localBase = gaussianRamp((uProgress - delay) / 0.66);
    float turn = easeOutExpo(localBase);

    float angle = turn * 6.28318531 * uDirection;
    vec3 axis = vec3(axis2d, 0.0);
    vec3 rotated =
      position * cos(angle) +
      cross(axis, position) * sin(angle) +
      axis * dot(axis, position) * (1.0 - cos(angle));

    float correctionAngle = sin(turn * 3.14159265) * directedAxisTilt * 2.0;
    float correctionCos = cos(correctionAngle);
    float correctionSin = sin(correctionAngle);
    rotated.xy =
      mat2(
        correctionCos,
        correctionSin,
        -correctionSin,
        correctionCos
      ) * rotated.xy;

    vec3 surfacePosition = vec3(rotated.xy, rotated.z * 0.34);
    float randomAngle = random(uv * vec2(241.0, 317.0));
    float randomRadius = random(uv.yx * vec2(419.0, 173.0) + 7.3);
    float randomHeight = random(uv * vec2(137.0, 463.0) + 19.1);
    float scatterIn = smoothstep(0.12, 0.34, localBase);
    float scatterOut = 1.0 - smoothstep(uNoiseSettle - 0.25, uNoiseSettle, localBase);
    float scatter = scatterIn * scatterOut;
    float noiseAmount = scatter * uNoiseStrength;

    float noiseAngle = (randomAngle - 0.5) * 3.2 * noiseAmount * uSpiral;
    float noiseCos = cos(noiseAngle);
    float noiseSin = sin(noiseAngle);
    vec3 transformed = surfacePosition;
    transformed.xz = mat2(noiseCos, -noiseSin, noiseSin, noiseCos) * transformed.xz;
    transformed.xz *= mix(1.0, 0.5 + randomRadius * 1.25, noiseAmount);
    transformed.y += (randomHeight - 0.5) * 0.22 * noiseAmount;
    transformed.x += (randomRadius - 0.5) * 0.06 * noiseAmount;
    transformed.z += (randomAngle - 0.5) * 0.14 * noiseAmount;
    float safeScatter = clamp(noiseAmount, 0.0, 1.0);
    transformed.xy *= mix(1.0, 0.82, safeScatter);

    vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = uPixelRatio * (2.65 + scatter * 1.85) * (1.0 / max(0.7, -mvPosition.z));
    vTurn = turn;
    vEnergy = scatter;
  }
`;

const fragmentShader = `
  precision highp float;
  uniform sampler2D uFrom;
  uniform sampler2D uTo;
  uniform vec2 uFromSize;
  uniform vec2 uToSize;
  uniform vec2 uViewport;
  varying vec2 vUv;
  varying float vTurn;
  varying float vEnergy;

  vec2 coverUv(vec2 uv, vec2 imageSize) {
    float imageAspect = imageSize.x / imageSize.y;
    float viewportAspect = uViewport.x / uViewport.y;
    vec2 scale = vec2(1.0);
    if (viewportAspect > imageAspect) scale.y = imageAspect / viewportAspect;
    else scale.x = viewportAspect / imageAspect;
    return (uv - 0.5) * scale + 0.5;
  }

  void main() {
    float distanceToCenter = length(gl_PointCoord - 0.5);
    float circleAlpha = 1.0 - smoothstep(0.35, 0.5, distanceToCenter);
    float particleShape = smoothstep(0.02, 0.35, vEnergy);
    float alpha = mix(1.0, circleAlpha, particleShape);
    vec4 fromColor = texture2D(uFrom, coverUv(vUv, uFromSize));
    float isBack = 1.0 - step(0.0, cos(vTurn * 6.28318531));
    vec2 toUv = vec2(mix(vUv.x, 1.0 - vUv.x, isBack), vUv.y);
    vec4 toColor = texture2D(uTo, coverUv(toUv, uToSize));
    float imageSwitch = smoothstep(0.235, 0.265, vTurn);
    vec3 color = mix(fromColor.rgb, toColor.rgb, imageSwitch);
    color += vEnergy * 0.055;
    gl_FragColor = vec4(color, alpha);
  }
`;

let renderer;
let scene;
let camera;
let material;
let particles;
let textures = [];
let index = 0;
let isAnimating = false;
let queuedStep = 0;
let animationRun = 0;
let pointerStart = null;
let previewingNext = false;
let transitionDuration = 1800;
let cursorTargetX = innerWidth / 2;
let cursorTargetY = innerHeight / 2;
let cursorX = cursorTargetX;
let cursorY = cursorTargetY;
let cameraTargetX = 0;
let cameraTargetY = 0;
let cameraX = 0;
let cameraY = 0;

function imageSize(texture) {
  return new THREE.Vector2(texture.image.naturalWidth || texture.image.width, texture.image.naturalHeight || texture.image.height);
}

function render() {
  if (renderer && scene && camera) renderer.render(scene, camera);
}

function resize() {
  if (!renderer || !camera || !material || !particles) return;
  const rect = canvas.getBoundingClientRect();
  const frameRect = frameElement.getBoundingClientRect();
  const pixelRatio = Math.min(devicePixelRatio, 2);
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(rect.width, rect.height, false);
  camera.aspect = rect.width / rect.height;
  camera.updateProjectionMatrix();
  particles.scale.set(frameRect.width / rect.height, frameRect.height / rect.height, 1);
  material.uniforms.uViewport.value.set(frameRect.width, frameRect.height);
  material.uniforms.uPixelRatio.value = pixelRatio;
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

function setTexturePair(nextIndex, direction = 1) {
  material.uniforms.uFrom.value = textures[index];
  material.uniforms.uTo.value = textures[nextIndex];
  material.uniforms.uFromSize.value.copy(imageSize(textures[index]));
  material.uniforms.uToSize.value.copy(imageSize(textures[nextIndex]));
  material.uniforms.uDirection.value = direction;
}

function scrubTransition(progress) {
  if (!material || !textures.length) return;
  animationRun += 1;
  isAnimating = false;
  queuedStep = 0;
  const nextIndex = (index + 1) % slides.length;
  setTexturePair(nextIndex, 1);
  material.uniforms.uProgress.value = progress;
  setProgressUi(progress);
  stage.toggleAttribute("data-changing", progress > 0.001 && progress < 0.58);
  const shouldPreviewNext = progress >= 0.58;
  if (shouldPreviewNext !== previewingNext) {
    previewingNext = shouldPreviewNext;
    updateContent(shouldPreviewNext ? nextIndex : index);
  }
  render();
}

function move(step) {
  if (!material || !textures.length) return;
  if (isAnimating) {
    queuedStep = Math.sign(step);
    return;
  }
  const direction = Math.sign(step);
  const nextIndex = (index + direction + slides.length) % slides.length;
  const run = ++animationRun;
  const duration = reducedMotion.matches ? 240 : transitionDuration;
  const startedAt = performance.now();
  let contentChanged = false;
  isAnimating = true;
  previewingNext = false;
  setTexturePair(nextIndex, direction);
  material.uniforms.uProgress.value = 0;
  setProgressUi(0);
  stage.setAttribute("data-changing", "");

  function frame(now) {
    if (run !== animationRun) return;
    const timeProgress = Math.min((now - startedAt) / duration, 1);
    const progress = timeProgress;
    material.uniforms.uProgress.value = progress;
    setProgressUi(progress);
    render();
    if (!contentChanged && progress >= 0.58) {
      contentChanged = true;
      updateContent(nextIndex);
      stage.removeAttribute("data-changing");
    }
    if (timeProgress < 1) return requestAnimationFrame(frame);
    index = nextIndex;
    setTexturePair(index, 1);
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

function setCursorDirection(clientX) {
  const rect = stage.getBoundingClientRect();
  cursorArrow.textContent = clientX < rect.left + rect.width / 2 ? "←" : "→";
}

function setCameraTarget(clientX, clientY) {
  if (reducedMotion.matches) return;
  const rect = stage.getBoundingClientRect();
  cameraTargetX = THREE.MathUtils.clamp((clientX - rect.left) / rect.width * 2 - 1, -1, 1) * 0.045;
  cameraTargetY = -THREE.MathUtils.clamp((clientY - rect.top) / rect.height * 2 - 1, -1, 1) * 0.03;
}

function animateCursor() {
  cursorX += (cursorTargetX - cursorX) * 0.18;
  cursorY += (cursorTargetY - cursorY) * 0.18;
  cursor.style.left = `${cursorX}px`;
  cursor.style.top = `${cursorY}px`;
  if (camera) {
    const previousCameraX = cameraX;
    const previousCameraY = cameraY;
    cameraX += (cameraTargetX - cameraX) * 0.075;
    cameraY += (cameraTargetY - cameraY) * 0.075;
    if (Math.abs(cameraX - previousCameraX) > 0.00001 || Math.abs(cameraY - previousCameraY) > 0.00001) {
      camera.position.x = cameraX;
      camera.position.y = cameraY;
      camera.lookAt(0, 0, 0);
      render();
    }
  }
  requestAnimationFrame(animateCursor);
}

async function init() {
  try {
    const loader = new THREE.TextureLoader();
    textures = await Promise.all(slides.map((slide) => loader.loadAsync(slide.src)));
    textures.forEach((texture) => { texture.colorSpace = THREE.SRGBColorSpace; });
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance"
    });
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, 1, 0.1, 10);
    camera.position.z = 1;
    material = new THREE.ShaderMaterial({
      uniforms: {
        uFrom: { value: textures[0] }, uTo: { value: textures[0] },
        uFromSize: { value: imageSize(textures[0]) }, uToSize: { value: imageSize(textures[0]) },
        uViewport: { value: new THREE.Vector2(1, 1) }, uProgress: { value: 0 },
        uDirection: { value: 1 }, uSpiral: { value: 1 },
        uNoiseStrength: { value: 1 }, uNoiseSettle: { value: 0.68 },
        uAxisTilt: { value: THREE.MathUtils.degToRad(25) },
        uPixelRatio: { value: 1 }
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false
    });
    const visibleHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    const compactViewport = coarsePointer.matches || innerWidth < 760;
    const horizontalSegments = compactViewport ? 160 : 220;
    const verticalSegments = compactViewport ? 214 : 294;
    particles = new THREE.Points(
      new THREE.PlaneGeometry(visibleHeight, visibleHeight, horizontalSegments, verticalSegments),
      material
    );
    scene.add(particles);
    resize();
    stage.setAttribute("data-webgl-ready", "");
    addEventListener("resize", resize);
  } catch (error) {
    console.warn("Particle slider could not be initialized; keeping the image fallback.", error);
  }
}

stage.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
    event.preventDefault();
    move(event.key === "ArrowLeft" ? -1 : 1);
  }
});
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
  if (Math.abs(deltaX) > 42 && Math.abs(deltaX) > Math.abs(deltaY)) return move(deltaX < 0 ? 1 : -1);
  if (event.target.closest(".experiment-nav, .petal-control, .petal-gui, .detail-dialog, .detail-dialog-toggle")) return;
  const rect = stage.getBoundingClientRect();
  move(event.clientX < rect.left + rect.width / 2 ? -1 : 1);
});
stage.addEventListener("pointercancel", () => { pointerStart = null; cursor.removeAttribute("data-pressed"); });
stage.addEventListener("pointerenter", (event) => {
  if (coarsePointer.matches) return;
  cursorTargetX = cursorX = event.clientX;
  cursorTargetY = cursorY = event.clientY;
  setCursorDirection(event.clientX);
  setCameraTarget(event.clientX, event.clientY);
  cursor.setAttribute("data-visible", "");
});
stage.addEventListener("pointermove", (event) => {
  if (coarsePointer.matches) return;
  cursorTargetX = event.clientX;
  cursorTargetY = event.clientY;
  setCursorDirection(event.clientX);
  setCameraTarget(event.clientX, event.clientY);
  cursor.toggleAttribute("data-visible", !event.target.closest(".experiment-nav, .petal-control, .petal-gui, .detail-dialog-toggle"));
});
stage.addEventListener("pointerleave", () => { cursor.removeAttribute("data-visible"); cameraTargetX = cameraTargetY = 0; });
previousButton.addEventListener("click", (event) => { event.stopPropagation(); move(-1); });
nextButton.addEventListener("click", (event) => { event.stopPropagation(); move(1); });
progressInput.addEventListener("input", () => scrubTransition(Number(progressInput.value)));
progressReset.addEventListener("click", () => { previewingNext = false; scrubTransition(0); updateContent(index); });
durationInput.addEventListener("input", () => { transitionDuration = Number(durationInput.value); durationOutput.value = `${(transitionDuration / 1000).toFixed(1)}s`; });
spiralInput.addEventListener("input", () => { const value = Number(spiralInput.value); spiralOutput.value = value.toFixed(1); if (material) { material.uniforms.uSpiral.value = value; render(); } });
noiseInput.addEventListener("input", () => {
  const value = Number(noiseInput.value);
  noiseOutput.value = value.toFixed(1);
  if (material) {
    material.uniforms.uNoiseStrength.value = value;
    render();
  }
});
noiseSettleInput.addEventListener("input", () => {
  const value = Number(noiseSettleInput.value);
  noiseSettleOutput.value = `${Math.round(value * 100)}%`;
  if (material) {
    material.uniforms.uNoiseSettle.value = value;
    render();
  }
});
["pointerdown", "pointerup", "click"].forEach((name) => gui.addEventListener(name, (event) => event.stopPropagation()));
gui.addEventListener("pointerenter", () => cursor.removeAttribute("data-visible"));

animateCursor();
init();
