function restartAnimation(elements) {
  elements.forEach((element) => {
    element.classList.remove("is-playing");
  });

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      elements.forEach((element) => {
        element.classList.add("is-playing");
      });
    });
  });
}

const durationCards = [...document.querySelectorAll(".duration-card")];
document.querySelector("[data-replay-duration]")?.addEventListener("click", () => {
  restartAnimation(durationCards);
});

const tuner = document.querySelector("[data-duration-tuner]");
const range = document.querySelector("[data-duration-range]");
const value = document.querySelector("[data-duration-value]");
const preview = document.querySelector(".duration-preview");

function updateDuration() {
  const duration = Number(range.value);
  tuner.style.setProperty("--duration", `${duration}ms`);
  value.textContent = `${(duration / 1000).toFixed(2)}s`;
  restartAnimation([preview]);
}

range?.addEventListener("input", updateDuration);
document.querySelector("[data-replay-tuner]")?.addEventListener("click", () => {
  restartAnimation([preview]);
});
