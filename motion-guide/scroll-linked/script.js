const meter = document.querySelector("[data-scroll-meter]");
const progressText = document.querySelector("[data-scroll-progress]");
const scenes = [...document.querySelectorAll(".scroll-scene")];

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function updateScrollMotion() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const pageProgress = maxScroll > 0 ? clamp(window.scrollY / maxScroll) : 0;
  const percent = Math.round(pageProgress * 100);

  meter?.style.setProperty("--scroll-fill", `${percent}%`);
  meter?.style.setProperty("--scroll-card-top", `${78 - percent * 0.56}%`);
  if (progressText) {
    progressText.textContent = `${percent}%`;
  }

  scenes.forEach((scene) => {
    const rect = scene.getBoundingClientRect();
    const start = window.innerHeight * 0.84;
    const end = window.innerHeight * 0.34;
    const progress = clamp((start - rect.top) / (start - end));
    scene.style.setProperty("--scene-opacity", String(0.42 + progress * 0.58));
    scene.style.setProperty("--scene-y", `${28 - progress * 28}px`);
    scene.style.setProperty("--scene-scale", String(0.97 + progress * 0.03));
  });
}

window.addEventListener("scroll", updateScrollMotion, { passive: true });
window.addEventListener("resize", updateScrollMotion);
updateScrollMotion();
