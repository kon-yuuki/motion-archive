import { categories, works } from "../data/works.js";
import { statusBadge } from "./ui.js";

function categorySlug(value) {
  return value.toLowerCase().replaceAll(" ", "-");
}

function groupMarkup(items, key) {
  const type = key === "techniques" ? "technique" : "expression";

  return items
    .map((category) => {
      const matches = works.filter((work) => work[key].includes(category));
      const links = matches.length
        ? matches
            .map(
              (work) =>
                `<a class="category-work" href="../works/${work.slug}/">${work.title}${statusBadge(work)}</a>`
            )
            .join("")
        : '<span class="category-empty">No experiments yet</span>';

      return `
        <article class="category-card" id="${type}-${categorySlug(category)}">
          <header>
            <h3>${category}</h3>
            <span>${String(matches.length).padStart(2, "0")}</span>
          </header>
          <div class="category-links">${links}</div>
        </article>
      `;
    })
    .join("");
}

document.querySelector("[data-techniques]").innerHTML = groupMarkup(categories.techniques, "techniques");
document.querySelector("[data-expressions]").innerHTML = groupMarkup(categories.expressions, "expressions");
