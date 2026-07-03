import * as THREE from "three";
import Stats from "three/examples/jsm/libs/stats.module.js";

const VALID_LAYOUTS = ["canvas-row"];
const CANVAS_DRAG_EASE = 0.075;
const CANVAS_DEPTH_EASE = 0.14;
const CANVAS_PRESS_DEPTH = -0.55;
const CANVAS_PARALLAX_OVERSCAN = 0.82;
const CANVAS_PARALLAX_STRENGTH = 0.38;
const CANVAS_PARALLAX_RANGE_X = 0.065;
const CANVAS_PARALLAX_RANGE_Y = 0.055;
const CANVAS_TEXTURE_EDGE_PADDING = 0.04;
const CANVAS_GEOMETRY_SEGMENTS_X = 64;
const CANVAS_GEOMETRY_SEGMENTS_Y = 64;
const CANVAS_EDGE_WARP_EASE = 0.18;
const CANVAS_EDGE_WARP_STRENGTH = 0.72;
const CANVAS_EDGE_WARP_MAX = 0.085;
const CANVAS_GRID_COLUMNS = 10;
const CANVAS_GRID_ROWS = 1;
const CANVAS_PLANE_GAP_RATIO = 0.18;
const CANVAS_WHEEL_SPEED = 1.15;
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
uniform vec2 uWarpVector;

varying vec2 vSampleUv;

void main() {
  vec3 warpedPosition = position;
  float amount = length(uWarpVector);

  if (amount > 0.0001) {
    vec2 direction = uWarpVector / amount;
    vec2 perpendicular = vec2(-direction.y, direction.x);
    float perpendicularPosition = dot(position.xy * 2.0, perpendicular);
    float centerBulge = max(0.0, 1.0 - perpendicularPosition * perpendicularPosition);

    warpedPosition.xy += direction * amount * centerBulge;
  }

  vSampleUv = position.xy + 0.5;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(warpedPosition, 1.0);
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
  .filter((image) => image.path.startsWith("misty-veiled-portraits/"))
  .map((image) => ({
    ...image,
    focus: CANVAS_IMAGE_FOCUS[image.path] || { x: 0.5, y: 0.5 }
  }));

function getLayoutFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const layout = params.get("layout") || "canvas-row";
  return VALID_LAYOUTS.includes(layout) ? layout : "canvas-row";
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
    startStatsMonitor();
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

function resizeThreeScene() {
  if (!threeScene) return;

  const width = window.innerWidth;
  const height = window.innerHeight;
  const pixelRatio = Math.min(window.devicePixelRatio, 2);

  threeScene.renderer.setPixelRatio(pixelRatio);
  threeScene.renderer.setSize(width, height, false);
  threeScene.camera.aspect = width / height;
  threeScene.camera.updateProjectionMatrix();

  const visibleHeight = 2 * Math.tan(THREE.MathUtils.degToRad(threeScene.camera.fov * 0.5)) * threeScene.camera.position.z;
  const visibleWidth = visibleHeight * threeScene.camera.aspect;
  const planeWidth = visibleWidth * 0.29;
  const planeHeight = Math.min(visibleHeight * 0.52, planeWidth * 1.28);
  const isRowLayout = threeScene.mode === CANVAS_ROW_LAYOUT;
  const gapX = planeWidth * CANVAS_PLANE_GAP_RATIO;
  const gapY = planeHeight * CANVAS_PLANE_GAP_RATIO;
  const stepX = planeWidth + gapX;
  const stepY = planeHeight + gapY;
  const columns = isRowLayout ? threeScene.planes.length : CANVAS_GRID_COLUMNS;
  const rows = isRowLayout ? 1 : CANVAS_GRID_ROWS;
  const loopWidth = stepX * columns;
  const loopHeight = stepY * rows;
  const gridStartX = (columns - 1) * stepX * -0.5;
  const gridStartY = (rows - 1) * stepY * -0.5;

  threeScene.visibleHeight = visibleHeight;
  threeScene.visibleWidth = visibleWidth;
  threeScene.loopHeight = loopHeight;
  threeScene.loopWidth = loopWidth;
  threeScene.dragOffset.x = wrapAroundCenter(threeScene.dragOffset.x, loopWidth);
  threeScene.dragOffset.y = isRowLayout ? 0 : wrapAroundCenter(threeScene.dragOffset.y, loopHeight);
  threeScene.targetOffset.x = wrapAroundCenter(threeScene.targetOffset.x, loopWidth);
  threeScene.targetOffset.y = isRowLayout ? 0 : wrapAroundCenter(threeScene.targetOffset.y, loopHeight);
  threeScene.planeLayout = {
    gridStartX,
    gridStartY,
    planeHeight,
    planeWidth,
    stepX,
    stepY
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

  const { gridStartX, gridStartY, planeHeight, planeWidth, stepX, stepY } = threeScene.planeLayout;

  threeScene.planes.forEach((plane, index) => {
    const baseX = gridStartX + plane.userData.gridColumn * stepX + threeScene.dragOffset.x;
    const baseY = gridStartY + plane.userData.gridRow * stepY + threeScene.dragOffset.y;
    plane.position.x = wrapAroundCenter(baseX, threeScene.loopWidth);
    plane.position.y = wrapAroundCenter(baseY, threeScene.loopHeight);
    plane.position.z = threeScene.depthOffsetZ;
    plane.scale.set(planeWidth, planeHeight, 1);
    updateTextureParallax(threeScene.textures[index], threeScene.materials[index], plane.position);
  });
}

function updatePlaneMaskWarp() {
  if (!threeScene) return;

  threeScene.materials.forEach((material) => {
    material.uniforms.uWarpVector.value.copy(threeScene.edgeWarp);
  });
}

function getEdgeWarpTarget(offsetStep) {
  if (!threeScene?.visibleWidth || !threeScene?.visibleHeight) return new THREE.Vector2(0, 0);

  const normalizedX = offsetStep.x / threeScene.visibleWidth;
  const normalizedY = offsetStep.y / threeScene.visibleHeight;
  const normalizedLength = Math.hypot(normalizedX, normalizedY);
  if (normalizedLength < 0.00001) return new THREE.Vector2(0, 0);
  const easedLength = normalizedLength * normalizedLength;

  const amount = THREE.MathUtils.clamp(
    easedLength * CANVAS_EDGE_WARP_STRENGTH,
    0,
    CANVAS_EDGE_WARP_MAX
  );

  return offsetStep.clone().normalize().multiplyScalar(-amount);
}

function wrapAroundCenter(value, range) {
  if (!range) return value;

  return THREE.MathUtils.euclideanModulo(value + range * 0.5, range) - range * 0.5;
}

function getLoopDelta(from, to, range) {
  return wrapAroundCenter(to - from, range);
}

function getLoopDeltaVector(from, to) {
  return new THREE.Vector2(
    getLoopDelta(from.x, to.x, threeScene.loopWidth),
    getLoopDelta(from.y, to.y, threeScene.loopHeight)
  );
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

function updateTextureParallax(texture, material, planePosition) {
  if (!texture?.userData || !threeScene?.visibleWidth || !threeScene?.visibleHeight) return;

  const parallaxRangeX = texture.userData.parallaxRangeX;
  const parallaxRangeY = texture.userData.parallaxRangeY;
  if (parallaxRangeX === undefined || parallaxRangeY === undefined) return;

  const normalizedX = THREE.MathUtils.clamp(planePosition.x / (threeScene.visibleWidth * 0.5), -1, 1);
  const normalizedY = THREE.MathUtils.clamp(planePosition.y / (threeScene.visibleHeight * 0.5), -1, 1);
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

  gridImages.forEach((image, index) => {
    const texture = loader.load(image.src, () => {
      resizeThreeScene();
      renderThreeScene();
    });
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
        uWarpVector: { value: new THREE.Vector2(0, 0) }
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

  camera.position.z = 5;
  const stats = new Stats();
  stats.showPanel(0);
  stats.dom.classList.add("stats-monitor");

  threeScene = {
    camera,
    geometry,
    materials,
    planes,
    renderer,
    scene,
    textures,
    visibleHeight: 0,
    visibleWidth: 0,
    loopHeight: 0,
    loopWidth: 0,
    dragOffset: new THREE.Vector2(0, 0),
    targetOffset: new THREE.Vector2(0, 0),
    depthOffsetZ: 0,
    targetDepthOffsetZ: 0,
    edgeWarp: new THREE.Vector2(0, 0),
    targetEdgeWarp: new THREE.Vector2(0, 0),
    frameId: null,
    stats,
    statsFrameId: null,
    planeLayout: null
  };

  resizeThreeScene();
  renderThreeScene();
}

function renderThreeScene() {
  if (!threeScene) return;

  threeScene.renderer.render(threeScene.scene, threeScene.camera);
}

function startStatsMonitor() {
  if (!threeScene || threeScene.statsFrameId !== null) return;

  if (!threeScene.stats.dom.isConnected) {
    document.body.appendChild(threeScene.stats.dom);
  }
  threeScene.statsFrameId = window.requestAnimationFrame(updateStatsMonitor);
}

function updateStatsMonitor() {
  if (!threeScene) return;

  threeScene.stats.update();
  threeScene.statsFrameId = window.requestAnimationFrame(updateStatsMonitor);
}

function stopStatsMonitor() {
  if (!threeScene) return;

  window.cancelAnimationFrame(threeScene.statsFrameId);
  threeScene.statsFrameId = null;
  threeScene.stats.dom.remove();
}

function handleCanvasPointerDown(event) {
  if (!threeScene) return;

  threeScene.dragStart = new THREE.Vector2(event.clientX, event.clientY);
  threeScene.dragStartOffset = threeScene.targetOffset.clone();
  threeScene.targetDepthOffsetZ = CANVAS_PRESS_DEPTH;
  canvas.classList.add("is-dragging");
  canvas.setPointerCapture(event.pointerId);
  startThreeEaseLoop();
}

function handleCanvasPointerMove(event) {
  if (!threeScene || !threeScene.dragStart) return;

  const worldPerPixel = threeScene.visibleWidth / window.innerWidth;
  threeScene.targetOffset.x = wrapAroundCenter(
    threeScene.dragStartOffset.x + (event.clientX - threeScene.dragStart.x) * worldPerPixel,
    threeScene.loopWidth
  );
  threeScene.targetOffset.y = 0;
  startThreeEaseLoop();
}

function handleCanvasPointerUp(event) {
  if (!threeScene) return;

  delete threeScene.dragStart;
  delete threeScene.dragStartOffset;
  threeScene.targetDepthOffsetZ = 0;
  canvas.classList.remove("is-dragging");
  if (canvas.hasPointerCapture(event.pointerId)) {
    canvas.releasePointerCapture(event.pointerId);
  }
  startThreeEaseLoop();
}

function getWheelDeltaPixels(event) {
  const unit = event.deltaMode === WheelEvent.DOM_DELTA_LINE
    ? 16
    : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
      ? window.innerHeight
      : 1;
  const dominantDelta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;

  return dominantDelta * unit;
}

function handleCanvasWheel(event) {
  if (!threeScene?.visibleWidth) return;

  event.preventDefault();
  const worldPerPixel = threeScene.visibleWidth / window.innerWidth;
  const wheelOffset = getWheelDeltaPixels(event) * worldPerPixel * CANVAS_WHEEL_SPEED;
  threeScene.targetOffset.x = wrapAroundCenter(
    threeScene.targetOffset.x - wheelOffset,
    threeScene.loopWidth
  );
  threeScene.targetOffset.y = 0;
  startThreeEaseLoop();
}

function startThreeEaseLoop() {
  if (!threeScene || threeScene.frameId !== null) return;

  threeScene.frameId = window.requestAnimationFrame(updateThreeEase);
}

function updateThreeEase() {
  if (!threeScene) return;

  const delta = getLoopDeltaVector(threeScene.dragOffset, threeScene.targetOffset);
  const depthDelta = threeScene.targetDepthOffsetZ - threeScene.depthOffsetZ;
  const previousOffset = threeScene.dragOffset.clone();
  const isDragging = Boolean(threeScene.dragStart);

  if (delta.length() > 0.001 || Math.abs(depthDelta) > 0.001) {
    threeScene.dragOffset.x = wrapAroundCenter(
      threeScene.dragOffset.x + delta.x * CANVAS_DRAG_EASE,
      threeScene.loopWidth
    );
    threeScene.dragOffset.y = wrapAroundCenter(
      threeScene.dragOffset.y + delta.y * CANVAS_DRAG_EASE,
      threeScene.loopHeight
    );
    threeScene.depthOffsetZ += depthDelta * CANVAS_DEPTH_EASE;
  } else {
    threeScene.dragOffset.copy(threeScene.targetOffset);
    threeScene.depthOffsetZ = threeScene.targetDepthOffsetZ;
  }

  const offsetStep = getLoopDeltaVector(previousOffset, threeScene.dragOffset);
  const warpSource = delta.length() > 0.001 ? delta : offsetStep;
  threeScene.targetEdgeWarp.copy(warpSource.length() > 0.00001 ? getEdgeWarpTarget(warpSource) : new THREE.Vector2(0, 0));

  const edgeWarpDelta = threeScene.targetEdgeWarp.clone().sub(threeScene.edgeWarp);
  if (edgeWarpDelta.length() > 0.0001) {
    threeScene.edgeWarp.addScaledVector(edgeWarpDelta, CANVAS_EDGE_WARP_EASE);
  } else {
    threeScene.edgeWarp.copy(threeScene.targetEdgeWarp);
  }

  updateThreePlanePositions();
  updatePlaneMaskWarp();
  renderThreeScene();

  const isMoving = delta.length() > 0.001;
  const isDepthChanging = Math.abs(depthDelta) > 0.001;
  const isWarping = threeScene.edgeWarp.length() > 0.0001 || edgeWarpDelta.length() > 0.0001;

  if (isMoving || isDepthChanging || isWarping || isDragging) {
    threeScene.frameId = window.requestAnimationFrame(updateThreeEase);
  } else {
    threeScene.frameId = null;
  }
}

function stopThreeScene() {
  if (!threeScene) return;

  canvas.classList.remove("is-dragging");
  stopStatsMonitor();
  window.cancelAnimationFrame(threeScene.frameId);
  threeScene.geometry.dispose();
  threeScene.materials.forEach((material) => material.dispose());
  threeScene.textures.forEach((texture) => texture.dispose());
  threeScene.renderer.dispose();
  threeScene = null;
}

renderImages();
setActiveLayout(getLayoutFromUrl());

window.addEventListener("resize", resizeThreeScene);
canvas.addEventListener("pointerdown", handleCanvasPointerDown);
canvas.addEventListener("pointermove", handleCanvasPointerMove);
canvas.addEventListener("pointerup", handleCanvasPointerUp);
canvas.addEventListener("pointercancel", handleCanvasPointerUp);
canvas.addEventListener("wheel", handleCanvasWheel, { passive: false });

document.querySelector("[data-layout-switcher]").addEventListener("click", (event) => {
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
