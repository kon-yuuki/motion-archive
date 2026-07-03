const options = {
  early: {
    line: "80%",
    label: "80% line",
    waiting: "ターゲットが 80% line に届くまで待機しています。",
    fired: "ターゲットが 80% line を越えたので発火しました。",
    note: "画面下 80% に入ったら開始。読み始める少し前に準備できるため、一般的な表示演出で使いやすい条件です。"
  },
  center: {
    line: "50%",
    label: "Center",
    waiting: "ターゲットが Center line に届くまで待機しています。",
    fired: "ターゲットが Center line を越えたので発火しました。",
    note: "画面中央に来たら開始。主役の要素をしっかり見せたい時に使えますが、少し遅く感じる場合があります。"
  },
  late: {
    line: "25%",
    label: "25% line",
    waiting: "ターゲットが 25% line に届くまで待機しています。",
    fired: "ターゲットが 25% line を越えたので発火しました。",
    note: "画面上部まで来てから開始。強く注目させたい時以外は、読もうとした瞬間に動いて邪魔になりやすい条件です。"
  }
};

const lab = document.querySelector("[data-trigger-lab]");
const viewport = document.querySelector("[data-trigger-viewport]");
const label = document.querySelector("[data-trigger-label]");
const note = document.querySelector("[data-trigger-note]");
const status = document.querySelector("[data-trigger-status]");
const card = document.querySelector("[data-trigger-card]");
const buttons = [...document.querySelectorAll("[data-trigger-option]")];
let currentOption = options.early;

function resetTrigger() {
  card.classList.remove("is-triggered");
  status.textContent = currentOption.waiting;
}

function updateTriggerState() {
  const viewportRect = viewport.getBoundingClientRect();
  const lineY = viewportRect.top + viewport.clientHeight * (parseFloat(currentOption.line) / 100);
  const cardTop = viewportRect.top + card.offsetTop - viewport.scrollTop;
  const isTriggered = cardTop <= lineY;

  card.classList.toggle("is-triggered", isTriggered);
  status.textContent = isTriggered ? currentOption.fired : currentOption.waiting;
}

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    currentOption = options[button.dataset.triggerOption];
    lab.style.setProperty("--trigger-line", currentOption.line);
    label.textContent = currentOption.label;
    note.textContent = currentOption.note;
    buttons.forEach((item) => {
      item.setAttribute("aria-pressed", String(item === button));
    });
    resetTrigger();
    viewport.scrollTop = 0;
    updateTriggerState();
  });
});

viewport.addEventListener("scroll", updateTriggerState, { passive: true });
window.addEventListener("resize", updateTriggerState);
resetTrigger();
