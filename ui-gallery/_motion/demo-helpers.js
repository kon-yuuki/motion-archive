/** Small utilities; every study owns its actual motion and markup. */
export function listen(target, type, handler, signal, options = {}) {
  target.addEventListener(type, handler, { ...options, signal });
}

export function motion(
  element,
  keyframes,
  options,
  signal,
  reducedMotion = false,
) {
  const animation = element.animate(keyframes, {
    ...options,
    duration: reducedMotion ? 0 : options.duration,
    delay: reducedMotion ? 0 : (options.delay ?? 0),
  });
  const cancel = () => animation.cancel();
  signal?.addEventListener("abort", cancel, { once: true });
  animation.finished
    .catch(() => {})
    .finally(() => signal?.removeEventListener("abort", cancel));
  return animation;
}

/** Original geometric artwork. No reference-site assets are downloaded or reused. */
export function makeArt(index = 0, label = "Motion study") {
  const palettes = [
    ["#d5dad1", "#44594a", "#b5d064", "#faf5df"],
    ["#d7c8ba", "#853e2f", "#e68f61", "#fff2d8"],
    ["#becbd9", "#203e67", "#759fe5", "#eaf0f5"],
    ["#dad0da", "#75496c", "#c89eb5", "#f6e9ee"],
    ["#dedcce", "#60592e", "#dbcd67", "#fff8dd"],
    ["#c2d9d4", "#245c55", "#7cb3a5", "#e9f5ee"],
  ];
  const [paper, ink, accent, light] =
    palettes[Math.abs(index) % palettes.length];
  const safeLabel = String(label)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll('"', "&quot;");
  const scene =
    index % 3 === 0
      ? `<circle cx="385" cy="155" r="85" fill="${accent}"/><path d="M0 440 180 160 345 440Z" fill="${ink}"/><path d="m220 440 190-205 230 205Z" fill="${light}"/><path d="M0 440h640v40H0z" fill="${ink}"/>`
      : index % 3 === 1
        ? `<path d="M140 430V215a180 180 0 0 1 360 0v215Z" fill="${ink}"/><path d="M218 430V230a102 102 0 0 1 204 0v200Z" fill="${accent}"/><path d="M276 430V236a44 44 0 0 1 88 0v194Z" fill="${light}"/>`
        : `<ellipse cx="320" cy="400" rx="200" ry="32" fill="${ink}" opacity=".15"/><rect x="160" y="190" width="320" height="220" rx="110" fill="${ink}"/><circle cx="320" cy="177" r="102" fill="${accent}"/><circle cx="320" cy="145" r="53" fill="${light}"/>`;
  return `<svg class="motion-art" viewBox="0 0 640 480" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${safeLabel}"><rect width="640" height="480" fill="${paper}"/>${scene}<path d="M32 32h48M32 32v48M608 32h-48M608 32v48" fill="none" stroke="${ink}" opacity=".4" stroke-width="2"/></svg>`;
}
