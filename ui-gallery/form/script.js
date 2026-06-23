const statusMessages = {
  "input-only": {
    input: "丸を押したので選択できました",
    label: "文字は読めますが、ここは反応しません",
    gap: "余白は反応しません"
  },
  "split-label": {
    input: "丸を押したので選択できました",
    label: "文字を押して選択できました",
    gap: "丸と文字の間は反応しません"
  },
  "full-row": {
    input: "丸を押して選択できました",
    label: "文字を押して選択できました",
    gap: "余白を押しても選択できます"
  }
};

function getHitType(target, card) {
  if (target.matches("input")) {
    return "input";
  }

  if (card.dataset.pattern === "full-row" && target.closest(".choice-option--full")) {
    return target.closest(".choice-text") ? "label" : "gap";
  }

  if (target.closest(".choice-text") || target.matches("label")) {
    return "label";
  }

  return "gap";
}

function showPulse(card, event, hitType) {
  const stage = card.querySelector(".choice-stage");
  if (!stage) {
    return;
  }

  const rect = stage.getBoundingClientRect();
  const pulse = document.createElement("span");
  pulse.className = `hit-pulse hit-pulse--${hitType}`;
  pulse.style.left = `${event.clientX - rect.left}px`;
  pulse.style.top = `${event.clientY - rect.top}px`;
  pulse.setAttribute("aria-hidden", "true");
  stage.append(pulse);
  pulse.addEventListener("animationend", () => pulse.remove());
}

function initChoiceDemo(card) {
  const status = card.querySelector("[data-status]");
  const pattern = card.dataset.pattern;

  card.addEventListener("pointerdown", (event) => {
    if (event.target.closest("[data-info-open]")) {
      return;
    }

    const hitType = getHitType(event.target, card);
    status.textContent = statusMessages[pattern][hitType];
    showPulse(card, event, hitType);
  });

  card.querySelectorAll("input").forEach((input) => {
    input.addEventListener("focus", () => {
      const focusLabel = input.closest("label, .choice-option");
      focusLabel?.setAttribute("data-focus", "");
    });
    input.addEventListener("blur", () => {
      const focusLabel = input.closest("label, .choice-option");
      focusLabel?.removeAttribute("data-focus");
    });
  });
}

document.querySelectorAll("[data-choice-demo]").forEach(initChoiceDemo);

const infoDialog = document.querySelector("[data-info-dialog]");
const infoTitle = infoDialog.querySelector("[data-info-title]");
const infoContents = [...infoDialog.querySelectorAll("[data-info-content]")];
const infoClose = infoDialog.querySelector("[data-info-close]");
const infoTitles = {
  "choice-hit-area": "Choice Label Hit Area",
  "code-input-only": "ラジオ部分だけ",
  "code-split-label": "ラジオとラベル",
  "code-full-row": "余白まで押せる"
};
let infoTrigger = null;

function closeInfoDialog() {
  infoDialog.close();
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

document.querySelectorAll("[data-info-open]").forEach((button) => {
  button.addEventListener("click", () => {
    const topic = button.dataset.infoOpen;
    infoTrigger = button;
    infoTitle.textContent = infoTitles[topic];
    infoContents.forEach((content) => {
      content.hidden = content.dataset.infoContent !== topic;
    });
    lockPageScroll();
    infoDialog.showModal();
    infoClose.focus();
  });
});

infoClose.addEventListener("click", closeInfoDialog);
infoDialog.addEventListener("click", (event) => {
  if (event.target === infoDialog) {
    closeInfoDialog();
  }
});
infoDialog.addEventListener("close", () => {
  unlockPageScroll();
  infoTrigger?.focus();
});
