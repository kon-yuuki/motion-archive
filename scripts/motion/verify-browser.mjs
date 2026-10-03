import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { readdirSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

// Run against `npm run dev` or `npm run preview` in a separate terminal.
const origin = process.env.UI_TEST_BASE_URL ?? "http://127.0.0.1:5173";
const output = resolve(process.env.UI_TEST_OUTPUT ?? ".ui-motion-qa");
const categories = [
  "buttons",
  "sliders",
  "section-transitions",
  "text-reveals",
  "image-reveals",
];
const references = [];
for (const category of categories)
  for (const entry of readdirSync(resolve("ui-gallery", category), {
    withFileTypes: true,
  }).filter((item) => item.isDirectory())) {
    const directory = resolve("ui-gallery", category, entry.name);
    if (
      !existsSync(resolve(directory, "meta.js")) ||
      !existsSync(resolve(directory, "index.html"))
    )
      continue;
    const { metadata } = await import(
      pathToFileURL(resolve(directory, "meta.js"))
    );
    references.push(metadata);
  }
mkdirSync(output, { recursive: true });
const launch = { headless: true };
if (process.env.UI_CHROMIUM_EXECUTABLE_PATH)
  launch.executablePath = process.env.UI_CHROMIUM_EXECUTABLE_PATH;
if (process.env.UI_CHROMIUM_ARGS)
  launch.args = JSON.parse(process.env.UI_CHROMIUM_ARGS);
const browser = await chromium.launch(launch);
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
});
// Keep QA self-contained. Reference links are inspected, never clicked externally.
await context.route("**/*", (route) => {
  const url = new URL(route.request().url());
  if (url.pathname.startsWith("/_vercel/"))
    return route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: "",
    });
  return url.origin === new URL(origin).origin
    ? route.continue()
    : route.abort();
});
const page = await context.newPage(),
  results = [],
  errors = [],
  accessibility = [],
  failedResponses = [];
page.on("pageerror", (error) =>
  errors.push({ url: page.url(), message: error.message }),
);
page.on("response", (response) => {
  if (response.status() >= 400 && response.url().startsWith(origin))
    failedResponses.push({ url: response.url(), status: response.status() });
});
const check = (name, passed, details) => {
  results.push({ name, passed, details });
  if (!passed) console.error("FAIL:", name, details ?? "");
};
// Motion captures must sample the moving scene, not wait for an animated element
// to satisfy locator.screenshot's stability precondition (which can time out).
async function captureLab(path) {
  const lab = page.locator(".motion-lab");
  await lab.evaluate(element => element.scrollIntoView({ block: "center" }));
  const clip = await lab.boundingBox();
  if (!clip || clip.width <= 0 || clip.height <= 0) throw new Error("Missing motion-lab capture bounds");
  await page.screenshot({ path, clip });
}
try {
  for (const metadata of references) {
    const id = `${metadata.category}/${metadata.slug}`;
    console.log(`Checking ${id}`);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`${origin}/ui-gallery/${id}/`);
    await page.waitForSelector("[data-demo-ready=true]");
    check(
      `${id}: title`,
      (await page.locator("h1").textContent()) === metadata.title,
    );
    check(
      `${id}: source`,
      (await page.locator(".motion-reference a").count()) >= 2,
    );
    if (
      !/live/i.test(metadata.source.observationMode ?? "") &&
      /record/i.test(metadata.source.observationMode ?? "")
    )
      check(
        `${id}: recording disclosure`,
        (await page.locator(".motion-reference").textContent()).includes(
          "公式の記録映像を観察",
        ),
      );
    await page.locator("[data-demo-replay]").click();
    await page.waitForTimeout(250);
    await captureLab(resolve(output, id.replace("/", "-") + "-desktop.png"));
    await page.locator("[data-demo-replay]").click();
    await page.locator("[data-demo-reset]").click();
    await page.waitForTimeout(120);
    check(
      `${id}: repeated replay/reset`,
      (await page.locator("[data-demo-ready=true]").count()) === 1,
    );
    await page.locator("[data-motion-toggle]").check();
    await page.locator("[data-demo-replay]").click();
    await page.waitForTimeout(300);
    check(
      `${id}: reduced setting`,
      (await page
        .locator("[data-demo-stage]")
        .getAttribute("data-reduced-motion")) === "true",
    );
    check(
      `${id}: reduced animations`,
      (await page
        .locator("[data-demo-stage]")
        .evaluate(
          (root) =>
            root
              .getAnimations({ subtree: true })
              .filter((animation) => animation.playState === "running").length,
        )) === 0,
    );
    await page.locator("#code-css").click();
    check(
      `${id}: source tab`,
      (await page.locator("[data-code-content]").textContent()).length > 200,
    );
    await page.locator("#code-css").press("ArrowRight");
    check(
      `${id}: keyboard tabs`,
      (await page.locator("#code-helpers").getAttribute("aria-selected")) ===
        "true",
    );
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      await page.waitForTimeout(100);
      check(
        `${id}: ${width}px overflow`,
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      if (width === 390)
        await captureLab(resolve(output, id.replace("/", "-") + "-mobile.png"));
    }
    const analysis = await new AxeBuilder({ page })
      .include("[data-motion-page]")
      .analyze();
    accessibility.push({
      id,
      violations: analysis.violations.map((item) => ({
        id: item.id,
        impact: item.impact,
        help: item.help,
        nodes: item.nodes.map((node) => ({
          target: node.target,
          summary: node.failureSummary,
        })),
      })),
    });
  }
  for (const category of categories) {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`${origin}/ui-gallery/${category}/`);
    await page.waitForSelector(".reference-card");
    const count = references.filter(
      (item) => item.category === category,
    ).length;
    check(
      `${category}: catalogue count`,
      (await page.locator(".reference-card").count()) === count,
    );
    const field = page.locator("[data-reference-filter]");
    await field.fill("a-query-that-will-not-match");
    check(
      `${category}: filter empty`,
      (await page.locator(".reference-card:visible").count()) === 0,
    );
    await field.fill("");
  }
  // The shell is explicitly remounted during Swup navigation, including back/forward.
  await page.goto(`${origin}/ui-gallery/section-transitions/`);
  await page.waitForSelector(".reference-card");
  for (let index = 0; index < 3; index++) {
    await page.locator(".reference-card").first().click();
    await page.waitForSelector("[data-demo-ready=true]");
    await page.locator("[data-demo-replay]").click();
    await page.locator('[data-gallery-categories] a[aria-current="location"]').click();
    await page.waitForSelector(".reference-card");
  }
  check(
    "Repeated Swup navigation",
    (await page.locator(".reference-card").count()) ===
      references.filter((item) => item.category === "section-transitions")
        .length,
  );
  check("No JavaScript page errors", errors.length === 0, errors);
  check(
    "No failed local requests",
    failedResponses.length === 0,
    failedResponses,
  );
  const severe = accessibility.flatMap((item) =>
    item.violations
      .filter((issue) => ["serious", "critical"].includes(issue.impact))
      .map((issue) => ({ id: item.id, ...issue })),
  );
  check("No serious or critical axe findings", severe.length === 0, severe);
} catch (error) {
  results.push({ name: "Browser runner", passed: false, details: error.stack });
} finally {
  const report = {
    checkedAt: new Date().toISOString(),
    referenceCount: references.length,
    passed: results.filter((item) => item.passed).length,
    total: results.length,
    results,
    errors,
    failedResponses,
    accessibility,
  };
  writeFileSync(
    resolve(output, "report.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(
    `${report.passed}/${report.total} checks passed; ${references.length} references; ${accessibility.reduce((sum, item) => sum + item.violations.length, 0)} axe findings to review`,
  );
  await browser.close();
  if (results.some((item) => !item.passed)) process.exitCode = 1;
}
