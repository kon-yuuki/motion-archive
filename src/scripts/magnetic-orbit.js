import "../styles/magnetic-orbit.scss";
import { bindReplay } from "./detail-shell.js";

const stage = document.querySelector("[data-stage]");
const orbit = document.querySelector("[data-orbit]");
let frame = 0;

function moveOrbit(x, y) {
  orbit.style.setProperty("--x", `${x}px`);
  orbit.style.setProperty("--y", `${y}px`);
}

stage.addEventListener("pointermove", (event) => {
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(() => {
    const bounds = stage.getBoundingClientRect();
    moveOrbit(event.clientX - bounds.left, event.clientY - bounds.top);
  });
});

bindReplay(() => {
  moveOrbit(stage.clientWidth / 2, stage.clientHeight / 2);
});

moveOrbit(stage.clientWidth / 2, stage.clientHeight / 2);
