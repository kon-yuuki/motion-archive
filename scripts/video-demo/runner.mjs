import { access, mkdir, rename } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { promisify } from "node:util";
import { execFile } from "node:child_process";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const execFileAsync = promisify(execFile);

const easeInOutCubic = (value) => (
  value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2
);

export async function createDemo({
  url,
  output,
  viewport = { width: 1980, height: 1114 },
  stageSelector = "body",
  tooltipSelector
}) {
  const outputPath = resolve(output);
  await mkdir(resolve(outputPath, ".."), { recursive: true });

  const browserCandidates = [
    process.env.DEMO_BROWSER_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    chromium.executablePath()
  ].filter(Boolean);
  let executablePath;

  for (const candidate of browserCandidates) {
    try {
      await access(candidate);
      executablePath = candidate;
      break;
    } catch {
      // Try the next installed browser.
    }
  }

  const browser = await chromium.launch({ headless: true, executablePath });
  const context = await browser.newContext({
    viewport,
    recordVideo: {
      dir: resolve(outputPath, ".."),
      size: viewport
    }
  });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "networkidle" });

  await page.addStyleTag({
    content: `
      body { overflow: hidden; }

      ${stageSelector} {
        transform: translate(0, 0) scale(1);
        transform-origin: 0 0;
        will-change: transform;
      }

      .demo-caption {
        align-items: center;
        background: rgba(23, 34, 29, 0.94);
        border: 1px solid rgba(255, 255, 255, 0.14);
        border-radius: 17px;
        bottom: 28px;
        box-shadow: 0 16px 40px rgba(23, 34, 29, 0.22);
        color: #f8f3e6;
        display: flex;
        flex-direction: column;
        font-family: var(--font-sans, sans-serif);
        left: 50%;
        opacity: 0;
        padding: 12px 22px 13px;
        pointer-events: none;
        position: fixed;
        transform: translate(-50%, 12px);
        transition: opacity 180ms ease, transform 180ms ease;
        z-index: 1000;
      }

      .demo-caption[data-visible] {
        opacity: 1;
        transform: translate(-50%, 0);
      }

      .demo-caption strong {
        font-size: 17px;
        font-weight: 680;
        letter-spacing: 0.01em;
        line-height: 1.25;
      }

      .demo-caption span {
        color: rgba(248, 243, 230, 0.65);
        font-size: 11px;
        font-weight: 520;
        letter-spacing: 0.025em;
        line-height: 1.3;
        margin-top: 3px;
      }

      .demo-cursor {
        filter: drop-shadow(0 3px 4px rgba(0, 0, 0, 0.28));
        height: 38px;
        left: 0;
        pointer-events: none;
        position: fixed;
        top: 0;
        transform: translate(var(--demo-cursor-x), var(--demo-cursor-y));
        width: 30px;
        z-index: 1020;
      }

      .demo-cursor svg {
        display: block;
        height: 100%;
        width: 100%;
      }

      ${tooltipSelector ? `body > ${tooltipSelector} {
        left: 0 !important;
        position: fixed !important;
        top: 0 !important;
        transform:
          translate(var(--demo-cursor-x, 0), var(--demo-cursor-y, 0))
          translate(30px, 22px) !important;
        z-index: 1010;
      }` : ""}
    `
  });

  await page.evaluate(({ stageSelector, tooltipSelector }) => {
    const caption = document.createElement("div");
    caption.className = "demo-caption";
    caption.innerHTML = "<strong></strong><span></span>";
    document.body.append(caption);

    const cursor = document.createElement("div");
    cursor.className = "demo-cursor";
    cursor.innerHTML = `
      <svg viewBox="0 0 27 34" aria-hidden="true">
        <path d="M2 2l20 18-10 1 6 10-5 3-6-11-5 7z" fill="#fff" stroke="#17221d" stroke-width="2" stroke-linejoin="round"/>
      </svg>
    `;
    document.body.append(cursor);

    if (tooltipSelector) {
      const tooltip = document.querySelector(tooltipSelector);
      if (tooltip) document.body.append(tooltip);
    }

    window.__demoStage = document.querySelector(stageSelector);
    window.addEventListener("mousemove", (event) => {
      document.body.style.setProperty("--demo-cursor-x", `${event.clientX}px`);
      document.body.style.setProperty("--demo-cursor-y", `${event.clientY}px`);
    });
  }, { stageSelector, tooltipSelector });

  let pointer = { x: viewport.width * 0.9, y: viewport.height * 0.88 };
  let camera = { tx: 0, ty: 0, scale: 1 };
  await page.mouse.move(pointer.x, pointer.y);

  async function caption(ja, en) {
    await page.evaluate(({ ja, en }) => {
      const element = document.querySelector(".demo-caption");
      element.querySelector("strong").textContent = ja;
      element.querySelector("span").textContent = en;
      element.setAttribute("data-visible", "");
    }, { ja, en });
  }

  async function hideCaption() {
    await page.evaluate(() => {
      document.querySelector(".demo-caption")?.removeAttribute("data-visible");
    });
  }

  async function pointFor(target, position = { x: 0.5, y: 0.5 }) {
    const box = typeof target === "string"
      ? await page.locator(target).first().boundingBox()
      : await target.boundingBox();

    return {
      x: box.x + box.width * position.x,
      y: box.y + box.height * position.y
    };
  }

  async function moveTo(target, {
    position,
    duration = 1200,
    zoom = 1,
    ja,
    en
  } = {}) {
    const destination = await pointFor(target, position);
    const frames = Math.max(24, Math.round(duration / 25));

    if (ja || en) await caption(ja ?? "", en ?? "");

    const pointerStart = { ...pointer };
    const cameraStart = { ...camera };
    const localTarget = {
      x: (destination.x - cameraStart.tx) / cameraStart.scale,
      y: (destination.y - cameraStart.ty) / cameraStart.scale
    };
    const cameraEnd = {
      tx: destination.x - localTarget.x * zoom,
      ty: destination.y - localTarget.y * zoom,
      scale: zoom
    };
    const transformFor = ({ tx, ty, scale }) => (
      `translate(${tx}px, ${ty}px) scale(${scale})`
    );

    await page.evaluate(({ from, to, duration }) => {
      window.__demoCameraAnimation?.cancel();
      window.__demoCameraAnimation = window.__demoStage.animate(
        [{ transform: from }, { transform: to }],
        {
          duration,
          easing: "cubic-bezier(0.65, 0, 0.35, 1)",
          fill: "forwards"
        }
      );
    }, {
      from: transformFor(cameraStart),
      to: transformFor(cameraEnd),
      duration
    });

    for (let frame = 1; frame <= frames; frame += 1) {
      const eased = easeInOutCubic(frame / frames);
      pointer = {
        x: pointerStart.x + (destination.x - pointerStart.x) * eased,
        y: pointerStart.y + (destination.y - pointerStart.y) * eased
      };
      await page.mouse.move(pointer.x, pointer.y);
      await page.waitForTimeout(duration / frames);
    }

    camera = cameraEnd;
    await page.evaluate((transform) => {
      window.__demoStage.style.transform = transform;
      window.__demoCameraAnimation?.cancel();
    }, transformFor(camera));
  }

  async function zoomOut(duration = 900) {
    const cameraStart = { ...camera };
    const cameraEnd = { tx: 0, ty: 0, scale: 1 };
    const transformFor = ({ tx, ty, scale }) => (
      `translate(${tx}px, ${ty}px) scale(${scale})`
    );

    await page.evaluate(({ from, to, duration }) => {
      window.__demoCameraAnimation?.cancel();
      window.__demoCameraAnimation = window.__demoStage.animate(
        [{ transform: from }, { transform: to }],
        {
          duration,
          easing: "cubic-bezier(0.65, 0, 0.35, 1)",
          fill: "forwards"
        }
      );
    }, {
      from: transformFor(cameraStart),
      to: transformFor(cameraEnd),
      duration
    });
    await page.waitForTimeout(duration);
    camera = cameraEnd;
    await page.evaluate((transform) => {
      window.__demoStage.style.transform = transform;
      window.__demoCameraAnimation?.cancel();
    }, transformFor(camera));
  }

  async function finish() {
    const video = page.video();
    await context.close();
    await browser.close();
    await rename(await video.path(), outputPath);
    return outputPath;
  }

  return {
    page,
    caption,
    hideCaption,
    moveTo,
    zoomOut,
    wait: (duration) => page.waitForTimeout(duration),
    finish
  };
}

export async function transcodeToMp4(input, output, { width = 1980, height = 1114 } = {}) {
  await execFileAsync(ffmpegPath, [
    "-y",
    "-i", resolve(input),
    "-vf", `scale=${width}:${height}:flags=lanczos`,
    "-c:v", "libx264",
    "-preset", "medium",
    "-crf", "20",
    "-pix_fmt", "yuv420p",
    "-movflags", "+faststart",
    "-an",
    resolve(output)
  ]);

  return resolve(output);
}
