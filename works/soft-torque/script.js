import * as THREE from "three";
import "../_shared/detail-shell.js";

const slides = [
  {
    src: new URL("../../src/assets/images/sunlit-floral-portraits/sunlit-floral-portrait-01.webp", import.meta.url).href,
    primary: "Soft",
    secondary: "Torque",
    caption: "Motion study, I"
  },
  {
    src: new URL("../../src/assets/images/sunlit-floral-portraits/sunlit-floral-portrait-06.webp", import.meta.url).href,
    primary: "Gentle",
    secondary: "Fold",
    caption: "Motion study, II"
  },
  {
    src: new URL("../../src/assets/images/sunlit-floral-portraits/sunlit-floral-portrait-08.webp", import.meta.url).href,
    primary: "Slow",
    secondary: "Arc",
    caption: "Motion study, III"
  },
  {
    src: new URL("../../src/assets/images/sunlit-floral-portraits/sunlit-floral-portrait-04.webp", import.meta.url).href,
    primary: "Quiet",
    secondary: "Twist",
    caption: "Motion study, IV"
  },
  {
    src: new URL("../../src/assets/images/sunlit-floral-portraits/sunlit-floral-portrait-09.webp", import.meta.url).href,
    primary: "Tender",
    secondary: "Turn",
    caption: "Motion study, V"
  }
];

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
const axisTiltInput = document.querySelector("[data-axis-tilt]");
const axisTiltOutput = document.querySelector("[data-axis-tilt-output]");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const coarsePointer = window.matchMedia("(pointer: coarse)");

const vertexShader = `
  uniform float uProgress;
  uniform float uDirection;
  uniform float uAxisTilt;
  varying vec2 vUv;
  varying float vTurn;

  float easeOutExpoBack(float value) {
    float normalizedExpo =
      (1.0 - pow(2.0, -9.0 * value)) /
      (1.0 - pow(2.0, -9.0));
    float overshoot =
      sin(value * 3.14159265) *
      pow(value, 1.35) *
      0.1;
    return normalizedExpo + overshoot;
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
    float current =
      0.5 *
      (1.0 + erfApprox((value - 0.5) / gaussianScale));
    return clamp((current - lower) / (upper - lower), 0.0, 1.0);
  }

  void main() {
    vUv = uv;

    float directedAxisTilt = uAxisTilt * uDirection;
    vec2 axis2d =
      vec2(sin(directedAxisTilt), cos(directedAxisTilt));
    float axisExtent = 0.5 * (abs(axis2d.x) + abs(axis2d.y));
    float axisPosition =
      dot(uv - 0.5, axis2d) /
      (axisExtent * 2.0) +
      0.5;
    float delay = (1.0 - axisPosition) * 0.34;
    float rawLocalProgress = (uProgress - delay) / 0.66;
    float localProgress = gaussianRamp(rawLocalProgress);
    float turn = easeOutExpoBack(localProgress);
    float angle = turn * 3.14159265 * uDirection;

    vec3 axis = vec3(axis2d, 0.0);
    vec3 rotated =
      position * cos(angle) +
      cross(axis, position) * sin(angle) +
      axis * dot(axis, position) * (1.0 - cos(angle));

    float correctionAngle = turn * directedAxisTilt * 2.0;
    float correctionCos = cos(correctionAngle);
    float correctionSin = sin(correctionAngle);
    rotated.xy =
      mat2(
        correctionCos,
        correctionSin,
        -correctionSin,
        correctionCos
      ) *
      rotated.xy;

    vec3 transformed = vec3(rotated.xy, rotated.z * 0.34);

    vTurn = turn;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
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

  vec2 coverUv(vec2 uv, vec2 imageSize) {
    float imageAspect = imageSize.x / imageSize.y;
    float viewportAspect = uViewport.x / uViewport.y;
    vec2 scale = vec2(1.0);

    if (viewportAspect > imageAspect) {
      scale.y = imageAspect / viewportAspect;
    } else {
      scale.x = viewportAspect / imageAspect;
    }

    return (uv - 0.5) * scale + 0.5;
  }

  void main() {
    vec2 fromUv = coverUv(vUv, uFromSize);
    vec2 toUv = coverUv(vec2(1.0 - vUv.x, vUv.y), uToSize);
    vec4 fromColor = texture2D(uFrom, fromUv);
    vec4 toColor = texture2D(uTo, toUv);
    float imageSwitch = smoothstep(0.485, 0.515, vTurn);
    gl_FragColor = mix(fromColor, toColor, imageSwitch);
  }
`;

let renderer;
let scene;
let camera;
let material;
let mesh;
let textures = [];
let index = 0;
let isAnimating = false;
let queuedStep = 0;
let animationRun = 0;
let pointerStart = null;
let previewingNext = false;
let cursorTargetX = window.innerWidth / 2;
let cursorTargetY = window.innerHeight / 2;
let cursorX = cursorTargetX;
let cursorY = cursorTargetY;
let cameraTargetX = 0;
let cameraTargetY = 0;
let cameraX = 0;
let cameraY = 0;
let transitionDuration = 1200;
const cameraShift = {
  x: 0.056,
  y: 0.04
};

function imageSize(texture) {
  return new THREE.Vector2(
    texture.image.naturalWidth || texture.image.width,
    texture.image.naturalHeight || texture.image.height
  );
}

function render() {
  if (renderer && scene && camera) renderer.render(scene, camera);
}

function resize() {
  if (!renderer || !camera || !material || !mesh) return;

  const rect = canvas.getBoundingClientRect();
  const frameRect = frameElement.getBoundingClientRect();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(rect.width, rect.height, false);
  camera.aspect = rect.width / rect.height;
  camera.updateProjectionMatrix();
  mesh.scale.set(frameRect.width / rect.height, frameRect.height / rect.height, 1);
  material.uniforms.uViewport.value.set(frameRect.width, frameRect.height);
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
  if (!material || textures.length === 0) return;

  animationRun += 1;
  isAnimating = false;
  queuedStep = 0;

  const nextIndex = (index + 1) % slides.length;
  setTexturePair(nextIndex, 1);
  material.uniforms.uProgress.value = progress;
  setProgressUi(progress);

  if (progress > 0.001 && progress < 0.6) {
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

function setCursorDirection(clientX) {
  const rect = stage.getBoundingClientRect();
  cursorArrow.textContent = clientX < rect.left + rect.width / 2 ? "←" : "→";
}

function setCameraTarget(clientX, clientY) {
  if (reducedMotion.matches) return;

  const rect = stage.getBoundingClientRect();
  const normalizedX = THREE.MathUtils.clamp((clientX - rect.left) / rect.width * 2 - 1, -1, 1);
  const normalizedY = THREE.MathUtils.clamp((clientY - rect.top) / rect.height * 2 - 1, -1, 1);
  cameraTargetX = normalizedX * cameraShift.x;
  cameraTargetY = -normalizedY * cameraShift.y;
}

function animateCursor() {
  cursorX += (cursorTargetX - cursorX) * 0.18;
  cursorY += (cursorTargetY - cursorY) * 0.18;
  cursor.style.left = `${cursorX}px`;
  cursor.style.top = `${cursorY}px`;

  if (camera) {
    const previousX = cameraX;
    const previousY = cameraY;
    cameraX += (cameraTargetX - cameraX) * 0.075;
    cameraY += (cameraTargetY - cameraY) * 0.075;

    if (Math.abs(cameraX - previousX) > 0.00001 || Math.abs(cameraY - previousY) > 0.00001) {
      camera.position.x = cameraX;
      camera.position.y = cameraY;
      camera.lookAt(0, 0, 0);
      render();
    }
  }

  requestAnimationFrame(animateCursor);
}

function move(step) {
  if (!material || textures.length === 0) return;

  if (isAnimating) {
    queuedStep = Math.sign(step);
    return;
  }

  const direction = Math.sign(step);
  const nextIndex = (index + direction + slides.length) % slides.length;
  const run = ++animationRun;
  const duration = reducedMotion.matches ? 220 : transitionDuration;
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
    material.uniforms.uProgress.value = timeProgress;
    setProgressUi(timeProgress);
    render();

    if (!contentChanged && timeProgress >= 0.6) {
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
    stage.removeAttribute("data-changing");
    render();
    isAnimating = false;

    const nextStep = queuedStep;
    queuedStep = 0;
    if (nextStep) move(nextStep);
  }

  requestAnimationFrame(frame);
}

async function init() {
  try {
    const loader = new THREE.TextureLoader();
    textures = await Promise.all(slides.map((slide) => loader.loadAsync(slide.src)));
    textures.forEach((texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
    });

    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true
    });

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, 1, 0.1, 10);
    camera.position.z = 1;

    material = new THREE.ShaderMaterial({
      uniforms: {
        uFrom: { value: textures[0] },
        uTo: { value: textures[0] },
        uFromSize: { value: imageSize(textures[0]) },
        uToSize: { value: imageSize(textures[0]) },
        uViewport: { value: new THREE.Vector2(1, 1) },
        uProgress: { value: 0 },
        uDirection: { value: 1 },
        uAxisTilt: { value: THREE.MathUtils.degToRad(25) }
      },
      vertexShader,
      fragmentShader,
      side: THREE.DoubleSide
    });

    const visibleHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    const geometry = new THREE.PlaneGeometry(visibleHeight, visibleHeight, 48, 96);
    mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    resize();
    stage.setAttribute("data-webgl-ready", "");
    window.addEventListener("resize", resize);
  } catch (error) {
    console.warn("WebGL slider could not be initialized; keeping the image fallback.", error);
  }
}

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

  if (Math.abs(deltaX) > 42 && Math.abs(deltaX) > Math.abs(deltaY)) {
    move(deltaX < 0 ? 1 : -1);
    return;
  }

  if (event.target.closest(".experiment-nav, .petal-control, .petal-gui, .detail-dialog, .detail-dialog-toggle")) return;

  const rect = stage.getBoundingClientRect();
  move(event.clientX < rect.left + rect.width / 2 ? -1 : 1);
});

stage.addEventListener("pointercancel", () => {
  pointerStart = null;
  cursor.removeAttribute("data-pressed");
});

stage.addEventListener("pointerenter", (event) => {
  if (coarsePointer.matches) return;
  cursorTargetX = event.clientX;
  cursorTargetY = event.clientY;
  cursorX = event.clientX;
  cursorY = event.clientY;
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

  if (event.target.closest(".experiment-nav, .petal-control, .petal-gui, .detail-dialog-toggle")) {
    cursor.removeAttribute("data-visible");
  } else {
    cursor.setAttribute("data-visible", "");
  }
});

stage.addEventListener("pointerleave", () => {
  cursor.removeAttribute("data-visible");
  cameraTargetX = 0;
  cameraTargetY = 0;
});

previousButton.addEventListener("click", (event) => {
  event.stopPropagation();
  move(-1);
});

nextButton.addEventListener("click", (event) => {
  event.stopPropagation();
  move(1);
});

progressInput.addEventListener("input", () => {
  scrubTransition(Number(progressInput.value));
});

progressReset.addEventListener("click", resetProgress);

durationInput.addEventListener("input", () => {
  transitionDuration = Number(durationInput.value);
  durationOutput.value = `${(transitionDuration / 1000).toFixed(1)}s`;
});

axisTiltInput.addEventListener("input", () => {
  const degrees = Number(axisTiltInput.value);
  axisTiltOutput.value = `${degrees}°`;

  if (!material) return;
  material.uniforms.uAxisTilt.value = THREE.MathUtils.degToRad(degrees);
  render();
});

["pointerdown", "pointerup", "click"].forEach((eventName) => {
  gui.addEventListener(eventName, (event) => event.stopPropagation());
});

gui.addEventListener("pointerenter", () => {
  cursor.removeAttribute("data-visible");
});

animateCursor();
init();
