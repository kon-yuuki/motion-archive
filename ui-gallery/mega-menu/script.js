const menuData = {
  products: {
    label: "Products",
    title: "つくるための道具を、ひとつの場所に。",
    groups: [
      ["Design", "Interface design", "Prototyping", "Design systems"],
      ["Build", "Developer tools", "Integrations", "Release notes"]
    ]
  },
  solutions: {
    label: "Solutions",
    title: "チームの進み方に合う解決策。",
    groups: [
      ["Teams", "Startups", "Enterprise", "Agencies"],
      ["Use cases", "Collaboration", "Research", "Planning"]
    ]
  },
  resources: {
    label: "Resources",
    title: "アイデアと実装をつなぐ資料。",
    groups: [
      ["Learn", "Guides", "Customer stories", "Events"],
      ["Support", "Help center", "Community", "Contact"]
    ]
  }
};

const navItems = [
  ["products", "Products"],
  ["solutions", "Solutions"],
  ["resources", "Resources"],
  [null, "Pricing"],
  [null, "Company"]
];

function panelMarkup(key, id) {
  const item = menuData[key];
  const groups = item.groups.map(([title, ...links]) => `
    <section class="mega-group">
      <h4>${title}</h4>
      ${links.map((label) => `<a href="#${key}-${label.toLowerCase().replaceAll(" ", "-")}">${label}<span aria-hidden="true">↗</span></a>`).join("")}
    </section>
  `).join("");

  return `<div class="mega-panel" id="${id}-${key}" data-panel="${key}" hidden>
    <div class="mega-panel__intro">
      <p>${item.label}</p>
      <a href="#${key}-all">${item.title}<span aria-hidden="true">→</span></a>
    </div>
    <div class="mega-panel__links">${groups}</div>
  </div>`;
}

function pointInTriangle(point, a, b, c) {
  const sign = (p1, p2, p3) => (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
  const d1 = sign(point, a, b);
  const d2 = sign(point, b, c);
  const d3 = sign(point, c, a);
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
}

function initDemo(demo, index) {
  const id = `mega-demo-${index}`;
  const useSafeArea = demo.dataset.safeArea === "true";
  demo.innerHTML = `
    <div class="browser-bar"><i></i><i></i><i></i><span>studio.example</span></div>
    <div class="demo-site">
      <header class="demo-header">
        <a class="demo-logo" href="#home" aria-label="Arc home">Arc</a>
        <nav class="demo-nav" aria-label="グローバルナビゲーション">
          <ul class="demo-nav__list">
            ${navItems.map(([key, label]) => key
              ? `<li class="demo-nav__item" data-nav-item="${key}">
                  <button type="button" data-trigger="${key}" aria-expanded="false" aria-controls="${id}-${key}">${label}<span aria-hidden="true">⌄</span></button>
                  ${panelMarkup(key, id)}
                </li>`
              : `<li class="demo-nav__item"><a href="#${label.toLowerCase()}">${label}</a></li>`).join("")}
          </ul>
        </nav>
        <button class="demo-menu-button" type="button" aria-label="ナビゲーションを開く" aria-expanded="false">Menu</button>
      </header>
      ${useSafeArea ? `<div class="safe-area-visual" aria-hidden="true"></div>` : ""}
      <div class="demo-placeholder"><span>Move diagonally</span><p>開いた項目から、メニュー右側のリンクへ斜めに移動して比較してください。</p></div>
    </div>`;

  const header = demo.querySelector(".demo-header");
  const demoSite = demo.querySelector(".demo-site");
  const nav = demo.querySelector(".demo-nav");
  const mobileButton = demo.querySelector(".demo-menu-button");
  const safeAreaVisual = demo.querySelector(".safe-area-visual");
  const triggers = [...demo.querySelectorAll("[data-trigger]")];
  const plainLinks = [...demo.querySelectorAll(".demo-nav__item > a")];
  const panels = [...demo.querySelectorAll("[data-panel]")];
  let activeKey = null;
  let leavePoint = null;
  let visualPointer = null;
  let safeOriginPoint = null;
  let safeOriginY = null;
  let pendingKey = null;
  let pendingPointer = null;
  let hoveredKey = null;
  let safeTimer = null;
  let hasReachedPanel = false;

  function open(key, origin = leavePoint) {
    window.clearTimeout(safeTimer);
    hasReachedPanel = false;
    pendingKey = null;
    pendingPointer = null;
    demo.removeAttribute("data-safe-active");
    demo.removeAttribute("data-panel-reached");
    if (origin) {
      leavePoint = origin;
      visualPointer = origin;
      safeOriginPoint = origin;
    }
    activeKey = key;
    if (origin) {
      const triggerRect = demo.querySelector(`[data-trigger="${key}"]`).getBoundingClientRect();
      safeOriginY = Math.min(Math.max(origin.y, triggerRect.top), triggerRect.bottom);
    }
    demo.dataset.open = "";
    triggers.forEach((trigger) => trigger.setAttribute("aria-expanded", String(trigger.dataset.trigger === key)));
    panels.forEach((panel) => { panel.hidden = panel.dataset.panel !== key; });
    drawSafeArea(safeOriginPoint);
  }

  function close() {
    window.clearTimeout(safeTimer);
    activeKey = null;
    hasReachedPanel = false;
    safeOriginPoint = null;
    safeOriginY = null;
    pendingKey = null;
    pendingPointer = null;
    hoveredKey = null;
    demo.removeAttribute("data-safe-active");
    demo.removeAttribute("data-panel-reached");
    delete demo.dataset.open;
    triggers.forEach((trigger) => trigger.setAttribute("aria-expanded", "false"));
    panels.forEach((panel) => { panel.hidden = true; });
  }

  function deferSwitch(key, pointer) {
    pendingKey = key;
    pendingPointer = pointer;
    drawSafeArea(safeOriginPoint);
    demo.setAttribute("data-safe-active", "");
    window.clearTimeout(safeTimer);
    safeTimer = window.setTimeout(() => {
      const triangle = getSafeTriangle(activeKey, safeOriginPoint);
      const insideSafeArea = triangle && pendingPointer
        ? pointInTriangle(pendingPointer, triangle.origin, triangle.left, triangle.right)
        : false;
      if (hoveredKey === key && !insideSafeArea) open(key, pendingPointer);
    }, 140);
  }

  function getSafeTriangle(key, originPoint) {
    if (!key || !originPoint) return null;
    const triggerRect = demo.querySelector(`[data-trigger="${key}"]`).getBoundingClientRect();
    const navItem = demo.querySelector(`[data-nav-item="${key}"]`);
    const panelRect = navItem.querySelector("[data-panel]").getBoundingClientRect();
    const clampedPointer = {
      x: Math.min(Math.max(originPoint.x, triggerRect.left), triggerRect.right),
      y: safeOriginY ?? Math.min(Math.max(originPoint.y, triggerRect.top), triggerRect.bottom)
    };
    return {
      origin: clampedPointer,
      left: { x: panelRect.left, y: panelRect.top },
      right: { x: panelRect.right, y: panelRect.top }
    };
  }

  function drawSafeArea(originPoint) {
    if (!safeAreaVisual) return;
    const triangle = getSafeTriangle(activeKey, originPoint);
    if (!triangle) return;
    const siteRect = demoSite.getBoundingClientRect();
    const origin = { x: triangle.origin.x - siteRect.left, y: triangle.origin.y - siteRect.top };
    const left = { x: triangle.left.x - siteRect.left, y: triangle.left.y - siteRect.top };
    const right = { x: triangle.right.x - siteRect.left, y: triangle.right.y - siteRect.top };
    safeAreaVisual.style.setProperty("--safe-origin-x", `${origin.x}px`);
    safeAreaVisual.style.setProperty("--safe-origin-y", `${origin.y}px`);
    safeAreaVisual.style.setProperty("--safe-left-x", `${left.x}px`);
    safeAreaVisual.style.setProperty("--safe-right-x", `${right.x}px`);
    safeAreaVisual.style.setProperty("--safe-base-y", `${left.y}px`);
  }

  triggers.forEach((trigger) => {
    trigger.addEventListener("pointerenter", (event) => {
      if (event.pointerType === "touch" || window.matchMedia("(max-width: 680px)").matches) return;
      const key = trigger.dataset.trigger;
      const pointer = { x: event.clientX, y: event.clientY };
      const cameFromPanel = event.relatedTarget instanceof Element && Boolean(event.relatedTarget.closest("[data-panel]"));
      hoveredKey = key;
      if (hasReachedPanel || cameFromPanel || !useSafeArea || !activeKey || activeKey === key || !leavePoint) open(key, pointer);
      else deferSwitch(key, pointer);
    });
    trigger.addEventListener("pointerleave", (event) => {
      leavePoint = { x: event.clientX, y: event.clientY };
      if (hoveredKey === trigger.dataset.trigger) hoveredKey = null;
      if (pendingKey === trigger.dataset.trigger) {
        window.clearTimeout(safeTimer);
        pendingKey = null;
        pendingPointer = null;
        demo.removeAttribute("data-safe-active");
      }
    });
    trigger.addEventListener("focus", () => {
      if (!window.matchMedia("(max-width: 680px)").matches) {
        const rect = trigger.getBoundingClientRect();
        open(trigger.dataset.trigger, { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
      }
    });
    trigger.addEventListener("click", () => activeKey === trigger.dataset.trigger ? close() : open(trigger.dataset.trigger));
  });

  plainLinks.forEach((link) => {
    link.addEventListener("pointerenter", close);
    link.addEventListener("focus", close);
  });

  panels.forEach((panel) => {
    panel.addEventListener("pointerenter", () => {
      if (!useSafeArea || panel.dataset.panel !== activeKey) return;
      hasReachedPanel = true;
      window.clearTimeout(safeTimer);
      pendingKey = null;
      pendingPointer = null;
      demo.removeAttribute("data-safe-active");
      demo.setAttribute("data-panel-reached", "");
    });
  });

  demo.addEventListener("pointermove", (event) => {
    visualPointer = { x: event.clientX, y: event.clientY };
    if (activeKey) {
      const triggerRect = demo.querySelector(`[data-trigger="${activeKey}"]`).getBoundingClientRect();
      const insideActiveTrigger = event.clientX >= triggerRect.left
        && event.clientX <= triggerRect.right
        && event.clientY >= triggerRect.top
        && event.clientY <= triggerRect.bottom;
      if (insideActiveTrigger) {
        safeOriginPoint = visualPointer;
        safeOriginY = Math.min(Math.max(event.clientY, triggerRect.top), triggerRect.bottom);
        drawSafeArea(safeOriginPoint);
      }
    }
    if (pendingKey) pendingPointer = visualPointer;
    if (!useSafeArea || hasReachedPanel || !pendingKey || !leavePoint || !activeKey) return;
    const point = { x: event.clientX, y: event.clientY };
    const triangle = getSafeTriangle(activeKey, safeOriginPoint);
    if (!triangle) return;
    const inside = pointInTriangle(point, triangle.origin, triangle.left, triangle.right);
    demo.toggleAttribute("data-safe-active", inside);
    if (!inside && hoveredKey === pendingKey) open(pendingKey, pendingPointer);
  });

  header.addEventListener("pointerleave", (event) => {
    if (event.relatedTarget && demo.contains(event.relatedTarget)) return;
    close();
  });
  demo.addEventListener("pointerleave", close);
  demo.addEventListener("focusout", (event) => {
    if (!demo.contains(event.relatedTarget)) close();
  });
  mobileButton.addEventListener("click", () => {
    const expanded = mobileButton.getAttribute("aria-expanded") === "true";
    mobileButton.setAttribute("aria-expanded", String(!expanded));
    nav.toggleAttribute("data-mobile-open", !expanded);
    if (expanded) close();
  });
  window.addEventListener("resize", close);
}

document.querySelectorAll("[data-mega-demo]").forEach(initDemo);
