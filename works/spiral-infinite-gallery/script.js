import * as THREE from "three";
import "../_shared/detail-shell.js";

const stage = document.querySelector("[data-spiral]");
const canvas = document.querySelector("[data-spiral-canvas]");
const currentLabel = document.querySelector("[data-current]");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const imageSources = [
  new URL("../../src/assets/images/sunlit-floral-portraits/sunlit-floral-portrait-01.webp", import.meta.url).href,
  new URL("../../src/assets/images/warm-neutral-tailoring/camel-coat-profile.webp", import.meta.url).href,
  new URL("../../src/assets/images/misty-veiled-portraits/misty-veiled-portrait-03.webp", import.meta.url).href,
  new URL("../../src/assets/images/sunlit-floral-portraits/sunlit-floral-portrait-05.webp", import.meta.url).href,
  new URL("../../src/assets/images/warm-neutral-tailoring/ivory-cream-seated-stool.webp", import.meta.url).href,
  new URL("../../src/assets/images/misty-veiled-portraits/misty-veiled-portrait-08.webp", import.meta.url).href,
  new URL("../../src/assets/images/sunlit-floral-portraits/sunlit-floral-portrait-09.webp", import.meta.url).href,
  new URL("../../src/assets/images/warm-neutral-tailoring/chocolate-brown-back-view.webp", import.meta.url).href,
  new URL("../../src/assets/images/misty-veiled-portraits/misty-veiled-portrait-06.webp", import.meta.url).href,
  new URL("../../src/assets/images/warm-neutral-tailoring/ivory-cream-standing-long.webp", import.meta.url).href
];

const vertexShader = `
  uniform float uCurveRadius;
  uniform float uEdgePull;
  uniform float uPlaneHeight;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 p = position;
    float curveAngle = p.x / uCurveRadius;
    p.x = sin(curveAngle) * uCurveRadius;
    p.z += (cos(curveAngle) - 1.0) * uCurveRadius;
    float halfHeight = uPlaneHeight * 0.5;
    float pullAmount = abs(uEdgePull);
    float sagitta = max(pullAmount, 0.0001);
    float arcRadius = (halfHeight * halfHeight + sagitta * sagitta) / (2.0 * sagitta);
    float arcDepth = arcRadius - sqrt(max(arcRadius * arcRadius - p.y * p.y, 0.0));
    p.z -= arcDepth * sign(uEdgePull) * step(0.0001, pullAmount);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const fragmentShader = `
  uniform sampler2D uTexture;
  uniform float uTextureAspect;
  uniform float uPlaneAspect;
  uniform float uFocus;
  uniform float uCornerRadius;
  varying vec2 vUv;
  void main() {
    vec2 uv = vUv - 0.5;
    float ratio = uPlaneAspect / uTextureAspect;
    if (ratio > 1.0) uv.y /= ratio;
    else uv.x *= ratio;
    uv += 0.5;
    vec4 image = texture2D(uTexture, uv);
    vec2 roundedUv = vec2((vUv.x - 0.5) * uPlaneAspect, vUv.y - 0.5);
    vec2 roundedSize = vec2(uPlaneAspect * 0.5, 0.5);
    vec2 cornerDistance = abs(roundedUv) - (roundedSize - uCornerRadius);
    float roundedDistance = length(max(cornerDistance, 0.0))
      + min(max(cornerDistance.x, cornerDistance.y), 0.0)
      - uCornerRadius;
    float roundedAlpha = 1.0 - smoothstep(-0.0025, 0.0025, roundedDistance);
    vec3 color = mix(image.rgb * 0.64, image.rgb, uFocus);
    gl_FragColor = vec4(color, image.a * roundedAlpha);
  }
`;

function signedModulo(value, length) {
  return ((value + length * 0.5) % length + length) % length - length * 0.5;
}

function initSpiral() {
  if (!stage || !canvas || !window.WebGLRenderingContext) {
    stage?.setAttribute("data-webgl-unavailable", "");
    return;
  }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  } catch {
    stage.setAttribute("data-webgl-unavailable", "");
    return;
  }

  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0xd8d5cb, 0.105);
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 80);
  camera.position.set(0, 0, 9.5);

  const group = new THREE.Group();
  scene.add(group);
  const loader = new THREE.TextureLoader();
  const planeWidth = 2.65;
  const planeHeight = 1.62;
  const verticalStep = planeHeight * 0.5;
  const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight, 18, 32);
  const textures = imageSources.map((source) => {
    const texture = loader.load(source);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
    return texture;
  });
  const planeCount = imageSources.length * 3;
  const planes = Array.from({ length: planeCount }, (_, index) => {
    const texture = textures[index % textures.length];
    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthTest: true,
      depthWrite: true,
      side: THREE.DoubleSide,
      uniforms: {
        uTexture: { value: texture },
        uTextureAspect: { value: 0.78 },
        uPlaneAspect: { value: planeWidth / planeHeight },
        uFocus: { value: 1 },
        uCornerRadius: { value: 0.055 },
        uCurveRadius: { value: 3.8 },
        uEdgePull: { value: 0 },
        uPlaneHeight: { value: planeHeight }
      },
      vertexShader,
      fragmentShader
    });
    texture.addEventListener("update", () => {
      if (texture.image?.width) material.uniforms.uTextureAspect.value = texture.image.width / texture.image.height;
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData = { index, material, texture };
    group.add(mesh);
    return mesh;
  });

  let target = 0;
  let position = 0;
  let pointerY = 0;
  let dragging = false;
  let lastTime = performance.now();
  let previousPosition = 0;
  let edgePull = 0;
  let pressDepth = 0;
  let responsiveScale = 1;
  let frame = 0;

  function addInput(delta) {
    target += THREE.MathUtils.clamp(delta, -180, 180) * 0.0035;
  }

  function onWheel(event) { addInput(-event.deltaY); }
  function onPointerDown(event) {
    dragging = true;
    pointerY = event.clientY;
    stage.classList.add("is-dragging");
    stage.setPointerCapture(event.pointerId);
  }
  function onPointerMove(event) {
    if (!dragging) return;
    addInput((pointerY - event.clientY) * 2.4);
    pointerY = event.clientY;
  }
  function onPointerUp(event) {
    dragging = false;
    stage.classList.remove("is-dragging");
    if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
  }
  function onKeyDown(event) {
    if (event.key === "ArrowDown" || event.key === "ArrowRight") addInput(-120);
    if (event.key === "ArrowUp" || event.key === "ArrowLeft") addInput(120);
  }

  function resize() {
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.fov = width < 720 ? 52 : 40;
    camera.position.z = width < 720 ? 11.2 : 9.5;
    group.position.x = width < 720 ? 0.65 : 1.35;
    camera.position.x = group.position.x;
    camera.updateProjectionMatrix();
    responsiveScale = width < 720 ? 0.72 : 1;
  }

  function render(time) {
    const delta = Math.min(2, (time - lastTime) / 16.67);
    lastTime = time;
    const easing = reducedMotion.matches ? 0.18 : 0.075;
    position += (target - position) * easing * delta;
    const scrollVelocity = (position - previousPosition) / Math.max(delta, 0.001);
    previousPosition = position;
    const edgePullTarget = reducedMotion.matches
      ? 0
      : THREE.MathUtils.clamp(scrollVelocity * 4.5, -0.22, 0.22);
    const edgePullEase = Math.abs(edgePullTarget) > Math.abs(edgePull) ? 0.12 : 0.06;
    edgePull += (edgePullTarget - edgePull) * edgePullEase * delta;
    const pressTarget = dragging && !reducedMotion.matches ? 1 : 0;
    const pressEase = pressTarget > pressDepth ? 0.18 : 0.1;
    pressDepth += (pressTarget - pressDepth) * pressEase * delta;
    group.position.z = pressDepth * -0.38;
    group.scale.setScalar(responsiveScale * (1 - pressDepth * 0.025));

    const count = planes.length;
    let nearestIndex = 0;
    let nearestDistance = Infinity;
    planes.forEach((plane, index) => {
      const offset = signedModulo(index - position, count);
      const angle = offset * 0.8;
      const depth = Math.cos(angle);
      const horizontalCompression = 1 - Math.min(Math.abs(offset) * 0.04, 0.14);
      plane.position.set(
        Math.sin(angle) * 3.45 * horizontalCompression,
        offset * -verticalStep,
        depth * 1.75 - 0.85
      );
      const verticalTilt = -Math.min(Math.abs(offset) * 0.07, 0.26);
      plane.rotation.set(verticalTilt, angle, 0);
      const focus = THREE.MathUtils.clamp(1 - Math.abs(offset) * 0.16, 0.18, 1);
      const scale = 0.72 + focus * 0.28;
      plane.scale.setScalar(scale);
      plane.userData.material.uniforms.uFocus.value += (focus - plane.userData.material.uniforms.uFocus.value) * 0.1;
      plane.userData.material.uniforms.uEdgePull.value = edgePull;
      plane.renderOrder = Math.round((depth + 1) * 100);
      if (Math.abs(offset) < nearestDistance) {
        nearestDistance = Math.abs(offset);
        nearestIndex = index;
      }
    });
    currentLabel.textContent = String((nearestIndex % imageSources.length) + 1).padStart(2, "0");
    renderer.render(scene, camera);
    frame = requestAnimationFrame(render);
  }

  stage.addEventListener("wheel", onWheel, { passive: true });
  stage.addEventListener("pointerdown", onPointerDown);
  stage.addEventListener("pointermove", onPointerMove);
  stage.addEventListener("pointerup", onPointerUp);
  stage.addEventListener("pointercancel", onPointerUp);
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("resize", resize);
  resize();
  frame = requestAnimationFrame(render);

  window.addEventListener("pagehide", () => {
    cancelAnimationFrame(frame);
    geometry.dispose();
    planes.forEach(({ userData }) => {
      userData.material.dispose();
    });
    textures.forEach((texture) => texture.dispose());
    renderer.dispose();
  }, { once: true });
}

initSpiral();
