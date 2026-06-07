import { works } from "../data/works.js";
import { workRow } from "./ui.js";

document.querySelector("[data-all-works]").innerHTML = works
  .map((work, index) => workRow(work, "./", works.length - index - 1, "../categories/"))
  .join("");

document.querySelector("[data-count]").textContent = String(works.length).padStart(2, "0");
