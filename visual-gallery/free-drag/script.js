import * as THREE from "three";
import { initInfoDialog } from "../../src/scripts/info-dialog.js";

const VALID_LAYOUTS = ["canvas-plane"];
const CANVAS_DRAG_EASE = 0.075;
const CANVAS_PRESS_EASE = 0.14;
const CANVAS_PRESS_ZOOM = 0.93;
const CANVAS_PARALLAX_OVERSCAN = 0.74;
const CANVAS_PARALLAX_STRENGTH = 0.9;
const CANVAS_PARALLAX_RANGE_X = 0.13;
const CANVAS_PARALLAX_RANGE_Y = 0.12;
const CANVAS_TEXTURE_EDGE_PADDING = 0.04;
const CANVAS_GEOMETRY_SEGMENTS_X = 96;
const CANVAS_GEOMETRY_SEGMENTS_Y = 96;
const CANVAS_GRID_COLUMNS = 5;
const CANVAS_GRID_ROWS = 5;
const CANVAS_PLANE_GAP_RATIO = 0.18;
const CANVAS_SPHERE_RADIUS = 8;
const CANVAS_WHEEL_SPEED = 1.0;
const CANVAS_WHEEL_MAX_STEP = 0.42;
const CANVAS_TRACKPAD_AXIS_THRESHOLD = 0.5;
const CANVAS_ROW_LAYOUT = "canvas-row";
const CANVAS_IMAGE_FOCUS = {
  "misty-veiled-portraits/misty-veiled-portrait-01.webp": { x: 0.55, y: 0.48 },
  "misty-veiled-portraits/misty-veiled-portrait-02.webp": { x: 0.52, y: 0.48 },
  "misty-veiled-portraits/misty-veiled-portrait-03.webp": { x: 0.72, y: 0.56 },
  "misty-veiled-portraits/misty-veiled-portrait-04.webp": { x: 0.46, y: 0.48 },
  "misty-veiled-portraits/misty-veiled-portrait-05.webp": { x: 0.38, y: 0.5 },
  "misty-veiled-portraits/misty-veiled-portrait-06.webp": { x: 0.44, y: 0.58 },
  "misty-veiled-portraits/misty-veiled-portrait-07.webp": { x: 0.43, y: 0.54 },
  "misty-veiled-portraits/misty-veiled-portrait-08.webp": { x: 0.42, y: 0.52 },
  "misty-veiled-portraits/misty-veiled-portrait-09.webp": { x: 0.37, y: 0.5 },
  "misty-veiled-portraits/misty-veiled-portrait-10.webp": { x: 0.57, y: 0.52 }
};
const CANVAS_PLANE_VERTEX_SHADER = `
uniform vec2 uSphereCenterAngles;
uniform vec2 uPlaneAngularSize;
uniform float uSphereRadius;

varying vec2 vSampleUv;

void main() {
  vec2 angles = uSphereCenterAngles + position.xy * uPlaneAngularSize;
  float yaw = angles.x;
  float pitch = angles.y;
  float cosPitch = cos(pitch);
  vec3 sphereDirection = normalize(vec3(
    sin(yaw) * cosPitch,
    sin(pitch),
    -cos(yaw) * cosPitch
  ));
  vec3 spherePosition = sphereDirection * uSphereRadius;

  vSampleUv = position.xy + 0.5;
  gl_Position = projectionMatrix * viewMatrix * vec4(spherePosition, 1.0);
}
`;
const CANVAS_PLANE_FRAGMENT_SHADER = `
uniform sampler2D uMap;
uniform vec2 uTextureOffset;
uniform vec2 uTextureRepeat;

varying vec2 vSampleUv;

void main() {
  vec2 imageUv = uTextureOffset + vSampleUv * uTextureRepeat;
  gl_FragColor = texture2D(uMap, clamp(imageUv, vec2(0.0), vec2(1.0)));
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

const imageModules = import.meta.glob("../../src/assets/images/**/*.{png,jpg,jpeg,webp,avif}", {
  eager: true,
  query: "?url",
  import: "default"
});

const board = document.querySelector("[data-image-board]");
const canvas = document.querySelector("[data-three-canvas]");
const visualLoader = document.querySelector("[data-visual-loader]");
const loaderBar = document.querySelector("[data-loader-bar]");
const loaderCount = document.querySelector("[data-loader-count]");
const dialog = document.querySelector("[data-image-dialog]");
const dialogImage = dialog.querySelector("[data-dialog-image]");
const dialogClose = dialog.querySelector("[data-dialog-close]");

let lastFocusedImage = null;
let threeScene = null;

function toTitle(filename) {
  return filename
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function comparePath(a, b) {
  return a.path.localeCompare(b.path, "en", { numeric: true });
}

function createImageList() {
  return Object.entries(imageModules)
    .map(([path, src]) => {
      const relativePath = path.replace("../../src/assets/images/", "");
      const parts = relativePath.split("/");
      const filename = parts.at(-1);

      return {
        src,
        path: relativePath,
        filename,
        title: toTitle(filename)
      };
    })
    .sort(comparePath);
}

const images = createImageList().filter((image) => !image.path.startsWith("warm-neutral-tailoring/"));
const canvasImages = images
  .filter((image) => (
    image.path.startsWith("misty-veiled-portraits/")
    || image.path.startsWith("sunlit-floral-portraits/")
  ))
  .map((image) => ({
    ...image,
    focus: CANVAS_IMAGE_FOCUS[image.path] || { x: 0.5, y: 0.5 }
  }));

function getLayoutFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const layout = params.get("layout") || "canvas-plane";
  return VALID_LAYOUTS.includes(layout) ? layout : "canvas-plane";
}

function setActiveLayout(layout) {
  board.dataset.layout = layout;
  const isCanvasLayout = layout === "canvas-plane" || layout === CANVAS_ROW_LAYOUT;
  let currentLink = null;

  document.body.classList.toggle("is-three-layout", isCanvasLayout);
  board.setAttribute("aria-hidden", String(isCanvasLayout));
  canvas.toggleAttribute("hidden", !isCanvasLayout);

  document.querySelectorAll("[data-layout-link]").forEach((link) => {
    const isCurrent = link.dataset.layoutLink === layout;
    link.classList.toggle("is-current", isCurrent);
    if (isCurrent) {
      link.setAttribute("aria-current", "page");
      currentLink = link;
    } else {
      link.removeAttribute("aria-current");
    }
  });

  const switcher = currentLink?.closest("[data-layout-switcher]");
  if (currentLink && switcher) {
    const currentLeft = currentLink.offsetLeft;
    const currentRight = currentLeft + currentLink.offsetWidth;
    const viewportLeft = switcher.scrollLeft;
    const viewportRight = viewportLeft + switcher.clientWidth;

    if (currentLeft < viewportLeft) {
      switcher.scrollLeft = Math.max(0, currentLeft - 4);
    } else if (currentRight > viewportRight) {
      switcher.scrollLeft = currentRight - switcher.clientWidth + 4;
    }
  }

  if (isCanvasLayout) {
    startThreeScene(layout);
  } else {
    stopThreeScene();
  }
}

function renderImages() {
  board.innerHTML = images
    .map((image, index) => {
      const loading = index < 8 ? "eager" : "lazy";
      return `
        <figure class="image-item" style="--item-index: ${index};">
          <button type="button" data-image-index="${index}" aria-label="${image.title} を大きく表示">
            <img src="${image.src}" alt="${image.title}" loading="${loading}" decoding="async" />
          </button>
        </figure>
      `;
    })
    .join("");
}

function openDialog(index, trigger) {
  const image = images[index];
  lastFocusedImage = trigger;
  dialogImage.src = image.src;
  dialogImage.alt = image.title;
  dialog.showModal();
  dialogClose.focus();
}

function closeDialog() {
  dialog.close();
}

function updateVisualLoadingProgress(loadedCount, totalCount) {
  const progress = totalCount > 0 ? loadedCount / totalCount : 1;

  loaderBar?.style.setProperty("--loader-progress", String(progress));
  if (loaderCount) {
    loaderCount.textContent = `${loadedCount} / ${totalCount}`;
  }
}

function completeVisualLoading() {
  document.body.classList.remove("is-loading");
  visualLoader?.setAttribute("aria-hidden", "true");
}

function resizeThreeScene() {
  if (!threeScene) return;

  const width = window.innerWidth;
  const height = window.innerHeight;
  const pixelRatio = Math.min(window.devicePixelRatio, 2);

  threeScene.renderer.setPixelRatio(pixelRatio);
  threeScene.renderer.setSize(width, height, false);
  threeScene.camera.aspect = width / height;
  threeScene.camera.updateProjectionMatrix();

  const verticalFov = THREE.MathUtils.degToRad(threeScene.camera.fov);
  const horizontalFov = 2 * Math.atan(Math.tan(verticalFov * 0.5) * threeScene.camera.aspect);
  const visibleHeight = 2 * Math.tan(verticalFov * 0.5) * threeScene.sphereRadius;
  const visibleWidth = visibleHeight * threeScene.camera.aspect;
  const planeSize = Math.min(visibleWidth * 0.29, visibleHeight * 0.46);
  const planeWidth = planeSize;
  const planeHeight = planeSize;
  const gapX = planeWidth * CANVAS_PLANE_GAP_RATIO;
  const gapY = planeHeight * CANVAS_PLANE_GAP_RATIO;
  const stepYaw = (planeWidth + gapX) / threeScene.sphereRadius;
  const stepPitch = (planeHeight + gapY) / threeScene.sphereRadius;
  const columns = CANVAS_GRID_COLUMNS;
  const rows = CANVAS_GRID_ROWS;
  const loopWidth = stepYaw * columns;
  const loopHeight = stepPitch * rows;
  const gridStartYaw = (columns - 1) * stepYaw * -0.5;
  const gridStartPitch = (rows - 1) * stepPitch * -0.5;

  threeScene.verticalFov = verticalFov;
  threeScene.horizontalFov = horizontalFov;
  threeScene.visibleHeight = visibleHeight;
  threeScene.visibleWidth = visibleWidth;
  threeScene.loopHeight = loopHeight;
  threeScene.loopWidth = loopWidth;
  threeScene.radiansPerPixelX = horizontalFov / window.innerWidth;
  threeScene.radiansPerPixelY = verticalFov / window.innerHeight;
  threeScene.planeLayout = {
    gridStartPitch,
    gridStartYaw,
    planeHeight,
    planeWidth,
    stepPitch,
    stepYaw
  };

  threeScene.textures.forEach((texture, index) => {
    fitTextureToPlane(texture, planeWidth / planeHeight);
    syncTextureUniforms(threeScene.materials[index], texture);
  });
  updateThreePlanePositions();
  renderThreeScene();
}

function updateThreePlanePositions() {
  if (!threeScene?.planeLayout) return;

  const { gridStartPitch, gridStartYaw, planeHeight, planeWidth, stepPitch, stepYaw } = threeScene.planeLayout;
  const sphereRadius = threeScene.sphereRadius;

  threeScene.planes.forEach((plane, index) => {
    const yaw = wrapAroundCenter(gridStartYaw + plane.userData.gridColumn * stepYaw + threeScene.dragOffset.x, threeScene.loopWidth);
    const pitch = wrapAroundCenter(gridStartPitch + plane.userData.gridRow * stepPitch + threeScene.dragOffset.y, threeScene.loopHeight);
    const centerDir = getSphereDirection(yaw, pitch);
    const material = threeScene.materials[index];

    material.uniforms.uSphereCenterAngles.value.set(yaw, pitch);
    material.uniforms.uPlaneAngularSize.value.set(planeWidth / sphereRadius, planeHeight / sphereRadius);
    material.uniforms.uSphereRadius.value = sphereRadius;
    updateTextureParallax(threeScene.textures[index], material, centerDir);
  });
}

function getSphereDirection(yaw, pitch) {
  const cosPitch = Math.cos(pitch);

  return new THREE.Vector3(
    Math.sin(yaw) * cosPitch,
    Math.sin(pitch),
    -Math.cos(yaw) * cosPitch
  ).normalize();
}

function wrapAroundCenter(value, range) {
  if (!range) return value;

  return THREE.MathUtils.euclideanModulo(value + range * 0.5, range) - range * 0.5;
}

function getLoopDeltaVector(from, to) {
  return new THREE.Vector2(to.x - from.x, to.y - from.y);
}

function normalizeSettledOffsets() {
  if (!threeScene) return;

  const normalizedX = wrapAroundCenter(threeScene.targetOffset.x, threeScene.loopWidth);
  const normalizedY = wrapAroundCenter(threeScene.targetOffset.y, threeScene.loopHeight);

  threeScene.targetOffset.set(normalizedX, normalizedY);
  threeScene.dragOffset.set(normalizedX, normalizedY);
}

function fitTextureToPlane(texture, planeAspect) {
  const imageWidth = texture.image?.naturalWidth || texture.image?.width;
  const imageHeight = texture.image?.naturalHeight || texture.image?.height;
  if (!imageWidth || !imageHeight) return;

  const imageAspect = imageWidth / imageHeight;
  texture.center.set(0, 0);

  let coverRepeatX = 1;
  let coverRepeatY = 1;

  if (imageAspect > planeAspect) {
    coverRepeatX = planeAspect / imageAspect;
  } else {
    coverRepeatY = imageAspect / planeAspect;
  }

  const repeatX = coverRepeatX * CANVAS_PARALLAX_OVERSCAN;
  const repeatY = coverRepeatY * CANVAS_PARALLAX_OVERSCAN;

  const maxOffsetX = 1 - repeatX;
  const maxOffsetY = 1 - repeatY;
  const focusX = texture.userData.focus?.x ?? 0.5;
  const focusY = texture.userData.focus?.y ?? 0.5;
  const baseOffsetX = THREE.MathUtils.clamp(focusX - repeatX * 0.5, 0, maxOffsetX);
  const baseOffsetY = THREE.MathUtils.clamp(focusY - repeatY * 0.5, 0, maxOffsetY);
  const edgePaddingX = Math.min(CANVAS_TEXTURE_EDGE_PADDING, maxOffsetX * 0.25);
  const edgePaddingY = Math.min(CANVAS_TEXTURE_EDGE_PADDING, maxOffsetY * 0.25);

  texture.repeat.set(repeatX, repeatY);
  texture.offset.set(baseOffsetX, baseOffsetY);
  texture.userData.baseOffsetX = baseOffsetX;
  texture.userData.baseOffsetY = baseOffsetY;
  texture.userData.repeatX = repeatX;
  texture.userData.repeatY = repeatY;
  texture.userData.parallaxRangeX = Math.min(
    CANVAS_PARALLAX_RANGE_X,
    Math.max(0, baseOffsetX - edgePaddingX),
    Math.max(0, maxOffsetX - baseOffsetX - edgePaddingX)
  );
  texture.userData.parallaxRangeY = Math.min(
    CANVAS_PARALLAX_RANGE_Y,
    Math.max(0, baseOffsetY - edgePaddingY),
    Math.max(0, maxOffsetY - baseOffsetY - edgePaddingY)
  );
  texture.needsUpdate = true;
}

function syncTextureUniforms(material, texture) {
  if (!material?.uniforms || !texture?.userData) return;

  material.uniforms.uTextureOffset.value.set(texture.userData.baseOffsetX || 0, texture.userData.baseOffsetY || 0);
  material.uniforms.uTextureRepeat.value.set(texture.userData.repeatX || 1, texture.userData.repeatY || 1);
}

function updateTextureParallax(texture, material, centerDir) {
  if (!texture?.userData || !threeScene?.visibleWidth || !threeScene?.visibleHeight) return;

  const parallaxRangeX = texture.userData.parallaxRangeX;
  const parallaxRangeY = texture.userData.parallaxRangeY;
  if (parallaxRangeX === undefined || parallaxRangeY === undefined) return;

  const depth = Math.max(0.001, -centerDir.z);
  const normalizedX = THREE.MathUtils.clamp(
    (centerDir.x / depth) / Math.tan(threeScene.horizontalFov * 0.5),
    -1,
    1
  );
  const normalizedY = THREE.MathUtils.clamp(
    (centerDir.y / depth) / Math.tan(threeScene.verticalFov * 0.5),
    -1,
    1
  );
  const parallaxX = normalizedX * parallaxRangeX * CANVAS_PARALLAX_STRENGTH;
  const parallaxY = normalizedY * parallaxRangeY * CANVAS_PARALLAX_STRENGTH;
  const nextOffsetX = texture.userData.baseOffsetX + parallaxX;
  const nextOffsetY = texture.userData.baseOffsetY + parallaxY;

  texture.offset.set(nextOffsetX, nextOffsetY);
  material.uniforms.uTextureOffset.value.set(nextOffsetX, nextOffsetY);
}

function startThreeScene() {
  if (threeScene) {
    resizeThreeScene();
    return;
  }

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    canvas
  });
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 100);
  const loader = new THREE.TextureLoader();
  const geometry = new THREE.PlaneGeometry(1, 1, CANVAS_GEOMETRY_SEGMENTS_X, CANVAS_GEOMETRY_SEGMENTS_Y);
  const planes = [];
  const materials = [];
  const textures = [];

  const gridImages = Array.from({ length: CANVAS_GRID_COLUMNS * CANVAS_GRID_ROWS }, (_, index) => (
    canvasImages[index % canvasImages.length]
  ));
  let loadedTextureCount = 0;
  updateVisualLoadingProgress(0, gridImages.length);

  function markTextureReady() {
    loadedTextureCount += 1;
    updateVisualLoadingProgress(loadedTextureCount, gridImages.length);
    if (loadedTextureCount < gridImages.length) return;

    resizeThreeScene();
    renderThreeScene();
    completeVisualLoading();
  }

  gridImages.forEach((image, index) => {
    const texture = loader.load(image.src, () => {
      resizeThreeScene();
      renderThreeScene();
      markTextureReady();
    }, undefined, markTextureReady);
    texture.userData.focus = image.focus;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.generateMipmaps = false;
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearFilter;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;

    const material = new THREE.ShaderMaterial({
      fragmentShader: CANVAS_PLANE_FRAGMENT_SHADER,
      side: THREE.DoubleSide,
      uniforms: {
        uMap: { value: texture },
        uTextureOffset: { value: new THREE.Vector2(0, 0) },
        uTextureRepeat: { value: new THREE.Vector2(1, 1) },
        uSphereCenterAngles: { value: new THREE.Vector2(0, 0) },
        uPlaneAngularSize: { value: new THREE.Vector2(1, 1) },
        uSphereRadius: { value: CANVAS_SPHERE_RADIUS }
      },
      vertexShader: CANVAS_PLANE_VERTEX_SHADER
    });
    const plane = new THREE.Mesh(geometry, material);
    plane.frustumCulled = false;
    plane.userData.gridColumn = index % CANVAS_GRID_COLUMNS;
    plane.userData.gridRow = Math.floor(index / CANVAS_GRID_COLUMNS);

    planes.push(plane);
    materials.push(material);
    textures.push(texture);
    scene.add(plane);
  });

  camera.position.set(0, 0, 0);
  camera.lookAt(0, 0, -1);
  threeScene = {
    camera,
    geometry,
    materials,
    planes,
    renderer,
    scene,
    sphereRadius: CANVAS_SPHERE_RADIUS,
    textures,
    horizontalFov: 0,
    verticalFov: 0,
    visibleHeight: 0,
    visibleWidth: 0,
    loopHeight: 0,
    loopWidth: 0,
    radiansPerPixelX: 0,
    radiansPerPixelY: 0,
    dragOffset: new THREE.Vector2(0, 0),
    targetOffset: new THREE.Vector2(0, 0),
    pressZoom: 1,
    targetPressZoom: 1,
    frameId: null,
    planeLayout: null
  };

  resizeThreeScene();
  renderThreeScene();
}

function renderThreeScene() {
  if (!threeScene) return;

  threeScene.renderer.render(threeScene.scene, threeScene.camera);
}

function handleCanvasPointerDown(event) {
  if (!threeScene) return;

  threeScene.dragStart = new THREE.Vector2(event.clientX, event.clientY);
  threeScene.dragStartOffset = threeScene.targetOffset.clone();
  threeScene.targetPressZoom = CANVAS_PRESS_ZOOM;
  canvas.classList.add("is-dragging");
  try {
    canvas.setPointerCapture(event.pointerId);
  } catch {
    // Synthetic pointer events used in automated checks do not have an active pointer to capture.
  }
  startThreeEaseLoop();
}

function handleCanvasPointerMove(event) {
  if (!threeScene || !threeScene.dragStart) return;

  threeScene.targetOffset.x = threeScene.dragStartOffset.x
    + (event.clientX - threeScene.dragStart.x) * threeScene.radiansPerPixelX;
  threeScene.targetOffset.y = threeScene.dragStartOffset.y
    - (event.clientY - threeScene.dragStart.y) * threeScene.radiansPerPixelY;
  startThreeEaseLoop();
}

function handleCanvasPointerUp(event) {
  if (!threeScene) return;

  delete threeScene.dragStart;
  delete threeScene.dragStartOffset;
  threeScene.targetPressZoom = 1;
  canvas.classList.remove("is-dragging");
  if (canvas.hasPointerCapture(event.pointerId)) {
    canvas.releasePointerCapture(event.pointerId);
  }
  startThreeEaseLoop();
}

function getWheelUnit(event) {
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) return 16;
  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) return window.innerHeight;
  return 1;
}

function isFreeScrollWheel(event) {
  return event.deltaMode === WheelEvent.DOM_DELTA_PIXEL
    && Math.abs(event.deltaX) > CANVAS_TRACKPAD_AXIS_THRESHOLD;
}

function clampWheelDelta(deltaX, deltaY) {
  const length = Math.hypot(deltaX, deltaY);
  if (length <= CANVAS_WHEEL_MAX_STEP) {
    return new THREE.Vector2(deltaX, deltaY);
  }

  const scale = CANVAS_WHEEL_MAX_STEP / length;
  return new THREE.Vector2(deltaX * scale, deltaY * scale);
}

function handleCanvasWheel(event) {
  if (!threeScene?.visibleWidth || !threeScene?.visibleHeight) return;

  event.preventDefault();

  const unit = getWheelUnit(event);
  const deltaX = isFreeScrollWheel(event) ? event.deltaX * unit * threeScene.radiansPerPixelX * CANVAS_WHEEL_SPEED : 0;
  const deltaY = event.deltaY * unit * threeScene.radiansPerPixelY * CANVAS_WHEEL_SPEED;
  const clampedDelta = clampWheelDelta(deltaX, deltaY);

  threeScene.targetOffset.x -= clampedDelta.x;
  threeScene.targetOffset.y += clampedDelta.y;
  startThreeEaseLoop();
}

function startThreeEaseLoop() {
  if (!threeScene || threeScene.frameId !== null) return;

  threeScene.frameId = window.requestAnimationFrame(updateThreeEase);
}

function updateThreeEase() {
  if (!threeScene) return;

  const delta = getLoopDeltaVector(threeScene.dragOffset, threeScene.targetOffset);
  const pressDelta = threeScene.targetPressZoom - threeScene.pressZoom;
  const isDragging = Boolean(threeScene.dragStart);

  if (delta.length() > 0.001 || Math.abs(pressDelta) > 0.001) {
    threeScene.dragOffset.x += delta.x * CANVAS_DRAG_EASE;
    threeScene.dragOffset.y += delta.y * CANVAS_DRAG_EASE;
    threeScene.pressZoom += pressDelta * CANVAS_PRESS_EASE;
  } else {
    threeScene.dragOffset.copy(threeScene.targetOffset);
    threeScene.pressZoom = threeScene.targetPressZoom;
    normalizeSettledOffsets();
  }

  threeScene.camera.zoom = threeScene.pressZoom;
  threeScene.camera.updateProjectionMatrix();
  updateThreePlanePositions();
  renderThreeScene();

  const isMoving = delta.length() > 0.001;
  const isPressChanging = Math.abs(pressDelta) > 0.001;

  if (isMoving || isPressChanging || isDragging) {
    threeScene.frameId = window.requestAnimationFrame(updateThreeEase);
  } else {
    threeScene.frameId = null;
  }
}

function stopThreeScene() {
  if (!threeScene) return;

  canvas.classList.remove("is-dragging");
  window.cancelAnimationFrame(threeScene.frameId);
  threeScene.geometry.dispose();
  threeScene.materials.forEach((material) => material.dispose());
  threeScene.textures.forEach((texture) => texture.dispose());
  threeScene.renderer.dispose();
  threeScene = null;
}

renderImages();
setActiveLayout(getLayoutFromUrl());
initInfoDialog({
  openLabel: "ギャラリー情報を開く",
  closeLabel: "ギャラリー情報を閉じる"
});

window.addEventListener("resize", resizeThreeScene);
canvas.addEventListener("pointerdown", handleCanvasPointerDown);
canvas.addEventListener("pointermove", handleCanvasPointerMove);
canvas.addEventListener("pointerup", handleCanvasPointerUp);
canvas.addEventListener("pointercancel", handleCanvasPointerUp);
canvas.addEventListener("wheel", handleCanvasWheel, { passive: false });

document.querySelector("[data-layout-switcher]")?.addEventListener("click", (event) => {
  const link = event.target.closest("[data-layout-link]");
  if (!link) return;

  event.preventDefault();
  const layout = link.dataset.layoutLink;
  const nextUrl = new URL(link.href);
  window.history.pushState({ layout }, "", nextUrl);
  setActiveLayout(layout);
});

window.addEventListener("popstate", () => {
  setActiveLayout(getLayoutFromUrl());
});

board.addEventListener("click", (event) => {
  const button = event.target.closest("[data-image-index]");
  if (!button) return;

  openDialog(Number(button.dataset.imageIndex), button);
});

dialogClose.addEventListener("click", closeDialog);
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) closeDialog();
});
dialog.addEventListener("close", () => {
  dialogImage.removeAttribute("src");
  lastFocusedImage?.focus();
});
