import * as THREE from "three";
import { Line2 } from "three/addons/lines/Line2.js";
import { LineGeometry } from "three/addons/lines/LineGeometry.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import "../_shared/detail-shell.js";

const page = document.querySelector("[data-helix-page]");
const stage = document.querySelector("[data-helix-stage]");
const canvas = document.querySelector("[data-helix-canvas]");
const status = document.querySelector("[data-helix-status]");
const progressLabel = document.querySelector("[data-helix-progress]");
const indexLabel = document.querySelector("[data-helix-index]");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const imageSources = [
  new URL("../../src/assets/images/sculptural-still-lifes/neutral-stone-monuments.webp", import.meta.url).href,
  new URL("../../src/assets/images/sculptural-still-lifes/warm-ivory-sculptures.webp", import.meta.url).href,
  new URL("../../src/assets/images/sculptural-still-lifes/sage-glass-forms.webp", import.meta.url).href,
  new URL("../../src/assets/images/sculptural-still-lifes/charcoal-amber-forms.webp", import.meta.url).href,
  new URL("../../src/assets/images/sculptural-still-lifes/blue-black-geometry.webp", import.meta.url).href,
  new URL("../../src/assets/images/sculptural-still-lifes/terracotta-arches.webp", import.meta.url).href,
  new URL("../../src/assets/images/sculptural-still-lifes/emerald-forms.webp", import.meta.url).href,
  new URL("../../src/assets/images/sculptural-still-lifes/burgundy-copper-forms.webp", import.meta.url).href,
  new URL("../../src/assets/images/sculptural-still-lifes/navy-stone-sculptures.webp", import.meta.url).href,
  new URL("../../src/assets/images/sculptural-still-lifes/blush-pastel-forms.webp", import.meta.url).href
];

const PLANE_WIDTH = 2.45;
const PLANE_HEIGHT = 1.58;
const HELIX_RADIUS = 4.4;
const HELIX_PITCH = 1.12;
const HELIX_TILT = -Math.atan2(HELIX_PITCH, HELIX_RADIUS);
const PHASE_STEP = 0.55;
const PLANE_COPIES = 3;
const PLANE_COUNT = imageSources.length * PLANE_COPIES;
const START_PHASE = 1.42;
const LOOP_SPAN = PLANE_COUNT * PHASE_STEP;
const TRAVEL = LOOP_SPAN;

const vertexShader = `
  uniform float uCurveRadius;
  uniform float uExpand;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec3 p = position;
    float angle = p.x / uCurveRadius;
    vec3 curved = vec3(
      sin(angle) * uCurveRadius,
      p.y,
      p.z + (cos(angle) - 1.0) * uCurveRadius
    );
    p = mix(curved, p, uExpand);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const fragmentShader = `
  uniform sampler2D uTexture;
  uniform float uTextureAspect;
  uniform float uPlaneAspect;
  uniform float uFocus;
  uniform float uExpand;
  varying vec2 vUv;

  vec2 coverUv(vec2 uv) {
    float ratio = uPlaneAspect / uTextureAspect;
    vec2 centered = uv - 0.5;
    if (ratio > 1.0) centered.y /= ratio;
    else centered.x *= ratio;
    return centered + 0.5;
  }

  float roundedMask(vec2 uv, float radius) {
    vec2 scaledUv = vec2((uv.x - 0.5) * uPlaneAspect, uv.y - 0.5);
    vec2 size = vec2(uPlaneAspect * 0.5, 0.5);
    vec2 distanceToCorner = abs(scaledUv) - (size - radius);
    float distanceToEdge = length(max(distanceToCorner, 0.0))
      + min(max(distanceToCorner.x, distanceToCorner.y), 0.0)
      - radius;
    return 1.0 - smoothstep(-0.004, 0.004, distanceToEdge);
  }

  void main() {
    vec4 image = texture2D(uTexture, coverUv(vUv));
    float luminance = dot(image.rgb, vec3(0.299, 0.587, 0.114));
    vec3 color = mix(vec3(luminance), image.rgb, 0.3 + uFocus * 0.7);
    color *= 0.34 + uFocus * 0.7;
    if (!gl_FrontFacing) color *= 0.52;
    float cornerRadius = mix(0.045, 0.0, uExpand);
    gl_FragColor = vec4(color, image.a * roundedMask(vUv, cornerRadius));
    #include <colorspace_fragment>
  }
`;

function helixPosition(phase, target = new THREE.Vector3()) {
  return target.set(
    Math.sin(phase) * HELIX_RADIUS,
    -phase * HELIX_PITCH,
    Math.cos(phase) * HELIX_RADIUS - 0.8
  );
}

function wrapPhase(phase) {
  return THREE.MathUtils.euclideanModulo(phase + LOOP_SPAN * 0.5, LOOP_SPAN) - LOOP_SPAN * 0.5;
}

async function initHelix() {
  if (!page || !stage || !canvas || !window.WebGLRenderingContext) {
    stage?.setAttribute("data-webgl-unavailable", "");
    if (status) status.textContent = "この実験にはWebGL対応のブラウザが必要です。";
    return;
  }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      canvas,
      powerPreference: "high-performance",
      preserveDrawingBuffer: new URLSearchParams(window.location.search).has("verifyCanvas")
    });
  } catch {
    stage.setAttribute("data-webgl-unavailable", "");
    status.textContent = "この実験にはWebGL対応のブラウザが必要です。";
    return;
  }

  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 60);
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  camera.position.set(0, 0, 8.2);

  const helix = new THREE.Group();
  helix.position.x = 0.9;
  helix.position.z = -0.65;
  scene.add(helix);

  const railOffset = PLANE_HEIGHT * 0.5 + 0.09;
  const railPointCount = 121;
  const railPhaseLength = 2.7;
  const railGeometries = [-1, 1].map(() => {
    const railGeometry = new THREE.BufferGeometry();
    railGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(railPointCount * 3), 3)
    );
    return railGeometry;
  });
  const railMaterial = new THREE.LineBasicMaterial({
    blending: THREE.AdditiveBlending,
    color: 0xffffff,
    depthTest: true,
    opacity: 0.18,
    transparent: true,
    depthWrite: true
  });
  const railGlowLayers = [
    { width: 3, strength: 0.5 },
    { width: 7, strength: 0.22 },
    { width: 13, strength: 0.08 }
  ];
  const railGlowMaterials = railGlowLayers.map(({ width }) => new LineMaterial({
    blending: THREE.AdditiveBlending,
    color: 0xffffff,
    depthTest: true,
    depthWrite: false,
    linewidth: width,
    opacity: 0,
    transparent: true
  }));
  const railGlows = railGeometries.map((railGeometry) => {
    const glows = railGlowMaterials.map((glowMaterial) => {
      const glowGeometry = new LineGeometry();
      glowGeometry.setPositions(railGeometry.attributes.position.array);
      const glow = new Line2(glowGeometry, glowMaterial);
      glow.computeLineDistances();
      helix.add(glow);
      return glow;
    });
    const rail = new THREE.Line(railGeometry, railMaterial);
    helix.add(rail);
    return glows;
  });

  function updateRails(offset) {
    const centerPhase = wrapPhase(offset - 5.1);
    railGeometries.forEach((railGeometry, railIndex) => {
      const side = railIndex === 0 ? -1 : 1;
      const positions = railGeometry.attributes.position;
      for (let index = 0; index < railPointCount; index += 1) {
        const progress = index / (railPointCount - 1);
        const phase = centerPhase + THREE.MathUtils.lerp(-railPhaseLength * 0.5, railPhaseLength * 0.5, progress);
        const point = helixPosition(phase);
        point.x += side * -Math.sin(HELIX_TILT) * Math.cos(phase) * railOffset;
        point.y += side * Math.cos(HELIX_TILT) * railOffset;
        point.z += side * Math.sin(HELIX_TILT) * Math.sin(phase) * railOffset;
        positions.setXYZ(index, point.x, point.y, point.z);
      }
      positions.needsUpdate = true;
      railGeometry.computeBoundingSphere();
      railGlows[railIndex]?.forEach((glow) => glow.geometry.setPositions(positions.array));
    });
  }
  updateRails(START_PHASE);

  const textureLoader = new THREE.TextureLoader();
  let textures;
  try {
    textures = await Promise.all(imageSources.map((source) => textureLoader.loadAsync(source)));
  } catch {
    railGeometries.forEach((railGeometry) => railGeometry.dispose());
    railMaterial.dispose();
    railGlows.flat().forEach((glow) => glow.geometry.dispose());
    railGlowMaterials.forEach((material) => material.dispose());
    renderer.dispose();
    stage.setAttribute("data-webgl-unavailable", "");
    status.textContent = "画像を読み込めませんでした。";
    return;
  }

  const maxAnisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
  const geometry = new THREE.PlaneGeometry(PLANE_WIDTH, PLANE_HEIGHT, 40, 24);
  const planes = Array.from({ length: PLANE_COUNT }, (_, index) => {
    const imageIndex = index % textures.length;
    const texture = textures[imageIndex];
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = maxAnisotropy;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;

    const material = new THREE.ShaderMaterial({
      alphaTest: 0.02,
      depthTest: true,
      depthWrite: true,
      side: THREE.DoubleSide,
      transparent: true,
      uniforms: {
        uTexture: { value: texture },
        uTextureAspect: { value: texture.image.width / texture.image.height },
        uPlaneAspect: { value: PLANE_WIDTH / PLANE_HEIGHT },
        uCurveRadius: { value: 5.2 },
        uExpand: { value: 0 },
        uFocus: { value: index === 0 ? 1 : 0.08 }
      },
      vertexShader,
      fragmentShader
    });
    const plane = new THREE.Mesh(geometry, material);
    plane.frustumCulled = false;
    plane.userData = { imageIndex, material, currentScale: index === 0 ? 1 : 0.92 };
    helix.add(plane);
    return plane;
  });

  let targetOffset = START_PHASE;
  let currentOffset = START_PHASE;
  let previousOffset = START_PHASE;
  let responsiveScale = 1;
  let lastTime = performance.now();
  let frame = 0;
  let previousTouchY = null;
  let dragPointerId = null;
  let previousDragY = null;
  let dragDistance = 0;
  let lastPointerX = null;
  let lastPointerY = null;
  let currentPlane = null;
  let expandedImage = null;
  let snapTimer = 0;
  let previousGuiProgress = 0;

  const transitionGui = document.createElement("div");
  transitionGui.className = "helix-transition-gui";
  transitionGui.innerHTML = `
    <label for="helix-transition-progress">Transition progress</label>
    <div>
      <input id="helix-transition-progress" type="range" min="0" max="1" step="0.001" value="0">
      <output for="helix-transition-progress">0.000</output>
    </div>
  `;
  stage.append(transitionGui);
  const transitionProgressInput = transitionGui.querySelector("input");
  const transitionProgressOutput = transitionGui.querySelector("output");

  function addInput(delta) {
    targetOffset += delta * 0.0022;
  }

  function snapToNearestPlane() {
    const step = Math.round((targetOffset - START_PHASE) / PHASE_STEP);
    targetOffset = START_PHASE + step * PHASE_STEP;
  }

  function scheduleSnap(delay = 140) {
    window.clearTimeout(snapTimer);
    snapTimer = window.setTimeout(snapToNearestPlane, delay);
  }

  function onWheel(event) {
    if (document.body.hasAttribute("data-dialog-open") || expandedImage) return;
    event.preventDefault();
    const unit = event.deltaMode === WheelEvent.DOM_DELTA_LINE
      ? 16
      : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
        ? window.innerHeight
        : 1;
    addInput(event.deltaY * unit);
    scheduleSnap();
  }

  function onTouchStart(event) {
    if (expandedImage) return;
    previousTouchY = event.touches[0]?.clientY ?? null;
  }

  function onTouchMove(event) {
    if (document.body.hasAttribute("data-dialog-open") || expandedImage || previousTouchY === null) return;
    const touchY = event.touches[0]?.clientY;
    if (touchY === undefined) return;
    event.preventDefault();
    addInput((previousTouchY - touchY) * 1.35);
    previousTouchY = touchY;
  }

  function onTouchEnd() {
    previousTouchY = null;
    scheduleSnap(80);
  }

  function onPointerDown(event) {
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
    if (expandedImage && event.pointerType !== "touch" && event.isPrimary) {
      event.preventDefault();
      if (expandedImage.target === 0) reopenExpandedImage();
      else closeExpandedImage();
      return;
    }
    if (document.body.hasAttribute("data-dialog-open") || event.pointerType === "touch" || !event.isPrimary) return;
    event.preventDefault();
    dragPointerId = event.pointerId;
    previousDragY = event.clientY;
    dragDistance = 0;
    stage.setPointerCapture(event.pointerId);
    stage.setAttribute("data-dragging", "");
    window.clearTimeout(snapTimer);
  }

  function onPointerMove(event) {
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
    if (dragPointerId === null || previousDragY === null) {
      stage.toggleAttribute("data-current-hover", isPointerOnCurrent(event.clientX, event.clientY));
      return;
    }
    if (event.pointerId !== dragPointerId) return;
    event.preventDefault();
    const movement = previousDragY - event.clientY;
    dragDistance += Math.abs(movement);
    addInput(movement * 1.35);
    previousDragY = event.clientY;
  }

  function onPointerUp(event) {
    if (event.pointerId !== dragPointerId) return;
    const shouldOpen = dragDistance < 6;
    if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
    dragPointerId = null;
    previousDragY = null;
    stage.removeAttribute("data-dragging");
    if (shouldOpen) {
      openCurrentImage(event.clientX, event.clientY);
    } else {
      scheduleSnap(80);
    }
  }

  function onPointerLeave() {
    if (dragPointerId === null) {
      lastPointerX = null;
      lastPointerY = null;
      stage.removeAttribute("data-current-hover");
    }
  }

  function isPointerOnCurrent(clientX, clientY) {
    if (!currentPlane || expandedImage) return false;
    const stageRect = stage.getBoundingClientRect();
    pointer.set(
      ((clientX - stageRect.left) / stageRect.width) * 2 - 1,
      -((clientY - stageRect.top) / stageRect.height) * 2 + 1
    );
    raycaster.setFromCamera(pointer, camera);
    return raycaster.intersectObject(currentPlane, false).length > 0;
  }

  function closeExpandedImage() {
    if (!expandedImage) return;
    if (expandedImage.target === 0 && !expandedImage.manual) return;
    expandedImage.manual = false;
    expandedImage.target = 0;
    expandedImage.motionFrom = expandedImage.progress;
    expandedImage.motionElapsed = 0;
    expandedImage.motionDuration = 72;
    document.body.removeAttribute("data-image-expanded");
    document.body.setAttribute("data-image-closing", "");
  }

  function reopenExpandedImage() {
    if (!expandedImage) return;
    expandedImage.manual = false;
    expandedImage.target = 1;
    expandedImage.motionFrom = expandedImage.progress;
    expandedImage.motionElapsed = 0;
    expandedImage.motionDuration = 72;
    document.body.removeAttribute("data-image-closing");
    document.body.setAttribute("data-image-expanded", "");
  }

  function beginExpandedImage() {
    if (!currentPlane || expandedImage) return;
    stage.removeAttribute("data-current-hover");
    currentPlane.updateWorldMatrix(true, false);
    scene.attach(currentPlane);
    expandedImage = {
      plane: currentPlane,
      progress: 0,
      target: 1,
      manual: false,
      motionFrom: 0,
      motionElapsed: 0,
      motionDuration: 72,
      startPosition: currentPlane.position.clone(),
      startQuaternion: currentPlane.quaternion.clone(),
      startScale: currentPlane.scale.clone()
    };
    currentPlane.userData.material.depthTest = false;
    currentPlane.userData.material.depthWrite = false;
    currentPlane.renderOrder = 1000;
    document.body.setAttribute("data-image-expanded", "");
  }

  function openCurrentImage(clientX, clientY) {
    if (!currentPlane || expandedImage) return;
    if (!isPointerOnCurrent(clientX, clientY)) return;
    beginExpandedImage();
  }

  function onTransitionProgressInput(event) {
    event.stopPropagation();
    const progress = Number(event.currentTarget.value);
    if (!expandedImage) beginExpandedImage();
    if (!expandedImage) return;
    expandedImage.manual = true;
    expandedImage.target = progress >= previousGuiProgress ? 1 : 0;
    expandedImage.progress = progress;
    previousGuiProgress = progress;
    transitionProgressOutput.value = progress.toFixed(3);
  }

  transitionGui.addEventListener("pointerdown", (event) => event.stopPropagation());
  transitionGui.addEventListener("click", (event) => event.stopPropagation());
  transitionProgressInput.addEventListener("input", onTransitionProgressInput);

  function onExpandedKeyDown(event) {
    if (event.key === "Escape") closeExpandedImage();
  }

  function onKeyDown(event) {
    if (document.body.hasAttribute("data-dialog-open") || expandedImage) return;
    const distance = {
      ArrowDown: 72,
      ArrowUp: -72,
      PageDown: window.innerHeight * 0.8,
      PageUp: -window.innerHeight * 0.8,
      " ": event.shiftKey ? -window.innerHeight * 0.8 : window.innerHeight * 0.8
    }[event.key];
    if (distance === undefined) return;
    event.preventDefault();
    addInput(distance);
    scheduleSnap(100);
  }

  function resize() {
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    const mobile = width < 720;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.fov = mobile ? 48 : 38;
    camera.position.z = mobile ? 9.4 : 8.2;
    camera.updateProjectionMatrix();
    railGlowMaterials.forEach((material) => material.resolution.set(width, height));
    responsiveScale = mobile ? 0.72 : 1;
    helix.position.x = mobile ? 0.72 : 0.9;
    helix.position.y = mobile ? 0.25 : 0;
  }

  function render(time) {
    const delta = Math.min(2, (time - lastTime) / 16.67);
    lastTime = time;

    if (reducedMotion.matches) {
      currentOffset = targetOffset;
    } else {
      const follow = 1 - Math.pow(0.9, delta);
      currentOffset += (targetOffset - currentOffset) * follow;
    }

    const velocity = (currentOffset - previousOffset) / Math.max(delta, 0.001);
    previousOffset = currentOffset;
    updateRails(currentOffset);
    const glowTarget = reducedMotion.matches ? 0 : THREE.MathUtils.clamp(Math.abs(velocity) * 12, 0, 0.2);
    railGlowMaterials.forEach((material, index) => {
      const targetOpacity = glowTarget * railGlowLayers[index].strength;
      material.opacity += (targetOpacity - material.opacity) * (1 - Math.pow(0.72, delta));
    });
    const press = reducedMotion.matches ? 0 : Math.min(Math.abs(velocity) * 12, 0.035);
    helix.scale.setScalar(responsiveScale * (1 - press));

    let nearestPlaneIndex = 0;
    let nearestIndex = 0;
    let nearestDistance = Infinity;
    planes.forEach((plane, index) => {
      if (plane === expandedImage?.plane) {
        nearestPlaneIndex = index;
        nearestIndex = plane.userData.imageIndex;
        nearestDistance = 0;
        return;
      }
      const phase = wrapPhase(START_PHASE + index * PHASE_STEP - currentOffset);
      helixPosition(phase, plane.position);
      plane.rotation.set(0, phase, HELIX_TILT);

      const depth = (Math.cos(phase) + 1) * 0.5;
      plane.renderOrder = Math.round(depth * 100);

      const distance = Math.abs(phase);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestPlaneIndex = index;
        nearestIndex = plane.userData.imageIndex;
      }
    });

    currentPlane = planes[nearestPlaneIndex];

    planes.forEach((plane, index) => {
      if (plane === expandedImage?.plane) return;
      const isCurrent = index === nearestPlaneIndex;
      const focus = isCurrent ? 1 : 0.08;
      const targetScale = isCurrent ? 1 : 0.92;
      const scaleFollow = 1 - Math.pow(0.82, delta);
      plane.userData.currentScale += (targetScale - plane.userData.currentScale) * scaleFollow;
      plane.scale.setScalar(plane.userData.currentScale);
      plane.userData.material.uniforms.uFocus.value +=
        (focus - plane.userData.material.uniforms.uFocus.value) * 0.14 * delta;
    });

    if (expandedImage) {
      const state = expandedImage;
      if (!state.manual) {
        state.motionElapsed = Math.min(state.motionElapsed + delta, state.motionDuration);
        const motionProgress = state.motionElapsed / state.motionDuration;
        const motionEased = 1 - Math.pow(1 - motionProgress, 5);
        state.progress = THREE.MathUtils.lerp(state.motionFrom, state.target, motionEased);
      }
      const transformProgress = THREE.MathUtils.clamp((state.progress - 0.1) / 0.9, 0, 1);
      const eased = transformProgress;
      const distance = 3.7;
      const viewHeight = 2 * distance * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5));
      const viewWidth = viewHeight * camera.aspect;
      const targetScale = Math.min(
        viewWidth * 0.9 / PLANE_WIDTH,
        viewHeight * 0.9 / PLANE_HEIGHT
      );
      const targetPosition = new THREE.Vector3(0, 0, camera.position.z - distance);
      state.plane.position.copy(state.startPosition).lerp(targetPosition, eased);
      state.plane.scale.copy(state.startScale).lerp(new THREE.Vector3(targetScale, targetScale, targetScale), eased);
      state.plane.quaternion.copy(state.startQuaternion).slerp(new THREE.Quaternion(), eased);
      state.plane.userData.material.uniforms.uExpand.value = eased;
      transitionProgressInput.value = String(state.progress);
      transitionProgressOutput.value = state.progress.toFixed(3);
      previousGuiProgress = state.progress;

      if (state.target === 0 && state.progress === 0) {
        helix.attach(state.plane);
        state.plane.userData.material.depthTest = true;
        state.plane.userData.material.depthWrite = true;
        state.plane.userData.material.uniforms.uExpand.value = 0;
        expandedImage = null;
        document.body.removeAttribute("data-image-expanded");
        document.body.removeAttribute("data-image-closing");
        scene.updateMatrixWorld(true);
        stage.toggleAttribute(
          "data-current-hover",
          lastPointerX !== null && isPointerOnCurrent(lastPointerX, lastPointerY)
        );
      }
    }

    const loopProgress = THREE.MathUtils.euclideanModulo(currentOffset, TRAVEL) / TRAVEL;
    progressLabel.textContent = String(Math.round(loopProgress * 100) % 100).padStart(3, "0");
    indexLabel.textContent = `${String(nearestIndex + 1).padStart(2, "0")} / ${imageSources.length}`;
    renderer.render(scene, camera);
    frame = requestAnimationFrame(render);
  }

  window.addEventListener("resize", resize);
  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("touchstart", onTouchStart, { passive: true });
  window.addEventListener("touchmove", onTouchMove, { passive: false });
  window.addEventListener("touchend", onTouchEnd, { passive: true });
  stage.addEventListener("pointerdown", onPointerDown);
  stage.addEventListener("pointermove", onPointerMove);
  stage.addEventListener("pointerup", onPointerUp);
  stage.addEventListener("pointercancel", onPointerUp);
  stage.addEventListener("pointerleave", onPointerLeave);
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keydown", onExpandedKeyDown);
  resize();
  stage.setAttribute("data-ready", "");
  frame = requestAnimationFrame(render);

  window.addEventListener("pagehide", () => {
    cancelAnimationFrame(frame);
    window.clearTimeout(snapTimer);
    window.removeEventListener("resize", resize);
    window.removeEventListener("wheel", onWheel);
    window.removeEventListener("touchstart", onTouchStart);
    window.removeEventListener("touchmove", onTouchMove);
    window.removeEventListener("touchend", onTouchEnd);
    stage.removeEventListener("pointerdown", onPointerDown);
    stage.removeEventListener("pointermove", onPointerMove);
    stage.removeEventListener("pointerup", onPointerUp);
    stage.removeEventListener("pointercancel", onPointerUp);
    stage.removeEventListener("pointerleave", onPointerLeave);
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keydown", onExpandedKeyDown);
    geometry.dispose();
    railGeometries.forEach((railGeometry) => railGeometry.dispose());
    railMaterial.dispose();
    railGlows.flat().forEach((glow) => glow.geometry.dispose());
    railGlowMaterials.forEach((material) => material.dispose());
    planes.forEach((plane) => plane.userData.material.dispose());
    textures.forEach((texture) => texture.dispose());
    renderer.dispose();
  }, { once: true });
}

initHelix();
