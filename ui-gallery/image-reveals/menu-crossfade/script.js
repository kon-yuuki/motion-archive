import { mountDemoPage } from "../../_motion/demo-page.js";
import { metadata } from "./meta.js";
import { createDemo } from "./demo.js";
import js from "./demo.js?raw";
import css from "./style.scss?raw";
const helpers = "このデモは共通の描画ヘルパーを使いません。";
mountDemoPage(metadata, createDemo, { js, css, helpers });
