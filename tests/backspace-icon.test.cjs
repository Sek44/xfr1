const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");

test("Missions load shared SVG backspace styling for numeric pads", () => {
  const keyboardCss = fs.readFileSync(path.join(root, "keyboard.css"), "utf8");
  assert.match(keyboardCss, /\.keypad \.academy-key--erase svg\s*\{/);

  const ui = fs.readFileSync(path.join(root, "game-ui.js"), "utf8");
  assert.equal((ui.match(/button\.innerHTML = BACKSPACE_SVG;/g) || []).length, 2);

  for (const mission of ["space.html", "magic.html"]) {
    const html = fs.readFileSync(path.join(root, mission), "utf8");
    assert.match(html, /href="\.\/keyboard\.css\?v=[^"]+"/);
  }
});
