import Swup from "swup";
import SwupHeadPlugin from "@swup/head-plugin";
import foundationCss from "../styles/site-foundation.scss?inline";

const foundationStylesheet = document.createElement("style");
foundationStylesheet.setAttribute("data-site-foundation", "");
foundationStylesheet.textContent = foundationCss;
document.head.append(foundationStylesheet);

function reloadModuleScript(script) {
  const replacement = document.createElement("script");

  for (const { name, value } of script.attributes) {
    replacement.setAttribute(name, value);
  }

  if (script.src) {
    const source = new URL(script.src);
    source.searchParams.set("swup", String(Date.now()));
    replacement.src = source.href;
  } else {
    replacement.textContent = script.textContent;
  }

  script.replaceWith(replacement);
}

const swup = new Swup({
  containers: ["#site-header", "#swup"],
  animationSelector: ".transition-fade",
  plugins: [
    new SwupHeadPlugin({
      awaitAssets: true,
      persistTags: "[data-site-foundation], link[rel='stylesheet'][data-swup-previous-style]"
    })
  ]
});

swup.hooks.on("visit:start", () => {
  document.querySelectorAll("link[rel='stylesheet']:not([data-site-foundation])").forEach((stylesheet) => {
    stylesheet.setAttribute("data-swup-previous-style", "");
  });
});

swup.hooks.before("content:replace", () => {
  window.dispatchEvent(new Event("site:before-content-replace"));
});

swup.hooks.on("page:view", () => {
  document.querySelectorAll("link[rel='stylesheet'][data-swup-previous-style]").forEach((stylesheet) => {
    stylesheet.remove();
  });

  document.querySelectorAll("script[data-swup-reload-script]").forEach((script) => {
    reloadModuleScript(script);
  });

  document
    .querySelectorAll("head script[type='module'][src]:not([src*='/@vite/client']):not([src*='metrics'])")
    .forEach(reloadModuleScript);
});
