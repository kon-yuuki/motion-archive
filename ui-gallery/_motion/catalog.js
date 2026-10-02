import { motionCategories, referencesFor } from "../../src/data/ui-motion.js";
const escape = (value = "") =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
export function referenceCards(category, prefix = "./") {
  return referencesFor(category)
    .map(
      (reference, index) =>
        `<a class="reference-card" href="${prefix}${reference.slug}/"><div class="reference-card__preview reference-card__preview--${category}" aria-hidden="true"><span class="reference-card__number">${String(index + 1).padStart(2, "0")}</span><div class="reference-card__drawing"><i></i><i></i><i></i><b>${category === "buttons" ? "Explore ↗︎" : category === "text-reveals" ? "Make it move." : "STUDY"}</b></div><span class="reference-card__play">↗︎</span></div><div class="reference-card__body"><p class="reference-card__source">${escape(reference.source.name)}${reference.status ? `<span>${escape(reference.status)}</span>` : ""}</p><h3>${escape(reference.title)}</h3><p>${escape(reference.subtitle ?? reference.description)}</p><div class="reference-card__tags"><span>${escape(reference.trigger)}</span><span>${escape(reference.duration)}</span></div></div></a>`,
    )
    .join("");
}
export function mountCategory() {
  const container = document.querySelector("[data-reference-category]");
  if (!container) return;
  const category = container.dataset.referenceCategory;
  const references = referencesFor(category);
  const title = motionCategories.find((item) => item.slug === category)?.title;
  container.querySelector("[data-reference-grid]").innerHTML =
    referenceCards(category);
  container.querySelectorAll("[data-reference-count]").forEach((element) => {
    element.textContent = `${String(references.length).padStart(2, "0")} studies`;
  });
  const filter = container.querySelector("[data-reference-filter]");
  const output = container.querySelector("[data-filter-status]");
  if (filter) {
    const lifecycle = new AbortController();
    filter.addEventListener(
      "input",
      () => {
        const query = filter.value.trim().toLowerCase();
        let visible = 0;
        container.querySelectorAll(".reference-card").forEach((card) => {
          const match = card.textContent.toLowerCase().includes(query);
          card.hidden = !match;
          if (match) visible += 1;
        });
        output.textContent = query
          ? `${visible} 件が見つかりました`
          : `${title} / ${references.length} studies`;
      },
      { signal: lifecycle.signal },
    );
    window.addEventListener(
      "site:before-content-replace",
      () => lifecycle.abort(),
      { once: true, signal: lifecycle.signal },
    );
  }
}
