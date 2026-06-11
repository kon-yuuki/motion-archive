import { bindReplay } from "../_shared/detail-shell.js";

const canvas = document.querySelector("[data-fluid-canvas]");
const stage = document.querySelector("[data-stage]");

const gl = canvas.getContext("webgl2", {
  alpha: false,
  depth: false,
  stencil: false,
  antialias: false,
  preserveDrawingBuffer: false
});

if (!gl) {
  stage?.setAttribute("data-unsupported", "");
  throw new Error("WebGL2 not available");
}

gl.getExtension("EXT_color_buffer_float");
gl.getExtension("OES_texture_float_linear");

// --- 紙と墨の色 (sRGB 0-1) -------------------------------------------------
const PAPER = [0.953, 0.929, 0.882];
const INK = [0.063, 0.055, 0.043];

// --- シミュレーション設定 --------------------------------------------------
const config = {
  simRes: 128, // 速度・圧力の解像度
  dyeRes: 1024, // 墨（染料）の解像度
  densityDissipation: 0.80, // 墨が薄れる速さ（小さいほど長く残る・時間ベース）
  velocityDissipation: 0.8, // 流れが鎮まる速さ（時間ベース）
  pressureIterations: 24, // 圧力ソルバの反復回数
  curl: 15, // 渦の強さ（墨が枝分かれして滲む）
  splatRadius: 0.0020, // にじみの一滴の大きさ
  splatForce: 5400 // カーソル速度を流れに変換する強さ
};

// --- シェーダ ---------------------------------------------------------------
const baseVertex = `#version 300 es
in vec2 aPosition;
out vec2 vUv;
out vec2 vL;
out vec2 vR;
out vec2 vT;
out vec2 vB;
uniform vec2 texelSize;
void main () {
  vUv = aPosition * 0.5 + 0.5;
  vL = vUv - vec2(texelSize.x, 0.0);
  vR = vUv + vec2(texelSize.x, 0.0);
  vT = vUv + vec2(0.0, texelSize.y);
  vB = vUv - vec2(0.0, texelSize.y);
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const splatShader = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uTarget;
uniform float aspectRatio;
uniform vec3 color;
uniform vec2 point;
uniform float radius;
void main () {
  vec2 p = vUv - point;
  p.x *= aspectRatio;
  vec3 splat = exp(-dot(p, p) / radius) * color;
  vec3 base = texture(uTarget, vUv).xyz;
  outColor = vec4(base + splat, 1.0);
}`;

const advectionShader = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 texelSize;
uniform float dt;
uniform float dissipation;
void main () {
  vec2 coord = vUv - dt * texture(uVelocity, vUv).xy * texelSize;
  float decay = 1.0 + dissipation * dt;
  outColor = texture(uSource, coord) / decay;
  outColor.a = 1.0;
}`;

const divergenceShader = `#version 300 es
precision highp float;
in vec2 vUv;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
out vec4 outColor;
uniform sampler2D uVelocity;
void main () {
  float L = texture(uVelocity, vL).x;
  float R = texture(uVelocity, vR).x;
  float T = texture(uVelocity, vT).y;
  float B = texture(uVelocity, vB).y;
  vec2 C = texture(uVelocity, vUv).xy;
  if (vL.x < 0.0) { L = -C.x; }
  if (vR.x > 1.0) { R = -C.x; }
  if (vT.y > 1.0) { T = -C.y; }
  if (vB.y < 0.0) { B = -C.y; }
  float div = 0.5 * (R - L + T - B);
  outColor = vec4(div, 0.0, 0.0, 1.0);
}`;

const curlShader = `#version 300 es
precision highp float;
in vec2 vUv;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
out vec4 outColor;
uniform sampler2D uVelocity;
void main () {
  float L = texture(uVelocity, vL).y;
  float R = texture(uVelocity, vR).y;
  float T = texture(uVelocity, vT).x;
  float B = texture(uVelocity, vB).x;
  float curl = R - L - T + B;
  outColor = vec4(0.5 * curl, 0.0, 0.0, 1.0);
}`;

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
void main () {
  float L = texture(uCurl, vL).x;
  float R = texture(uCurl, vR).x;
  float T = texture(uCurl, vT).x;
  float B = texture(uCurl, vB).x;
  float C = texture(uCurl, vUv).x;
  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  force /= length(force) + 0.0001;
  force *= curl * C;
  force.y *= -1.0;
  vec2 velocity = texture(uVelocity, vUv).xy;
  velocity += force * dt;
  velocity = clamp(velocity, -1000.0, 1000.0);
  outColor = vec4(velocity, 0.0, 1.0);
}`;

const pressureShader = `#version 300 es
precision highp float;
in vec2 vUv;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
out vec4 outColor;
uniform sampler2D uPressure;
uniform sampler2D uDivergence;
void main () {
  float L = texture(uPressure, vL).x;
  float R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x;
  float B = texture(uPressure, vB).x;
  float divergence = texture(uDivergence, vUv).x;
  float pressure = (L + R + B + T - divergence) * 0.25;
  outColor = vec4(pressure, 0.0, 0.0, 1.0);
}`;

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
void main () {
  float L = texture(uPressure, vL).x;
  float R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x;
  float B = texture(uPressure, vB).x;
  vec2 velocity = texture(uVelocity, vUv).xy;
  velocity.xy -= vec2(R - L, T - B);
  outColor = vec4(velocity, 0.0, 1.0);
}`;

const displayShader = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uTexture;
uniform vec3 paper;
uniform vec3 ink;
void main () {
  vec3 dye = texture(uTexture, vUv).rgb;
  // 染料濃度を非線形に持ち上げ、薄い縁を残しつつ中心を濃く
  float density = clamp(max(max(dye.r, dye.g), dye.b), 0.0, 1.0);
  density = 1.0 - exp(-density * 2.4);
  vec3 color = mix(paper, ink, density);
  outColor = vec4(color, 1.0);
}`;

// --- プログラム生成 --------------------------------------------------------
function compileShader(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) || "shader compile failed");
  }
  return shader;
}

function createProgram(fragmentSource) {
  const program = gl.createProgram();
  gl.attachShader(program, compileShader(gl.VERTEX_SHADER, baseVertex));
  gl.attachShader(program, compileShader(gl.FRAGMENT_SHADER, fragmentSource));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) || "program link failed");
  }

  const uniforms = {};
  const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < count; i += 1) {
    const name = gl.getActiveUniform(program, i).name;
    uniforms[name] = gl.getUniformLocation(program, name);
  }

  return { program, uniforms };
}

const programs = {
  splat: createProgram(splatShader),
  advection: createProgram(advectionShader),
  divergence: createProgram(divergenceShader),
  curl: createProgram(curlShader),
  vorticity: createProgram(vorticityShader),
  pressure: createProgram(pressureShader),
  gradient: createProgram(gradientShader),
  display: createProgram(displayShader)
};

// --- フルスクリーン三角形 --------------------------------------------------
const vao = gl.createVertexArray();
gl.bindVertexArray(vao);
const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
gl.enableVertexAttribArray(0);
gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

function blit(target) {
  gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.fbo : null);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

// --- フレームバッファ ------------------------------------------------------
function createFBO(w, h, internalFormat, format, type, filter) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);

  const fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  gl.viewport(0, 0, w, h);
  gl.clear(gl.COLOR_BUFFER_BIT);

  const texelSizeX = 1 / w;
  const texelSizeY = 1 / h;

  return {
    texture,
    fbo,
    width: w,
    height: h,
    texelSizeX,
    texelSizeY,
    attach(id) {
      gl.activeTexture(gl.TEXTURE0 + id);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      return id;
    }
  };
}

function createDoubleFBO(w, h, internalFormat, format, type, filter) {
  let fbo1 = createFBO(w, h, internalFormat, format, type, filter);
  let fbo2 = createFBO(w, h, internalFormat, format, type, filter);

  return {
    width: w,
    height: h,
    texelSizeX: fbo1.texelSizeX,
    texelSizeY: fbo1.texelSizeY,
    get read() {
      return fbo1;
    },
    get write() {
      return fbo2;
    },
    swap() {
      const temp = fbo1;
      fbo1 = fbo2;
      fbo2 = temp;
    }
  };
}

let velocity;
let dye;
let divergence;
let curl;
let pressure;

function initFramebuffers() {
  const rgba16f = gl.RGBA16F;
  const rgba = gl.RGBA;
  const halfFloat = gl.HALF_FLOAT;

  const simW = config.simRes;
  const simH = Math.round(config.simRes / aspect());
  const dyeW = config.dyeRes;
  const dyeH = Math.round(config.dyeRes / aspect());

  dye = createDoubleFBO(dyeW, dyeH, rgba16f, rgba, halfFloat, gl.LINEAR);
  velocity = createDoubleFBO(simW, simH, rgba16f, rgba, halfFloat, gl.LINEAR);
  divergence = createFBO(simW, simH, rgba16f, rgba, halfFloat, gl.NEAREST);
  curl = createFBO(simW, simH, rgba16f, rgba, halfFloat, gl.NEAREST);
  pressure = createDoubleFBO(simW, simH, rgba16f, rgba, halfFloat, gl.NEAREST);
}

function aspect() {
  return canvas.width / canvas.height || 1;
}

// --- リサイズ --------------------------------------------------------------
function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.floor(stage.clientWidth * dpr);
  const height = Math.floor(stage.clientHeight * dpr);
  if (canvas.width === width && canvas.height === height) {
    return false;
  }
  canvas.width = width;
  canvas.height = height;
  return true;
}

resize();
initFramebuffers();

// --- ポインタ入力 ----------------------------------------------------------
const pointer = {
  x: 0,
  y: 0,
  dx: 0,
  dy: 0,
  moved: false,
  active: false
};

function updatePointer(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = (clientX - rect.left) / rect.width;
  const y = 1 - (clientY - rect.top) / rect.height;
  pointer.dx = (x - pointer.x) * config.splatForce;
  pointer.dy = (y - pointer.y) * config.splatForce;
  pointer.x = x;
  pointer.y = y;
  pointer.moved = Math.abs(pointer.dx) > 0 || Math.abs(pointer.dy) > 0;
  pointer.active = true;
}

window.addEventListener("pointermove", (event) => {
  updatePointer(event.clientX, event.clientY);
});

window.addEventListener("pointerdown", (event) => {
  // 押した瞬間に位置を合わせ、デルタを出さない（飛びを防ぐ）
  const rect = canvas.getBoundingClientRect();
  pointer.x = (event.clientX - rect.left) / rect.width;
  pointer.y = 1 - (event.clientY - rect.top) / rect.height;
  pointer.dx = 0;
  pointer.dy = 0;
  pointer.active = true;
  // クリックで一滴落とす
  splat(pointer.x, pointer.y, 0, 0, 1.2);
});

// --- にじみ（splat）の注入 -------------------------------------------------
function splat(x, y, dx, dy, amount = 1) {
  const { splat: prog } = programs;
  gl.useProgram(prog.program);

  // 速度フィールドへ力を加える
  gl.uniform1i(prog.uniforms.uTarget, velocity.read.attach(0));
  gl.uniform1f(prog.uniforms.aspectRatio, aspect());
  gl.uniform2f(prog.uniforms.point, x, y);
  gl.uniform3f(prog.uniforms.color, dx, dy, 0);
  gl.uniform1f(prog.uniforms.radius, config.splatRadius);
  gl.viewport(0, 0, velocity.width, velocity.height);
  blit(velocity.write);
  velocity.swap();

  // 墨を染料フィールドへ加える
  gl.uniform1i(prog.uniforms.uTarget, dye.read.attach(0));
  gl.uniform3f(prog.uniforms.color, amount, amount, amount);
  gl.viewport(0, 0, dye.width, dye.height);
  blit(dye.write);
  dye.swap();
}

function applyPointer() {
  if (!pointer.moved) {
    return;
  }
  pointer.moved = false;
  splat(pointer.x, pointer.y, pointer.dx, pointer.dy, 0.9);
}

// --- シミュレーション 1 ステップ -------------------------------------------
function step(dt) {
  gl.disable(gl.BLEND);

  // 渦度（curl）の計算
  let prog = programs.curl;
  gl.useProgram(prog.program);
  gl.uniform2f(prog.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
  gl.uniform1i(prog.uniforms.uVelocity, velocity.read.attach(0));
  gl.viewport(0, 0, velocity.width, velocity.height);
  blit(curl);

  // 渦の力を速度へ加える
  prog = programs.vorticity;
  gl.useProgram(prog.program);
  gl.uniform2f(prog.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
  gl.uniform1i(prog.uniforms.uVelocity, velocity.read.attach(0));
  gl.uniform1i(prog.uniforms.uCurl, curl.attach(1));
  gl.uniform1f(prog.uniforms.curl, config.curl);
  gl.uniform1f(prog.uniforms.dt, dt);
  blit(velocity.write);
  velocity.swap();

  // 発散の計算
  prog = programs.divergence;
  gl.useProgram(prog.program);
  gl.uniform2f(prog.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
  gl.uniform1i(prog.uniforms.uVelocity, velocity.read.attach(0));
  blit(divergence);

  // 圧力を 0 で初期化せず減衰させて反復
  prog = programs.pressure;
  gl.useProgram(prog.program);
  gl.uniform2f(prog.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
  gl.uniform1i(prog.uniforms.uDivergence, divergence.attach(0));
  for (let i = 0; i < config.pressureIterations; i += 1) {
    gl.uniform1i(prog.uniforms.uPressure, pressure.read.attach(1));
    blit(pressure.write);
    pressure.swap();
  }

  // 圧力勾配を引いて非圧縮にする
  prog = programs.gradient;
  gl.useProgram(prog.program);
  gl.uniform2f(prog.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
  gl.uniform1i(prog.uniforms.uPressure, pressure.read.attach(0));
  gl.uniform1i(prog.uniforms.uVelocity, velocity.read.attach(1));
  blit(velocity.write);
  velocity.swap();

  // 速度の移流
  prog = programs.advection;
  gl.useProgram(prog.program);
  gl.uniform2f(prog.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
  gl.uniform1i(prog.uniforms.uVelocity, velocity.read.attach(0));
  gl.uniform1i(prog.uniforms.uSource, velocity.read.attach(0));
  gl.uniform1f(prog.uniforms.dt, dt);
  gl.uniform1f(prog.uniforms.dissipation, config.velocityDissipation);
  blit(velocity.write);
  velocity.swap();

  // 墨の移流
  gl.uniform2f(prog.uniforms.texelSize, dye.texelSizeX, dye.texelSizeY);
  gl.uniform1i(prog.uniforms.uVelocity, velocity.read.attach(0));
  gl.uniform1i(prog.uniforms.uSource, dye.read.attach(1));
  gl.uniform1f(prog.uniforms.dissipation, config.densityDissipation);
  gl.viewport(0, 0, dye.width, dye.height);
  blit(dye.write);
  dye.swap();
}

// --- 描画 ------------------------------------------------------------------
function render() {
  const prog = programs.display;
  gl.useProgram(prog.program);
  gl.uniform1i(prog.uniforms.uTexture, dye.read.attach(0));
  gl.uniform3f(prog.uniforms.paper, PAPER[0], PAPER[1], PAPER[2]);
  gl.uniform3f(prog.uniforms.ink, INK[0], INK[1], INK[2]);
  gl.viewport(0, 0, canvas.width, canvas.height);
  blit(null);
}

// --- メインループ ----------------------------------------------------------
let lastTime = performance.now();

function frame(now) {
  const dt = Math.min((now - lastTime) / 1000, 1 / 30);
  lastTime = now;

  if (resize()) {
    initFramebuffers();
  }

  applyPointer();
  step(dt);
  render();
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);

// --- Reset ボタン ----------------------------------------------------------
function clearDye() {
  gl.bindFramebuffer(gl.FRAMEBUFFER, dye.read.fbo);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.bindFramebuffer(gl.FRAMEBUFFER, dye.write.fbo);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.bindFramebuffer(gl.FRAMEBUFFER, velocity.read.fbo);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.bindFramebuffer(gl.FRAMEBUFFER, velocity.write.fbo);
  gl.clear(gl.COLOR_BUFFER_BIT);
}

bindReplay(() => {
  clearDye();
});
