import * as THREE from "three";
import "../_shared/detail-shell.js";
import { initSmoothScroll } from "../../src/scripts/smooth-scroll.js";

initSmoothScroll({ lerp: 0.08, wheelMultiplier: 0.9 });

const container = document.querySelector("[data-cylinder]");
const canvas = document.querySelector("[data-cylinder-canvas]");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const imageSources = [
  "../../src/assets/images/optimized/dummy_1-1024.webp",
  "../../src/assets/images/optimized/dummy_2-1024.webp",
  "../../src/assets/images/optimized/dummy_3-1024.webp",
  "../../src/assets/images/optimized/dummy_4-1024.webp"
].map((path) => new URL(path, import.meta.url).href);

function createCurvedPanelGeometry({ radius, arc, height, segments = 32 }) {
  const positions = [];
  const uvs = [];
  const indices = [];
  const verticalSegments = 4;

  for (let xIndex = 0; xIndex <= segments; xIndex += 1) {
    const u = xIndex / segments;
    const angle = (u - 0.5) * arc;
    const x = Math.sin(angle) * radius;
    const z = Math.cos(angle) * radius;

    for (let yIndex = 0; yIndex <= verticalSegments; yIndex += 1) {
      const v = yIndex / verticalSegments;
      positions.push(x, (0.5 - v) * height, z);
      uvs.push(u, 1 - v);
    }
  }

  for (let xIndex = 0; xIndex < segments; xIndex += 1) {
    for (let yIndex = 0; yIndex < verticalSegments; yIndex += 1) {
      const row = verticalSegments + 1;
      const a = xIndex * row + yIndex;
      const b = (xIndex + 1) * row + yIndex;
      const c = (xIndex + 1) * row + yIndex + 1;
      const d = xIndex * row + yIndex + 1;
      indices.push(a, b, d, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function createPanelMaterial(texture) {
  return new THREE.ShaderMaterial({
    depthTest: true,
    depthWrite: true,
    side: THREE.DoubleSide,
    transparent: false,
    uniforms: {
      uTexture: { value: texture },
      uLight: { value: 1 },
      uParallax: { value: 0 },
      uTextureAspect: { value: 1 },
      uPanelAspect: { value: 1 }
    },
    vertexShader: `
      varying vec2 vUv;

      void main() {
        vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
        vUv = uv;
        gl_Position = projectionMatrix * viewPosition;
      }
    `,
    fragmentShader: `
      uniform sampler2D uTexture;
      uniform float uLight;
      uniform float uParallax;
      uniform float uTextureAspect;
      uniform float uPanelAspect;
      varying vec2 vUv;

      void main() {
        vec2 imageUv = vUv - 0.5;
        float aspectRatio = uPanelAspect / uTextureAspect;
        if (aspectRatio > 1.0) {
          imageUv.y /= aspectRatio;
        } else {
          imageUv.x *= aspectRatio;
        }
        imageUv *= 0.78;
        imageUv.x -= uParallax * 0.18;
        imageUv += 0.5;
        imageUv = clamp(imageUv, vec2(0.002), vec2(0.998));

        float shade = 0.72 + uLight * 0.34;
        vec3 backColor = vec3(0.91, 0.91, 0.89) * (0.98 + uLight * 0.02);
        vec3 color = backColor;

        if (!gl_FrontFacing) {
          vec4 image = texture2D(uTexture, imageUv);
          color = image.rgb * shade;
        }

        gl_FragColor = vec4(color, 1.0);
      }
    `
  });
}

function normalizeAngle(angle) {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

function initCylinderScene() {
  if (!container || !canvas || !window.WebGLRenderingContext) {
    container?.setAttribute("data-webgl-unavailable", "");
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
    container.setAttribute("data-webgl-unavailable", "");
    return null;
  }

  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  camera.position.set(0, 0, 8.6);

  const carousel = new THREE.Group();
  scene.add(carousel);

  const textureLoader = new THREE.TextureLoader();
  const textures = imageSources.map((source) => {
    const texture = textureLoader.load(source);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
    return texture;
  });

  const radius = 3.1;
  const panelCount = 8;
  const panelArc = (Math.PI * 2) / panelCount * 0.9;
  const panelHeight = 1.32;
  const panelAspect = (radius * panelArc) / panelHeight;
  const panelGeometry = createCurvedPanelGeometry({
    radius,
    arc: panelArc,
    height: panelHeight
  });
  const panels = Array.from({ length: panelCount }, (_, index) => {
    const texture = textures[index % textures.length];
    const material = createPanelMaterial(texture);
    material.uniforms.uPanelAspect.value = panelAspect;
    texture.addEventListener("update", () => {
      const image = texture.image;
      if (image?.width && image?.height) {
        material.uniforms.uTextureAspect.value = image.width / image.height;
      }
    });
    const mesh = new THREE.Mesh(panelGeometry, material);
    const angle = (index / panelCount) * Math.PI * 2;
    mesh.rotation.y = angle;
    mesh.userData = {
      angle,
      material,
      parallax: 0
    };
    carousel.add(mesh);
    return mesh;
  });

  let rotation = -0.18;
  let velocity = 0;
  let lastScroll = window.scrollY;
  let lastTime = performance.now();
  let animationFrame = 0;

  function resize() {
    const width = container.clientWidth;
    const height = container.clientHeight;
    const pixelRatio = Math.min(window.devicePixelRatio, 1.75);
    const mobile = width < 720;
    const compactMobile = mobile && height < 740;

    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.fov = mobile ? 38 : 36;
    camera.position.z = mobile ? 10.2 : 8.45;
    camera.updateProjectionMatrix();

    carousel.scale.setScalar(mobile ? (compactMobile ? 0.5 : 0.56) : 0.96);
    carousel.position.set(mobile ? 0.08 : 1.35, compactMobile ? -1.28 : mobile ? -1.3 : -0.22, 0);
    carousel.rotation.x = mobile ? 0.14 : 0.28;
  }

  function render(time) {
    const delta = Math.min(40, time - lastTime) / 16.67;
    const scrollDelta = window.scrollY - lastScroll;
    lastScroll = window.scrollY;
    lastTime = time;

    velocity += scrollDelta * 0.00012;
    velocity *= 0.88;
    const baseSpeed = reducedMotion.matches ? 0 : 0.0026;
    rotation += (baseSpeed + velocity) * delta;
    carousel.rotation.y = rotation;

    panels.forEach((panel) => {
      const angle = normalizeAngle(rotation + panel.userData.angle);
      const front = (Math.cos(angle) + 1) / 2;
      const side = Math.sin(angle);
      const material = panel.userData.material;
      const targetParallax = THREE.MathUtils.clamp((-side * 0.62) - velocity * 6.8, -0.9, 0.9);

      panel.userData.parallax += (targetParallax - panel.userData.parallax) * 0.12;
      material.uniforms.uParallax.value = panel.userData.parallax;
      material.uniforms.uLight.value = front;
      panel.renderOrder = Math.round(front * 1000);
    });

    renderer.render(scene, camera);
    animationFrame = requestAnimationFrame(render);
  }

  resize();
  window.addEventListener("resize", resize);
  animationFrame = requestAnimationFrame(render);

  return {
    destroy() {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      panelGeometry.dispose();
      panels.forEach((panel) => panel.material.dispose());
      textures.forEach((texture) => texture.dispose());
      renderer.dispose();
    }
  };
}

initCylinderScene();
