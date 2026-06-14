const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const scrambleLabels = document.querySelectorAll("[data-scramble-label]");
const ctaButtons = document.querySelectorAll(".split-cta");
const lineLinks = document.querySelectorAll(".line-link");
const infoDialog = document.querySelector("[data-info-dialog]");
const infoTitle = infoDialog?.querySelector("[data-info-title]");
const infoContents = infoDialog ? [...infoDialog.querySelectorAll("[data-info-content]")] : [];
const infoClose = infoDialog?.querySelector("[data-info-close]");
const infoTitles = {
  "split-label-cta": "Split Label CTA"
};
const lineLinkDuration = 360;
const infoDialogCloseDuration = 220;
let infoTrigger = null;

function getScaleX(element) {
  const transform = window.getComputedStyle(element).transform;

  if (transform === "none") {
    return 0;
  }

  const matrix = new DOMMatrixReadOnly(transform);
  return Math.min(Math.max(matrix.a, 0), 1);
}

function resetLineLinkAnimation(link) {
  link.classList.remove("is-line-entering", "is-line-leaving");
}

function setupLineLink(link) {
  if (link.querySelector(".line-link__underline")) {
    return;
  }

  const underline = document.createElement("span");
  const line = document.createElement("span");
  underline.className = "line-link__underline";
  line.className = "line-link__line";
  underline.setAttribute("aria-hidden", "true");
  underline.append(line);
  link.append(underline);

  link.addEventListener("pointerenter", () => {
    const progress = getScaleX(line);
    const duration = Math.max((1 - progress) * lineLinkDuration, 80);

    resetLineLinkAnimation(link);
    link.style.setProperty("--line-link-from-scale", progress.toFixed(3));
    link.style.setProperty("--line-link-enter-duration", `${duration}ms`);

    requestAnimationFrame(() => {
      link.classList.add("is-line-entering");
    });
  });

  link.addEventListener("pointerleave", () => {
    const progress = getScaleX(line);

    resetLineLinkAnimation(link);
    link.style.setProperty("--line-link-from-scale", progress.toFixed(3));

    requestAnimationFrame(() => {
      link.classList.add("is-line-leaving");
    });
  });

  link.addEventListener("focus", () => {
    resetLineLinkAnimation(link);
    link.style.setProperty("--line-link-from-scale", "0");
    link.style.setProperty("--line-link-enter-duration", `${lineLinkDuration}ms`);

    requestAnimationFrame(() => {
      link.classList.add("is-line-entering");
    });
  });

  link.addEventListener("blur", () => {
    resetLineLinkAnimation(link);
    link.style.setProperty("--line-link-from-scale", "1");

    requestAnimationFrame(() => {
      link.classList.add("is-line-leaving");
    });
  });
}

function closeInfoDialog() {
  if (!infoDialog.open || infoDialog.classList.contains("is-closing")) {
    return;
  }

  infoDialog.classList.remove("is-opening");
  infoDialog.classList.add("is-closing");

  window.setTimeout(() => {
    infoDialog.close();
  }, infoDialogCloseDuration);
}

function lockPageScroll() {
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  document.documentElement.style.setProperty("--scrollbar-width", `${scrollbarWidth}px`);
  document.documentElement.setAttribute("data-dialog-open", "");
}

function unlockPageScroll() {
  document.documentElement.removeAttribute("data-dialog-open");
  document.documentElement.style.removeProperty("--scrollbar-width");
}

function setupInfoDialog() {
  if (!infoDialog || !infoTitle || !infoClose) {
    return;
  }

  document.querySelectorAll("[data-info-open]").forEach((button) => {
    button.addEventListener("click", () => {
      const topic = button.dataset.infoOpen;
      infoTrigger = button;
      infoTitle.textContent = infoTitles[topic] || "Implementation memo";

      for (const content of infoContents) {
        content.hidden = content.dataset.infoContent !== topic;
      }

      lockPageScroll();
      infoDialog.showModal();
      infoDialog.classList.remove("is-closing");
      infoDialog.classList.add("is-opening");
      infoClose.focus();
    });
  });

  infoClose.addEventListener("click", closeInfoDialog);
  infoDialog.addEventListener("click", (event) => {
    if (event.target === infoDialog) {
      closeInfoDialog();
    }
  });
  infoDialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeInfoDialog();
  });
  infoDialog.addEventListener("close", () => {
    infoDialog.classList.remove("is-opening", "is-closing");
    unlockPageScroll();
    infoTrigger?.focus();
  });
}

function roundedPolygonPath(points, radius) {
  const commands = [];

  for (let index = 0; index < points.length; index += 1) {
    const point = points[index];
    const previous = points[(index - 1 + points.length) % points.length];
    const next = points[(index + 1) % points.length];
    const previousVector = { x: previous.x - point.x, y: previous.y - point.y };
    const nextVector = { x: next.x - point.x, y: next.y - point.y };
    const previousLength = Math.hypot(previousVector.x, previousVector.y);
    const nextLength = Math.hypot(nextVector.x, nextVector.y);
    const pointRadius = Math.min(radius, previousLength / 2, nextLength / 2);
    const before = {
      x: point.x + (previousVector.x / previousLength) * pointRadius,
      y: point.y + (previousVector.y / previousLength) * pointRadius
    };
    const after = {
      x: point.x + (nextVector.x / nextLength) * pointRadius,
      y: point.y + (nextVector.y / nextLength) * pointRadius
    };

    if (index === 0) {
      commands.push(`M${before.x} ${before.y}`);
    } else {
      commands.push(`L${before.x} ${before.y}`);
    }

    commands.push(`Q${point.x} ${point.y} ${after.x} ${after.y}`);
  }

  commands.push("Z");
  return commands.join(" ");
}

function findPathOffset(pathElement, targetX, targetY) {
  const length = pathElement.getTotalLength();
  const steps = 220;
  let closestOffset = 0;
  let closestDistance = Number.POSITIVE_INFINITY;

  for (let step = 0; step <= steps; step += 1) {
    const offset = (length / steps) * step;
    const point = pathElement.getPointAtLength(offset);
    const distance = Math.hypot(point.x - targetX, point.y - targetY);

    if (distance < closestDistance) {
      closestDistance = distance;
      closestOffset = offset;
    }
  }

  return closestOffset;
}

function ensureEdgeFill(svg) {
  let fillPath = svg.querySelector(".split-cta__edge-fill");

  if (!fillPath) {
    fillPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    fillPath.setAttribute("class", "split-cta__edge-fill");
    svg.prepend(fillPath);
  }

  return fillPath;
}

function updateButtonEdge(button) {
  const svg = button.querySelector(".split-cta__edge");
  const paths = button.querySelectorAll(".split-cta__edge-base, .split-cta__edge-run");

  if (!svg || paths.length === 0) {
    return;
  }

  const width = Math.round(button.clientWidth);
  const height = Math.round(button.clientHeight);
  const configuredCorner = Number.parseFloat(getComputedStyle(button).getPropertyValue("--corner-size")) || 28;
  const configuredRadius = Number.parseFloat(getComputedStyle(button).getPropertyValue("--shape-radius")) || 5;
  const corner = Math.min(configuredCorner, width / 4, height / 2);
  const radius = Math.min(configuredRadius, corner / 3, height / 6);
  const points = [
    { x: 0.5, y: 0.5 },
    { x: width - corner, y: 0.5 },
    { x: width - 0.5, y: corner },
    { x: width - 0.5, y: height - 0.5 },
    { x: corner, y: height - 0.5 },
    { x: 0.5, y: height - corner }
  ];
  const path = roundedPolygonPath(points, radius);

  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  ensureEdgeFill(svg).setAttribute("d", path);

  for (const pathElement of paths) {
    pathElement.setAttribute("d", path);
  }

  const basePath = button.querySelector(".split-cta__edge-base");
  const length = basePath.getTotalLength();
  const topStart = findPathOffset(basePath, width / 2, 0.5);
  const bottomStart = findPathOffset(basePath, width / 2, height - 0.5);
  const topEnd = bottomStart;
  const bottomEnd = topStart + length;
  const topMid = (topStart + topEnd) / 2;
  const bottomMid = (bottomStart + bottomEnd) / 2;
  const segmentLength = Math.min(30, length * 0.06);

  button.style.setProperty("--edge-length", `${length}px`);
  button.style.setProperty("--edge-segment", `${segmentLength}px`);
  button.style.setProperty("--edge-top-start-offset", `${-topStart}px`);
  button.style.setProperty("--edge-top-mid-offset", `${-topMid}px`);
  button.style.setProperty("--edge-top-end-offset", `${-topEnd}px`);
  button.style.setProperty("--edge-bottom-start-offset", `${-bottomStart}px`);
  button.style.setProperty("--edge-bottom-mid-offset", `${-bottomMid}px`);
  button.style.setProperty("--edge-bottom-end-offset", `${-bottomEnd}px`);
}

function setupScrambleLabel(label) {
  const original = label.textContent.trim();
  const letters = original.split("");
  const container = label.closest(".split-cta__label");
  label.dataset.originalText = original;
  label.textContent = "";

  for (const letter of letters) {
    const character = document.createElement("span");
    character.className = "split-cta__char";
    character.textContent = letter;
    character.dataset.original = letter;
    label.append(character);
  }

  for (const character of label.children) {
    character.style.width = `${Math.ceil(character.getBoundingClientRect().width)}px`;
  }

  if (container) {
    container.style.width = `${Math.ceil(label.getBoundingClientRect().width)}px`;
  }

  setScrambleFrame(label, letters);
}

function setScrambleFrame(label, frameText) {
  const characters = label.children;

  for (let index = 0; index < characters.length; index += 1) {
    characters[index].textContent = frameText[index] || "";
  }
}

function scrambleText(label) {
  const original = label.dataset.originalText;

  const letters = original.split("");
  const firstLetterIndex = letters.findIndex((letter) => letter !== " ");
  let frame = 0;
  const drawableCount = Math.max(letters.length - firstLetterIndex - 1, 1);
  const totalFrames = Math.max(drawableCount + 8, 18);
  const scrambleWindow = 3;

  window.clearInterval(label.scrambleTimer);
  setScrambleFrame(label, letters.map((letter, index) => (index <= firstLetterIndex ? letter : "")));

  label.scrambleTimer = window.setInterval(() => {
    const progress = Math.min(frame / totalFrames, 1);
    const sweep = firstLetterIndex + 1 + progress * drawableCount;

    const frameLetters = letters.map((letter, index) => {
      if (index <= firstLetterIndex) {
        return letter;
      }

      if (index < sweep - scrambleWindow) {
        return letter;
      }

      if (index <= sweep) {
        if (letter === " ") {
          return letter;
        }

        return characters[Math.floor(Math.random() * characters.length)];
      }

      return "";
    });

    setScrambleFrame(label, frameLetters);

    frame += 1;

    if (frame > totalFrames) {
      window.clearInterval(label.scrambleTimer);
      setScrambleFrame(label, letters);
    }
  }, 28);
}

function animateMark(button) {
  window.clearTimeout(button.markTimer);
  button.classList.remove("is-mark-animating");

  requestAnimationFrame(() => {
    button.classList.add("is-mark-animating");
    button.markTimer = window.setTimeout(() => {
      button.classList.remove("is-mark-animating");
    }, 660);
  });
}

function animateEdge(button) {
  window.clearTimeout(button.edgeTimer);
  button.classList.remove("is-edge-running");

  requestAnimationFrame(() => {
    button.classList.add("is-edge-running");
    button.edgeTimer = window.setTimeout(() => {
      button.classList.remove("is-edge-running");
    }, 1120);
  });
}

function animateBackdrop(button) {
  if (button.classList.contains("split-cta--light")) {
    return;
  }

  window.clearTimeout(button.backdropTimer);
  button.classList.remove("is-backdrop-flashing");

  requestAnimationFrame(() => {
    button.classList.add("is-backdrop-flashing");
    button.backdropTimer = window.setTimeout(() => {
      button.classList.remove("is-backdrop-flashing");
    }, 640);
  });
}

for (const label of scrambleLabels) {
  const button = label.closest("button");
  setupScrambleLabel(label);

  button.addEventListener("pointerenter", () => {
    scrambleText(label);
    animateMark(button);
    animateEdge(button);
    animateBackdrop(button);
  });
  button.addEventListener("focus", () => {
    scrambleText(label);
    animateMark(button);
    animateEdge(button);
    animateBackdrop(button);
  });
}

for (const button of ctaButtons) {
  updateButtonEdge(button);

  const observer = new ResizeObserver(() => {
    updateButtonEdge(button);
  });

  observer.observe(button);
}

for (const link of lineLinks) {
  setupLineLink(link);
}

setupInfoDialog();
