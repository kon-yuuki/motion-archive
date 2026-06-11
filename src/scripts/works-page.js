import { works } from "../data/works.js";
import { workRow } from "./ui.js";
import { initWorkTooltip } from "./work-tooltip.js";

const list = document.querySelector("[data-all-works]");

list.innerHTML = works
  .map((work, index) => workRow(work, "./", works.length - index - 1, "../categories/"))
  .join("");

document.querySelector("[data-count]").textContent = String(works.length).padStart(2, "0");

initWorkTooltip(list);
