import { mountDemoPage } from "../../_motion/demo-page.js";
import { metadata } from "./meta.js";
import { createDemo } from "./demo.js";
import js from "./demo.js?raw";
import css from "./style.scss?raw";
import helpers from "../../_motion/demo-helpers.js?raw";
import scene from './scene.js?raw';
import art from './art.js?raw';
mountDemoPage(metadata, createDemo, { js: `${js}\n\n// scene.js\n${scene}\n\n// art.js\n${art}`, css, helpers });
