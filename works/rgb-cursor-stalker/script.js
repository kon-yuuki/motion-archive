import * as THREE from "three";
import "../_shared/detail-shell.js";

const stage = document.querySelector("[data-rgb-stage]");
const canvas = document.querySelector("[data-rgb-canvas]");
const cursor = document.querySelector("[data-rgb-cursor]");
const cards = [...document.querySelectorAll("[data-rgb-card]")];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

const vertexShader = `
  varying vec2 vUv;
  varying vec2 vScreen;
  varying float vWarp;
  varying float vLift;
  uniform vec2 uResolution;
  uniform vec2 uMouse;
  uniform float uPointer;
  uniform float uRadius;
  uniform float uPull;
  uniform float uLiftAmount;

  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vec2 screenPosition = vec2(worldPosition.x + uResolution.x * 0.5, uResolution.y * 0.5 - worldPosition.y);
    vec2 fromMouse = screenPosition - uMouse;
    float distanceToMouse = length(fromMouse);
    vec2 radialDirection = distanceToMouse > 0.001 ? fromMouse / distanceToMouse : vec2(0.0);
    float influence = smoothstep(uRadius, 0.0, distanceToMouse) * uPointer;
    float core = smoothstep(uRadius * 0.55, 0.0, distanceToMouse) * uPointer;
    float warp = influence;

    worldPosition.xy += vec2(radialDirection.x, -radialDirection.y) * warp * uPull;
    worldPosition.z += core * uLiftAmount;

    vUv = uv;
    vScreen = vec2(worldPosition.x + uResolution.x * 0.5, uResolution.y * 0.5 - worldPosition.y);
    vWarp = warp;
    vLift = core;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const fragmentShader = `
  precision highp float;

  uniform sampler2D uTexture;
  uniform vec2 uTextureSize;
  uniform vec2 uPlaneSize;
  uniform vec2 uObjectPosition;
  uniform vec2 uMouse;
  uniform float uPointer;
  uniform float uRadius;
  uniform float uShift;
  varying vec2 vUv;
  varying vec2 vScreen;
  varying float vWarp;
  varying float vLift;

  vec2 coverUv(vec2 uv) {
    float planeAspect = uPlaneSize.x / uPlaneSize.y;
    float imageAspect = uTextureSize.x / uTextureSize.y;
    vec2 visible = vec2(1.0);

    if (imageAspect > planeAspect) {
      visible.x = planeAspect / imageAspect;
    } else {
      visible.y = imageAspect / planeAspect;
    }

    vec2 offset = uObjectPosition * (1.0 - visible);
    return uv * visible + offset;
  }

  void main() {
    vec2 fromMouse = vScreen - uMouse;
    float distanceToMouse = length(fromMouse);
    float influence = smoothstep(uRadius, 0.0, distanceToMouse) * uPointer;
    vec2 radialDirection = distanceToMouse > 0.001 ? fromMouse / distanceToMouse : vec2(0.0);
    vec2 suctionUv = vUv - vec2(radialDirection.x, -radialDirection.y) * influence * 0.035;
    vec2 uv = coverUv(clamp(suctionUv, vec2(0.001), vec2(0.999)));
    vec2 channelOffset = radialDirection * (influence * uShift + vLift * uShift * 1.45) / uTextureSize;

    vec4 base = texture2D(uTexture, uv);
    float red = texture2D(uTexture, clamp(uv + channelOffset, vec2(0.001), vec2(0.999))).r;
    float blue = texture2D(uTexture, clamp(uv - channelOffset, vec2(0.001), vec2(0.999))).b;
    vec3 color = vec3(red, base.g, blue);

    color *= 0.96 + vWarp * 0.05 + vLift * 0.08;
    gl_FragColor = vec4(color, 1.0);
  }
`;

function parseObjectPosition(value) {
  const [x = "50%", y = "50%"] = value.split(/\s+/);
  return [parsePositionToken(x), parsePositionToken(y)];
}

function parsePositionToken(token) {
  if (token === "left" || token === "top") return 0;
  if (token === "right" || token === "bottom") return 1;
  if (token === "center") return 0.5;
  if (token.endsWith("%")) return Number.parseFloat(token) / 100;
  return 0.5;
}

function createImageMaterial(texture, image, objectPosition) {
  return new THREE.ShaderMaterial({
    depthTest: false,
    depthWrite: false,
    transparent: false,
    uniforms: {
      uTexture: { value: texture },
      uTextureSize: { value: new THREE.Vector2(image.naturalWidth || image.width, image.naturalHeight || image.height) },
      uPlaneSize: { value: new THREE.Vector2(1, 1) },
      uObjectPosition: { value: new THREE.Vector2(objectPosition[0], objectPosition[1]) },
      uMouse: { value: new THREE.Vector2(-10000, -10000) },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uPointer: { value: 0 },
      uRadius: { value: reducedMotion.matches ? 0 : 170 },
      uShift: { value: reducedMotion.matches ? 0 : 48 },
      uPull: { value: reducedMotion.matches ? 0 : 38 },
      uLiftAmount: { value: reducedMotion.matches ? 0 : 82 }
    },
    vertexShader,
    fragmentShader
  });
}

async function initRgbScene() {
  if (!stage || !canvas || cards.length === 0 || !finePointer.matches || !window.WebGLRenderingContext) {
    return null;
  }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      canvas,
      preserveDrawingBuffer: new URLSearchParams(window.location.search).has("verifyCanvas"),
      powerPreference: "high-performance"
    });
  } catch {
    return null;
  }

  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 1, 5000);
  camera.position.z = 1;

  const loader = new THREE.TextureLoader();
  const geometry = new THREE.PlaneGeometry(1, 1, 56, 56);
  const entries = await Promise.all(
    cards.map(async (card) => {
      const image = card.querySelector("img");
      const texture = await loader.loadAsync(image.currentSrc || image.src);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);

      const objectPosition = parseObjectPosition(getComputedStyle(image).objectPosition);
      const material = createImageMaterial(texture, image, objectPosition);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.frustumCulled = false;
      scene.add(mesh);

      return { card, image, material, mesh, texture, targetPointer: 0, currentPointer: 0 };
    })
  );

  const resolution = new THREE.Vector2(1, 1);
  const targetMouse = new THREE.Vector2(-10000, -10000);
  const currentMouse = new THREE.Vector2(-10000, -10000);
  const previousMouse = new THREE.Vector2(-10000, -10000);
  let animationFrame = 0;
  let hasPointer = false;

  function resize() {
    const stageRect = stage.getBoundingClientRect();
    const width = Math.max(1, stage.clientWidth);
    const height = Math.max(1, stage.clientHeight);
    const pixelRatio = Math.min(window.devicePixelRatio, 1.75);

    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height, false);
    resolution.set(width, height);

    camera.aspect = width / height;
    camera.position.z = height / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
    camera.far = Math.max(5000, camera.position.z + 2000);
    camera.updateProjectionMatrix();

    entries.forEach(({ card, image, material, mesh }) => {
      const rect = card.getBoundingClientRect();
      const x = rect.left - stageRect.left + rect.width / 2 - width / 2;
      const y = height / 2 - (rect.top - stageRect.top + rect.height / 2);
      mesh.position.set(x, y, 0);
      mesh.scale.set(Math.max(1, rect.width), Math.max(1, rect.height), 1);
      material.uniforms.uPlaneSize.value.set(Math.max(1, rect.width), Math.max(1, rect.height));
      material.uniforms.uResolution.value.copy(resolution);
      const objectPosition = parseObjectPosition(getComputedStyle(image).objectPosition);
      material.uniforms.uObjectPosition.value.set(objectPosition[0], objectPosition[1]);
    });
  }

  function movePointer(event) {
    if (event.pointerType && event.pointerType !== "mouse" && event.pointerType !== "pen") {
      return;
    }

    const rect = stage.getBoundingClientRect();
    targetMouse.set(event.clientX - rect.left, event.clientY - rect.top);
    const movement = hasPointer ? targetMouse.distanceTo(previousMouse) : 0;
    const motion = reducedMotion.matches ? 0 : Math.min(1, movement / 34);
    previousMouse.copy(targetMouse);
    if (!hasPointer) {
      currentMouse.copy(targetMouse);
      hasPointer = true;
    }
    stage.setAttribute("data-cursor-active", "");
    entries.forEach((entry) => {
      const cardRect = entry.card.getBoundingClientRect();
      const inside = event.clientX >= cardRect.left &&
        event.clientX <= cardRect.right &&
        event.clientY >= cardRect.top &&
        event.clientY <= cardRect.bottom;
      entry.targetPointer = inside ? Math.max(entry.targetPointer, motion) : 0;
    });
  }

  function leavePointer() {
    hasPointer = false;
    stage.removeAttribute("data-cursor-active");
    entries.forEach((entry) => {
      entry.targetPointer = 0;
    });
  }

  function render() {
    currentMouse.lerp(targetMouse, 0.18);

    entries.forEach((entry) => {
      const { material } = entry;
      entry.targetPointer *= 0.86;
      entry.currentPointer += (entry.targetPointer - entry.currentPointer) * 0.16;
      material.uniforms.uMouse.value.copy(currentMouse);
      material.uniforms.uPointer.value = entry.currentPointer;
    });

    if (cursor && hasPointer) {
      cursor.style.left = `${currentMouse.x}px`;
      cursor.style.top = `${currentMouse.y}px`;
    }

    renderer.render(scene, camera);
    animationFrame = requestAnimationFrame(render);
  }

  resize();
  window.addEventListener("resize", resize);
  stage.addEventListener("pointermove", movePointer);
  stage.addEventListener("pointerleave", leavePointer);
  stage.setAttribute("data-webgl-ready", "");
  animationFrame = requestAnimationFrame(render);

  return {
    destroy() {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      stage.removeEventListener("pointermove", movePointer);
      stage.removeEventListener("pointerleave", leavePointer);
      stage.removeAttribute("data-cursor-active");
      geometry.dispose();
      entries.forEach(({ material, texture }) => {
        material.dispose();
        texture.dispose();
      });
      renderer.dispose();
    }
  };
}

initRgbScene();
