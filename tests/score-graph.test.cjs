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
    const classes = new Set();
    this.classList = {
      remove: (name) => classes.delete(name),
      add: (name) => classes.add(name),
      contains: (name) => classes.has(name),
    };
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
    setTimeout: () => 1,
    clearTimeout: () => {},
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

test("shaded chart includes all scores and keeps the full history", () => {
  const rows = Array.from({ length: 15 }, (_, i) => ({
    tab: "g",
    score: i % 11,
    total: 10,
    date: "2026-10-" + String(25 - i).padStart(2, "0"),
    extra: { preserve: i },
  }));
  const f = setup(rows), original = f.stored;
  f.render("francais");
  assert.equal(tags(f.chart, "circle").length, 15);
  assert.equal(tags(f.chart, "path").length, 1);
  assert.equal(tags(f.chart, "polyline").length, 1);
  assert.equal(tags(f.chart, "text").some((node) => node.textContent === "25/10"), true);
  assert.equal(tags(f.chart, "svg")[0].attributes.class, "score-chart-mobile-dense");
  assert.equal(f.chart.children[1].tagName, "svg");
  assert.equal(f.chart.children.length, 2); // Title and graph, no explanatory line.
  assert.equal(tags(f.root, "tbody")[0].children.length, 15);
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
  assert.equal(f.chart.children.length, 2); // No explanatory note below the chart.
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

test("a large history plots every valid score without changing saved data", () => {
  const rows = Array.from({ length: 245 }, (_, index) => ({
    tab: "math",
    score: index % 11,
    total: 10,
    date: "2026-10-18",
    extra: { untouched: index },
  }));
  const fixture = setup(rows), original = fixture.stored;
  fixture.render("math");
  const svg = tags(fixture.chart, "svg")[0];
  assert.equal(tags(svg, "circle").length, 0); // Dense curves omit dots.
  assert.equal(svg.attributes.class, "score-chart-mobile-dense");
  assert.equal(svg.attributes.viewBox, "0 0 600 320");
  const line = tags(svg, "polyline")[0];
  assert.equal(line.attributes.points.trim().split(/\s+/).length, 245);
  assert.ok(tags(svg, "text").filter((node) => node.textContent === "18/10").length <= 4);
  assert.equal(tags(fixture.root, "tbody")[0].children.length, 245);
  assert.equal(fixture.chart.children.length, 2);
  assert.equal(fixture.stored, original);
  assert.equal(fixture.writes, 0);
});

test("score history provides styled entries and a mobile-friendly CSS layout", () => {
  const fixture = setup([
    { tab: "math", score: 8, total: 10, date: "2026-10-18" },
    { tab: "magic", score: 42, mode: "arcade", date: "2026-10-17" },
  ]);
  fixture.render("math");
  const exercise = tags(fixture.root, "tbody")[0].children[0];
  assert.equal(exercise.className, "history-entry");
  assert.equal(exercise.children[3].className, "history-score-value");
  assert.equal(exercise.children[3].attributes["data-label"], "Score");
  assert.equal(exercise.children[3].textContent, "8");
  fixture.render("magic");
  const mission = tags(fixture.root, "tbody")[0].children[0];
  assert.match(mission.children[3].className, /history-score-mission/);
  assert.equal(mission.children[3].textContent, "42 points");
  const css = fs.readFileSync(
    path.join(__dirname, "../styles/themes/magical-academy/classic.css"),
    "utf8",
  );
  assert.equal(css.includes(".score-chart-scroll"), false);
  assert.match(css, /\.score-chart-mobile-dense \.score-dot \{/);
  assert.match(css, /#history \.history-table tbody tr \{/);
  assert.match(css, /grid-template-columns: minmax\(0, 1fr\) auto minmax\(72px, auto\)/);
});

test("medium curves keep all points but hide close markers on mobile", () => {
  const records = Array.from({ length: 20 }, (_, index) => ({
    tab: "math",
    score: index % 11,
    total: 10,
    date: "2026-10-18",
  }));
  const f = setup(records);
  f.render("math");
  const svg = tags(f.chart, "svg")[0];
  assert.equal(svg.attributes.viewBox, "0 0 600 320");
  assert.equal(svg.attributes.class, "score-chart-mobile-dense");
  assert.equal(tags(svg, "circle").length, 20);
  assert.equal(tags(svg, "polyline")[0].attributes.points.trim().split(/\s+/).length, 20);
  assert.equal(f.chart.children[1].tagName, "svg");
  assert.equal(f.chart.children.length, 2);
  assert.equal(f.writes, 0);
});

test("short curves retain visible markers and no scroll wrapper", () => {
  const f = setup(Array.from({ length: 10 }, (_, index) => ({
    tab: "math",
    score: index,
    total: 10,
  })));
  f.render("math");
  const svg = tags(f.chart, "svg")[0];
  assert.equal(svg.attributes.class, "score-chart-compact");
  assert.equal(tags(svg, "circle").length, 10);
  assert.equal(svg.attributes.viewBox, "0 0 600 320");
  assert.equal(f.chart.children[1].tagName, "svg");
});

test("history cards use the same background and only highlight while pressed", () => {
  const css = fs.readFileSync(
    path.join(__dirname, "../styles/themes/magical-academy/classic.css"),
    "utf8",
  );
  assert.equal(css.includes("#history .history-table tbody tr:nth-child(even)"), false);
  assert.equal(css.includes("#history .history-table tbody tr:hover"), false);
  assert.ok(
    css.includes("#history .history-table tbody tr.holding td:not(.history-score-value)"),
  );
  assert.ok(css.includes("#history .history-table tbody tr.holding {"));
  assert.ok(css.includes("-webkit-user-select: none;"));

  const f = setup([{ tab: "math", score: 8, total: 10 }]);
  f.render("math");
  const row = tags(f.root, "tbody")[0].children[0];
  const pointer = { button: 0, isPrimary: true, clientX: 50, clientY: 60 };
  for (const end of ["pointerup", "pointercancel", "pointerleave"]) {
    row.listeners.pointerdown(pointer);
    assert.equal(row.classList.contains("holding"), true);
    row.listeners[end]();
    assert.equal(row.classList.contains("holding"), false);
  }
  row.listeners.pointerdown(pointer);
  row.listeners.pointermove({ clientX: 65, clientY: 60 });
  assert.equal(row.classList.contains("holding"), false);
  assert.equal(f.writes, 0);
});
