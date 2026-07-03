const labels = {
  linear: {
    curve: "linear",
    text: "一定速度で動きます。進行状況の表示には合いますが、UI部品の移動では少し硬く見えやすい動きです。"
  },
  in: {
    curve: "cubic-bezier(0.7, 0, 0.84, 0)",
    text: "最初はゆっくり、後半で速くなります。閉じる・退場する動きには使いやすい一方、表示開始では反応が遅く見えやすい動きです。"
  },
  out: {
    curve: "cubic-bezier(0.16, 1, 0.3, 1)",
    text: "最初に速く動き、最後はゆっくり止まります。メニューやカードの表示に使いやすい動きです。"
  },
  back: {
    curve: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    text: "少し行き過ぎて戻ります。楽しい印象は出せますが、重要な情報では目立ちすぎることがあります。"
  }
};

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

const easingCards = [...document.querySelectorAll(".easing-card")];
document.querySelector("[data-replay-easing]")?.addEventListener("click", () => {
  restartAnimation(easingCards);
});

const preview = document.querySelector(".easing-preview");
const note = document.querySelector("[data-easing-note]");
const buttons = [...document.querySelectorAll("[data-easing-option]")];

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    const option = labels[button.dataset.easingOption];
    preview.style.setProperty("--curve", option.curve);
    note.textContent = option.text;

    buttons.forEach((item) => {
      item.setAttribute("aria-pressed", String(item === button));
    });

    restartAnimation([preview]);
  });
});
