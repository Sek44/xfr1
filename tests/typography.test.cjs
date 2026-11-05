const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const typography = read("styles/typography.css");

test("every page loads the official typography tokens before its other styles", () => {
  for (const page of [
    "index",
    "francais",
    "conjugaison",
    "calcul",
    "scores",
    "space",
    "magic",
  ]) {
    const html = read(page + ".html");
    const styles = Array.from(
      html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g),
      (match) => match[1],
    );
    assert.equal(styles[0], "./styles/typography.css?v=1", page);
    assert.equal(styles.filter((s) => s.includes("typography.css")).length, 1, page);
  }
});

test("official typography defines exactly two families, eight sizes, and four weights", () => {
  for (const family of ["--font-ui", "--font-display"]) {
    assert.ok(typography.includes(family + ":"));
  }
  assert.equal((typography.match(/^  --text-(?:xs|sm|md|lg|xl|2xl|3xl|4xl):/gm) || []).length, 8);
  assert.equal((typography.match(/^  --weight-(?:normal|medium|bold|heavy):/gm) || []).length, 4);
  assert.ok(typography.includes("@media (max-width: 520px)"));
  assert.ok(typography.includes("@media (max-width: 360px)"));
});

test("classic navigation, controls, questions and progress share semantic type roles", () => {
  const classic = read("styles/themes/magical-academy/classic.css");
  const home = read("styles/themes/magical-academy/home-v3.css");
  for (const role of ["page-title", "tab", "score-tab", "question", "score-number"]) {
    assert.ok(classic.includes("var(--type-" + role + ")"), role);
  }
  for (const role of ["home-title", "section-title", "stat"]) {
    assert.ok(home.includes("var(--type-" + role + ")"), role);
  }
});
