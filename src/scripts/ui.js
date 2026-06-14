function escapeAttr(value = "") {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function displayTags(work) {
  return [...work.techniques, ...work.expressions]
    .slice(0, 3)
    .map((tag) => `<span class="tag">${tag}</span>`)
    .join("");
}

export function statusBadge(work) {
  return work.status ? `<span class="status-badge">${work.status}</span>` : "";
}

export function workRow(work, prefix, index = 0) {
  const displayDate = work.date.replaceAll(".", " / ");

  return `
    <a class="work-row" href="${prefix}${work.slug}/" data-description="${escapeAttr(work.description)}" aria-label="${escapeAttr(`${work.title}を開く`)}">
      <div class="work-row__meta">
        <span class="work-row__number">${String(index + 1).padStart(2, "0")}</span>
      </div>
      <span class="work-row__media">
        <img src="${work.thumbnail}" width="960" height="600" loading="lazy" alt="" />
      </span>
      <div class="work-row__content">
        <div>
          <time class="work-row__date" datetime="${work.date.replaceAll(".", "-")}">${displayDate}</time>
          <span class="work-row__title">${work.title}${statusBadge(work)}</span>
        </div>
        <span class="tag-group">${displayTags(work)}</span>
      </div>
    </a>
  `;
}
