import { createServer } from "vite";
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
const slug = process.argv[2] || "proximity-weight";
const output = resolve(
  `../motion-benchmark-correction/text-corrections/${slug}/replica`,
);
mkdirSync(output, { recursive: true });
const origin = "http://127.0.0.1:4197";
const dims =
  slug === "blur-dissolve"
    ? { width: 918, height: 656 }
    : { width: 1600, height: 1200 };
const harness = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/ui-gallery/text-reveals/${slug}/style.scss"><style>html,body{margin:0}*{box-sizing:border-box}.skip-link{display:none}.motion-sr-only{position:absolute!important;width:1px!important;height:1px!important;overflow:hidden!important;clip-path:inset(50%)!important;white-space:nowrap!important}</style></head><body><main id="fixture"></main><script>window.__pendingFrames=new Set();const raf=window.requestAnimationFrame.bind(window),caf=window.cancelAnimationFrame.bind(window);window.requestAnimationFrame=callback=>{const id=raf(time=>{__pendingFrames.delete(id);callback(time)});__pendingFrames.add(id);return id};window.cancelAnimationFrame=id=>{__pendingFrames.delete(id);caf(id)};</script><script type="module">import{createDemo}from'/ui-gallery/text-reveals/${slug}/demo.js';window.mount=(reducedMotion=false)=>{window.controller?.abort();window.demo?.destroy();window.controller=new AbortController();window.demo=createDemo(document.querySelector('#fixture'),{signal:controller.signal,reducedMotion})};mount();</script></body></html>`;
const server = await createServer({
  server: { host: "127.0.0.1", port: 4197, strictPort: true },
  plugins: [
    {
      name: "recorded-text-fixture",
      configureServer(s) {
        s.middlewares.use("/__text/", async (req, res) => {
          res.setHeader("Content-Type", "text/html");
          res.end(await s.transformIndexHtml("/__text/", harness));
        });
      },
    },
  ],
});
await server.listen();
const browser = await chromium.launch({
  headless: true,
  executablePath: "/tmp/chromium",
  args: ["--disable-dev-shm-usage"],
});
const checks = [],
  errors = [];
const check = (name, pass, detail) => {
  checks.push({ name, pass, detail });
  if (!pass) console.error(name, detail);
};
try {
  const context = await browser.newContext({ viewport: dims, hasTouch: true });
  await context.route("**/*", (r) => {
    const u = new URL(r.request().url());
    if (u.pathname.startsWith("/_vercel/")) return r.fulfill({ body: "" });
    return u.origin === origin ? r.continue() : r.abort();
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  await page.clock.install({ time: new Date("2026-01-01T00:00:00Z") });
  await page.goto(origin + "/__text/");
  await page.waitForFunction(() => !!window.demo);
  await page.evaluate(() => demo.ready);
  await page.clock.pauseAt(new Date("2026-01-01T00:01:00Z"));
  check(
    "Loads meaningful source scene",
    (await page.locator("[data-recorded-scene]").count()) === 1,
  );
  check(
    "No Vite error overlay",
    (await page.locator("vite-error-overlay").count()) === 0,
  );
  check(
    "Source aspect ratio preserved",
    await page
      .locator("[data-recorded-scene]")
      .evaluate(
        (e, ratio) =>
          Math.abs(
            e.getBoundingClientRect().width / e.getBoundingClientRect().height -
              ratio,
          ) < 0.01,
        dims.width / dims.height,
      ),
  );
  await page.evaluate(() => demo.reset());
  await page.screenshot({ path: resolve(output, "rest.png") });
  if (["proximity-weight", "contour-ripple", "character-xray"].includes(slug)) {
    const points =
      slug === "proximity-weight"
        ? [
            [832, 420],
            [850, 672],
            [530, 677],
          ]
        : slug === "contour-ripple"
          ? [
              [639, 430],
              [805, 631],
              [1200, 380],
            ]
          : [
              [770, 629],
              [706, 789],
              [992, 669],
            ];
    for (let i = 0; i < points.length; i++) {
      await page.evaluate(
        ([x, y, i]) => demo.inspectAt(x, y, i),
        [...points[i], i],
      );
      await page.screenshot({ path: resolve(output, `active-${i}.png`) });
    }
  } else {
    const times =
      slug === "blur-dissolve"
        ? [0, 280, 650, 1130, 1730]
        : [0, 800, 1340, 1878, 2415, 3220];
    for (const time of times) {
      await page.evaluate((t) => demo.seek(t), time);
      await page.screenshot({ path: resolve(output, `time-${time}.png`) });
    }
  }
  await page.evaluate(() => {
    demo.replay();
    demo.reset();
  });
  await page.clock.runFor(3800);
  const phase = await page.locator("#fixture").getAttribute("data-phase");
  check(
    "Reset interrupts playback",
    phase === "rest" || phase === "ready",
    phase,
  );
  await page.evaluate(() => demo.replay());
  await page.clock.runFor(400);
  await page.evaluate(() => demo.replay());
  await page.clock.runFor(100);
  check(
    "Repeated Replay remains active",
    (await page.locator("#fixture").getAttribute("data-phase")) !== "hidden",
  );
  await page.clock.runFor(slug === "character-xray" ? 13000 : 5000);
  check(
    "Playback stops scheduling frames",
    (await page.evaluate(() => __pendingFrames.size)) === 0,
  );
  await page.evaluate(() => demo.replay());
  await page.clock.runFor(100);
  await page.evaluate(() => controller.abort());
  const before = await page.locator("#fixture").innerHTML();
  await page.clock.runFor(4200);
  await page.evaluate(() => {
    demo.replay();
    demo.reset();
    demo.destroy();
  });
  check(
    "Abort + destroy prevents later DOM writes",
    before === (await page.locator("#fixture").innerHTML()),
  );
  check(
    "Abort cancels every queued frame",
    (await page.evaluate(() => __pendingFrames.size)) === 0,
  );
  await page.evaluate(() => mount(true));
  await page.evaluate(() => demo.ready);
  await page.evaluate(() => demo.replay());
  await page.clock.runFor(200);
  await page.screenshot({ path: resolve(output, "reduced.png") });
  const animations = await page.evaluate(
    () =>
      document.getAnimations().filter((a) => a.playState === "running").length,
  );
  check(
    "Reduced motion has no running CSS/WAAPI animations",
    animations === 0,
    animations,
  );
  check(
    "Reduced motion also stops canvas/SVG rAF",
    (await page.evaluate(() => __pendingFrames.size)) === 0,
  );
  await page.evaluate(() => mount());
  await page.evaluate(() => demo.ready);
  const target = page.locator('button, [tabindex="0"]').first();
  await target.focus();
  await target.press(
    ["blur-dissolve", "scan-band-reveal"].includes(slug)
      ? "Enter"
      : "ArrowRight",
  );
  await page.clock.runFor(200);
  check(
    "Keyboard control changes scene",
    (await page.locator("#fixture").getAttribute("data-phase")) !== "rest",
  );
  if (slug !== "blur-dissolve") {
    await target.press("Escape");
    check(
      "Escape resets",
      (await page.locator("#fixture").getAttribute("data-phase")) === "rest",
    );
  }
  if (["proximity-weight", "contour-ripple", "character-xray"].includes(slug)) {
    await page.evaluate(() => demo.reset());
    const box = await page.locator("[data-recorded-scene]").boundingBox();
    await page.mouse.move(box.x + box.width * 0.45, box.y + box.height * 0.55);
    await page.clock.runFor(200);
    await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.4);
    await page.clock.runFor(20);
    await page.mouse.move(-10, -10);
    await page.clock.runFor(1600);
    check(
      "Rapid enter / reversal / leave settles to rest",
      (await page.locator("#fixture").getAttribute("data-phase")) === "rest",
    );
    check(
      "Hover settle leaves no background loop",
      (await page.evaluate(() => __pendingFrames.size)) === 0,
    );
  }
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await page.clock.runFor(60);
    check(
      `${width}px no horizontal overflow`,
      await page.evaluate(
        () => document.documentElement.scrollWidth === innerWidth,
      ),
    );
    await page.screenshot({ path: resolve(output, `mobile-${width}.png`) });
  }
  if (slug !== "scan-band-reveal") {
    await page.evaluate(() => demo.reset());
    const box = await page.locator("[data-recorded-scene]").boundingBox();
    await page.touchscreen.tap(
      box.x + box.width * 0.5,
      box.y + box.height * 0.53,
    );
    await page.clock.runFor(80);
    check(
      "Mobile tap produces a response",
      (await page.locator("#fixture").getAttribute("data-phase")) !== "rest",
    );
    await page.screenshot({ path: resolve(output, "mobile-touch.png") });
  }
  await page.goto(origin + `/ui-gallery/text-reveals/${slug}/`);
  await page.waitForSelector("[data-demo-ready=true]");
  check(
    "Full gallery loads WIP",
    (await page.locator(".motion-status").textContent()) === "WIP / レビュー前",
  );
  await page.locator("[data-motion-toggle]").check();
  await page.locator("[data-demo-replay]").click();
  await page.locator("[data-demo-reset]").click();
  check(
    "Shell controls remain mounted",
    (await page.locator("[data-demo-ready=true]").count()) === 1,
  );
  await page.goto(origin + "/ui-gallery/text-reveals/");
  await page.goBack();
  await page.waitForSelector("[data-demo-ready=true]");
  await page.locator("[data-demo-reset]").click();
  check(
    "Back navigation restores a usable demo",
    (await page.locator("[data-recorded-scene]").count()) === 1,
  );
  check("No page errors", errors.length === 0, errors);
  writeFileSync(
    resolve(output, "report.json"),
    JSON.stringify(
      {
        slug,
        checks,
        errors,
        scope: "Behavior and rendered evidence, not a fidelity certification.",
      },
      null,
      2,
    ),
  );
  console.log(
    JSON.stringify(
      {
        slug,
        passed: checks.filter((c) => c.pass).length,
        total: checks.length,
        output,
      },
      null,
      2,
    ),
  );
  if (checks.some((c) => !c.pass)) process.exitCode = 1;
} finally {
  await browser.close();
  await server.close();
}
