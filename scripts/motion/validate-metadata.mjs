import { readdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
const categories = [
  "buttons",
  "sliders",
  "section-transitions",
  "text-reveals",
  "image-reveals",
];
const failures = [],
  references = [];
for (const category of categories) {
  const directory = resolve("ui-gallery", category);
  for (const entry of readdirSync(directory, { withFileTypes: true }).filter(
    (item) => item.isDirectory(),
  )) {
    const folder = resolve(directory, entry.name),
      meta = resolve(folder, "meta.js");
    if (!existsSync(meta)) continue;
    const { metadata: m } = await import(pathToFileURL(meta));
    references.push(m);
    const check = (condition, message) => {
      if (!condition) failures.push(`${category}/${entry.name}: ${message}`);
    };
    check(m.slug === entry.name, "slug must match folder");
    check(m.category === category, "category must match parent");
    for (const file of ["index.html", "script.js", "demo.js", "style.scss"])
      check(existsSync(resolve(folder, file)), `missing ${file}`);
    for (const field of [
      "title",
      "description",
      "trigger",
      "duration",
      "easing",
      "xPost",
    ])
      check(
        typeof m[field] === "string" && m[field].length > 0,
        `missing ${field}`,
      );
    for (const field of [
      "name",
      "url",
      "awardUrl",
      "awardDate",
      "observedAt",
      "location",
      "observation",
      "observationMode",
    ])
      check(
        typeof m.source?.[field] === "string" && m.source[field].length > 0,
        `missing source.${field}`,
      );
    check(
      /^https:\/\/www\.awwwards\.com\/sites\//.test(m.source?.awardUrl),
      "award URL must be a specific Awwwards site",
    );
    check(
      /^\d{4}-\d{2}-\d{2}$/.test(m.source?.awardDate),
      "award date must be YYYY-MM-DD",
    );
    if (/record/i.test(m.source?.observationMode ?? ""))
      check(
        /^https:\/\/www\.awwwards\.com\/inspiration\//.test(
          m.source?.recordingUrl,
        ),
        "recorded observations require exact recording URL",
      );
    for (const field of ["takeaways", "implementation", "limitations"])
      check(
        Array.isArray(m[field]) && m[field].length >= 2,
        `missing useful ${field}`,
      );
    for (const field of ["benefit", "caution", "smallScreen", "reducedMotion"])
      check(
        typeof m.usability?.[field] === "string" &&
          m.usability[field].length > 0,
        `missing usability.${field}`,
      );
  }
}
const counts = Object.fromEntries(
  categories.map((category) => [
    category,
    references.filter((item) => item.category === category).length,
  ]),
);
const expectedTotal = process.argv
  .find((argument) => argument.startsWith("--expected-total="))
  ?.split("=")[1];
const expectedEach = process.argv
  .find((argument) => argument.startsWith("--expected-per-category="))
  ?.split("=")[1];
if (expectedTotal && references.length !== Number(expectedTotal))
  failures.push(`Expected ${expectedTotal} total; found ${references.length}`);
if (expectedEach)
  for (const [category, count] of Object.entries(counts))
    if (count !== Number(expectedEach))
      failures.push(`Expected ${expectedEach} in ${category}; found ${count}`);
console.log(
  JSON.stringify({ total: references.length, counts, failures }, null, 2),
);
if (failures.length) process.exitCode = 1;
