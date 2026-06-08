import * as THREE from "three";

function createDiamondGeometry() {
  const sides = 12;
  const rings = [
    { radius: 0, z: 1.85, offset: 0 },
    { radius: 1.02, z: 0.76, offset: Math.PI / sides },
    { radius: 1.56, z: 0.24, offset: 0 },
    { radius: 1.42, z: -0.1, offset: Math.PI / sides },
    { radius: 0, z: -1.78, offset: 0 }
  ];
  const positions = [];
  const indices = [];

  rings.forEach((ring) => {
    for (let side = 0; side < sides; side += 1) {
      const angle = (side / sides) * Math.PI * 2 + ring.offset;
      positions.push(
        Math.cos(angle) * ring.radius,
        Math.sin(angle) * ring.radius,
        ring.z
      );
    }
  });

  for (let ring = 0; ring < rings.length - 1; ring += 1) {
    for (let side = 0; side < sides; side += 1) {
      const nextSide = (side + 1) % sides;
      const a = ring * sides + side;
      const b = (ring + 1) * sides + side;
      const c = (ring + 1) * sides + nextSide;
      const d = ring * sides + nextSide;
      indices.push(a, b, d, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  const faceted = geometry.toNonIndexed();
  geometry.dispose();
  faceted.computeVertexNormals();
  faceted.computeBoundingSphere();
  return faceted;
}

function createStudioEnvironment(renderer) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  canvas.width = 1536;
  canvas.height = 768;

  const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#e2edf5");
  gradient.addColorStop(0.2, "#343a40");
  gradient.addColorStop(0.58, "#080909");
  gradient.addColorStop(1, "#59635f");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  [
    { x: 90, width: 88, color: "#ffffff" },
    { x: 380, width: 34, color: "#65e2ff" },
    { x: 870, width: 112, color: "#ffffff" },
    { x: 1260, width: 38, color: "#ff72d5" }
  ].forEach(({ x, width, color }) => {
    const panel = context.createLinearGradient(x, 0, x + width, 0);
    panel.addColorStop(0, "rgba(255,255,255,0)");
    panel.addColorStop(0.3, color);
    panel.addColorStop(0.7, color);
    panel.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = panel;
    context.fillRect(x, 70, width, 590);
  });

  const source = new THREE.CanvasTexture(canvas);
  source.mapping = THREE.EquirectangularReflectionMapping;
  source.colorSpace = THREE.SRGBColorSpace;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const texture = pmrem.fromEquirectangular(source).texture;
  source.dispose();
  pmrem.dispose();
  return texture;
}

export function initGlassScene({ canvas, reducedMotion }) {
  if (!canvas || !WebGLRenderingContext) {
    return null;
  }

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    canvas,
    powerPreference: "high-performance"
  });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.28;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 0, 10);

  const backgroundUniforms = {
    uResolution: { value: new THREE.Vector2(1, 1) }
  };
  const background = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.ShaderMaterial({
      depthWrite: true,
      uniforms: backgroundUniforms,
      vertexShader: `
        varying vec2 vUv;

        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec2 uResolution;
        varying vec2 vUv;

        void main() {
          vec2 pixels = vUv * uResolution;
          float lineX = 1.0 - smoothstep(0.0, 1.1, mod(pixels.x, 64.0));
          float lineY = 1.0 - smoothstep(0.0, 1.1, mod(pixels.y, 64.0));
          float grid = max(lineX, lineY) * 0.035;
          vec3 dark = vec3(0.063, 0.067, 0.059) + grid;
          gl_FragColor = vec4(dark, 1.0);
        }
      `
    })
  );
  background.position.z = -5;
  scene.add(background);

  scene.environment = createStudioEnvironment(renderer);

  const geometry = createDiamondGeometry();
  const sculpture = new THREE.Group();
  const glass = new THREE.Mesh(
    geometry,
    new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.008,
      metalness: 0,
      transmission: 1,
      thickness: 2.6,
      ior: 2.18,
      dispersion: 0.42,
      iridescence: 0.28,
      iridescenceIOR: 1.46,
      iridescenceThicknessRange: [240, 720],
      clearcoat: 1,
      clearcoatRoughness: 0.006,
      attenuationColor: new THREE.Color(0xf2fbff),
      attenuationDistance: 12,
      envMapIntensity: 1.65
    })
  );
  sculpture.add(glass);

  const spectrum = new THREE.Mesh(
    geometry,
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewDirection;

        void main() {
          vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
          vNormal = normalize(normalMatrix * normal);
          vViewDirection = normalize(-viewPosition.xyz);
          gl_Position = projectionMatrix * viewPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vViewDirection;

        vec3 spectrum(float value) {
          return 0.52 + 0.48 * cos(
            6.28318 * (value + vec3(0.0, 0.33, 0.67))
          );
        }

        void main() {
          float fresnel = pow(1.0 - abs(dot(normalize(vNormal), vViewDirection)), 2.4);
          float band = dot(normalize(vNormal), vec3(0.28, 0.72, 0.36));
          vec3 color = spectrum(band * 0.42 + fresnel * 0.62);
          float alpha = smoothstep(0.22, 0.96, fresnel) * 0.18;
          gl_FragColor = vec4(color, alpha);
        }
      `
    })
  );
  spectrum.scale.setScalar(1.012);
  sculpture.add(spectrum);

  sculpture.rotation.set(1.16, -0.24, 0.08);
  scene.add(sculpture);

  const rim = new THREE.PointLight(0xff8bdd, 34, 20, 2);
  rim.position.set(-4, 3.5, 5);
  scene.add(rim);

  const coolLight = new THREE.PointLight(0x7de5ff, 32, 18, 2);
  coolLight.position.set(4, -2, 4);
  scene.add(coolLight);

  const warmLight = new THREE.PointLight(0xffed9a, 24, 16, 2);
  warmLight.position.set(2, 4, -2);
  scene.add(warmLight);

  let progress = 0;
  let animationFrame = 0;
  let startTime = performance.now();

  function resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const pixelRatio = Math.min(window.devicePixelRatio, 1.75);

    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    backgroundUniforms.uResolution.value.set(width, height);

    const backgroundDistance = camera.position.z - background.position.z;
    const backgroundHeight =
      2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * backgroundDistance;
    background.scale.set(backgroundHeight * camera.aspect, backgroundHeight, 1);


    const mobile = width < 760;
    sculpture.scale.setScalar(mobile ? 0.36 : 0.47);
    sculpture.position.set(
      mobile ? 1.25 : Math.min(3.45, width / 400),
      mobile ? -0.45 : -0.2,
      0
    );
  }

  function render(time = performance.now()) {
    const elapsed = (time - startTime) * 0.001;
    const motion = reducedMotion.matches ? 0 : elapsed;

    sculpture.rotation.x = 1.16 + Math.sin(motion * 0.27) * 0.08 + progress * 0.12;
    sculpture.rotation.y = -0.24 + motion * 0.09 + progress * 0.62;
    sculpture.rotation.z = 0.08 + Math.sin(motion * 0.32) * 0.08;
    sculpture.position.y +=
      ((window.innerWidth < 760 ? -0.45 : -0.2) + Math.sin(motion * 0.55) * 0.1 -
        sculpture.position.y) *
      0.04;

    renderer.render(scene, camera);

    if (!reducedMotion.matches) {
      animationFrame = requestAnimationFrame(render);
    }
  }

  function restartAnimation() {
    cancelAnimationFrame(animationFrame);
    startTime = performance.now();
    render();
  }

  function setProgress(value) {
    progress = value;

    if (reducedMotion.matches) {
      render();
    }
  }

  resize();
  render();
  window.addEventListener("resize", resize);
  reducedMotion.addEventListener("change", restartAnimation);

  return { setProgress };
}
