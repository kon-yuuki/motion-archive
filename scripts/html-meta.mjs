const SITE_ORIGIN = "https://motion-archive-mu.vercel.app";
const DEMO_ORIGIN = "https://motion-demos-psi.vercel.app";
const DEFAULT_DESCRIPTION =
  "Webモーション実験とUIパーツを集めたMotion & UIの公開アーカイブ。";

function escapeAttribute(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function readTagContent(html, pattern, fallback) {
  return html.match(pattern)?.[1]?.trim() || fallback;
}

export function pageKeyFromPath(pagePath) {
  const parts = pagePath
    .split("/")
    .filter((part) => part && part !== "index.html");

  if (parts[0] === ".share-build") {
    if (parts[1] === "ui-gallery") {
      return parts[2] ? `ui-gallery-${parts[2]}` : "ui-gallery";
    }
    return parts[1] || "index";
  }
  if (parts[0] === "works") {
    return parts[1] || "works";
  }
  if (parts[0] === "ui-gallery") {
    return parts[1] ? `ui-gallery-${parts[1]}` : "ui-gallery";
  }
  return parts[0] || "index";
}

export function canonicalPathFromPagePath(pagePath, share = false) {
  const parts = pagePath
    .split("/")
    .filter((part) => part && part !== "index.html");
  if (share) {
    const shareParts = parts[0] === ".share-build" ? parts.slice(1) : parts;
    return `/${shareParts.join("/")}/`;
  }
  return parts.length ? `/${parts.join("/")}/` : "/";
}

export function injectSocialMeta(html, { pagePath = "/", share = false } = {}) {
  const title = readTagContent(html, /<title>([\s\S]*?)<\/title>/i, "Motion & UI")
    .replaceAll("&amp;", "&");
  const description = readTagContent(
    html,
    /<meta\s+name="description"\s+content="([^"]*)"\s*\/?>/i,
    DEFAULT_DESCRIPTION
  );
  const origin = share ? DEMO_ORIGIN : SITE_ORIGIN;
  const canonicalPath = canonicalPathFromPagePath(pagePath, share);
  const canonical = `${origin}${canonicalPath}`;
  const image = `${origin}/og/${pageKeyFromPath(pagePath)}.png`;

  const tags = [
    `<link rel="canonical" href="${canonical}" />`,
    '<meta property="og:type" content="website" />',
    '<meta property="og:site_name" content="Motion &amp; UI" />',
    `<meta property="og:title" content="${escapeAttribute(title)}" />`,
    `<meta property="og:description" content="${escapeAttribute(description)}" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `<meta property="og:image" content="${image}" />`,
    '<meta property="og:image:width" content="1200" />',
    '<meta property="og:image:height" content="630" />',
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${escapeAttribute(title)}" />`,
    `<meta name="twitter:description" content="${escapeAttribute(description)}" />`,
    `<meta name="twitter:image" content="${image}" />`
  ].join("\n");

  return html.replace("</head>", `${tags}\n</head>`);
}

export function injectSkipLink(html) {
  const withMainTarget = html.replace(
    /<main(?![^>]*\sid=)([^>]*)>/i,
    '<main id="main-content"$1>'
  );
  return withMainTarget.replace(
    /<body([^>]*)>/i,
    '<body$1>\n<a class="skip-link" href="#main-content">本文へ移動</a>'
  );
}
