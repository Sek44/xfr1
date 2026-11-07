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
    "styles/themes/magical-academy/home-v3.css",
    "styles/themes/magical-academy/classic.css",
  ]) assert.equal(fs.existsSync(path.join(root, filename)), false, filename);
});
