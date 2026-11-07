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
  const classic = read("styles/themes/magical-academy/components.css");
  const home = read("styles/themes/magical-academy/home.css");
  for (const role of ["page-title", "tab", "score-tab", "question", "score-number"]) {
    assert.ok(classic.includes("var(--type-" + role + ")"), role);
  }
  for (const role of ["home-title", "card-title", "stat"]) {
    assert.ok(home.includes("var(--type-" + role + ")"), role);
  }
});

test("all CSS font size and weight declarations use the shared tokens", () => {
  const cssFiles = (dir) =>
    fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap((entry) => {
      const relative = path.join(dir, entry.name);
      if (entry.isDirectory() && ![".git", "node_modules"].includes(entry.name)) {
        return cssFiles(relative);
      }
      return entry.isFile() && entry.name.endsWith(".css") ? [relative] : [];
    });

  for (const file of cssFiles(".")) {
    const css = read(file);
    if (file.endsWith(path.join("styles", "typography.css"))) continue;
    for (const [, rawValue] of css.matchAll(/\bfont-size\s*:\s*([^;{}]+);/g)) {
      const value = rawValue.trim();
      assert.ok(value === "0" || value.includes("var("), file + ": " + value);
    }
    for (const [, rawValue] of css.matchAll(/\bfont-weight\s*:\s*([^;{}]+);/g)) {
      assert.ok(rawValue.includes("var("), file + ": " + rawValue.trim());
    }
  }
});
