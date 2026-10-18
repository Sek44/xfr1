const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
class Element {
  constructor(tag) {
    this.tagName = tag;
    this.children = [];
    this.attributes = {};
    this.listeners = {};
    this.classList = { remove() {}, add() {} };
  }
  append(...children) {
    this.children.push(...children);
  }
  replaceChildren() {
    this.children = [];
  }
  setAttribute(key, value) {
    this.attributes[key] = value;
  }
  addEventListener(type, handler) {
    this.listeners[type] = handler;
  }
}
function setup(records) {
  let stored = JSON.stringify(records),
    writes = 0;
  const context = {
    window: {},
    document: {
      createElement: (tag) => new Element(tag),
      createElementNS: (_, tag) => new Element(tag),
    },
    localStorage: {
      getItem: () => stored,
      setItem: (_, value) => {
        writes++;
        stored = value;
      },
    },
    AppConfirm: { ask: async () => true },
  };
  vm.runInNewContext(
    fs.readFileSync(path.join(__dirname, "../scores.js"), "utf8"),
    context,
  );
  const root = new Element("div");
  return {
    root,
    render: (game) => context.window.ExerciseScores.render(root, game),
    get stored() {
      return stored;
    },
    get writes() {
      return writes;
    },
  };
}
function find(root, predicate) {
  return root.children.flatMap((child) => [
    ...(predicate(child) ? [child] : []),
    ...find(child, predicate),
  ]);
}
const tags = (root, tag) => find(root, (node) => node.tagName === tag);
test("per-game graphs follow the table, filter records and plot oldest first without writing storage", () => {
  const rows = [
    {
      tab: "math",
      score: 9,
      total: 10,
      date: "2026-10-18",
      extra: { keep: true },
    },
    { tab: "space", score: 40, mode: "arcade" },
    { tab: "g", score: 7, total: 10 },
    { tab: "math", score: 3, total: 10, date: "2026-01-01" },
  ];
  const f = setup(rows),
    before = f.stored;
  for (const [game, expected] of [
    ["math", [3, 9]],
    ["space", [40]],
    ["francais", [7]],
  ]) {
    f.render(game);
    assert.equal(f.root.children.at(-1).className, "score-evolution");
    assert.ok(
      f.root.children.some((node) => node.className === "history-scroll"),
    );
    const svg = tags(f.root, "svg");
    assert.equal(svg.length, 1);
    const dots = tags(svg[0], "circle");
    assert.equal(dots.length, expected.length);
    dots.forEach((dot, index) =>
      assert.match(
        dot.children[0].textContent,
        new RegExp(" · " + expected[index] + " points$"),
      ),
    );
    assert.ok(
      dots.every(
        (dot) =>
          Number.isFinite(Number(dot.attributes.cx)) &&
          Number.isFinite(Number(dot.attributes.cy)),
      ),
    );
  }
  assert.equal(f.stored, before);
  assert.equal(f.writes, 0);
  f.render(null);
  assert.equal(tags(f.root, "svg").length, 0);
});
test("missing legacy scores create gaps, placeholders, and never invented zeroes", () => {
  const f = setup([
    { tab: "math", score: 9 },
    { tab: "math", score: null, custom: "keep" },
    { tab: "math", score: 0 },
  ]);
  f.render("math");
  assert.equal(tags(f.root, "circle").length, 2);
  assert.equal(tags(f.root, "polyline").length, 0);
  assert.match(tags(f.root, "circle")[0].children[0].textContent, /00:00/);
  assert.equal(f.writes, 0);
});
test("empty game history has an empty-state graph; combined history never has a graph", () => {
  const f = setup([]);
  f.render("space");
  assert.equal(f.root.children.at(-1).className, "score-evolution");
  assert.equal(tags(f.root, "svg").length, 0);
  f.render(null);
  assert.ok(
    !f.root.children.some((node) => node.className === "score-evolution"),
  );
});
test("confirmed score deletion refreshes the graph and preserves other game records", async () => {
  const f = setup([
    { tab: "math", score: 9, total: 10 },
    { tab: "space", score: 22, custom: "preserve" },
    { tab: "math", score: 3, total: 10 },
  ]);
  f.render("math");
  await tags(f.root, "tbody")[0].children[0].listeners.keydown({
    key: "Delete",
    preventDefault() {},
  });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(tags(f.root, "circle").length, 1);
  assert.match(
    tags(f.root, "circle")[0].children[0].textContent,
    / · 3 points$/,
  );
  assert.deepEqual(JSON.parse(f.stored), [
    { tab: "space", score: 22, custom: "preserve" },
    { tab: "math", score: 3, total: 10 },
  ]);
  assert.equal(f.writes, 1);
});
