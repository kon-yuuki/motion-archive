import * as THREE from "three";
import "../_shared/detail-shell.js";

const stage = document.querySelector("[data-stage]");
const canvas = document.querySelector("[data-canvas]");
const hint = document.querySelector("[data-hint]");
const coarsePointer = window.matchMedia("(pointer: coarse)");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

if (coarsePointer.matches && hint) hint.textContent = "Drag slowly across the image";

const MAX_SPLATS = 16;
const TRAIL_SIZE = 512;
const imageUrl = new URL("../../src/assets/images/sunlit-floral-portraits/sunlit-floral-portrait-04.webp", import.meta.url).href;
let renderer;

try {
  renderer = new THREE.WebGLRenderer({ canvas, alpha: false, antialias: false, powerPreference: "high-performance" });
} catch {
  stage.setAttribute("data-unsupported", "");
}

if (renderer) {
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const geometry = new THREE.PlaneGeometry(2, 2);
  const texture = new THREE.TextureLoader().load(imageUrl, () => stage.setAttribute("data-webgl-ready", ""));
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  const targetOptions = {
    type: THREE.HalfFloatType,
    format: THREE.RGBAFormat,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    depthBuffer: false,
    stencilBuffer: false
  };
  let readTarget = new THREE.WebGLRenderTarget(TRAIL_SIZE, TRAIL_SIZE, targetOptions);
  let writeTarget = new THREE.WebGLRenderTarget(TRAIL_SIZE, TRAIL_SIZE, targetOptions);

  const splats = Array.from({ length: MAX_SPLATS }, () => new THREE.Vector4(-10, -10, 0, 0.06));
  const splatMotions = Array.from({ length: MAX_SPLATS }, () => new THREE.Vector3(1, 0, 1));
  const updateMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uPrevious: { value: readTarget.texture },
      uDecay: { value: 0.98 },
      uAspect: { value: 1 },
      uTexelSize: { value: new THREE.Vector2(1 / TRAIL_SIZE, 1 / TRAIL_SIZE) },
      uExpansion: { value: 1.5 },
      uLifeStep: { value: 0.016 },
      uSplats: { value: splats },
      uSplatMotions: { value: splatMotions },
      uSplatCount: { value: 0 }
    },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position,1.0); }`,
    fragmentShader: `
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D uPrevious;
      uniform float uDecay;
      uniform float uAspect;
      uniform vec2 uTexelSize;
      uniform float uExpansion;
      uniform float uLifeStep;
      uniform vec4 uSplats[${MAX_SPLATS}];
      uniform vec3 uSplatMotions[${MAX_SPLATS}];
      uniform int uSplatCount;

      float cometDistance(vec2 localPoint, float tailLength) {
        if (tailLength < 0.08) return length(localPoint);

        float behind = -localPoint.x;
        if (behind <= 0.0) {
          // Rounded leading edge around the cursor.
          return length(localPoint);
        }
        if (behind <= tailLength) {
          // The cross-section narrows continuously toward the tail.
          float tailProgress = behind / tailLength;
          float localWidth = mix(1.0, 0.06, pow(tailProgress, 0.72));
          return abs(localPoint.y) / localWidth;
        }

        // Soft pointed cap after the tapered section.
        vec2 tipPoint = vec2((behind - tailLength) / 0.12, localPoint.y / 0.06);
        return length(tipPoint);
      }

      void main() {
        vec4 localState = texture2D(uPrevious, vUv);
        vec3 localTrail = localState.rgb;

        // The strength gradient points from an empty outer pixel back toward
        // the existing ring. Sample in that direction and only accept the
        // sample when it lies opposite the stored radial direction. This
        // propagates the field outward without also filling its center.
        float left = texture2D(uPrevious, vUv - vec2(uTexelSize.x, 0.0)).b;
        float right = texture2D(uPrevious, vUv + vec2(uTexelSize.x, 0.0)).b;
        float bottom = texture2D(uPrevious, vUv - vec2(0.0, uTexelSize.y)).b;
        float top = texture2D(uPrevious, vUv + vec2(0.0, uTexelSize.y)).b;
        vec2 gradient = vec2(right - left, top - bottom);
        vec2 towardRing = normalize(gradient + vec2(0.000001));
        vec2 sourceUv = vUv + towardRing * uTexelSize * uExpansion;
        vec4 expandedState = texture2D(uPrevious, sourceUv);
        vec3 expandedTrail = expandedState.rgb;
        vec2 sourceRadial = normalize(vec2(expandedTrail.y, -expandedTrail.x) + vec2(0.000001));
        float isOuterEdge = smoothstep(0.15, 0.75, dot(towardRing, -sourceRadial));
        float outwardGain = expandedTrail.b - localTrail.b;
        float expansionMix = isOuterEdge * smoothstep(0.002, 0.022, outwardGain);
        vec4 trailState = mix(localState, expandedState, expansionMix * 0.86);
        float life = max(trailState.a - uLifeStep, 0.0);
        float lifeEnvelope = smoothstep(0.0, 0.24, life);
        vec3 trail = trailState.rgb * uDecay * lifeEnvelope;
        for (int i = 0; i < ${MAX_SPLATS}; i++) {
          if (i >= uSplatCount) break;
          vec2 delta = vUv - uSplats[i].xy;
          delta.x *= uAspect;
          float radius = uSplats[i].w;
          vec2 motionDirection = uSplatMotions[i].xy;
          motionDirection.x *= uAspect;
          motionDirection = normalize(motionDirection + vec2(0.000001));
          vec2 motionNormal = vec2(-motionDirection.y, motionDirection.x);
          float stretch = uSplatMotions[i].z;
          vec2 cometPoint = vec2(
            dot(delta, motionDirection),
            dot(delta, motionNormal)
          ) / radius;
          float tailLength = 0.78 + (stretch - 1.0) * 1.25;
          float d = cometDistance(cometPoint, tailLength);
          // A Gaussian ring puts the strongest twist near the rim of the
          // circular influence area while leaving its center almost still.
          float rimDistance = (d - 0.76) / 0.19;
          float gaussianRing = exp(-rimDistance * rimDistance);
          float outerFade = 1.0 - smoothstep(0.92, 1.08, d);
          float alongComet = clamp(
            (cometPoint.x + tailLength) / (tailLength + 1.0),
            0.0,
            1.0
          );
          float directionalStrength = mix(0.06, 1.0, pow(alongComet, 1.35));
          float swirl = gaussianRing * outerFade * directionalStrength;
          // Estimate the comet contour normal so the UV twist follows both
          // the round head and the tapered sides of the tail.
          float epsilon = 0.012;
          vec2 contourNormal = normalize(vec2(
            cometDistance(cometPoint + vec2(epsilon, 0.0), tailLength) -
              cometDistance(cometPoint - vec2(epsilon, 0.0), tailLength),
            cometDistance(cometPoint + vec2(0.0, epsilon), tailLength) -
              cometDistance(cometPoint - vec2(0.0, epsilon), tailLength)
          ) + vec2(0.000001));
          vec2 cometTangent = vec2(-contourNormal.y, contourNormal.x);
          vec2 tangent = normalize(
            motionDirection * cometTangent.x + motionNormal * cometTangent.y + vec2(0.000001)
          );
          // Keep a filled coverage mask separately from the displacement.
          // A pixel that already has a lifetime is never refreshed by a later
          // overlapping stamp. Older parts of the path therefore keep moving
          // outward and expire before the newer comet head.
          float coverage = 1.0 - smoothstep(0.56, 1.06, d);
          float available = 1.0 - step(0.001, life);
          float newCoverage = coverage * available;
          trail.xy += tangent * swirl * uSplats[i].z * available;
          trail.z = max(trail.z, newCoverage * uSplats[i].z * 7.0);
          life = max(life, newCoverage);
        }
        gl_FragColor = vec4(clamp(trail.xy, -0.22, 0.22), clamp(trail.z, 0.0, 1.0), life);
      }
    `
  });

  const displayMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uImage: { value: texture },
      uTrail: { value: readTarget.texture },
      uTrailTexelSize: { value: new THREE.Vector2(1 / TRAIL_SIZE, 1 / TRAIL_SIZE) },
      uImageSize: { value: new THREE.Vector2(1, 1) },
      uViewport: { value: new THREE.Vector2(innerWidth, innerHeight) },
      uStrength: { value: reducedMotion.matches ? 0.72 : 1.6 }
    },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position,1.0); }`,
    fragmentShader: `
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D uImage;
      uniform sampler2D uTrail;
      uniform vec2 uTrailTexelSize;
      uniform vec2 uImageSize;
      uniform vec2 uViewport;
      uniform float uStrength;

      vec2 coverUv(vec2 uv) {
        float imageAspect = uImageSize.x / uImageSize.y;
        float viewAspect = uViewport.x / uViewport.y;
        vec2 scale = vec2(1.0);
        if (viewAspect > imageAspect) scale.y = imageAspect / viewAspect;
        else scale.x = viewAspect / imageAspect;
        return (uv - 0.5) * scale + 0.5;
      }

      void main() {
        vec3 trail = texture2D(uTrail, vUv).rgb;
        float left = texture2D(uTrail, vUv - vec2(uTrailTexelSize.x, 0.0)).b;
        float right = texture2D(uTrail, vUv + vec2(uTrailTexelSize.x, 0.0)).b;
        float bottom = texture2D(uTrail, vUv - vec2(0.0, uTrailTexelSize.y)).b;
        float top = texture2D(uTrail, vUv + vec2(0.0, uTrailTexelSize.y)).b;
        float contour = length(vec2(right - left, top - bottom));
        float edgeStrength = smoothstep(0.0015, 0.018, contour);
        float displacementStrength = mix(0.08, 1.22, edgeStrength);
        vec2 uv = coverUv(vUv + trail.xy * displacementStrength * 0.92 * uStrength);
        vec3 color = texture2D(uImage, uv).rgb;
        color *= 1.0 + trail.z * edgeStrength * 0.035;
        gl_FragColor = vec4(color, 1.0);
      }
    `
  });

  const quad = new THREE.Mesh(geometry, displayMaterial);
  scene.add(quad);
  const pending = [];
  const pointerTarget = new THREE.Vector2();
  const pointerEased = new THREE.Vector2();
  const lastStamp = new THREE.Vector2();
  let hasPointer = false;
  let inputForce = 0.025;
  let lastInputTime = performance.now();
  let lastTime = performance.now();

  texture.onUpdate = () => {
    const image = texture.image;
    displayMaterial.uniforms.uImageSize.value.set(image.naturalWidth || image.width, image.naturalHeight || image.height);
  };

  function resize() {
    const rect = canvas.getBoundingClientRect();
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(rect.width, rect.height, false);
    updateMaterial.uniforms.uAspect.value = rect.width / rect.height;
    displayMaterial.uniforms.uViewport.value.set(rect.width, rect.height);
  }

  function addPointer(event) {
    const rect = stage.getBoundingClientRect();
    const next = new THREE.Vector2((event.clientX - rect.left) / rect.width, 1 - (event.clientY - rect.top) / rect.height);
    const eventTime = performance.now();
    if (!hasPointer) {
      pointerTarget.copy(next);
      pointerEased.copy(next);
      lastStamp.copy(next);
      pending.push({ point: next.clone(), force: 0.025, direction: new THREE.Vector2(1, 0), stretch: 1 });
      inputForce = 0.025;
    } else {
      // Distortion strength follows the actual input speed. The eased render
      // point must not become stronger merely because it slows near its goal.
      const inputDt = Math.max((eventTime - lastInputTime) / 1000, 0.001);
      const inputVelocity = pointerTarget.distanceTo(next) / inputDt;
      const inputSpeed = Math.min(1, inputVelocity * 0.72);
      const inverseInputSpeed = 1 - inputSpeed;
      inputForce = 0.0015 + inverseInputSpeed * inverseInputSpeed * 0.0255;
    }
    pointerTarget.copy(next);
    lastInputTime = eventTime;
    hasPointer = true;
    stage.setAttribute("data-interacted", "");
  }

  stage.addEventListener("pointermove", addPointer);
  stage.addEventListener("pointerdown", (event) => {
    hasPointer = false;
    stage.setPointerCapture?.(event.pointerId);
    addPointer(event);
  });
  stage.addEventListener("pointerleave", () => { hasPointer = false; });
  stage.addEventListener("pointerup", (event) => {
    if (event.pointerType !== "mouse") hasPointer = false;
  });
  window.addEventListener("resize", resize);
  resize();

  function frame(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    const decayRate = reducedMotion.matches ? 1.4 : 0.7;
    updateMaterial.uniforms.uDecay.value = Math.exp(-dt * decayRate);
    // Every distortion sample has a finite lifetime. During that lifetime it
    // always drifts gently outward, independent of pointer start/stop state.
    const lifetime = reducedMotion.matches ? 0.48 : 0.82;
    updateMaterial.uniforms.uLifeStep.value = dt / lifetime;
    updateMaterial.uniforms.uExpansion.value = Math.min(dt * 34, 1.4);

    if (hasPointer) {
      // Reapplying easeOutExpo to the remaining distance each frame gives the
      // distortion point a soft, frame-rate-independent cursor follow.
      const followDuration = 0.65;
      const progress = Math.min(dt / followDuration, 1);
      const easeOutExpo = progress >= 1 ? 1 : 1 - 2 ** (-10 * progress);
      const previous = pointerEased.clone();
      pointerEased.lerp(pointerTarget, reducedMotion.matches ? 1 : easeOutExpo);

      const distance = lastStamp.distanceTo(pointerEased);
      if (distance > 0.00015) {
        const steps = Math.min(MAX_SPLATS, Math.max(1, Math.ceil(distance / 0.014)));
        const frameDistance = previous.distanceTo(pointerEased);
        const velocity = frameDistance / Math.max(dt, 0.001);
        const direction = pointerEased.clone().sub(lastStamp).normalize();
        const stretch = 1 + Math.min(velocity * 1.25, 2.5);
        const idleTime = Math.max(0, (now - lastInputTime) / 1000 - 0.05);
        // Once input stops, carry the existing shape forward with the eased
        // point while its stretch returns to one and its strength fades out.
        // This avoids stamping a new, strong circle at the stopping point.
        const force = inputForce * Math.exp(-idleTime * 5.2);
        for (let i = 1; i <= steps; i++) {
          pending.push({
            point: lastStamp.clone().lerp(pointerEased, i / steps),
            force,
            direction,
            stretch
          });
        }
        lastStamp.copy(pointerEased);
      }
    }

    if (pending.length > MAX_SPLATS) pending.splice(0, pending.length - MAX_SPLATS);
    const count = Math.min(pending.length, MAX_SPLATS);
    for (let i = 0; i < MAX_SPLATS; i++) {
      const item = i < count ? pending[i] : null;
      splats[i].set(item?.point.x ?? -10, item?.point.y ?? -10, item?.force ?? 0, coarsePointer.matches ? 0.055 : 0.04);
      splatMotions[i].set(item?.direction.x ?? 1, item?.direction.y ?? 0, item?.stretch ?? 1);
    }
    updateMaterial.uniforms.uSplatCount.value = count;
    pending.length = 0;

    quad.material = updateMaterial;
    updateMaterial.uniforms.uPrevious.value = readTarget.texture;
    renderer.setRenderTarget(writeTarget);
    renderer.render(scene, camera);
    [readTarget, writeTarget] = [writeTarget, readTarget];

    quad.material = displayMaterial;
    displayMaterial.uniforms.uTrail.value = readTarget.texture;
    renderer.setRenderTarget(null);
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}
