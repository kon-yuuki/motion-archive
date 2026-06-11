const title = document.querySelector("[data-character-reveal]");
const replay = document.querySelector("[data-replay]");
const controlsReset = document.querySelector("[data-controls-reset]");
const controlsPreview = document.querySelector("[data-controls-preview]");
const controls = [...document.querySelectorAll("[data-control]")];
const specDuration = document.querySelector("[data-spec-duration]");
const specStagger = document.querySelector("[data-spec-stagger]");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const defaults = {
  initialColor: "#61e5c0",
  finalColor: "#083031",
  duration: 300,
  stagger: 30
};

function splitText(element) {
  const text = element.dataset.text ?? "";
  let characterIndex = 0;

  element.setAttribute("aria-label", text.replace(/\n/g, " "));

  text.split("\n").forEach((line, lineIndex, lines) => {
    const lineElement = document.createElement("span");
    lineElement.className = "character-line";
    lineElement.setAttribute("aria-hidden", "true");

    const tokens = Array.from(line.matchAll(/(\s+|\S+)/g));

    tokens.forEach(([token], tokenIndex) => {
      if (/^\s+$/.test(token)) {
        const space = document.createElement("span");
        space.className = "character-space";
        space.textContent = " ";
        lineElement.append(space);
        return;
      }

      const word = document.createElement("span");
      word.className = "character-word";

      Array.from(token).forEach((character) => {
        const span = document.createElement("span");
        span.className = "character";
        span.style.setProperty("--character-index", characterIndex);
        span.textContent = character;
        word.append(span);
        characterIndex += 1;
      });

      lineElement.append(word);

      if (tokenIndex < tokens.length - 1 && !/^\s+$/.test(tokens[tokenIndex + 1][0])) {
        const space = document.createElement("span");
        space.className = "character-space";
        space.textContent = " ";
        lineElement.append(space);
      }
    });

    element.append(lineElement);

    if (lineIndex < lines.length - 1) {
      element.append(document.createElement("br"));
    }
  });
}

function reveal() {
  title.setAttribute("data-visible", "");
}

function replayReveal() {
  title.removeAttribute("data-visible");
  void title.offsetWidth;
  reveal();
}

function updateSettings() {
  const values = Object.fromEntries(controls.map((control) => [control.dataset.control, control.value]));

  title.style.setProperty("--initial-color", values.initialColor);
  title.style.setProperty("--final-color", values.finalColor);
  title.style.setProperty("--character-duration", `${values.duration}ms`);
  title.style.setProperty("--character-stagger", `${values.stagger}ms`);

  document.querySelector('[data-output="duration"]').value = `${values.duration}ms`;
  document.querySelector('[data-output="stagger"]').value = `${values.stagger}ms`;
  specDuration.textContent = values.duration;
  specStagger.textContent = values.stagger;

  replayReveal();
}

function resetSettings() {
  controls.forEach((control) => {
    control.value = defaults[control.dataset.control];
  });
  updateSettings();
}

splitText(title);

if (reducedMotion.matches) {
  reveal();
} else {
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return;
      reveal();
      observer.disconnect();
    },
    { rootMargin: "0px 0px -10% 0px" }
  );

  observer.observe(title);
}

replay.addEventListener("click", replayReveal);
controls.forEach((control) => control.addEventListener("input", updateSettings));
controlsReset.addEventListener("click", resetSettings);
controlsPreview.addEventListener("click", replayReveal);
