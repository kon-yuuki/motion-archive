const escapeHtml = (value = "") =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
const list = (items = []) =>
  `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
const categoryTitles = {
  buttons: "Buttons",
  sliders: "Sliders",
  "section-transitions": "Section transitions",
  "text-reveals": "Text motion",
  "image-reveals": "Image reveals",
};

/** Explicit lifecycle: safe on reload, back/forward, and Swup content replacement. */
export function mountDemoPage(metadata, createDemo, sources = {}) {
  const page = document.querySelector("[data-motion-page]");
  if (!page) return;
  const lifecycle = new AbortController();
  const { signal } = lifecycle;
  const category = categoryTitles[metadata.category] ?? metadata.category;
  const source = metadata.source;
  const referenceStatus = document.querySelector("[data-reference-status]");
  if (referenceStatus)
    referenceStatus.textContent = `Reference study${metadata.status ? " / " + metadata.status : ""}`;
  const statusBadge = metadata.status
    ? `<span class="motion-status">${escapeHtml(metadata.status)}${metadata.status === "WIP" ? " / レビュー前" : ""}</span>`
    : "";
  const observationMode =
    !/live/i.test(source.observationMode ?? "") &&
    /record/i.test(source.observationMode ?? "")
      ? "公式の記録映像を観察"
      : "公開サイトを実際に操作";
  const recordingLink = source.recordingUrl
    ? `<a href="${escapeHtml(source.recordingUrl)}" target="_blank" rel="noopener noreferrer">観察した記録映像 ↗︎</a>`
    : "";
  page.querySelector("[data-demo-heading]").innerHTML =
    `<p class="motion-eyebrow"><a href="../"${metadata.category === "buttons" ? " data-no-swup" : ""}>${escapeHtml(category)}</a><span>/</span>Motion reference</p><div class="motion-title-row"><h1>${escapeHtml(metadata.title)}</h1>${statusBadge}</div><p class="motion-description">${escapeHtml(metadata.description)}</p>`;
  page.querySelector("[data-demo-facts]").innerHTML = [
    ["Trigger", metadata.trigger],
    ["Duration", metadata.duration],
    ["Easing", metadata.easing],
  ]
    .map(
      ([label, value]) =>
        `<div><dt>${label}</dt><dd>${escapeHtml(value)}</dd></div>`,
    )
    .join("");
  page.querySelector("[data-demo-notes]").innerHTML =
    `<section><h2>動きの見どころ</h2>${list(metadata.takeaways)}</section><section><h2>使いやすさの視点</h2><p>${escapeHtml(metadata.usability.benefit)}</p><h3>組み込むときの注意</h3><p>${escapeHtml(metadata.usability.caution)}</p><h3>スマホ・キーボード</h3><p>${escapeHtml(metadata.usability.smallScreen)}</p><h3>動きを控える設定</h3><p>${escapeHtml(metadata.usability.reducedMotion)}</p></section><section><h2>実装メモ</h2>${list(metadata.implementation)}<p class="motion-caption">時間・イージングはこのデモの調整値です。参考サイトの内部実装を取得・複製したものではありません。</p></section><section class="motion-reference"><p class="motion-eyebrow">Observed reference</p><h2>${escapeHtml(source.name)}</h2><div class="motion-source-links"><a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">実サイトを見る ↗︎</a><a href="${escapeHtml(source.awardUrl)}" target="_blank" rel="noopener noreferrer">Awwwards / SOTD ↗︎</a>${recordingLink}</div><dl><div><dt>観察方法</dt><dd>${observationMode}</dd></div><div><dt>受賞日</dt><dd>${escapeHtml(source.awardDate)}</dd></div><div><dt>観察日</dt><dd>${escapeHtml(source.observedAt)}</dd></div><div><dt>対象箇所</dt><dd>${escapeHtml(source.location)}</dd></div></dl><p>${escapeHtml(source.observation)}</p><h3>再現範囲と違い</h3>${list(metadata.limitations)}<p class="motion-caption">受賞時と現在のサイトは異なる場合があります。公開画面や公式記録映像をもとに、動きの仕組みを学ぶ独立した実装です。画像・文章・ロゴはオリジナルのプレースホルダーに置き換えています。</p></section><details class="motion-post"><summary>投稿用の短い説明</summary><p>${escapeHtml(metadata.xPost)}</p></details>`;
  const stage = page.querySelector("[data-demo-stage]");
  const motionPreference = matchMedia("(prefers-reduced-motion: reduce)");
  const motionToggle = page.querySelector("[data-motion-toggle]");
  const status = page.querySelector("[data-demo-status]");
  motionToggle.checked = motionPreference.matches;
  let demo;
  let instance;
  function mount() {
    instance?.abort();
    demo?.destroy?.();
    stage
      .getAnimations({ subtree: true })
      .forEach((animation) => animation.cancel());
    stage.replaceChildren();
    instance = new AbortController();
    stage.dataset.reducedMotion = String(motionToggle.checked);
    demo =
      createDemo(stage, {
        signal: instance.signal,
        reducedMotion: motionToggle.checked,
      }) ?? {};
    stage.dataset.demoReady = "true";
    status.textContent = motionToggle.checked
      ? "動きを控えめに表示しています"
      : "操作して動きを確かめてください";
  }
  mount();
  page.querySelector("[data-demo-replay]").addEventListener(
    "click",
    () => {
      if (demo.replay) demo.replay();
      else mount();
      status.textContent = "もう一度再生しました";
    },
    { signal },
  );
  page.querySelector("[data-demo-reset]").addEventListener(
    "click",
    () => {
      if (demo.reset) demo.reset();
      else mount();
      status.textContent = "最初の状態に戻しました";
    },
    { signal },
  );
  motionToggle.addEventListener("change", mount, { signal });
  motionPreference.addEventListener(
    "change",
    (event) => {
      motionToggle.checked = event.matches;
      mount();
    },
    { signal },
  );
  const code = page.querySelector("[data-code-content]");
  const tabs = [...page.querySelectorAll("[data-code-tab]")];
  function selectTab(tab) {
    page.querySelector("[data-copy-code]").textContent = "Copy";
    tabs.forEach((button) => {
      const selected = button === tab;
      button.setAttribute("aria-selected", String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    code.textContent = sources[tab.dataset.codeTab] ?? "";
    page
      .querySelector("[data-code-panel]")
      .setAttribute("aria-labelledby", tab.id);
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => selectTab(tab), { signal });
    tab.addEventListener(
      "keydown",
      (event) => {
        if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key))
          return;
        event.preventDefault();
        const next =
          event.key === "Home"
            ? 0
            : event.key === "End"
              ? tabs.length - 1
              : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) %
                tabs.length;
        selectTab(tabs[next]);
        tabs[next].focus();
      },
      { signal },
    );
  });
  if (tabs[0]) selectTab(tabs[0]);
  page.querySelector("[data-copy-code]").addEventListener(
    "click",
    async (event) => {
      try {
        await navigator.clipboard.writeText(code.textContent);
        event.target.textContent = "コピーしました";
      } catch {
        event.target.textContent = "コードを選択してコピーしてください";
      }
    },
    { signal },
  );
  function destroy() {
    lifecycle.abort();
    instance?.abort();
    demo?.destroy?.();
    stage
      .getAnimations({ subtree: true })
      .forEach((animation) => animation.cancel());
  }
  const restore = (event) => {
    if (event.persisted) location.reload();
  };
  window.addEventListener(
    "site:before-content-replace",
    () => {
      window.removeEventListener("pageshow", restore);
      destroy();
    },
    { once: true, signal },
  );
  window.addEventListener("pagehide", destroy, { once: true, signal });
  // Keep this listener through the initial pageshow, so bfcache restores live controls.
  window.addEventListener("pageshow", restore);
}
