import "../styles/base.scss";
import { works } from "../data/works.js";
import { workRow } from "./ui.js";

document.querySelector("[data-all-works]").innerHTML = works
  .map((work) => workRow(work, "./"))
  .join("");

document.querySelector("[data-count]").textContent = String(works.length).padStart(2, "0");
