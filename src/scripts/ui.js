function categorySlug(value) {
  return value.toLowerCase().replaceAll(" ", "-");
}

function escapeAttr(value = "") {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function categoryTag(tag, type, categoryPrefix) {
  const href = `${categoryPrefix}#${type}-${categorySlug(tag)}`;

  return `<a class="tag" href="${href}">${tag}</a>`;
}

export function tags(work, categoryPrefix = "./categories/") {
  return [
    ...work.techniques.map((tag) => categoryTag(tag, "technique", categoryPrefix)),
    ...work.expressions.map((tag) => categoryTag(tag, "expression", categoryPrefix))
  ]
    .join("");
}

export function statusBadge(work) {
  return work.status ? `<span class="status-badge">${work.status}</span>` : "";
}

export function workRow(work, prefix, index = 0, categoryPrefix = "./categories/") {
  return `
    <article class="work-row" data-description="${escapeAttr(work.description)}">
      <span class="work-row__number">${String(index + 1).padStart(2, "0")}</span>
      <a class="work-row__title" href="${prefix}${work.slug}/">${work.title}${statusBadge(work)}</a>
      <span class="tag-group">${tags(work, categoryPrefix)}</span>
    </article>
  `;
}
