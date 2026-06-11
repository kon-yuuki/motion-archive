import { createDemo, transcodeToMp4 } from "./video-demo/runner.mjs";

const DEMO_ZOOM = 1.8;

const demo = await createDemo({
  url: "http://localhost:5173/ui-gallery/hover-intent/",
  output: "exports/edge-collision.webm",
  viewport: { width: 1980, height: 1114 },
  stageSelector: "main"
});

const { page } = demo;

await page.addStyleTag({
  content: `
    .gallery-header,
    .gallery-hero,
    .gallery-footer,
    main > .topic-heading:not(.topic-heading--collision),
    main > .gallery-section:not(.collision-comparison) {
      display: none !important;
    }

    main {
      padding: 42px 110px 60px !important;
    }

    .topic-heading--collision {
      border-top: 0 !important;
      margin-top: 0 !important;
      padding: 0 0 34px !important;
    }

    .collision-comparison {
      gap: 28px !important;
      max-width: 1380px !important;
      padding-top: 30px !important;
    }

    .collision-canvas {
      height: 250px !important;
    }

    .collision-example__heading {
      margin-bottom: 12px !important;
    }

    .demo-caption {
      border-radius: 20px !important;
      bottom: 30px !important;
      max-width: 900px;
      padding: 16px 30px 17px !important;
    }

    .demo-caption strong {
      font-size: 30px !important;
      line-height: 1.3 !important;
    }

    .demo-caption span {
      font-size: 16px !important;
      line-height: 1.4 !important;
      margin-top: 5px !important;
    }

    body > .collision-tip {
      font-size: 18px !important;
      left: var(--recording-pointer-x) !important;
      position: fixed !important;
      top: var(--recording-pointer-y) !important;
      z-index: 1010 !important;
    }
  `
});

const demos = page.locator("[data-collision-demo]");
const badArea = demos.nth(0).locator("[data-collision-area]");
const goodArea = demos.nth(1).locator("[data-collision-area]");
const infoButton = page.locator('[data-info-open="edge-collision"]');

async function pinEdgeTooltip(index, side) {
  await page.evaluate(({ index, side }) => {
    document.querySelectorAll(".collision-tip").forEach((tip) => {
      tip.removeAttribute("data-open");
    });

    const tip = document.querySelector(`#collision-tip-${index}`);
    document.body.style.setProperty("--recording-pointer-x", "calc(100vw - 205px)");
    document.body.style.setProperty("--recording-pointer-y", "50vh");
    tip.setAttribute("data-side", side);
    tip.setAttribute("data-open", "");
  }, { index, side });
}

await page.evaluate(() => {
  document.querySelectorAll("[data-collision-demo]").forEach((collisionDemo) => {
    const area = collisionDemo.querySelector("[data-collision-area]");
    const tip = collisionDemo.querySelector(".collision-tip");
    const shouldFlip = collisionDemo.dataset.flip === "true";

    document.body.append(tip);

    area.addEventListener("pointermove", (event) => {
      document.body.style.setProperty("--recording-pointer-x", `${event.clientX}px`);
      document.body.style.setProperty("--recording-pointer-y", `${event.clientY}px`);

      const spaceRight = window.innerWidth - event.clientX;
      const side = shouldFlip && spaceRight < tip.offsetWidth + 14 ? "left" : "right";
      tip.setAttribute("data-side", side);
    });
  });
});

await demo.wait(600);
await demo.caption(
  "カーソル追従ツールチップの端処理",
  "Edge handling for cursor-following tooltips"
);
await demo.wait(1500);
await demo.hideCaption();

await demo.moveTo(badArea, {
  position: { x: 0.42, y: 0.5 },
  duration: 1100,
  zoom: DEMO_ZOOM,
  ja: "通常はカーソルの右側に表示",
  en: "The tooltip normally follows on the right"
});
await demo.wait(900);

await demo.moveTo(badArea, {
  position: { x: 0.975, y: 0.5 },
  duration: 1500,
  zoom: DEMO_ZOOM,
  ja: "そのまま右端へ行くと、内容が見切れる",
  en: "At the right edge, the content gets clipped"
});
await pinEdgeTooltip(0, "right");
await demo.wait(1300);

await demo.zoomOut(850);
await demo.moveTo(goodArea, {
  position: { x: 0.42, y: 0.5 },
  duration: 1300,
  zoom: DEMO_ZOOM,
  ja: "表示前に、右側の空きスペースを確認",
  en: "Measure the available space before positioning"
});
await demo.wait(900);

await demo.moveTo(goodArea, {
  position: { x: 0.975, y: 0.5 },
  duration: 1500,
  zoom: DEMO_ZOOM,
  ja: "幅が足りなければ、左側へフリップ",
  en: "Flip to the left when there is not enough room"
});
await pinEdgeTooltip(1, "left");
await demo.wait(1300);

await demo.moveTo(goodArea, {
  position: { x: 0.58, y: 0.5 },
  duration: 900,
  zoom: DEMO_ZOOM
});
await demo.moveTo(goodArea, {
  position: { x: 0.975, y: 0.5 },
  duration: 900,
  zoom: DEMO_ZOOM
});
await pinEdgeTooltip(1, "left");
await demo.wait(650);

await demo.zoomOut(850);
await demo.moveTo(infoButton, {
  duration: 1000,
  zoom: 1,
  ja: "判定は、カーソル位置と必要幅の比較だけ",
  en: "The decision only compares pointer position and required width"
});
await infoButton.click();
await demo.wait(1800);
await page.locator("[data-info-close]").click();

await demo.hideCaption();
await demo.moveTo(goodArea, {
  position: { x: 0.975, y: 0.5 },
  duration: 1000,
  zoom: 1
});
await demo.caption(
  "端を検知して、読める位置へ配置する",
  "Detect the edge and keep the tooltip readable"
);
await demo.wait(1500);
await demo.hideCaption();
await demo.wait(450);

const webm = await demo.finish();
const mp4 = await transcodeToMp4(webm, "exports/edge-collision.mp4", {
  start: 2
});
console.log(mp4);
