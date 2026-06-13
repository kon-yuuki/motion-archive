import { easingCss } from "./easing-functions.js";

// 一覧の各行にホバーで説明文ツールチップを出す。
// - 最初の行は約0.2秒の遅延で表示
// - 表示中に行から行へ移動したときは遅延なしで即切り替え
// - 一覧から離れたら隠し、次回はまた遅延ありに戻す

const DELAY = 200;
const OFFSET = 18;
const EDGE = 12;

let tooltip = null;
let inner = null;
let timer = null;
let visible = false;
let pointerX = 0;
let pointerY = 0;

function reduceMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

function ensureTooltip() {
  if (tooltip) {
    return tooltip;
  }
  // 外側は位置決め（JSのtransformで追従）、内側がカード本体。
  // 役割を分けることで、カーソル追従のたびにアニメが滑るのを防ぐ。
  tooltip = document.createElement("div");
  tooltip.className = "work-tooltip";
  tooltip.setAttribute("role", "tooltip");
  inner = document.createElement("div");
  inner.className = "work-tooltip__inner";
  tooltip.appendChild(inner);
  document.body.appendChild(tooltip);
  return tooltip;
}

function position() {
  if (!tooltip) {
    return;
  }
  const rect = tooltip.getBoundingClientRect();
  let left = pointerX + OFFSET;
  let top = pointerY + OFFSET;

  if (left + rect.width > window.innerWidth - EDGE) {
    left = pointerX - OFFSET - rect.width;
  }
  if (top + rect.height > window.innerHeight - EDGE) {
    top = pointerY - OFFSET - rect.height;
  }

  tooltip.style.transform = `translate(${Math.max(EDGE, left)}px, ${Math.max(EDGE, top)}px)`;
}

// テキストを「視覚上の行」に分割する。
// 日本語は文字単位で折り返すため1文字ずつ、英数字の連なりは塊にして
// 単語の途中で切れないようにし、実際にレイアウトさせて offsetTop で行を判定する。
function splitLines(text) {
  const tokens = text.match(/[A-Za-z0-9()._%/:#'"-]+|\s+|[^\s]/g) || [text];
  inner.textContent = "";
  const spans = tokens.map((token) => {
    const span = document.createElement("span");
    span.textContent = token;
    inner.appendChild(span);
    return span;
  });

  const lines = [];
  let current = null;
  let lastTop = null;
  for (const span of spans) {
    const top = span.offsetTop;
    if (top !== lastTop) {
      current = [];
      lines.push(current);
      lastTop = top;
    }
    current.push(span.textContent);
  }

  return lines.map((parts) => parts.join("").replace(/^\s+|\s+$/g, ""));
}

// テキストを行マスクで（下から立ち上げて）描く。
// ホバー行が変わるたびに呼ばれ、毎回この行アニメーションが走る。
function reveal(text) {
  if (!inner?.animate || reduceMotion()) {
    inner.textContent = text;
    position();
    return;
  }

  const lines = splitLines(text);
  inner.textContent = "";

  const lineInners = lines.map((lineText) => {
    const mask = document.createElement("span");
    mask.className = "work-tooltip__line";
    const lineInner = document.createElement("span");
    lineInner.className = "work-tooltip__line-inner";
    lineInner.textContent = lineText || " ";
    mask.appendChild(lineInner);
    inner.appendChild(mask);
    return lineInner;
  });

  position();

  lineInners.forEach((el, index) => {
    el.animate(
      [
        { transform: "translateY(115%)", opacity: 0 },
        { transform: "translateY(0)", opacity: 1 }
      ],
      {
        duration: 520,
        delay: index * 55,
        easing: easingCss.easeOutExpo,
        fill: "backwards"
      }
    );
  });
}

// 初回表示。カードを出し、テキストを行マスクで立ち上げる。
function show(row) {
  const text = row.dataset.description;
  if (!text) {
    hide();
    return;
  }
  const tip = ensureTooltip();
  visible = true;
  reveal(text);
  tip.setAttribute("data-visible", "");
}

function hide() {
  clearTimeout(timer);
  timer = null;
  visible = false;
  tooltip?.removeAttribute("data-visible");
}

// 表示中に行が変わったとき。カードはそのまま、テキストだけ行マスクで出し直す。
function swap(row) {
  const text = row.dataset.description;
  if (!text) {
    hide();
    return;
  }
  reveal(text);
}

export function initWorkTooltip(container) {
  if (!container) {
    return;
  }

  let currentRow = null;

  container.addEventListener("mousemove", (event) => {
    pointerX = event.clientX;
    pointerY = event.clientY;

    const row = event.target.closest(".work-row");
    if (!row) {
      if (currentRow) {
        currentRow = null;
        hide();
      }
      return;
    }

    if (row !== currentRow) {
      currentRow = row;
      if (visible) {
        // すでに表示中なら遅延なしで、旧→新を上へ流して差し替える
        swap(row);
      } else {
        clearTimeout(timer);
        timer = setTimeout(() => show(row), DELAY);
      }
    } else if (visible) {
      position();
    }
  });

  container.addEventListener("mouseleave", () => {
    currentRow = null;
    hide();
  });
}
