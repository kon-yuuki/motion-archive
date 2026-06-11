import { works } from "../data/works.js";
import { workRow } from "./ui.js";
import { initWorkTooltip } from "./work-tooltip.js";

const list = document.querySelector("[data-latest-works]");
const workPrefix = list.dataset.workPrefix || "./works/";
const categoryPrefix = list.dataset.categoryPrefix || "./categories/";

list.innerHTML = works
  .map((work, index) => workRow(work, workPrefix, works.length - index - 1, categoryPrefix))
  .join("");

initWorkTooltip(list);
