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
    tip.setAttribute("data-open", "");
    target.setAttribute("aria-describedby", tip.id);
    groupActive = true;
    clearTimeout(coolTimer);
  }

  function hideNow() {
    tip.removeAttribute("data-open");
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
