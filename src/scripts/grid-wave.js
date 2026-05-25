import "../styles/grid-wave.scss";
import { bindReplay } from "./detail-shell.js";

const stage = document.querySelector("[data-stage]");
const grid = document.querySelector("[data-grid]");
const columns = 19;
const rows = 11;

for (let row = 0; row < rows; row += 1) {
  for (let column = 0; column < columns; column += 1) {
    const point = document.createElement("span");
    const distanceFromCenter = Math.abs(9 - column) + Math.abs(5 - row);
    point.style.setProperty("--delay", `${distanceFromCenter * 32}ms`);
    grid.append(point);
  }
}

function disturb(x, y) {
  const bounds = grid.getBoundingClientRect();
  const points = grid.querySelectorAll("span");
  points.forEach((point) => {
    const pointBounds = point.getBoundingClientRect();
    const dx = pointBounds.left + pointBounds.width / 2 - x;
    const dy = pointBounds.top + pointBounds.height / 2 - y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const strength = Math.max(0, 1 - distance / 250);
    point.style.setProperty("--force", strength.toFixed(3));
  });
  grid.style.setProperty("--origin-x", `${x - bounds.left}px`);
  grid.style.setProperty("--origin-y", `${y - bounds.top}px`);
}

stage.addEventListener("pointermove", (event) => disturb(event.clientX, event.clientY));
stage.addEventListener("pointerleave", () => {
  grid.querySelectorAll("span").forEach((point) => point.style.setProperty("--force", 0));
});

bindReplay(() => {
  const bounds = grid.getBoundingClientRect();
  disturb(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2);
  grid.classList.remove("is-pulsing");
  void grid.offsetWidth;
  grid.classList.add("is-pulsing");
});
