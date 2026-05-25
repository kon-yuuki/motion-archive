export function tags(work) {
  return [...work.techniques, ...work.expressions]
    .map((tag) => `<span class="tag">${tag}</span>`)
    .join("");
}

export function workRow(work, prefix) {
  return `
    <a class="work-row" href="${prefix}${work.slug}/">
      <span class="work-row__number">${work.date.replaceAll(".", " / ")}</span>
      <span class="work-row__title">${work.title}</span>
      <span class="tag-group">${tags(work)}</span>
      <span class="work-row__arrow" aria-hidden="true">Open</span>
    </a>
  `;
}
