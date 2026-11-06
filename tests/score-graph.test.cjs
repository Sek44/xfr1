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
  const root = new Element("div"),
    chart = new Element("section");
  return {
    root,
    chart,
    render: (game) => context.window.ExerciseScores.render(root, game, chart),
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
test("separate graphs precede the table, filter records and plot oldest first without writing storage", () => {
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
    assert.equal(f.chart.children[0].textContent, "Évolution du score");
    assert.ok(
      f.root.children.some((node) => node.className === "history-scroll"),
    );
    const svg = tags(f.chart, "svg");
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
  assert.equal(tags(f.chart, "svg").length, 1);
  assert.equal(tags(f.chart, "circle").length, 3);
});
test("score history shows points without denominators, preserving saved totals", () => {
  const records = [
    { tab: "g", score: 7, total: 10, date: "2026-10-18" },
    { tab: "math", score: 3, total: 20, date: "2026-10-17" },
    { tab: "space", score: 40, mode: "arcade", date: "2026-10-16" },
    { tab: "g", score: null, date: "2026-10-15" },
  ];
  const f = setup(records);
  const original = f.stored;
  f.render(null);
  const body = tags(f.root, "tbody")[0];
  assert.deepEqual(
    body.children.map((row) => row.children[3].textContent),
    ["7", "3", "—"],
  );
  assert.equal(f.stored, original);
  assert.equal(f.writes, 0);
});

test("missing legacy scores create gaps, placeholders, and never invented zeroes", () => {
  const f = setup([
    { tab: "math", score: 9 },
    { tab: "math", score: null, custom: "keep" },
    { tab: "math", score: 0 },
  ]);
  f.render("math");
  assert.equal(tags(f.chart, "circle").length, 2);
  assert.equal(tags(f.chart, "polyline").length, 0);
  assert.equal(tags(f.chart, "path").length, 0);
  assert.match(tags(f.chart, "circle")[0].children[0].textContent, /00:00/);
  assert.equal(f.writes, 0);
});
test("empty filtered and combined histories both show a separate empty-state chart", () => {
  const f = setup([]);
  for (const game of ["space", null]) {
    f.render(game);
    assert.equal(f.chart.children[0].textContent, "Évolution du score");
    assert.equal(tags(f.chart, "svg").length, 0);
    assert.match(f.chart.children[1].textContent, /Pas encore de score/);
  }
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
  assert.equal(tags(f.chart, "circle").length, 1);
  assert.match(
    tags(f.chart, "circle")[0].children[0].textContent,
    / · 3 points$/,
  );
  assert.deepEqual(JSON.parse(f.stored), [
    { tab: "space", score: 22, custom: "preserve" },
    { tab: "math", score: 3, total: 10 },
  ]);
  assert.equal(f.writes, 1);
});

test("shaded chart uses dates, keeps the last twelve points and does not truncate history", () => {
  const rows = Array.from({ length: 15 }, (_, i) => ({
    tab: "g",
    score: i % 11,
    total: 10,
    date: "2026-10-" + String(25 - i).padStart(2, "0"),
    extra: { preserve: i },
  }));
  const f = setup(rows), original = f.stored;
  f.render("francais");
  assert.equal(tags(f.chart, "circle").length, 12);
  assert.equal(tags(f.chart, "path").length, 1);
  assert.equal(tags(f.chart, "polyline").length, 1);
  assert.equal(tags(f.chart, "text").some((node) => node.textContent === "14/10"), true);
  assert.equal(tags(f.root, "tbody")[0].children.length, 15);
  assert.match(f.chart.children.at(-1).textContent, /12 dernières parties/);
  assert.equal(f.stored, original);
  assert.equal(f.writes, 0);
});

test("scores page renders the graph frame before the complete list", () => {
  const html = fs.readFileSync(path.join(__dirname, "../scores.html"), "utf8");
  assert.ok(html.indexOf('id="score-chart"') < html.indexOf('id="history"'));
  assert.match(html, /document\.getElementById\("score-chart"\)/);
});

test("Tous uses exercise scores normalized to ten and excludes missions from both panels", () => {
  const rows = [
    { tab: "space", score: 500, mode: "arcade", date: "2026-11-06" },
    { tab: "math", score: 15, total: 20, date: "2026-11-05", category: "Additions" },
    { tab: "magic", score: 240, mode: "arcade", date: "2026-11-04" },
    { tab: "g", score: 4, total: 5, date: "2026-11-03" },
    { tab: "conjugaison", score: 9, total: 10, date: "2026-11-02" },
  ];
  const f = setup(rows), original = f.stored;
  f.render(null);
  assert.equal(f.root.children[0].textContent, "Tous mes exercices");
  const body = tags(f.root, "tbody")[0];
  assert.equal(body.children.length, 3);
  assert.deepEqual(
    body.children.map((row) => row.children[3].textContent),
    ["15", "4", "9"],
  );
  const dots = tags(f.chart, "circle");
  assert.equal(dots.length, 3);
  assert.deepEqual(
    dots.map((dot) =>
      Number(
        dot.children[0].textContent
          .split(" · ")
          .at(-1)
          .split(" / 10")[0]
          .replace(",", "."),
      ),
    ),
    [9, 8, 7.5],
  );
  const svg = tags(f.chart, "svg")[0];
  assert.equal(
    tags(svg, "text").filter((node) => node.textContent === "10").length,
    1,
  );
  assert.ok(tags(svg, "linearGradient").length === 1);
  assert.equal(tags(svg, "stop").length, 3);
  assert.equal(tags(svg, "stop")[0].attributes["stop-opacity"], "0.76");
  assert.equal(f.stored, original);
  assert.equal(f.writes, 0);
  f.render("space");
  assert.equal(tags(f.chart, "circle").length, 1);
  assert.equal(tags(f.chart, "text").some((node) => node.textContent === "500"), true);
  assert.equal(tags(f.root, "tbody")[0].children.length, 1);
  f.render("magic");
  assert.equal(tags(f.chart, "text").some((node) => node.textContent === "240"), true);
});

test("unknown exercise totals create gaps in Tous but preserve raw scores in their tabs", () => {
  const f = setup([
    { tab: "math", score: 5, total: 10 },
    { tab: "g", score: 3 },
    { tab: "g", score: 6, total: 10 },
  ]);
  f.render(null);
  assert.equal(tags(f.root, "tbody")[0].children.length, 3);
  assert.equal(tags(f.chart, "circle").length, 2);
  assert.equal(tags(f.chart, "polyline").length, 0);
  assert.equal(tags(f.chart, "path").length, 0);
  assert.match(f.chart.children.at(-2).textContent, /sans score ou total valide/);
  f.render("francais");
  assert.equal(tags(f.chart, "circle").length, 2);
  assert.equal(f.writes, 0);
});

test("stored score category distinguishes future mission types without rewriting history", () => {
  const f = setup([
    { tab: "future-mission", score: 900, scoreCategory: "mission" },
    { tab: "math", score: 9, total: 10, custom: "unchanged" },
  ]);
  const original = f.stored;
  f.render(null);
  assert.equal(tags(f.root, "tbody")[0].children.length, 1);
  assert.equal(tags(f.chart, "circle").length, 1);
  assert.equal(f.stored, original);
});

test("score tabs are visually separated by category without visible section headings", () => {
  const html = fs.readFileSync(path.join(__dirname, "../scores.html"), "utf8");
  assert.equal((html.match(/class="score-tab-group"/g) || []).length, 2);
  assert.equal(html.includes('class="score-tab-group-label"'), false);
  assert.ok(html.includes('class="score-tab-group" aria-label="Exercices"'));
  assert.ok(html.includes('class="score-tab-group" aria-label="Missions"'));
});
