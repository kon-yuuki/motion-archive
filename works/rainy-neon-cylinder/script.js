import * as THREE from "three";
import "../_shared/detail-shell.js";

const container = document.querySelector("[data-cylinder]");
const canvas = document.querySelector("[data-cylinder-canvas]");
const previousButton = document.querySelector("[data-cylinder-prev]");
const nextButton = document.querySelector("[data-cylinder-next]");
const slideCounter = document.querySelector("[data-cylinder-counter]");
const slideCopy = document.querySelector(".cylinder-copy");
const slideCategory = document.querySelector("[data-slide-category]");
const slideTitle = document.querySelector("[data-slide-title]");
const slideDescription = document.querySelector("[data-slide-description]");
const dragCursor = document.querySelector("[data-cylinder-drag-cursor]");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const slideContent = [
  { category: "Night Study 01 · Boulevard", title: ["Rain-lit", "Boulevard"], description: "Digital billboards and warm windows frame\na crowded avenue after dark." },
  { category: "Night Study 02 · Blue Hour", title: ["Electric", "Downtown"], description: "Cool displays wash the narrow street\nwhile a late bus moves through the rain." },
  { category: "Night Study 03 · Crossing", title: ["Red", "Reflections"], description: "Signals, umbrellas, and passing figures\nrepeat across a mirror of rainwater." },
  { category: "Night Study 04 · Side Street", title: ["Amber", "Shelter"], description: "A quieter street glows beneath awnings\nas cyclists and umbrellas pass by." },
  { category: "Night Study 05 · Overlook", title: ["Neon", "Current"], description: "Traffic carries ribbons of magenta and blue\nthrough the city seen from above." },
  { category: "Night Study 06 · Through Glass", title: ["Rain", "Patterns"], description: "Streetlights dissolve into color\nthrough a window covered in raindrops." },
  { category: "Night Study 07 · Pedestrians", title: ["Umbrella", "Crossing"], description: "Commuters move between cool blue screens\nand pools of warm orange light." },
  { category: "Night Study 08 · Avenue", title: ["Midnight", "Lines"], description: "An almost empty boulevard stretches ahead,\ndivided by blue and amber reflections." },
  { category: "Night Study 09 · Rush", title: ["City", "Pulse"], description: "Headlights and red signals build a dense\nrhythm through the rain-soaked street." },
  { category: "Night Study 10 · After Dark", title: ["Last", "Light"], description: "Taxis and storefronts leave one final glow\nbefore the city loop begins again." }
];

const imageSources = [
  new URL("../../src/assets/images/rainy-neon-cityscapes/rainy-neon-cityscape-01.webp", import.meta.url).href,
  new URL("../../src/assets/images/rainy-neon-cityscapes/rainy-neon-cityscape-02.webp", import.meta.url).href,
  new URL("../../src/assets/images/rainy-neon-cityscapes/rainy-neon-cityscape-03.webp", import.meta.url).href,
  new URL("../../src/assets/images/rainy-neon-cityscapes/rainy-neon-cityscape-04.webp", import.meta.url).href,
  new URL("../../src/assets/images/rainy-neon-cityscapes/rainy-neon-cityscape-05.webp", import.meta.url).href,
  new URL("../../src/assets/images/rainy-neon-cityscapes/rainy-neon-cityscape-06.webp", import.meta.url).href,
  new URL("../../src/assets/images/rainy-neon-cityscapes/rainy-neon-cityscape-07.webp", import.meta.url).href,
  new URL("../../src/assets/images/rainy-neon-cityscapes/rainy-neon-cityscape-08.webp", import.meta.url).href,
  new URL("../../src/assets/images/rainy-neon-cityscapes/rainy-neon-cityscape-09.webp", import.meta.url).href,
  new URL("../../src/assets/images/rainy-neon-cityscapes/rainy-neon-cityscape-10.webp", import.meta.url).href
];

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

      vec3 sampleHighlight(vec2 uv) {
        vec3 sampleColor = texture2D(uTexture, clamp(uv, vec2(0.002), vec2(0.998))).rgb;
        float sampleLuminance = dot(sampleColor, vec3(0.2126, 0.7152, 0.0722));
        return sampleColor * smoothstep(0.58, 0.92, sampleLuminance);
      }

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

        float shade = 0.68 + uLight * 0.24;
        vec4 image = texture2D(uTexture, imageUv);
        vec3 color = image.rgb * shade;
        float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
        color = mix(vec3(luminance), color, 0.84);
        color = mix(vec3(0.025, 0.028, 0.038), color, 0.84);

        vec2 glowOffset = vec2(0.007, 0.012);
        vec3 glow = sampleHighlight(imageUv + vec2(glowOffset.x, 0.0));
        glow += sampleHighlight(imageUv - vec2(glowOffset.x, 0.0));
        glow += sampleHighlight(imageUv + vec2(0.0, glowOffset.y));
        glow += sampleHighlight(imageUv - vec2(0.0, glowOffset.y));
        glow += sampleHighlight(imageUv + glowOffset);
        glow += sampleHighlight(imageUv - glowOffset);
        glow += sampleHighlight(imageUv + vec2(glowOffset.x, -glowOffset.y));
        glow += sampleHighlight(imageUv + vec2(-glowOffset.x, glowOffset.y));
        glow *= 0.125;
        color = 1.0 - (1.0 - color) * (1.0 - glow * 0.24);

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
  const cameraPointer = new THREE.Vector2();
  const cameraPosition = new THREE.Vector2();
  let cameraBaseZ = 7.5;

  const cylinderRig = new THREE.Group();
  const carousel = new THREE.Group();
  cylinderRig.add(carousel);
  scene.add(cylinderRig);

  const textureLoader = new THREE.TextureLoader();
  const textures = imageSources.map((source) => {
    const texture = textureLoader.load(source, (loadedTexture) => {
      const image = loadedTexture.image;
      if (!image?.width || !image?.height) return;
      const aspect = image.width / image.height;
      loadedTexture.userData.aspect = aspect;
      loadedTexture.userData.materials?.forEach((material) => {
        material.uniforms.uTextureAspect.value = aspect;
      });
    });
    texture.userData.materials = [];
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
    return texture;
  });

  const radius = 3.1;
  const panelCount = imageSources.length;
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
    texture.userData.materials.push(material);
    if (texture.userData.aspect) {
      material.uniforms.uTextureAspect.value = texture.userData.aspect;
    }
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

  let rotation = 0;
  let targetRotation = rotation;
  let snapStartRotation = rotation;
  let snapStartedAt = 0;
  let isSnapping = false;
  let autoRotationEnabled = true;
  let autoAdvanceAt = performance.now() + 3000;
  let isDragging = false;
  let dragStartX = 0;
  let dragStartRotation = 0;
  let pressDepth = 0;
  let layoutScale = 1;
  let currentSlide = 0;
  let lastTime = performance.now();
  let animationFrame = 0;
  const slideStep = (Math.PI * 2) / panelCount;
  const slideDuration = 900;
  const autoHoldDuration = 3000;

  function easeInOutCubic(progress) {
    return progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;
  }

  function updateSlideCopy() {
    const content = slideContent[currentSlide];
    if (!content) return;
    slideCopy?.toggleAttribute("data-long-title", content.title.some((line) => line.length >= 10));
    slideCategory.textContent = content.category;
    slideTitle.replaceChildren(...content.title.map((line) => {
      const lineElement = document.createElement("span");
      lineElement.className = "cylinder-title-line";
      const textElement = document.createElement("span");
      textElement.className = "cylinder-title-line__text";
      textElement.textContent = line;
      lineElement.append(textElement);
      return lineElement;
    }));
    slideDescription.replaceChildren(...content.description.split("\n").map((line) => {
      const lineElement = document.createElement("span");
      lineElement.className = "cylinder-description-line";
      const textElement = document.createElement("span");
      textElement.className = "cylinder-description-line__text";
      textElement.textContent = line;
      lineElement.append(textElement);
      return lineElement;
    }));
    if (slideCopy && !reducedMotion.matches) {
      slideCopy.removeAttribute("data-changing");
      void slideCopy.offsetWidth;
      slideCopy.setAttribute("data-changing", "");
    }
  }

  function moveSlide(direction) {
    const nearestStep = Math.round(rotation / slideStep);
    const targetStep = nearestStep - direction;
    snapStartRotation = rotation;
    snapStartedAt = performance.now();
    targetRotation = targetStep * slideStep;
    currentSlide = ((-targetStep % panelCount) + panelCount) % panelCount;
    isSnapping = true;
    autoRotationEnabled = false;
    if (slideCounter) {
      slideCounter.textContent = `${String(currentSlide + 1).padStart(2, "0")} / ${String(panelCount).padStart(2, "0")}`;
    }
    updateSlideCopy();
  }

  function updateCursor(event) {
    if (!dragCursor) return;
    dragCursor.style.left = `${event.clientX}px`;
    dragCursor.style.top = `${event.clientY}px`;
  }

  function updateCameraPointer(event) {
    if (event.pointerType !== "mouse" || reducedMotion.matches) return;
    const bounds = container.getBoundingClientRect();
    cameraPointer.set(
      THREE.MathUtils.clamp(((event.clientX - bounds.left) / bounds.width) * 2 - 1, -1, 1),
      THREE.MathUtils.clamp(1 - ((event.clientY - bounds.top) / bounds.height) * 2, -1, 1)
    );
  }

  function handlePointerDown(event) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    isDragging = true;
    autoRotationEnabled = false;
    isSnapping = false;
    dragStartX = event.clientX;
    dragStartRotation = rotation;
    container.setPointerCapture(event.pointerId);
    dragCursor?.setAttribute("data-dragging", "");
  }

  function handlePointerMove(event) {
    updateCursor(event);
    updateCameraPointer(event);
    if (!isDragging) return;
    const dragOffset = THREE.MathUtils.clamp((event.clientX - dragStartX) * 0.0008, -0.06, 0.06);
    rotation = dragStartRotation + dragOffset;
  }

  function handlePointerUp(event) {
    if (!isDragging) return;
    isDragging = false;
    if (container.hasPointerCapture(event.pointerId)) {
      container.releasePointerCapture(event.pointerId);
    }
    dragCursor?.removeAttribute("data-dragging");

    const bounds = container.getBoundingClientRect();
    const outside = event.clientX < bounds.left || event.clientX > bounds.right
      || event.clientY < bounds.top || event.clientY > bounds.bottom;
    if (outside) dragCursor?.removeAttribute("data-visible");

    const dragDistance = event.clientX - dragStartX;
    if (Math.abs(dragDistance) >= 40) {
      moveSlide(dragDistance < 0 ? 1 : -1);
      return;
    }

    const targetStep = Math.round(dragStartRotation / slideStep);
    snapStartRotation = rotation;
    snapStartedAt = performance.now();
    targetRotation = targetStep * slideStep;
    currentSlide = ((-targetStep % panelCount) + panelCount) % panelCount;
    isSnapping = true;
    if (slideCounter) {
      slideCounter.textContent = `${String(currentSlide + 1).padStart(2, "0")} / ${String(panelCount).padStart(2, "0")}`;
    }
    updateSlideCopy();
  }

  function handleKeydown(event) {
    if (event.key === "ArrowLeft") moveSlide(-1);
    if (event.key === "ArrowRight") moveSlide(1);
  }

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
    cameraBaseZ = mobile ? 8.3 : 7.5;
    camera.position.z = cameraBaseZ;
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();

    layoutScale = mobile ? (compactMobile ? 0.72 : 0.82) : 1.28;
    cylinderRig.scale.setScalar(layoutScale);
    cylinderRig.position.set(0, mobile ? -0.26 : -0.38, 0);
    cylinderRig.rotation.x = -0.08;
    cylinderRig.rotation.z = 0.06;
  }

  function render(time) {
    const delta = Math.min(40, time - lastTime) / 16.67;
    lastTime = time;

    const targetPressDepth = isDragging ? 1 : 0;
    pressDepth += (targetPressDepth - pressDepth) * (isDragging ? 0.16 : 0.1);
    cylinderRig.position.z = THREE.MathUtils.lerp(0, -0.22, pressDepth);
    cylinderRig.scale.setScalar(layoutScale * THREE.MathUtils.lerp(1, 0.98, pressDepth));

    const cameraEase = 1 - Math.pow(0.9, delta);
    cameraPosition.x = THREE.MathUtils.lerp(cameraPosition.x, cameraPointer.x * 0.3, cameraEase);
    cameraPosition.y = THREE.MathUtils.lerp(cameraPosition.y, cameraPointer.y * 0.18, cameraEase);
    camera.position.set(cameraPosition.x, cameraPosition.y, cameraBaseZ);
    camera.lookAt(0, -0.08, 0);

    if (isSnapping) {
      const progress = reducedMotion.matches
        ? 1
        : Math.min(1, (time - snapStartedAt) / slideDuration);
      const easedProgress = easeInOutCubic(progress);
      rotation = THREE.MathUtils.lerp(snapStartRotation, targetRotation, easedProgress);
      if (progress >= 1) {
        rotation = targetRotation;
        isSnapping = false;
        autoRotationEnabled = true;
        autoAdvanceAt = time + autoHoldDuration;
      }
    } else if (autoRotationEnabled && !reducedMotion.matches) {
      if (time >= autoAdvanceAt) {
        moveSlide(1);
      } else {
        rotation -= 0.00018 * delta;
      }
    }
    carousel.rotation.y = rotation;

    panels.forEach((panel) => {
      const angle = normalizeAngle(rotation + panel.userData.angle);
      const front = (Math.cos(angle) + 1) / 2;
      const side = Math.sin(angle);
      const material = panel.userData.material;
      const targetParallax = THREE.MathUtils.clamp(-side * 0.62, -0.9, 0.9);

      panel.userData.parallax = targetParallax;
      material.uniforms.uParallax.value = panel.userData.parallax;
      material.uniforms.uLight.value = front;
      panel.renderOrder = Math.round(front * 1000);
    });

    renderer.render(scene, camera);
    animationFrame = requestAnimationFrame(render);
  }

  resize();
  window.addEventListener("resize", resize);
  window.addEventListener("keydown", handleKeydown);
  container.addEventListener("pointerenter", (event) => {
    updateCursor(event);
    updateCameraPointer(event);
    dragCursor?.setAttribute("data-visible", "");
  });
  container.addEventListener("pointerleave", () => {
    if (!isDragging) dragCursor?.removeAttribute("data-visible");
    cameraPointer.set(0, 0);
  });
  container.addEventListener("pointerdown", handlePointerDown);
  container.addEventListener("pointermove", handlePointerMove);
  container.addEventListener("pointerup", handlePointerUp);
  container.addEventListener("pointercancel", handlePointerUp);
  previousButton?.addEventListener("click", () => moveSlide(-1));
  nextButton?.addEventListener("click", () => moveSlide(1));
  animationFrame = requestAnimationFrame(render);

  return {
    destroy() {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", handleKeydown);
      panelGeometry.dispose();
      panels.forEach((panel) => panel.material.dispose());
      textures.forEach((texture) => texture.dispose());
      renderer.dispose();
    }
  };
}

initCylinderScene();
