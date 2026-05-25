import "../styles/base.scss";
import { works } from "../data/works.js";
import { workRow } from "./ui.js";

document.querySelector("[data-latest-works]").innerHTML = works
  .map((work) => workRow(work, "./works/"))
  .join("");
