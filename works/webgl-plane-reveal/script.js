import * as THREE from "three";
import "../_shared/detail-shell.js";
import { initSmoothScroll } from "../../src/scripts/smooth-scroll.js";

initSmoothScroll({
  duration: 1.1,
  easing: easeOutExpo,
  lerp: null,
  wheelMultiplier: 0.88
});

const stage = document.querySelector("[data-plane-reveal-stage]");
const canvas = document.querySelector("[data-plane-reveal-canvas]");
const cards = [...document.querySelectorAll("[data-plane-reveal-card]")];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const REVEAL_DURATION = 2000;

const vertexShader = `
  varying vec2 vUv;
  uniform float uProgress;
  uniform float uLift;

  float getRowProgress(float fromTop) {
    float clampedFromTop = clamp(fromTop, 0.0, 1.0);
    float staggerAmount = 0.16;
    float staggerCurve = 0.5 - 0.5 * cos(clampedFromTop * 3.14159265);
    float rowDelay = staggerCurve * staggerAmount;
    float rowLinear = clamp((uProgress - rowDelay) / (1.0 - staggerAmount), 0.0, 1.0);

    return rowLinear >= 1.0
      ? 1.0
      : 1.0 - pow(2.0, -10.0 * rowLinear);
  }

  void main() {
    vUv = uv;

    float fromTop = 0.5 - position.y;
    float sampleStep = 0.02;
    float rowProgress =
      getRowProgress(fromTop - sampleStep * 4.0) * 0.02763055 +
      getRowProgress(fromTop - sampleStep * 3.0) * 0.06628225 +
      getRowProgress(fromTop - sampleStep * 2.0) * 0.12383154 +
      getRowProgress(fromTop - sampleStep) * 0.18017382 +
      getRowProgress(fromTop) * 0.20416369 +
      getRowProgress(fromTop + sampleStep) * 0.18017382 +
      getRowProgress(fromTop + sampleStep * 2.0) * 0.12383154 +
      getRowProgress(fromTop + sampleStep * 3.0) * 0.06628225 +
      getRowProgress(fromTop + sampleStep * 4.0) * 0.02763055;
    float floating = 1.0 - rowProgress;

    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    worldPosition.z += floating * uLift;

    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const fragmentShader = `
  precision highp float;

  uniform sampler2D uTexture;
  uniform vec2 uTextureSize;
  uniform vec2 uPlaneSize;
  uniform vec2 uObjectPosition;
  uniform float uProgress;
  varying vec2 vUv;

  vec2 coverUv(vec2 uv) {
    float planeAspect = uPlaneSize.x / uPlaneSize.y;
    float imageAspect = uTextureSize.x / uTextureSize.y;
    vec2 visible = vec2(1.0);

    if (imageAspect > planeAspect) {
      visible.x = planeAspect / imageAspect;
    } else {
      visible.y = imageAspect / planeAspect;
    }

    vec2 position = vec2(uObjectPosition.x, 1.0 - uObjectPosition.y);
    vec2 offset = position * (1.0 - visible);
    return uv * visible + offset;
  }

  void main() {
    gl_FragColor = texture2D(uTexture, coverUv(vUv));
    gl_FragColor.a *= smoothstep(0.0, 0.32, uProgress);
    #include <colorspace_fragment>
  }
`;

function parsePositionToken(token) {
  if (token === "left" || token === "top") return 0;
  if (token === "right" || token === "bottom") return 1;
  if (token === "center") return 0.5;
  if (token.endsWith("%")) return Number.parseFloat(token) / 100;
  return 0.5;
}

function parseObjectPosition(value) {
  const [x = "50%", y = "50%"] = value.trim().split(/\s+/);
  return new THREE.Vector2(parsePositionToken(x), parsePositionToken(y));
}

function easeOutExpo(progress) {
  if (progress === 0 || progress === 1) {
    return progress;
  }

  return 1 - Math.pow(2, -10 * progress);
}

function createMaterial(texture, image) {
  return new THREE.ShaderMaterial({
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uTexture: { value: texture },
      uTextureSize: {
        value: new THREE.Vector2(image.naturalWidth || image.width, image.naturalHeight || image.height)
      },
      uPlaneSize: { value: new THREE.Vector2(1, 1) },
      uObjectPosition: { value: parseObjectPosition(getComputedStyle(image).objectPosition) },
      uProgress: { value: reducedMotion.matches ? 1 : 0 },
      uLift: { value: 0 }
    },
    transparent: true,
    vertexShader,
    fragmentShader
  });
}

async function initPlaneReveal() {
  if (!stage || !canvas || cards.length === 0 || !window.WebGLRenderingContext) {
    return;
  }

  let renderer;

  try {
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      canvas,
      powerPreference: "high-performance"
    });
  } catch {
    return;
  }

  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 5000);
  camera.position.z = 1;

  const loader = new THREE.TextureLoader();
  const geometry = new THREE.PlaneGeometry(1, 1, 1, 512);

  let entries;

  try {
    entries = await Promise.all(
      cards.map(async (card) => {
        const image = card.querySelector("img");
        const texture = await loader.loadAsync(image.currentSrc || image.src);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;

        const material = createMaterial(texture, image);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.frustumCulled = false;
        scene.add(mesh);

        return {
          card,
          image,
          material,
          mesh,
          texture,
          startedAt: null,
          complete: reducedMotion.matches
        };
      })
    );
  } catch {
    geometry.dispose();
    renderer.dispose();
    return;
  }

  let viewportWidth = 1;
  let viewportHeight = 1;
  let frameId = 0;
  let sizeDirty = true;

  function resizeRenderer() {
    const canvasRect = canvas.getBoundingClientRect();
    viewportWidth = Math.max(1, canvasRect.width);
    viewportHeight = Math.max(1, canvasRect.height);

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(viewportWidth, viewportHeight, false);

    camera.aspect = viewportWidth / viewportHeight;
    camera.position.z = viewportHeight / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
    camera.far = camera.position.z + 2000;
    camera.updateProjectionMatrix();

    sizeDirty = false;
  }

  function syncMeshesToDom() {
    entries.forEach(({ card, image, material, mesh }) => {
      const rect = card.getBoundingClientRect();
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);

      mesh.position.set(
        rect.left + width / 2 - viewportWidth / 2,
        viewportHeight / 2 - (rect.top + height / 2),
        0
      );
      mesh.scale.set(width, height, 1);
      mesh.visible = rect.bottom > 0 && rect.top < viewportHeight && rect.right > 0 && rect.left < viewportWidth;

      material.uniforms.uPlaneSize.value.set(width, height);
      material.uniforms.uObjectPosition.value.copy(parseObjectPosition(getComputedStyle(image).objectPosition));
      material.uniforms.uLift.value = Math.min(220, Math.max(120, height * 0.42));
    });
  }

  function updateRevealProgress(time) {
    entries.forEach((entry) => {
      if (entry.complete || entry.startedAt === null) {
        return;
      }

      const elapsed = Math.max(0, time - entry.startedAt);
      const normalized = Math.min(1, elapsed / REVEAL_DURATION);
      entry.material.uniforms.uProgress.value = normalized;

      if (normalized >= 1) {
        entry.material.uniforms.uProgress.value = 1;
        entry.complete = true;
      }
    });
  }

  function render(time = 0) {
    if (sizeDirty) {
      resizeRenderer();
    }

    updateRevealProgress(time);
    syncMeshesToDom();
    renderer.render(scene, camera);
    frameId = requestAnimationFrame(render);
  }

  function requestResize() {
    sizeDirty = true;
  }

  const resizeObserver = new ResizeObserver(requestResize);
  resizeObserver.observe(document.documentElement);
  cards.forEach((card) => resizeObserver.observe(card));
  window.addEventListener("resize", requestResize);

  const revealObserver = reducedMotion.matches ? null : new IntersectionObserver((observedEntries) => {
    observedEntries.forEach((observedEntry) => {
      if (!observedEntry.isIntersecting) {
        return;
      }

      const entry = entries.find((item) => item.card === observedEntry.target);
      if (entry && entry.startedAt === null) {
        entry.startedAt = performance.now();
      }
      revealObserver.unobserve(observedEntry.target);
    });
  }, {
    rootMargin: "0px 0px -8% 0px",
    threshold: 0.08
  });

  revealObserver?.observe(cards[0]);
  cards.slice(1).forEach((card) => revealObserver?.observe(card));

  resizeRenderer();
  syncMeshesToDom();
  renderer.render(scene, camera);
  stage.setAttribute("data-webgl-ready", "");
  frameId = requestAnimationFrame(render);

  window.addEventListener("pagehide", () => {
    cancelAnimationFrame(frameId);
    window.removeEventListener("resize", requestResize);
    resizeObserver.disconnect();
    revealObserver?.disconnect();
    geometry.dispose();
    entries.forEach(({ material, texture }) => {
      material.dispose();
      texture.dispose();
    });
    renderer.dispose();
  }, { once: true });
}

initPlaneReveal();
