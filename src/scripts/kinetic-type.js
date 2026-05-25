import "../styles/kinetic-type.scss";
import { bindReplay } from "./detail-shell.js";

const stage = document.querySelector("[data-stage]");

bindReplay(() => {
  stage.classList.remove("is-replaying");
  void stage.offsetWidth;
  stage.classList.add("is-replaying");
});
