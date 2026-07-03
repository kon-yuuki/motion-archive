const notes = {
  fade: "透明度だけを変えます。落ち着いていますが、どこから現れたかは控えめに伝わります。",
  slide: "透明度に加えて、下から 14px だけ上へ移動します。出現の方向が伝わり、動きも控えめです。",
  scale: "透明度に加えて、少し小さい状態から原寸へ戻します。ポップアップ感が出るため、使いすぎない方が読みやすいです。"
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

const transformCards = [...document.querySelectorAll(".transform-card")];
document.querySelector("[data-replay-transform]")?.addEventListener("click", () => {
  restartAnimation(transformCards);
});

const sampleCard = document.querySelector("[data-sample-card]");
const note = document.querySelector("[data-transform-note]");
const buttons = [...document.querySelectorAll("[data-transform-option]")];

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    const option = button.dataset.transformOption;
    sampleCard.dataset.motion = option;
    note.textContent = notes[option];

    buttons.forEach((item) => {
      item.setAttribute("aria-pressed", String(item === button));
    });

    restartAnimation([sampleCard]);
  });
});
