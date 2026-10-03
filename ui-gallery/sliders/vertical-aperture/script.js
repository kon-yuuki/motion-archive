import { mountDemoPage } from "../../_motion/demo-page.js";
import { metadata } from "./meta.js";
import { createDemo } from "./demo.js";
import js from "./demo.js?raw";
import css from "./style.scss?raw";
import trace from "./trace.js?raw";
import helpers from "../../_motion/demo-helpers.js?raw";
mountDemoPage(metadata, createDemo, { js: `${js}\n\n// Recorded geometry table and interpolation\n${trace}`, css, helpers });
