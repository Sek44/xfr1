const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : entry.isFile() ? [full] : [];
  });
}
function check(file, reference) {
  if (!reference || /^(?:[a-z][\w+.-]*:|\/\/|\/|#)/i.test(reference)) return;
  const pathname = reference.split(/[?#]/, 1)[0];
  if (!pathname) return;
  const target = path.resolve(path.dirname(file), decodeURIComponent(pathname));
  const relative = path.relative(root, target);
  assert.ok(!relative.startsWith("..") && !path.isAbsolute(relative),
    `${path.relative(root, file)}: path escapes repository: ${reference}`);
  assert.ok(fs.existsSync(target),
    `${path.relative(root, file)}: missing local file ${reference}`);
}
test("all local HTML links, scripts and stylesheets resolve", () => {
  for (const file of fs.readdirSync(root).filter((name) => name.endsWith(".html"))) {
    const source = path.join(root, file);
    const html = fs.readFileSync(source, "utf8");
    for (const [, , reference] of html.matchAll(/\b(?:href|src)=(["\x27])([^"\x27]+)\1/g)) check(source, reference);
  }
});
test("all local CSS assets exist", () => {
  const files = [...fs.readdirSync(root).filter((name) => name.endsWith(".css")).map((name) => path.join(root, name)),
    ...walk(path.join(root, "styles")).filter((file) => file.endsWith(".css"))];
  for (const file of files) {
    const css = fs.readFileSync(file, "utf8");
    for (const [, , reference] of css.matchAll(/url\(\s*(["\x27]?)(.*?)\1\s*\)/g)) check(file, reference);
  }
});

test("legacy stylesheet paths have been removed", () => {
  for (const filename of [
    "home.css", "shared.css", "school-common.css",
    "exercise-theme.css", "exercise-restart.css",
    "scores-theme.css", "score-view.css",
    "exercise-header.css", "scores-base.css",
    "scores-overlay.css",
    "styles/themes/magical-academy/home-v3.css",
    "styles/themes/magical-academy/classic.css",
  ]) assert.equal(fs.existsSync(path.join(root, filename)), false, filename);
});

test("local Markdown documentation links resolve", () => {
  const documents = [
    path.join(root, "AGENTS.md"),
    path.join(root, "README.md"),
    ...walk(path.join(root, "docs")).filter((file) => file.endsWith(".md")),
  ];
  for (const file of documents) {
    const markdown = fs.readFileSync(file, "utf8");
    for (const [, reference] of markdown.matchAll(/!?\[[^\]\n]*\]\(\s*(<[^>]+>|[^\s)]+)(?:\s+["'][^"']*["'])?\s*\)/g)) {
      check(file, reference.startsWith("<") ? reference.slice(1, -1) : reference);
    }
  }
});

test("each page imports each JavaScript and CSS file only once", () => {
  for (const page of fs.readdirSync(root).filter((name) => name.endsWith(".html"))) {
    const html = fs.readFileSync(path.join(root, page), "utf8");
    const imports = [...html.matchAll(/<(?:script|link)\b[^>]*>/g)]
      .map(([tag]) => tag.match(/\b(?:src|href)=(["'])([^"']+)\1/))
      .filter((match) => match && /\.(?:js|css)(?:[?#]|$)/.test(match[2]))
      .map((match) => match[2].split(/[?#]/, 1)[0]);
    assert.equal(new Set(imports).size, imports.length,
      page + ": duplicate script or stylesheet import");
  }
});

test("classic pages load navigation and score styles only from the active theme", () => {
  for (const page of ["index", "francais", "conjugaison", "calcul", "scores"]) {
    const html = fs.readFileSync(path.join(root, page + ".html"), "utf8");
    assert.doesNotMatch(html, /(?:exercise-header|scores-base)\.css/);
    assert.match(html, /magical-academy\/components\.css/);
  }
  const components = fs.readFileSync(path.join(root, "styles/themes/magical-academy/components.css"), "utf8");
  const scores = fs.readFileSync(path.join(root, "styles/themes/magical-academy/scores.css"), "utf8");
  assert.match(components, /\.academy-banner \.nav-icon\.academy-nav-button/);
  assert.match(scores, /\.history-panel :is\(h2, h3\)/);
  assert.match(scores, /letter-spacing: -\.02em/);
});

test("score-only CSS stays in Scores, and the shared scores iframe retains its styling", () => {
  const shared = fs.readFileSync(path.join(root, "shared-components.css"), "utf8");
  const confirmation = fs.readFileSync(path.join(root, "app-confirm.css"), "utf8");
  const scores = fs.readFileSync(path.join(root, "styles/themes/magical-academy/scores.css"), "utf8");
  const overlay = shared.match(/\.scores-view\s*\{([^}]+)\}/);
  assert.ok(overlay, "shared scores overlay style should exist");
  for (const rule of ["position: fixed", "inset: 0", "z-index: 1000"]) {
    assert.ok(overlay[1].includes(rule), "missing scores overlay rule: " + rule);
  }
  for (const selector of [".history-table", ".history-scroll", ".score-evolution"]) {
    assert.equal(shared.includes(selector), false, selector + " is score-only");
    assert.ok(scores.includes(selector), selector + " belongs to scores.css");
  }
  for (const selector of [".history-hint", ".history-error", ".history-table tbody tr.holding"]) {
    assert.equal(confirmation.includes(selector), false, selector + " is not a dialog rule");
    assert.ok(scores.includes(selector), selector + " belongs to scores.css");
  }
  for (const page of ["francais", "conjugaison", "calcul", "magic", "space"]) {
    assert.equal(fs.readFileSync(path.join(root, page + ".html"), "utf8").includes("scores-overlay.css"), false, page);
  }
});
