import photographUrl from "../../../src/assets/images/nature.jpg";
import revealTimeUrl from "./reveal-time.png";

/**
 * A recorded-mask trace, not a recreation of Stuuudio's unknown shader.
 * reveal-time.png: gray / 255 * 900 = each pixel's half-visible time in ms.
 * See scripts/motion/organic-trace/extract.py for extraction and confidence limits.
 */
export function createDemo(root, { signal, reducedMotion = false } = {}) {
  root.innerHTML = `<section class="organic-mask" data-state="loading" aria-label="記録映像の輪郭をトレースした画像表示">
    <div class="organic-mask__identity"><span>FIELD NOTES</span><span>IMAGE / 03</span><span>2026</span></div>
    <p class="organic-mask__edition">NATURAL<br>FORMS<br><span>/03</span></p>
    <div class="organic-mask__aside"><p>A moment<br>between<br>the leaves.</p><span>RECORDED<br>MASK STUDY</span></div>
    <figure class="organic-mask__figure"><img src="${photographUrl}" alt="花と木々に囲まれた霧の森の風景" decoding="async" /><canvas class="organic-mask__canvas" aria-hidden="true"></canvas><figcaption class="organic-mask__sr-only">既存のローカル写真に、記録映像から抽出した画像表示の輪郭を適用しています</figcaption></figure>
    <div class="organic-mask__caption"><span>Featured study</span><p>A quiet<br>place.</p><button type="button" aria-label="画像の表示をもう一度再生">Replay <span aria-hidden="true">↗︎</span></button></div>
    <p class="organic-mask__status organic-mask__sr-only" role="status" aria-live="polite">画像の準備中です</p>
  </section>`;
  const stage = root.querySelector(".organic-mask");
  const photograph = root.querySelector("img");
  const canvas = root.querySelector("canvas");
  const context = canvas.getContext("2d");
  const status = root.querySelector('[role="status"]');
  const lifecycle = new AbortController();
  let animationFrame = 0;
  let observer;
  let destroyed = false;
  let loaded = false;
  let pending = reducedMotion ? "complete" : "observe";
  let field;
  let mask;
  let maskContext;
  let maskPixels;
  let imageLayer;
  const duration = 900;
  const width = 375;
  const height = 534;

  function stop() {
    cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    observer?.disconnect();
  }
  function draw(milliseconds) {
    if (destroyed || !loaded) return;
    const elapsed = Math.max(0, Math.min(duration, milliseconds));
    stage.dataset.elapsed = String(Math.round(elapsed));
    if (elapsed >= duration || reducedMotion) {
      stage.dataset.state = "complete";
      return;
    }
    stage.dataset.state = elapsed === 0 ? "ready" : "playing";
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (elapsed === 0) return;
    const pixels = maskPixels.data;
    for (let i = 0; i < field.length; i++) {
      // Narrow soft edge; the spatial field supplies all ordering and acceleration.
      const alpha = Math.max(0, Math.min(1, (elapsed - field[i]) / 8 + 0.5));
      pixels[i * 4 + 3] = Math.round(alpha * alpha * (3 - 2 * alpha) * 255);
    }
    maskContext.putImageData(maskPixels, 0, 0);
    context.globalCompositeOperation = "source-over";
    context.drawImage(imageLayer, 0, 0);
    context.globalCompositeOperation = "destination-in";
    context.drawImage(mask, 0, 0, canvas.width, canvas.height);
    context.globalCompositeOperation = "source-over";
  }
  function replay() {
    if (destroyed) return;
    stop();
    pending = "replay";
    if (!loaded) return;
    if (reducedMotion) {
      draw(duration);
      status.textContent = "画像全体を表示しています";
      return;
    }
    draw(0);
    status.textContent = "不規則な窓がつながり、画像が現れています";
    let started;
    const tick = (now) => {
      if (destroyed) return;
      started ??= now;
      const elapsed = now - started;
      draw(elapsed);
      if (elapsed < duration) animationFrame = requestAnimationFrame(tick);
      else {
        animationFrame = 0;
        status.textContent = "画像全体が見えました";
      }
    };
    animationFrame = requestAnimationFrame(tick);
  }
  function reset() {
    if (destroyed) return;
    stop();
    if (stage.dataset.state === "fallback") {
      status.textContent = "動きの素材を読み込めないため、画像全体を表示しています";
      return;
    }
    pending = reducedMotion ? "complete" : "reset";
    draw(reducedMotion ? duration : 0);
    status.textContent = reducedMotion
      ? "画像全体を表示しています"
      : "画像を隠しました。Replay で表示します";
  }
  // A deterministic time cursor for frame comparisons and integration tests.
  function seek(milliseconds) {
    if (destroyed) return;
    stop();
    pending = "reset";
    draw(reducedMotion ? duration : milliseconds);
  }
  function destroy() {
    if (destroyed) return;
    destroyed = true;
    stop();
    lifecycle.abort();
    signal?.removeEventListener("abort", destroy);
    stage.dataset.state = "destroyed";
  }
  root.querySelector("button").addEventListener("click", replay, { signal: lifecycle.signal });
  signal?.addEventListener("abort", destroy, { once: true });
  if (signal?.aborted) destroy();
  if (reducedMotion && !destroyed) stage.dataset.state = "complete";

  const ready = (async () => {
    try {
      const texture = new Image();
      texture.src = revealTimeUrl;
      await Promise.all([texture.decode(), photograph.decode()]);
      if (destroyed) return;
      if (!context) throw new Error("Canvas 2D is unavailable");
      mask = document.createElement("canvas");
      mask.width = width;
      mask.height = height;
      maskContext = mask.getContext("2d", { willReadFrequently: true });
      maskContext.drawImage(texture, 0, 0, width, height);
      const encoded = maskContext.getImageData(0, 0, width, height).data;
      field = Float32Array.from({ length: width * height }, (_, i) => encoded[i * 4] / 255 * duration);
      maskPixels = maskContext.createImageData(width, height);
      for (let i = 0; i < maskPixels.data.length; i += 4) maskPixels.data.fill(255, i, i + 3);
      canvas.width = width * 2;
      canvas.height = height * 2;
      imageLayer = document.createElement("canvas");
      imageLayer.width = canvas.width;
      imageLayer.height = canvas.height;
      const layerContext = imageLayer.getContext("2d");
      const scale = Math.max(canvas.width / photograph.naturalWidth, canvas.height / photograph.naturalHeight);
      const dw = photograph.naturalWidth * scale;
      const dh = photograph.naturalHeight * scale;
      layerContext.drawImage(photograph, (canvas.width - dw) / 2, (canvas.height - dh) / 2, dw, dh);
      loaded = true;
      stage.dataset.loaded = "true";
      if (pending === "complete") {
        draw(duration);
        status.textContent = "画像全体を表示しています";
      } else if (pending === "replay") replay();
      else if (pending === "reset") reset();
      else {
        draw(0);
        observer = new IntersectionObserver((entries) => {
          if (entries.some((entry) => entry.isIntersecting)) replay();
        }, { threshold: 0.25 });
        observer.observe(stage);
      }
    } catch {
      if (destroyed) return;
      // A missing texture must never keep the real image hidden.
      stage.dataset.state = "fallback";
      status.textContent = "動きの素材を読み込めないため、画像全体を表示しています";
    }
  })();
  return { replay, reset, destroy, seek, ready };
}
