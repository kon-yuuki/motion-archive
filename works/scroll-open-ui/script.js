import "../_shared/detail-shell.js";

const sequence = document.querySelector("[data-scroll-open-sequence]");
const list = document.querySelector("[data-scroll-open-list]");
const items = [...document.querySelectorAll("[data-scroll-open-item]")];
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const itemSpan = 0.34;
const itemGap = 0.31;
const finalSequenceProgress = (items.length - 1) * itemGap + itemSpan;

const clamp = (value, min = 0, max = 1) => Math.min(Math.max(value, min), max);

let closedListHeight = 1;
let stickyDistance = 1;
let itemHeights = items.map(() => ({ closed: 0, extra: 0 }));

function setProgress(item, progress) {
  const rounded = Math.round(progress * 1000) / 1000;
  const isOpen = rounded > 0.64;

  item.style.setProperty("--open-progress", String(rounded));
  item.toggleAttribute("data-open", isOpen);
}

function updateItems() {
  const sequenceRect = sequence.getBoundingClientRect();
  const stickyStart = window.innerHeight - closedListHeight;
  const sequenceProgress = clamp((stickyStart - sequenceRect.top) / stickyDistance);
  const progresses = items.map((item, index) => {
    const start = index * itemGap;
    return clamp((sequenceProgress - start) / itemSpan);
  });
  const listHeight = progresses.reduce((total, progress, index) => {
    const height = itemHeights[index] || { closed: 0, extra: 0 };
    return total + height.closed + height.extra * progress;
  }, 0);

  list.style.setProperty("--list-height", `${listHeight}px`);
  items.forEach((item, index) => {
    const progress = progresses[index];
    setProgress(item, progress);
  });
}

function measureClosedListHeight() {
  const current = items.map((item) => item.style.getPropertyValue("--open-progress"));
  items.forEach((item) => {
    item.style.setProperty("--open-progress", "0");
  });
  const closedHeights = items.map((item) => item.getBoundingClientRect().height);
  closedListHeight = list.getBoundingClientRect().height;

  items.forEach((item) => {
    item.style.setProperty("--open-progress", "1");
  });
  itemHeights = items.map((item, index) => ({
    closed: closedHeights[index],
    extra: item.getBoundingClientRect().height - closedHeights[index],
  }));

  stickyDistance = Math.max(window.innerHeight * 1.35, 1);
  sequence.style.setProperty(
    "--sequence-height",
    `${closedListHeight + stickyDistance * finalSequenceProgress}px`
  );
  list.style.setProperty("--list-height", `${closedListHeight}px`);
  items.forEach((item, index) => {
    item.style.setProperty("--open-progress", current[index] || "0");
  });
}

if (reduceMotion.matches) {
  items.forEach((item) => setProgress(item, 1));
} else {
  measureClosedListHeight();
  window.addEventListener("scroll", updateItems, { passive: true });
  window.addEventListener("resize", () => {
    measureClosedListHeight();
    updateItems();
  });
  updateItems();
}
