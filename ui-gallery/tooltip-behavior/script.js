// ホバーで開くツールチップの遅延設計デモ。
// 各デモは data 属性で挙動を切り替える：
//   data-open-delay : 開くまでの待機時間(ms)
//   data-group      : true なら「一度開いたらグループ内は遅延なし」
//   data-cooldown   : グループから離れて待機状態へ戻るまでの時間(ms)

const CLOSE_DELAY = 90; // 離れてから閉じるまでの猶予（隣へ移る際のチラつき防止）

function initDemo(demo, index) {
  const openDelay = Number(demo.dataset.openDelay || 0);
  const useGroup = demo.dataset.group === "true";
  const cooldown = Number(demo.dataset.cooldown || 600);
  const targets = [...demo.querySelectorAll("[data-tip]")];

  const tip = document.createElement("div");
  tip.className = "intent-tip";
  tip.id = `intent-tip-${index}`;
  tip.setAttribute("role", "tooltip");
  tip.setAttribute("aria-hidden", "true");
  tip.setAttribute("data-position-reset", "");
  demo.appendChild(tip);

  let openTimer = null;
  let closeTimer = null;
  let coolTimer = null;
  let groupActive = false;
  let current = null;

  function place(target) {
    tip.textContent = target.dataset.tip;
    tip.style.left = `${target.offsetLeft + target.offsetWidth / 2}px`;
    tip.style.top = `${target.offsetTop}px`;
  }

  function open(target) {
    current?.removeAttribute("aria-describedby");
    current = target;
    place(target);
    if (tip.hasAttribute("data-position-reset")) {
      // 閉じている間の位置変更を確定し、次の表示位置からフェードインさせる
      void tip.offsetWidth;
      tip.removeAttribute("data-position-reset");
    }
    tip.setAttribute("data-open", "");
    tip.removeAttribute("aria-hidden");
    target.setAttribute("aria-describedby", tip.id);
    groupActive = true;
    clearTimeout(coolTimer);
  }

  function hideNow() {
    tip.removeAttribute("data-open");
    tip.setAttribute("aria-hidden", "true");
    tip.setAttribute("data-position-reset", "");
    current?.removeAttribute("aria-describedby");
    current = null;
  }

  function close() {
    hideNow();
    if (useGroup) {
      // 少しの間はグループを「温かい」状態に保ち、戻ってきたら即開く
      clearTimeout(coolTimer);
      coolTimer = setTimeout(() => {
        groupActive = false;
      }, cooldown);
    } else {
      groupActive = false;
    }
  }

  function enter(target) {
    clearTimeout(openTimer);
    clearTimeout(closeTimer);
    const delay = useGroup && groupActive ? 0 : openDelay;
    if (delay === 0) {
      open(target);
    } else {
      // 待機中は何も出さない（前の項目を残さない）
      hideNow();
      openTimer = setTimeout(() => open(target), delay);
    }
  }

  function leave() {
    clearTimeout(openTimer);
    clearTimeout(closeTimer);
    closeTimer = setTimeout(close, CLOSE_DELAY);
  }

  targets.forEach((target) => {
    target.addEventListener("pointerenter", () => enter(target));
    target.addEventListener("pointerleave", leave);
    target.addEventListener("pointerdown", () => {
      clearTimeout(openTimer);
      clearTimeout(closeTimer);
      open(target);
    });
    // キーボード操作では意図が明確なので即時に開く
    target.addEventListener("focus", () => {
      clearTimeout(openTimer);
      clearTimeout(closeTimer);
      open(target);
    });
    target.addEventListener("blur", leave);
  });
}

document.querySelectorAll("[data-intent-demo]").forEach(initDemo);

function initCollisionDemo(demo, index) {
  const area = demo.querySelector("[data-collision-area]");
  const shouldFlip = demo.dataset.flip === "true";
  const tip = document.createElement("div");

  tip.className = "collision-tip";
  tip.id = `collision-tip-${index}`;
  tip.setAttribute("role", "tooltip");
  tip.textContent = "カーソル位置の詳細";
  demo.appendChild(tip);

  function place(clientX, clientY) {
    const boundaryRect = demo.getBoundingClientRect();
    const localX = clientX - boundaryRect.left;
    const localY = clientY - boundaryRect.top;
    const gap = 14;
    const spaceRight = boundaryRect.right - clientX;
    const side = shouldFlip && spaceRight < tip.offsetWidth + gap ? "left" : "right";

    tip.style.setProperty("--pointer-x", `${localX}px`);
    tip.style.setProperty("--pointer-y", `${localY}px`);
    tip.setAttribute("data-side", side);
  }

  function open(event) {
    place(event.clientX, event.clientY);
    tip.setAttribute("data-open", "");
    area.setAttribute("aria-describedby", tip.id);
  }

  function close() {
    tip.removeAttribute("data-open");
    area.removeAttribute("aria-describedby");
  }

  area.addEventListener("pointerenter", open);
  area.addEventListener("pointermove", (event) => place(event.clientX, event.clientY));
  area.addEventListener("pointerdown", open);
  area.addEventListener("pointerleave", close);
  area.addEventListener("focus", () => {
    const rect = area.getBoundingClientRect();
    open({
      clientX: shouldFlip ? rect.right - 12 : rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2
    });
  });
  area.addEventListener("blur", close);
  area.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }
    event.preventDefault();
    if (tip.hasAttribute("data-open")) {
      close();
    } else {
      const rect = area.getBoundingClientRect();
      open({
        clientX: shouldFlip ? rect.right - 12 : rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2
      });
    }
  });
  window.addEventListener("resize", () => {
    close();
  });
}

document.querySelectorAll("[data-collision-demo]").forEach(initCollisionDemo);

const infoDialog = document.querySelector("[data-info-dialog]");
const infoTitle = infoDialog.querySelector("[data-info-title]");
const infoContents = [...infoDialog.querySelectorAll("[data-info-content]")];
const infoClose = infoDialog.querySelector("[data-info-close]");
const infoTitles = {
  "tooltip-behavior": "Hover Intent",
  "edge-collision": "Edge Collision"
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
  if (event.target === infoDialog) closeInfoDialog();
});
infoDialog.addEventListener("close", () => {
  unlockPageScroll();
  infoTrigger?.focus();
});
