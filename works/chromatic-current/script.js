import "../_shared/detail-shell.js";

const canvas = document.querySelector("[data-current-canvas]");
const stage = document.querySelector("[data-stage]");
const gl = canvas?.getContext("webgl2", {
  alpha: false,
  antialias: false,
  depth: false,
  preserveDrawingBuffer: false,
  stencil: false
});

if (!gl) {
  stage?.setAttribute("data-unsupported", "");
  throw new Error("WebGL2 is required for Chromatic Current");
}

gl.getExtension("EXT_color_buffer_float");
gl.getExtension("OES_texture_float_linear");

const config = {
  brightnessStep: 0.34,
  coverageDissipation: 0.11,
  curl: 4.8,
  densityDissipation: 0.56,
  diffusionIterations: 2,
  diffusionNoiseStrength: 0.58,
  diffusionRadius: 14,
  diffusionStrength: 0.14,
  expansionAdvectionScale: 2.35,
  expansionDissipation: 0.28,
  expansionDilution: 0.026,
  expansionForce: 24,
  expansionRadius: 0.0025,
  forwardForce: 32,
  microSwirlStrength: 0.7,
  dyeSplatRadius: 0.00028,
  dyeResolution: 1600,
  pressureIterations: 20,
  simulationResolution: 640,
  splatForce: 1050,
  velocitySplatRadius: 0.0022,
  velocityDissipation: 1.25
};

const vertexShader = `#version 300 es
  in vec2 aPosition;
  out vec2 vUv;
  out vec2 vL;
  out vec2 vR;
  out vec2 vT;
  out vec2 vB;
  uniform vec2 texelSize;

  void main() {
    vUv = aPosition * 0.5 + 0.5;
    vL = vUv - vec2(texelSize.x, 0.0);
    vR = vUv + vec2(texelSize.x, 0.0);
    vT = vUv + vec2(0.0, texelSize.y);
    vB = vUv - vec2(0.0, texelSize.y);
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

const splatShader = `#version 300 es
  precision highp float;
  in vec2 vUv;
  out vec4 outColor;
  uniform sampler2D uTarget;
  uniform float aspectRatio;
  uniform vec3 color;
  uniform vec2 point;
  uniform float radius;

  void main() {
    vec2 offset = vUv - point;
    offset.x *= aspectRatio;
    vec3 impulse = exp(-dot(offset, offset) / radius) * color;
    outColor = vec4(texture(uTarget, vUv).xyz + impulse, 1.0);
  }
`;

const advectionShader = `#version 300 es
  precision highp float;
  in vec2 vUv;
  out vec4 outColor;
  uniform sampler2D uVelocity;
  uniform sampler2D uSource;
  uniform sampler2D uExpansion;
  uniform vec2 texelSize;
  uniform vec2 sourceTexelSize;
  uniform float dt;
  uniform float diffusion;
  uniform vec3 dissipation;
  uniform float ageRate;
  uniform float expansionDilution;
  uniform float expansionScale;

  void main() {
    vec2 expansionVelocity = texture(uExpansion, vUv).xy * expansionScale;
    vec2 velocity = texture(uVelocity, vUv).xy + expansionVelocity;
    vec2 coordinate = vUv - dt * velocity * texelSize;
    vec4 center = texture(uSource, coordinate);
    vec4 cardinalNeighbors =
      texture(uSource, coordinate - vec2(sourceTexelSize.x, 0.0)) +
      texture(uSource, coordinate + vec2(sourceTexelSize.x, 0.0)) +
      texture(uSource, coordinate - vec2(0.0, sourceTexelSize.y)) +
      texture(uSource, coordinate + vec2(0.0, sourceTexelSize.y));
    vec4 diagonalNeighbors =
      texture(uSource, coordinate + vec2(sourceTexelSize.x, sourceTexelSize.y)) +
      texture(uSource, coordinate + vec2(sourceTexelSize.x, -sourceTexelSize.y)) +
      texture(uSource, coordinate + vec2(-sourceTexelSize.x, sourceTexelSize.y)) +
      texture(uSource, coordinate - vec2(sourceTexelSize.x, sourceTexelSize.y));
    vec4 diffused =
      (center * 2.0 + cardinalNeighbors + diagonalNeighbors * 0.7) /
      8.8;
    float diffusionMix = 1.0 - exp(-diffusion * dt);
    outColor = mix(center, diffused, diffusionMix);
    outColor.rgb /= vec3(1.0) + dissipation * dt;
    outColor.rgb /= 1.0 + length(expansionVelocity) * dt * expansionDilution;
    outColor.b += outColor.g * dt * ageRate;
    outColor.a = 1.0;
  }
`;

const radialSplatShader = `#version 300 es
  precision highp float;
  in vec2 vUv;
  out vec4 outColor;
  uniform sampler2D uTarget;
  uniform float aspectRatio;
  uniform vec2 point;
  uniform vec2 direction;
  uniform float radius;
  uniform float strength;

  void main() {
    vec2 offset = vUv - point;
    vec2 physicalOffset = vec2(offset.x * aspectRatio, offset.y);
    float distanceFromSource = length(physicalOffset);
    vec2 outwardDirection = physicalOffset / max(distanceFromSource, 0.0001);
    vec2 flowDirection = normalize(vec2(direction.x * aspectRatio, direction.y));
    vec2 flowNormal = vec2(-flowDirection.y, flowDirection.x);
    float forwardDistance = dot(physicalOffset, flowDirection);
    float lateralDistance = dot(physicalOffset, flowNormal);
    float longitudinalScale = forwardDistance >= 0.0 ? 2.75 : 0.38;
    vec2 plumeOffset = vec2(
      lateralDistance / 0.58,
      forwardDistance / longitudinalScale
    );
    float falloff = exp(-dot(plumeOffset, plumeOffset) / radius);
    float alignment = dot(outwardDirection, flowDirection);
    float forwardMask = smoothstep(-0.28, 0.82, alignment);
    float directionalStrength = mix(0.035, 1.0, forwardMask);
    vec2 plumeDirection = normalize(
      outwardDirection * 0.24 + flowDirection * 1.18
    );
    vec2 previousField = texture(uTarget, vUv).xy;
    vec2 expansionField =
      previousField + plumeDirection * falloff * strength * directionalStrength;
    outColor = vec4(clamp(expansionField, -120.0, 120.0), 0.0, 1.0);
  }
`;

const clearShader = `#version 300 es
  precision highp float;
  in vec2 vUv;
  out vec4 outColor;
  uniform sampler2D uTexture;
  uniform float value;

  void main() {
    outColor = texture(uTexture, vUv) * value;
  }
`;

const diffusionShader = `#version 300 es
  precision highp float;
  in vec2 vUv;
  out vec4 outColor;
  uniform sampler2D uSource;
  uniform vec2 texelSize;
  uniform float aspectRatio;
  uniform float phase;
  uniform float noiseStrength;
  uniform float radius;
  uniform float strength;
  uniform float swirlStrength;

  float hash21(vec2 point) {
    vec3 value = fract(vec3(point.xyx) * vec3(0.1031, 0.1030, 0.0973));
    value += dot(value, value.yzx + 33.33);
    return fract((value.x + value.y) * value.z);
  }

  float valueNoise(vec2 point) {
    vec2 cell = floor(point);
    vec2 local = fract(point);
    local = local * local * (3.0 - 2.0 * local);
    float bottom = mix(hash21(cell), hash21(cell + vec2(1.0, 0.0)), local.x);
    float top = mix(hash21(cell + vec2(0.0, 1.0)), hash21(cell + vec2(1.0)), local.x);
    return mix(bottom, top, local.y);
  }

  vec2 curlNoise(vec2 point, float epsilon) {
    float left = valueNoise(point - vec2(epsilon, 0.0));
    float right = valueNoise(point + vec2(epsilon, 0.0));
    float bottom = valueNoise(point - vec2(0.0, epsilon));
    float top = valueNoise(point + vec2(0.0, epsilon));
    return vec2(top - bottom, left - right) / (epsilon * 2.0);
  }

  void main() {
    vec2 noiseCoordinate = vec2(vUv.x * aspectRatio, vUv.y);
    float broadNoise = valueNoise(
      noiseCoordinate * 38.0 + vec2(phase * 0.17, -phase * 0.11)
    );
    float fineNoise = valueNoise(
      noiseCoordinate * 127.0 + vec2(-phase * 0.31, phase * 0.23) + 19.7
    );
    float diffusionNoise = broadNoise * 0.62 + fineNoise * 0.38;
    float noiseAngle = broadNoise * 6.283185 + fineNoise * 3.7;
    vec2 randomFlow = vec2(cos(noiseAngle), sin(noiseAngle));
    vec4 sourceCenter = texture(uSource, vUv);
    float sourceAge = sourceCenter.b / max(sourceCenter.g, 0.000001);
    float flutterEnvelope = exp(-sourceAge * 2.8);
    vec2 broadCoordinate = noiseCoordinate * 11.0 + vec2(phase * 0.08, -phase * 0.05);
    vec2 detailCoordinate = noiseCoordinate * 27.0 + vec2(-phase * 0.11, phase * 0.07) + 8.3;
    vec2 organicCurl = curlNoise(broadCoordinate, 0.075);
    organicCurl += curlNoise(detailCoordinate, 0.09) * 0.28;
    organicCurl += randomFlow * noiseStrength * 0.16;
    vec2 sourceUv = clamp(
      vUv - organicCurl * texelSize * swirlStrength * flutterEnvelope,
      0.0,
      1.0
    );
    float localRadius = radius * mix(0.55, 1.50, diffusionNoise);
    float localStrength = clamp(strength * mix(0.52, 1.45, fineNoise), 0.0, 1.0);
    vec2 horizontal = vec2(texelSize.x * localRadius, 0.0);
    vec2 vertical = vec2(0.0, texelSize.y * localRadius);
    vec4 center = texture(uSource, sourceUv);
    vec4 cardinal =
      texture(uSource, sourceUv + horizontal) +
      texture(uSource, sourceUv - horizontal) +
      texture(uSource, sourceUv + vertical) +
      texture(uSource, sourceUv - vertical);
    vec4 diagonal =
      texture(uSource, sourceUv + horizontal + vertical) +
      texture(uSource, sourceUv + horizontal - vertical) +
      texture(uSource, sourceUv - horizontal + vertical) +
      texture(uSource, sourceUv - horizontal - vertical);
    vec4 spread = center * 0.36 + cardinal * 0.12 + diagonal * 0.04;
    outColor = mix(center, spread, localStrength);
    outColor.a = 1.0;
  }
`;

const divergenceShader = `#version 300 es
  precision highp float;
  in vec2 vUv;
  in vec2 vL;
  in vec2 vR;
  in vec2 vT;
  in vec2 vB;
  out vec4 outColor;
  uniform sampler2D uVelocity;

  void main() {
    float left = texture(uVelocity, vL).x;
    float right = texture(uVelocity, vR).x;
    float top = texture(uVelocity, vT).y;
    float bottom = texture(uVelocity, vB).y;
    vec2 center = texture(uVelocity, vUv).xy;
    if (vL.x < 0.0) left = -center.x;
    if (vR.x > 1.0) right = -center.x;
    if (vT.y > 1.0) top = -center.y;
    if (vB.y < 0.0) bottom = -center.y;
    outColor = vec4(0.5 * (right - left + top - bottom), 0.0, 0.0, 1.0);
  }
`;

const curlShader = `#version 300 es
  precision highp float;
  in vec2 vL;
  in vec2 vR;
  in vec2 vT;
  in vec2 vB;
  out vec4 outColor;
  uniform sampler2D uVelocity;

  void main() {
    float left = texture(uVelocity, vL).y;
    float right = texture(uVelocity, vR).y;
    float top = texture(uVelocity, vT).x;
    float bottom = texture(uVelocity, vB).x;
    outColor = vec4(0.5 * (right - left - top + bottom), 0.0, 0.0, 1.0);
  }
`;

const vorticityShader = `#version 300 es
  precision highp float;
  in vec2 vUv;
  in vec2 vL;
  in vec2 vR;
  in vec2 vT;
  in vec2 vB;
  out vec4 outColor;
  uniform sampler2D uVelocity;
  uniform sampler2D uCurl;
  uniform float curl;
  uniform float dt;

  void main() {
    float left = texture(uCurl, vL).x;
    float right = texture(uCurl, vR).x;
    float top = texture(uCurl, vT).x;
    float bottom = texture(uCurl, vB).x;
    float center = texture(uCurl, vUv).x;
    vec2 force = 0.5 * vec2(abs(top) - abs(bottom), abs(right) - abs(left));
    force /= length(force) + 0.0001;
    force *= curl * center;
    force.y *= -1.0;
    vec2 velocity = texture(uVelocity, vUv).xy + force * dt;
    outColor = vec4(clamp(velocity, -1000.0, 1000.0), 0.0, 1.0);
  }
`;

const pressureShader = `#version 300 es
  precision highp float;
  in vec2 vL;
  in vec2 vR;
  in vec2 vT;
  in vec2 vB;
  out vec4 outColor;
  uniform sampler2D uPressure;
  uniform sampler2D uDivergence;
  in vec2 vUv;

  void main() {
    float left = texture(uPressure, vL).x;
    float right = texture(uPressure, vR).x;
    float top = texture(uPressure, vT).x;
    float bottom = texture(uPressure, vB).x;
    float divergence = texture(uDivergence, vUv).x;
    outColor = vec4((left + right + top + bottom - divergence) * 0.25, 0.0, 0.0, 1.0);
  }
`;

const gradientShader = `#version 300 es
  precision highp float;
  in vec2 vUv;
  in vec2 vL;
  in vec2 vR;
  in vec2 vT;
  in vec2 vB;
  out vec4 outColor;
  uniform sampler2D uPressure;
  uniform sampler2D uVelocity;

  void main() {
    float left = texture(uPressure, vL).x;
    float right = texture(uPressure, vR).x;
    float top = texture(uPressure, vT).x;
    float bottom = texture(uPressure, vB).x;
    vec2 velocity = texture(uVelocity, vUv).xy;
    velocity -= vec2(right - left, top - bottom);
    outColor = vec4(velocity, 0.0, 1.0);
  }
`;

const displayShader = `#version 300 es
  precision highp float;
  in vec2 vUv;
  out vec4 outColor;
  uniform sampler2D uDye;
  uniform float uAspect;
  uniform float uTime;

  float hash21(vec2 point) {
    vec3 value = fract(vec3(point.xyx) * vec3(0.1031, 0.1030, 0.0973));
    value += dot(value, value.yzx + 33.33);
    return fract((value.x + value.y) * value.z);
  }

  float valueNoise(vec2 point) {
    vec2 cell = floor(point);
    vec2 local = fract(point);
    local = local * local * (3.0 - 2.0 * local);
    float bottom = mix(hash21(cell), hash21(cell + vec2(1.0, 0.0)), local.x);
    float top = mix(hash21(cell + vec2(0.0, 1.0)), hash21(cell + vec2(1.0)), local.x);
    return mix(bottom, top, local.y);
  }

  vec3 dyeAt(vec2 coordinate) {
    vec3 sampleColor = texture(uDye, clamp(coordinate, 0.0, 1.0)).rgb;
    return sampleColor;
  }

  float boundaryMask(float value, float threshold, float thickness) {
    float antialiasWidth = max(fwidth(value) * 0.55, 0.0006);
    float distanceToBoundary = abs(value - threshold);
    return 1.0 - smoothstep(
      thickness + antialiasWidth,
      thickness + antialiasWidth * 2.2,
      distanceToBoundary
    );
  }

  void main() {
    vec3 base = vec3(0.1686, 0.1373, 0.1451);
    vec3 deepMauve = vec3(0.265, 0.178, 0.205);
    vec3 dustyRose = vec3(0.445, 0.238, 0.285);
    vec3 warmCoral = vec3(0.695, 0.350, 0.330);
    vec3 palePeach = vec3(0.925, 0.655, 0.555);
    // 固定半径のリングへ切り替えず、速度場で移流・拡散した染料を
    // そのまま描画する。これにより消滅時の段階的な輪郭変化を防ぐ。
    vec3 dye = dyeAt(vUv);
    float age = dye.b / max(dye.g, 0.000001);
    // 拡散で薄くなる外周だけを持ち上げ、中心の残像より先に消えないようにする。
    float spreadLift = 1.0 + smoothstep(0.14, 1.70, age) * 5.40;
    float density = 1.0 - exp(-dye.r * 0.9 * spreadLift);
    float coverage = 1.0 - exp(-dye.g * 1.65 * spreadLift);
    if (coverage < 0.000001) {
      outColor = vec4(base, 1.0);
      return;
    }
    vec2 drift = vec2(uTime * 0.035, -uTime * 0.024);
    vec2 noiseScale = vec2(42.0 * uAspect, 42.0);
    float broadNoise = valueNoise(vUv * noiseScale + drift);
    float fineNoise = valueNoise(vUv * noiseScale * 3.1 - drift * 1.7);
    float detail = broadNoise * 0.65 + fineNoise * 0.35;
    float detailMask = smoothstep(0.001, 0.12, density);
    density *= mix(1.0, 0.74 + detail * 0.52, detailMask);
    density = clamp(density, 0.0, 1.0);
    coverage *= 0.90 + detail * 0.20;
    coverage = clamp(coverage, 0.0, 1.0);

    float firstLayer = smoothstep(0.00008, 0.008, coverage);
    float secondLayer = smoothstep(0.006, 0.042, density + coverage * 0.82);
    float thirdLayer = smoothstep(0.035, 0.135, density + coverage * 0.20);
    float fourthLayer = smoothstep(0.135, 0.360, density);
    vec3 color = mix(base, deepMauve, firstLayer * 0.72);
    color = mix(color, dustyRose, secondLayer * 0.80);
    color = mix(color, warmCoral, thirdLayer * 0.86);
    color = mix(color, palePeach, fourthLayer * 0.90);
    color *= 0.965 + detail * 0.07;

    float marbleBoundary =
      boundaryMask(coverage, 0.0075, 0.0008) * 0.28 +
      boundaryMask(coverage, 0.018, 0.0018) * 0.52 +
      boundaryMask(density, 0.048, 0.0018) * 0.34 +
      boundaryMask(density, 0.090, 0.0035) * 0.68 +
      boundaryMask(density, 0.145, 0.0038) * 0.46 +
      boundaryMask(density, 0.225, 0.0065) * 0.78;
    vec3 boundaryColor = mix(base * 0.78, palePeach, fourthLayer * 0.20);
    color = mix(color, boundaryColor, clamp(marbleBoundary * 0.24, 0.0, 0.34));
    outColor = vec4(color, 1.0);
  }
`;

function compileShader(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) || "Shader compilation failed");
  }
  return shader;
}

function createProgram(fragmentSource) {
  const program = gl.createProgram();
  gl.attachShader(program, compileShader(gl.VERTEX_SHADER, vertexShader));
  gl.attachShader(program, compileShader(gl.FRAGMENT_SHADER, fragmentSource));
  gl.bindAttribLocation(program, 0, "aPosition");
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) || "Shader link failed");
  }

  const uniforms = {};
  const uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let index = 0; index < uniformCount; index += 1) {
    const name = gl.getActiveUniform(program, index).name;
    uniforms[name] = gl.getUniformLocation(program, name);
  }
  return { program, uniforms };
}

const programs = {
  advection: createProgram(advectionShader),
  clear: createProgram(clearShader),
  curl: createProgram(curlShader),
  diffusion: createProgram(diffusionShader),
  display: createProgram(displayShader),
  divergence: createProgram(divergenceShader),
  gradient: createProgram(gradientShader),
  pressure: createProgram(pressureShader),
  radialSplat: createProgram(radialSplatShader),
  splat: createProgram(splatShader),
  vorticity: createProgram(vorticityShader)
};

const vertexArray = gl.createVertexArray();
gl.bindVertexArray(vertexArray);
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
gl.enableVertexAttribArray(0);
gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

function blit(target) {
  gl.bindFramebuffer(gl.FRAMEBUFFER, target?.fbo || null);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

function createFramebuffer(width, height, filter) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, width, height, 0, gl.RGBA, gl.HALF_FLOAT, null);

  const fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  gl.viewport(0, 0, width, height);
  gl.clear(gl.COLOR_BUFFER_BIT);

  return {
    attach(unit) {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      return unit;
    },
    fbo,
    height,
    texelSizeX: 1 / width,
    texelSizeY: 1 / height,
    width
  };
}

function createDoubleFramebuffer(width, height, filter) {
  let first = createFramebuffer(width, height, filter);
  let second = createFramebuffer(width, height, filter);
  return {
    get read() {
      return first;
    },
    get write() {
      return second;
    },
    height,
    swap() {
      [first, second] = [second, first];
    },
    texelSizeX: 1 / width,
    texelSizeY: 1 / height,
    width
  };
}

function getResolution(resolution) {
  const ratio = canvas.width / canvas.height || 1;
  return ratio >= 1
    ? { width: resolution, height: Math.round(resolution / ratio) }
    : { width: Math.round(resolution * ratio), height: resolution };
}

let velocity;
let dye;
let divergence;
let curl;
let pressure;
let expansion;
let diffusionPhase = Math.random() * 100;

function initializeFramebuffers() {
  const simulation = getResolution(config.simulationResolution);
  const color = getResolution(config.dyeResolution);
  velocity = createDoubleFramebuffer(simulation.width, simulation.height, gl.LINEAR);
  expansion = createDoubleFramebuffer(simulation.width, simulation.height, gl.LINEAR);
  dye = createDoubleFramebuffer(color.width, color.height, gl.LINEAR);
  divergence = createFramebuffer(simulation.width, simulation.height, gl.NEAREST);
  curl = createFramebuffer(simulation.width, simulation.height, gl.NEAREST);
  pressure = createDoubleFramebuffer(simulation.width, simulation.height, gl.NEAREST);
}

function resizeCanvas() {
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.floor(stage.clientWidth * pixelRatio);
  const height = Math.floor(stage.clientHeight * pixelRatio);
  if (canvas.width === width && canvas.height === height) {
    return false;
  }
  canvas.width = width;
  canvas.height = height;
  return true;
}

function splat(
  x,
  y,
  dx,
  dy,
  amount,
  flowStrength,
  dyeRadius = config.dyeSplatRadius,
  velocityRadius = config.velocitySplatRadius
) {
  const program = programs.splat;
  gl.useProgram(program.program);
  gl.uniform1f(program.uniforms.aspectRatio, canvas.width / canvas.height);
  gl.uniform2f(program.uniforms.point, x, y);

  gl.uniform1i(program.uniforms.uTarget, velocity.read.attach(0));
  gl.uniform3f(program.uniforms.color, dx, dy, 0);
  gl.uniform1f(program.uniforms.radius, velocityRadius);
  gl.viewport(0, 0, velocity.width, velocity.height);
  blit(velocity.write);
  velocity.swap();

  const radialProgram = programs.radialSplat;
  gl.useProgram(radialProgram.program);
  gl.uniform1i(radialProgram.uniforms.uTarget, expansion.read.attach(0));
  gl.uniform1f(radialProgram.uniforms.aspectRatio, canvas.width / canvas.height);
  gl.uniform2f(radialProgram.uniforms.point, x, y);
  gl.uniform2f(radialProgram.uniforms.direction, dx, dy);
  gl.uniform1f(radialProgram.uniforms.radius, config.expansionRadius);
  gl.uniform1f(radialProgram.uniforms.strength, config.expansionForce * flowStrength);
  gl.viewport(0, 0, expansion.width, expansion.height);
  blit(expansion.write);
  expansion.swap();

  gl.useProgram(program.program);
  gl.uniform1f(program.uniforms.aspectRatio, canvas.width / canvas.height);
  gl.uniform2f(program.uniforms.point, x, y);
  gl.uniform1i(program.uniforms.uTarget, dye.read.attach(0));
  // Rは明るさ、Gは外周へ広がる染みの面積として別々に減衰させる。
  gl.uniform3f(program.uniforms.color, amount, amount * 0.42, 0);
  gl.uniform1f(program.uniforms.radius, dyeRadius);
  gl.viewport(0, 0, dye.width, dye.height);
  blit(dye.write);
  dye.swap();
}

const pointer = {
  enteredAt: performance.now(),
  flowDirectionX: 0,
  flowDirectionY: 0,
  flowInitialized: false,
  initialized: false,
  lastEventTime: 0,
  noisePhase: Math.random() * Math.PI * 2,
  x: 0,
  y: 0
};
const splatQueue = [];
let latestInputTime = performance.now() / 1000;

function pointerPosition(event) {
  const bounds = canvas.getBoundingClientRect();
  return {
    x: Math.min(Math.max((event.clientX - bounds.left) / bounds.width, 0), 1),
    y: Math.min(Math.max(1 - (event.clientY - bounds.top) / bounds.height, 0), 1)
  };
}

function queuePointerMovement(event) {
  const next = pointerPosition(event);
  if (!pointer.initialized) {
    pointer.x = next.x;
    pointer.y = next.y;
    pointer.lastEventTime = event.timeStamp;
    pointer.initialized = true;
    return;
  }

  const deltaX = next.x - pointer.x;
  const deltaY = next.y - pointer.y;
  const distance = Math.hypot(deltaX, deltaY);
  if (distance < 0.00005) {
    return;
  }

  const aspectRatio = canvas.width / canvas.height || 1;
  const physicalDeltaX = deltaX * aspectRatio;
  const physicalDistance = Math.hypot(physicalDeltaX, deltaY);
  const rawDirectionX = physicalDistance > 0 ? physicalDeltaX / physicalDistance : 0;
  const rawDirectionY = physicalDistance > 0 ? deltaY / physicalDistance : 0;
  const directionBlend = pointer.flowInitialized ? 0.28 : 1;
  const blendedDirectionX =
    pointer.flowDirectionX + (rawDirectionX - pointer.flowDirectionX) * directionBlend;
  const blendedDirectionY =
    pointer.flowDirectionY + (rawDirectionY - pointer.flowDirectionY) * directionBlend;
  const blendedLength = Math.hypot(blendedDirectionX, blendedDirectionY) || 1;
  const physicalDirectionX = blendedDirectionX / blendedLength;
  const physicalDirectionY = blendedDirectionY / blendedLength;
  pointer.flowDirectionX = physicalDirectionX;
  pointer.flowDirectionY = physicalDirectionY;
  pointer.flowInitialized = true;
  const directionX = physicalDirectionX / aspectRatio;
  const directionY = physicalDirectionY;
  const normalX = -physicalDirectionY / aspectRatio;
  const normalY = physicalDirectionX;
  const inputGain = smoothStep(0, 0.26, (performance.now() - pointer.enteredAt) / 1000);
  const forceLimit = Math.min(1, 0.03 / Math.max(physicalDistance, 0.00001));
  const smoothedDeltaX = directionX * physicalDistance;
  const smoothedDeltaY = directionY * physicalDistance;
  const leadDistance = Math.min(0.145, 0.052 + physicalDistance * 2.3);
  const segmentCount = Math.min(
    12,
    Math.max(1, Math.ceil((physicalDistance * canvas.clientHeight) / 6))
  );
  const segmentGain = inputGain / segmentCount;
  const baseForceX =
    (smoothedDeltaX * config.splatForce * forceLimit + directionX * config.forwardForce) *
    segmentGain;
  const baseForceY =
    (smoothedDeltaY * config.splatForce * forceLimit + directionY * config.forwardForce) *
    segmentGain;

  for (let segment = 1; segment <= segmentCount; segment += 1) {
    const progress = segment / segmentCount;
    pointer.noisePhase += 0.18 + physicalDistance * 4;
    const positionJitter =
      Math.sin(pointer.noisePhase * 0.83) * 0.0012 +
      Math.sin(pointer.noisePhase * 1.91) * 0.0005;
    const forceAngle =
      Math.sin(pointer.noisePhase * 0.61) * 0.02 +
      Math.sin(pointer.noisePhase * 1.37) * 0.008;
    const forceCos = Math.cos(forceAngle);
    const forceSin = Math.sin(forceAngle);
    const radiusVariation =
      1 + Math.sin(pointer.noisePhase * 0.47) * 0.08 +
      Math.sin(pointer.noisePhase * 1.13) * 0.03;
    const sampleX = pointer.x + deltaX * progress;
    const sampleY = pointer.y + deltaY * progress;
    const projectedX = sampleX + directionX * leadDistance;
    const projectedY = sampleY + directionY * leadDistance;

    splatQueue.push({
      amount: config.brightnessStep * segmentGain,
      dx: baseForceX * forceCos - baseForceY * forceSin,
      dyeRadius: config.dyeSplatRadius * radiusVariation,
      dy: baseForceX * forceSin + baseForceY * forceCos,
      flowStrength: segmentGain,
      velocityRadius: config.velocitySplatRadius * (0.92 + radiusVariation * 0.08),
      x: Math.min(Math.max(projectedX + normalX * positionJitter, 0), 1),
      y: Math.min(Math.max(projectedY + normalY * positionJitter, 0), 1)
    });
  }

  if (splatQueue.length > 96) {
    splatQueue.splice(0, splatQueue.length - 96);
  }
  pointer.x = next.x;
  pointer.y = next.y;
  pointer.lastEventTime = event.timeStamp;
  latestInputTime = performance.now() / 1000;
}

stage.addEventListener("pointerenter", (event) => {
  const position = pointerPosition(event);
  pointer.x = position.x;
  pointer.y = position.y;
  pointer.lastEventTime = event.timeStamp;
  pointer.enteredAt = performance.now();
  pointer.flowInitialized = false;
  pointer.initialized = true;
});

stage.addEventListener("pointermove", (event) => {
  const coalescedEvents = event.getCoalescedEvents?.();
  const events = coalescedEvents?.length ? coalescedEvents : [event];
  events.forEach(queuePointerMovement);
});

stage.addEventListener("pointerdown", (event) => {
  const position = pointerPosition(event);
  if (!pointer.initialized) {
    pointer.enteredAt = performance.now();
    pointer.flowInitialized = false;
  }
  pointer.x = position.x;
  pointer.y = position.y;
  pointer.lastEventTime = event.timeStamp;
  pointer.initialized = true;
});

stage.addEventListener("pointerleave", () => {
  pointer.flowInitialized = false;
  pointer.initialized = false;
});

function applySplats() {
  splatQueue
    .splice(0)
    .forEach(({ x, y, dx, dy, amount, flowStrength, dyeRadius, velocityRadius }) =>
      splat(x, y, dx, dy, amount, flowStrength, dyeRadius, velocityRadius)
    );
}

function smoothStep(minimum, maximum, value) {
  const normalized = Math.min(Math.max((value - minimum) / (maximum - minimum), 0), 1);
  return normalized * normalized * (3 - 2 * normalized);
}

function simulate(dt) {
  gl.disable(gl.BLEND);
  let program = programs.clear;
  gl.useProgram(program.program);
  gl.uniform1i(program.uniforms.uTexture, expansion.read.attach(0));
  gl.uniform1f(program.uniforms.value, Math.exp(-config.expansionDissipation * dt));
  gl.viewport(0, 0, expansion.width, expansion.height);
  blit(expansion.write);
  expansion.swap();

  program = programs.curl;
  gl.useProgram(program.program);
  gl.uniform2f(program.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
  gl.uniform1i(program.uniforms.uVelocity, velocity.read.attach(0));
  gl.viewport(0, 0, velocity.width, velocity.height);
  blit(curl);

  program = programs.vorticity;
  gl.useProgram(program.program);
  gl.uniform2f(program.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
  gl.uniform1i(program.uniforms.uVelocity, velocity.read.attach(0));
  gl.uniform1i(program.uniforms.uCurl, curl.attach(1));
  gl.uniform1f(program.uniforms.curl, config.curl);
  gl.uniform1f(program.uniforms.dt, dt);
  blit(velocity.write);
  velocity.swap();

  program = programs.divergence;
  gl.useProgram(program.program);
  gl.uniform2f(program.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
  gl.uniform1i(program.uniforms.uVelocity, velocity.read.attach(0));
  blit(divergence);

  program = programs.clear;
  gl.useProgram(program.program);
  gl.uniform1i(program.uniforms.uTexture, pressure.read.attach(0));
  gl.uniform1f(program.uniforms.value, 0.82);
  blit(pressure.write);
  pressure.swap();

  program = programs.pressure;
  gl.useProgram(program.program);
  gl.uniform2f(program.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
  gl.uniform1i(program.uniforms.uDivergence, divergence.attach(0));
  for (let iteration = 0; iteration < config.pressureIterations; iteration += 1) {
    gl.uniform1i(program.uniforms.uPressure, pressure.read.attach(1));
    blit(pressure.write);
    pressure.swap();
  }

  program = programs.gradient;
  gl.useProgram(program.program);
  gl.uniform2f(program.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
  gl.uniform1i(program.uniforms.uPressure, pressure.read.attach(0));
  gl.uniform1i(program.uniforms.uVelocity, velocity.read.attach(1));
  blit(velocity.write);
  velocity.swap();

  program = programs.advection;
  gl.useProgram(program.program);
  gl.uniform2f(program.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
  gl.uniform2f(program.uniforms.sourceTexelSize, velocity.texelSizeX, velocity.texelSizeY);
  gl.uniform1i(program.uniforms.uVelocity, velocity.read.attach(0));
  gl.uniform1i(program.uniforms.uSource, velocity.read.attach(0));
  gl.uniform1i(program.uniforms.uExpansion, expansion.read.attach(2));
  gl.uniform1f(program.uniforms.dt, dt);
  gl.uniform1f(program.uniforms.diffusion, 0);
  gl.uniform1f(program.uniforms.ageRate, 0);
  gl.uniform1f(program.uniforms.expansionDilution, 0);
  gl.uniform1f(program.uniforms.expansionScale, 0);
  gl.uniform3f(
    program.uniforms.dissipation,
    config.velocityDissipation,
    config.velocityDissipation,
    config.velocityDissipation
  );
  blit(velocity.write);
  velocity.swap();

  // 速度格子と染料格子の中間スケールで移流し、入力後も進行方向へ
  // 流れ続けながら、強い力で一気に巻き戻らない距離に抑える。
  gl.uniform2f(program.uniforms.texelSize, velocity.texelSizeX * 0.32, velocity.texelSizeY * 0.32);
  gl.uniform2f(program.uniforms.sourceTexelSize, dye.texelSizeX, dye.texelSizeY);
  gl.uniform1i(program.uniforms.uVelocity, velocity.read.attach(0));
  gl.uniform1i(program.uniforms.uSource, dye.read.attach(1));
  gl.uniform1i(program.uniforms.uExpansion, expansion.read.attach(2));
  gl.uniform1f(program.uniforms.diffusion, 0);
  gl.uniform1f(program.uniforms.ageRate, 1);
  gl.uniform1f(program.uniforms.expansionDilution, config.expansionDilution);
  gl.uniform1f(program.uniforms.expansionScale, config.expansionAdvectionScale);
  const idleTime = Math.max(0, performance.now() / 1000 - latestInputTime);
  const idleFadeDissipation =
    smoothStep(0.06, 0.2, idleTime) * 4.5 +
    smoothStep(0.2, 0.65, idleTime) * 9;
  gl.uniform3f(
    program.uniforms.dissipation,
    config.densityDissipation + idleFadeDissipation,
    config.coverageDissipation + idleFadeDissipation,
    config.coverageDissipation + idleFadeDissipation
  );
  gl.viewport(0, 0, dye.width, dye.height);
  blit(dye.write);
  dye.swap();

  // 染料を毎フレーム近傍へ少しずつ渡す。輪郭が外へ成長してから
  // 濃度が下がるため、「その場で消える」のではなく滲んで消える。
  program = programs.diffusion;
  gl.useProgram(program.program);
  gl.uniform2f(program.uniforms.texelSize, dye.texelSizeX, dye.texelSizeY);
  gl.uniform1f(program.uniforms.aspectRatio, canvas.width / canvas.height);
  gl.uniform1f(program.uniforms.noiseStrength, config.diffusionNoiseStrength);
  gl.uniform1f(program.uniforms.radius, config.diffusionRadius);
  gl.uniform1f(program.uniforms.strength, config.diffusionStrength);
  gl.uniform1f(program.uniforms.swirlStrength, config.microSwirlStrength);
  diffusionPhase += dt * 0.42;
  for (let iteration = 0; iteration < config.diffusionIterations; iteration += 1) {
    gl.uniform1f(program.uniforms.phase, diffusionPhase + iteration * 0.19);
    gl.uniform1i(program.uniforms.uSource, dye.read.attach(0));
    blit(dye.write);
    dye.swap();
  }
}

function render(time) {
  const program = programs.display;
  gl.useProgram(program.program);
  gl.uniform1i(program.uniforms.uDye, dye.read.attach(0));
  gl.uniform1f(program.uniforms.uAspect, canvas.width / canvas.height);
  gl.uniform1f(program.uniforms.uTime, time);
  gl.viewport(0, 0, canvas.width, canvas.height);
  blit(null);
}

resizeCanvas();
initializeFramebuffers();

let previousFrame = performance.now();

function frame(time) {
  const dt = Math.min((time - previousFrame) / 1000, 1 / 30);
  previousFrame = time;
  if (resizeCanvas()) {
    initializeFramebuffers();
  }
  applySplats();
  simulate(dt);
  render(time / 1000);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
