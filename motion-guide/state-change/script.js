const stateCopy = {
  idle: {
    label: "送信する",
    message: "押す前は、通常の見た目で待機します。",
    note: "通常状態。まだ何も起きていないことが分かる、落ち着いた見た目です。"
  },
  hover: {
    label: "送信する",
    message: "近づいたときに少し浮かせると、押せる場所だと伝わります。",
    note: "hover は補助です。スマホでは出ないため、重要な情報は hover だけに頼りすぎない方が安全です。"
  },
  pressed: {
    label: "送信する",
    message: "押した瞬間に少し沈むと、操作が届いたことが分かります。",
    note: "pressed は短く返します。長すぎると反応が鈍く見えやすくなります。"
  },
  loading: {
    label: "送信中",
    message: "処理中の表示があると、連打せずに待てます。",
    note: "loading ではボタン幅が変わらないようにすると、周囲のレイアウトが動きにくくなります。"
  },
  complete: {
    label: "送信済み",
    message: "完了したことが伝わると、次の行動に移りやすくなります。",
    note: "complete は短時間だけ出して戻すのか、そのまま残すのかを事前に決めておきます。"
  }
};

const action = document.querySelector("[data-demo-action]");
const label = document.querySelector("[data-action-label]");
const message = document.querySelector("[data-state-message]");
const note = document.querySelector("[data-state-note]");
const buttons = [...document.querySelectorAll("[data-state-option]")];

function setState(state) {
  const copy = stateCopy[state];
  action.dataset.state = state;
  label.textContent = copy.label;
  message.textContent = copy.message;
  note.textContent = copy.note;

  buttons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.stateOption === state));
  });
}

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    setState(button.dataset.stateOption);
  });
});

action?.addEventListener("click", () => {
  setState("pressed");
  window.setTimeout(() => setState("loading"), 180);
  window.setTimeout(() => setState("complete"), 1200);
  window.setTimeout(() => setState("idle"), 2400);
});
