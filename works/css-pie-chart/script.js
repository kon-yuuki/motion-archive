import { bindReplay } from "../_shared/detail-shell.js";

const chart = document.querySelector(".pie-chart");
const editorRows = document.querySelector("[data-editor-rows]");
const addButton = document.querySelector("[data-add-item]");
const markupPreview = document.querySelector("[data-markup-preview]");
const itemCount = document.querySelector(".chart-lab__footer p:nth-child(2) strong");
const chartCanvas = document.querySelector(".chart-lab__canvas");
const tooltip = document.querySelector("[data-chart-tooltip]");
const tooltipColor = document.querySelector("[data-tooltip-color]");
const tooltipLabel = document.querySelector("[data-tooltip-label]");
const tooltipPercent = document.querySelector("[data-tooltip-percent]");
const tooltipValue = document.querySelector("[data-tooltip-value]");
const palette = ["#38a88e", "#4d79dc", "#d65b91", "#d98a32"];
const maxItems = 4;
const minItems = 2;

function replay() {
  if (!chart) {
    return;
  }

  chart.removeAttribute("data-replaying");
  requestAnimationFrame(() => {
    requestAnimationFrame(() => chart.setAttribute("data-replaying", ""));
  });
}

chart?.addEventListener("animationend", () => {
  chart.removeAttribute("data-replaying");
});

bindReplay(replay);

function rows() {
  return [...document.querySelectorAll("[data-editor-row]")];
}

function normalize(values) {
  const safeValues = values.map((value) => Math.max(0, Number(value) || 0));
  const total = safeValues.reduce((sum, value) => sum + value, 0);
  const source = total > 0 ? safeValues : safeValues.map(() => 1);
  const sourceTotal = source.reduce((sum, value) => sum + value, 0);
  const exact = source.map((value) => (value / sourceTotal) * 100);
  const rounded = exact.map(Math.floor);
  let remainder = 100 - rounded.reduce((sum, value) => sum + value, 0);

  exact
    .map((value, index) => ({ index, fraction: value - rounded[index] }))
    .sort((a, b) => b.fraction - a.fraction)
    .forEach(({ index }) => {
      if (remainder > 0) {
        rounded[index] += 1;
        remainder -= 1;
      }
    });

  return rounded;
}

function updateChart() {
  if (!chart) {
    return;
  }

  const currentRows = rows();
  const percentages = normalize(
    currentRows.map((row) => row.querySelector('[data-field="value"]').value)
  );

  chart.replaceChildren();

  for (let index = 0; index < maxItems; index += 1) {
    chart.setAttribute(`data-percentage-${index + 1}`, String(percentages[index] ?? 0));
  }

  currentRows.forEach((row, index) => {
    const labelInput = row.querySelector('[data-field="label"]');
    const colorInput = row.querySelector('[data-field="color"]');
    const label = labelInput.value.trim() || `Item ${index + 1}`;
    const percentage = percentages[index];
    const item = document.createElement("li");
    const text = document.createElement("span");

    item.dataset.color = colorInput.value;
    item.dataset.percentage = String(percentage);
    item.dataset.rawValue = String(Math.max(0, Number(row.querySelector('[data-field="value"]').value) || 0));
    item.tabIndex = 0;
    item.setAttribute("aria-label", `${label}、全体の${percentage}%`);
    text.textContent = label;
    item.append(text);
    chart.append(item);
    row.querySelector("[data-percent]").textContent = `${percentage}%`;
    colorInput.setAttribute("aria-label", `${label} color`);
    row.querySelector('[data-field="value"]').setAttribute("aria-label", `${label} value`);
    row.querySelector("[data-remove-item]").setAttribute("aria-label", `Remove ${label}`);
  });

  chart.setAttribute(
    "aria-label",
    currentRows
      .map((row, index) => {
        const label = row.querySelector('[data-field="label"]').value.trim() || `Item ${index + 1}`;
        return `${label} ${percentages[index]}%`;
      })
      .join("、")
  );

  markupPreview.innerHTML = percentages
    .map((percentage, index) => `data-percentage-${index + 1}="${percentage}"`)
    .join("<br>");
  itemCount.textContent = String(currentRows.length);
  addButton.disabled = currentRows.length >= maxItems;
  currentRows.forEach((row) => {
    row.querySelector("[data-remove-item]").disabled = currentRows.length <= minItems;
  });
}

function isBarView() {
  return document.querySelector("#bar-view")?.checked;
}

function itemAtPointer(event) {
  const items = [...chart.children];

  if (isBarView()) {
    return event.target.closest(".pie-chart li");
  }

  const rect = chart.getBoundingClientRect();
  const x = event.clientX - (rect.left + rect.width / 2);
  const y = event.clientY - (rect.top + rect.height / 2);
  const radius = rect.width / 2;

  if (Math.hypot(x, y) > radius) {
    return null;
  }

  const angle = (Math.atan2(y, x) * 180 / Math.PI + 450) % 360;
  const percentageAtPointer = angle / 3.6;
  let accumulated = 0;

  return items.find((item) => {
    accumulated += Number(item.dataset.percentage);
    return percentageAtPointer <= accumulated;
  }) ?? null;
}

function positionTooltip(clientX, clientY) {
  if (!tooltip || !chartCanvas) {
    return;
  }

  const canvasRect = chartCanvas.getBoundingClientRect();
  const tooltipWidth = tooltip.offsetWidth || 168;
  const tooltipHeight = tooltip.offsetHeight || 82;
  const x = Math.min(
    Math.max(clientX - canvasRect.left + 16, 8),
    canvasRect.width - tooltipWidth - 8
  );
  const y = Math.min(
    Math.max(clientY - canvasRect.top + 16, 8),
    canvasRect.height - tooltipHeight - 8
  );

  tooltip.style.setProperty("--tooltip-x", `${x}px`);
  tooltip.style.setProperty("--tooltip-y", `${y}px`);
}

function showTooltip(item, clientX, clientY) {
  if (!item || !tooltip) {
    hideTooltip();
    return;
  }

  [...chart.children].forEach((candidate) => {
    candidate.toggleAttribute("data-active", candidate === item);
  });
  chart.setAttribute("data-has-active", "");

  const label = item.querySelector("span")?.textContent ?? "";
  tooltipColor.style.setProperty("--tooltip-color", item.dataset.color);
  tooltipLabel.textContent = label;
  tooltipPercent.textContent = `${item.dataset.percentage}%`;
  tooltipValue.textContent = item.dataset.rawValue;
  tooltip.setAttribute("data-visible", "");
  tooltip.setAttribute("aria-hidden", "false");
  positionTooltip(clientX, clientY);
}

function hideTooltip() {
  if (!chart || !tooltip) {
    return;
  }

  chart.removeAttribute("data-has-active");
  [...chart.children].forEach((item) => item.removeAttribute("data-active"));
  tooltip.removeAttribute("data-visible");
  tooltip.setAttribute("aria-hidden", "true");
}

function addItem() {
  if (rows().length >= maxItems) {
    return;
  }

  const index = rows().length;
  const row = document.createElement("div");
  row.className = "chart-editor__row";
  row.setAttribute("data-editor-row", "");
  row.innerHTML = `
    <input data-field="color" type="color" value="${palette[index]}" aria-label="New item color" />
    <input data-field="label" type="text" value="Item ${index + 1}" aria-label="Item label" />
    <input data-field="value" type="number" min="0" step="1" value="20" aria-label="New item value" />
    <output data-percent>0%</output>
    <button data-remove-item type="button" aria-label="Remove new item">&times;</button>
  `;
  editorRows.append(row);
  updateChart();
  row.querySelector('[data-field="label"]').select();
}

editorRows?.addEventListener("input", updateChart);
editorRows?.addEventListener("click", (event) => {
  const removeButton = event.target.closest("[data-remove-item]");

  if (!removeButton || rows().length <= minItems) {
    return;
  }

  removeButton.closest("[data-editor-row]").remove();
  updateChart();
});
addButton?.addEventListener("click", addItem);
chart?.addEventListener("pointermove", (event) => {
  showTooltip(itemAtPointer(event), event.clientX, event.clientY);
});
chart?.addEventListener("pointerleave", hideTooltip);
chart?.addEventListener("focusin", (event) => {
  const item = event.target.closest("li");

  if (!item) {
    return;
  }

  const rect = item.querySelector("span")?.getBoundingClientRect() ?? item.getBoundingClientRect();
  showTooltip(item, rect.right, rect.top);
});
chart?.addEventListener("focusout", hideTooltip);
document.querySelectorAll('input[name="chart-view"]').forEach((input) => {
  input.addEventListener("change", hideTooltip);
});
updateChart();
