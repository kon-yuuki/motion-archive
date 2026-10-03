import { mountDemoPage } from "../../_motion/demo-page.js";
import { metadata } from "./meta.js";
import { createDemo } from "./demo.js";
import js from "./demo.js?raw";
import css from "./style.scss?raw";
import helpers from "./TRACE.md?raw";
mountDemoPage(metadata, createDemo, { js, css, helpers });
