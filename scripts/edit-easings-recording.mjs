import { readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import { execFile } from "node:child_process";

const require = createRequire(import.meta.url);
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const execFileAsync = promisify(execFile);

const input = "exports/画面収録 2026-06-29 21.54.39.mov";
const output = "exports/easings-x-captioned.mp4";
const width = 1808;
const height = 934;

const fontName = readdirSync("/System/Library/Fonts")
  .find((name) => name.includes("角") && name.includes("W6"));
const fontFile = join("/System/Library/Fonts", fontName ?? "AppleSDGothicNeo.ttc");

const segments = [
  {
    start: 0,
    end: 3.2,
    zoom: 1,
    center: [904, 560],
    caption: "30種類のイージングを一覧で比較",
    subcaption: "Compare 30 easing curves in one view"
  },
  {
    start: 3.2,
    end: 6.4,
    zoom: 1,
    center: [700, 485],
    caption: "カーブに触れると進み方を追える",
    subcaption: "Hover a curve to trace its timing"
  },
  {
    start: 6.4,
    end: 11.8,
    zoom: 1,
    center: [1390, 650],
    caption: "Durationをまとめて変えて確認",
    subcaption: "Adjust the duration for the whole list"
  },
  {
    start: 11.8,
    end: 16.2,
    zoom: 1,
    center: [1040, 520],
    caption: "速さを変えると印象の差が見える",
    subcaption: "Changing speed reveals the difference"
  },
  {
    start: 16.2,
    end: 22.5,
    zoom: 1,
    center: [904, 485],
    caption: "気になる動きはコードまで確認",
    subcaption: "Open a curve and check the code"
  },
  {
    start: 22.5,
    end: 24.62,
    zoom: 1,
    center: [904, 520],
    caption: "イージングは、名前ではなく動きで選ぶ",
    subcaption: "Choose easing by motion, not by name"
  }
];

function escapeText(value) {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll(":", "\\:")
    .replaceAll("'", "\\'");
}

function cropFor({ zoom, center }) {
  const cropWidth = Math.round(width / zoom / 2) * 2;
  const cropHeight = Math.round(height / zoom / 2) * 2;
  const maxX = width - cropWidth;
  const maxY = height - cropHeight;
  const x = Math.max(0, Math.min(maxX, Math.round(center[0] - cropWidth / 2)));
  const y = Math.max(0, Math.min(maxY, Math.round(center[1] - cropHeight / 2)));

  return `crop=${cropWidth}:${cropHeight}:${x}:${y},scale=${width}:${height}:flags=lanczos`;
}

function captionFilter(caption, subcaption) {
  const text = escapeText(caption);
  const subtext = escapeText(subcaption);
  const font = fontFile.replaceAll("\\", "\\\\").replaceAll(":", "\\:");
  const boxWidth = 760;
  const boxHeight = 104;
  const boxX = Math.round((width - boxWidth) / 2);
  const boxY = height - boxHeight - 48;

  const baseBox = `drawbox=x=${boxX}:y=${boxY}:w=${boxWidth}:h=${boxHeight}:color=0x17221deb:t=fill`;
  const mainText = [
    `drawtext=fontfile='${font}'`,
    `text='${text}'`,
    "fontcolor=0xfff9ee",
    "fontsize=36",
    "x=(w-text_w)/2",
    `y=${boxY + 18}`
  ].join(":");
  const subText = [
    `drawtext=fontfile='${font}'`,
    `text='${subtext}'`,
    "fontcolor=0xfff9eeb8",
    "fontsize=17",
    "x=(w-text_w)/2",
    `y=${boxY + 70}`
  ].join(":");

  return [
    baseBox,
    mainText,
    subText
  ].join(",");
}

const filterParts = [];

segments.forEach((segment, index) => {
  const label = `v${index}`;
  filterParts.push(
    `[0:v]trim=start=${segment.start}:end=${segment.end},setpts=PTS-STARTPTS,${cropFor(segment)},${captionFilter(segment.caption, segment.subcaption)}[${label}]`
  );
});

filterParts.push(`${segments.map((_, index) => `[v${index}]`).join("")}concat=n=${segments.length}:v=1:a=0[outv]`);

await execFileAsync(ffmpegPath, [
  "-y",
  "-i", resolve(input),
  "-filter_complex", filterParts.join(";"),
  "-map", "[outv]",
  "-c:v", "libx264",
  "-preset", "medium",
  "-crf", "18",
  "-pix_fmt", "yuv420p",
  "-movflags", "+faststart",
  "-an",
  resolve(output)
], { maxBuffer: 1024 * 1024 * 8 });

console.log(resolve(output));
