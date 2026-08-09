import { visibleWorks } from "../data/works.js";
import { workRow } from "./ui.js";
import { initWorkTooltip } from "./work-tooltip.js";

const list = document.querySelector("[data-latest-works]");
const workPrefix = list.dataset.workPrefix || "./works/";

list.innerHTML = visibleWorks
  .map((work, index) => workRow(work, workPrefix, visibleWorks.length - index - 1))
  .join("");

document.querySelector("[data-work-count]").textContent = String(visibleWorks.length).padStart(2, "0");
initWorkTooltip(list);
