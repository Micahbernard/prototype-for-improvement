/**
 * One-off generator: inner HTML → Astro pages (run from esoterica-astro/).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(__dirname, "..", "..");
const pagesDir = path.resolve(__dirname, "..", "src", "pages");

const chrome = `  <div slot="chrome">
  <div class="cursor-dot"></div>
  <canvas id="starfield"></canvas>
  <div class="orb orb-1"></div>
  <div class="orb orb-2"></div>
  </div>
`;

function extractStyle(html) {
  const m = html.match(/<style>([\s\S]*?)<\/style>/);
  return m ? m[1] : "";
}

function extractTarotCss(css) {
  const a = css.indexOf("/* ===== HERO (inner .sub-hero-cosmos in styles.css) ===== */");
  const b = css.indexOf("/* ===== FOOTER ===== */");
  const c = css.indexOf("/* ===== FOCUS STATES (a11y) ===== */");
  if (a === -1 || b === -1 || c === -1) throw new Error("tarot css markers missing");
  return `${css.slice(a, b).trim()}\n\n${css.slice(c).trim()}`;
}

function extractClassesCss(css) {
  const a = css.indexOf("/* ===== HERO (outer shell; inner .sub-hero-cosmos in styles.css) ===== */");
  const b = css.indexOf("/* ===== FOOTER ===== */");
  const mobile = css.indexOf("/* ===== MOBILE ===== */");
  if (a === -1 || b === -1 || mobile === -1) {
    throw new Error("classes css markers missing");
  }
  return `${css.slice(a, b).trim()}\n\n${css.slice(mobile).trim()}`;
}

function extractLegalCss(css) {
  const a = css.indexOf("/* ===== HERO (outer shell; inner .sub-hero-cosmos in styles.css) ===== */");
  const b = css.indexOf("/* ===== FOOTER ===== */");
  if (a === -1 || b === -1) return "";
  return css.slice(a, b).trim();
}

function extractMainHtml(html, endMarker) {
  const start = html.indexOf("<!-- ===== HERO ===== -->");
  if (start === -1) throw new Error("HERO marker missing");
  const end = html.indexOf(endMarker);
  if (end === -1) throw new Error(`end marker missing: ${endMarker}`);
  return html.slice(start, end).trim();
}

function extractScript(html) {
  const pageClose = html.indexOf("</div><!-- /page -->");
  if (pageClose === -1) throw new Error("/page marker missing");
  const s = html.indexOf("<script>", pageClose);
  const e = html.lastIndexOf("</script>");
  if (s === -1 || e === -1) throw new Error("script missing");
  return html.slice(s + "<script>".length, e).trim();
}

function rewriteUrls(fragment) {
  return fragment
    .replace(/href="index\.html#shop"/g, 'href="/#shop"')
    .replace(/href="index\.html"/g, 'href="/"')
    .replace(/href="tarot-readings\.html"/g, 'href="/tarot-readings"')
    .replace(/href="classes\.html"/g, 'href="/classes"')
    .replace(/href="contact\.html"/g, 'href="/contact"')
    .replace(/href="privacy\.html"/g, 'href="/privacy"')
    .replace(/href="terms\.html"/g, 'href="/terms"')
    .replace(/src="logo\.png"/g, 'src="/logo.png"');
}

function wrapPage({ title, description, css, mainHtml, script }) {
  const esc = (s) => s.replace(/<\/script>/gi, "<\\/script>");
  const lines = [
    "---",
    "import Layout from '../layouts/Layout.astro';",
    "",
    `const pageTitle = ${JSON.stringify(title)};`,
    `const pageDescription = ${JSON.stringify(description)};`,
    "---",
    "",
  ];
  if (css && css.trim()) {
    lines.push("<style is:global>", css, "</style>", "");
  }
  lines.push("<Layout title={pageTitle} description={pageDescription}>");
  lines.push(chrome);
  lines.push(rewriteUrls(mainHtml));
  lines.push("  <script is:inline slot=\"scripts\">");
  lines.push(esc(script));
  lines.push("  </script>");
  lines.push("</Layout>");
  lines.push("");
  return lines.join("\n");
}

const tarotHtml = fs.readFileSync(path.join(siteRoot, "tarot-readings.html"), "utf8");
const tarotCss = extractTarotCss(extractStyle(tarotHtml));
const tarotMain = extractMainHtml(tarotHtml, "<!-- ===== FOOTER ===== -->");
const tarotScript = extractScript(tarotHtml);
fs.writeFileSync(
  path.join(pagesDir, "tarot-readings.astro"),
  wrapPage({
    title: "Tarot Readings — Esoterica",
    description:
      "Intuitive tarot readings channeled through the mystic arts. Discover clarity, guidance, and cosmic insight.",
    css: tarotCss,
    mainHtml: tarotMain,
    script: tarotScript,
  }),
  "utf8"
);

const classesHtml = fs.readFileSync(path.join(siteRoot, "classes.html"), "utf8");
const classesCss = extractClassesCss(extractStyle(classesHtml));
const classesMain = extractMainHtml(classesHtml, "<!-- ===== FOOTER ===== -->");
const classesScript = extractScript(classesHtml);
fs.writeFileSync(
  path.join(pagesDir, "classes.astro"),
  wrapPage({
    title: "Classes & Workshops — Esoterica",
    description:
      "Immersive esoteric classes and workshops. Learn crystal healing, tarot, sacred geometry, and alchemical arts with Esoterica.",
    css: classesCss,
    mainHtml: classesMain,
    script: classesScript,
  }),
  "utf8"
);

for (const { file, title, description } of [
  { file: "contact.html", title: "Contact — Esoterica", description: "Contact — Esoterica." },
  { file: "privacy.html", title: "Privacy Policy — Esoterica", description: "Privacy Policy — Esoterica." },
  { file: "terms.html", title: "Terms of Use — Esoterica", description: "Terms of Use — Esoterica." },
]) {
  const html = fs.readFileSync(path.join(siteRoot, file), "utf8");
  const css = extractLegalCss(extractStyle(html));
  const main = extractMainHtml(html, "<footer>");
  const script = extractScript(html);
  const base = file.replace(".html", "");
  fs.writeFileSync(
    path.join(pagesDir, `${base}.astro`),
    wrapPage({
      title,
      description,
      css,
      mainHtml: main,
      script,
    }),
    "utf8"
  );
}

console.log("OK: tarot-readings, classes, contact, privacy, terms");
