const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const source = fs.readFileSync(path.join(__dirname, "../scores.js"), "utf8");
function setup(initial) {
  let stored = initial,
    writes = 0;
  const context = {
    window: {},
    localStorage: {
      getItem(key) {
        assert.equal(key, "exercices_francais_scores");
        return stored;
      },
      setItem(key, value) {
        assert.equal(key, "exercices_francais_scores");
        stored = value;
        writes++;
      },
    },
  };
  vm.runInNewContext(source, context);
  return {
    scores: context.window.ExerciseScores,
    get stored() {
      return stored;
    },
    get writes() {
      return writes;
    },
  };
}
test("legacy history stays unchanged, including unknown fields and more than 200 entries", () => {
  const old = Array.from({ length: 245 }, (_, i) => ({
    tab: "g",
    score: i % 11,
    total: 10,
    date: "2026-01-01",
    custom: { i },
  }));
  old.push(null, { custom: "keep missing fields" });
  const fixture = setup(JSON.stringify(old));
  fixture.scores.read();
  assert.equal(fixture.writes, 0);
  assert.equal(
    fixture.scores.save({ tab: "space", score: 12, total: 1, mode: "arcade" }),
    true,
  );
  const rows = JSON.parse(fixture.stored);
  assert.deepEqual(rows.slice(1), old);
  assert.match(rows[0].time, /^\d{2}:\d{2}$/);
});
test("missing times use 00:00 and historical ISO timestamps retain their usable time", () => {
  const { scores } = setup("[]");
  assert.equal(scores.time({}), "00:00");
  assert.equal(scores.time({ date: "2026-01-01" }), "00:00");
  assert.equal(scores.time({ time: "99:99" }), "00:00");
  assert.equal(scores.time({ time: "09:05" }), "09:05");
  const date = "2026-01-01T12:34:00Z";
  assert.equal(
    scores.time({ date }),
    new Date(date).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
  );
});
test("unreadable data is never overwritten", () => {
  for (const original of ["{broken", '{"unexpected":"object"}']) {
    const fixture = setup(original);
    assert.equal(fixture.scores.save({ score: 1, total: 10 }), false);
    assert.equal(fixture.stored, original);
    assert.equal(fixture.writes, 0);
  }
});
test("explicit deletion removes exactly the selected legacy row, preserving duplicates and unknown fields", () => {
  const duplicate = {
    tab: "g",
    score: 8,
    total: 10,
    date: "2026-01-01",
    extra: "legacy",
  };
  const old = [
    null,
    duplicate,
    { tab: "math", score: 2, total: 10, extra: { keep: true } },
    duplicate,
    { custom: "keep" },
  ];
  const fixture = setup(JSON.stringify(old)),
    records = fixture.scores.read();
  assert.equal(fixture.scores.remove(records[2]), true);
  const expected = old.slice();
  expected.splice(3, 1);
  assert.deepEqual(JSON.parse(fixture.stored), expected);
  assert.equal(fixture.scores.remove(records[2]), false);
});
test("stale deletion never removes a score added or changed in the meantime", () => {
  const old = [{ tab: "g", score: 4, total: 10 }];
  const fixture = setup(JSON.stringify(old)),
    selected = fixture.scores.read()[0];
  fixture.scores.save({ tab: "space", score: 12, total: 1, mode: "arcade" });
  const before = fixture.stored;
  assert.equal(fixture.scores.remove(selected), false);
  assert.equal(fixture.stored, before);
});

test("new scores carry a separate exercise/mission category without touching the exercise level label", () => {
  const fixture = setup(JSON.stringify([
    { tab: "magic", score: 23, extra: "legacy" },
    { tab: "math", category: "Additions 0-100", score: 7, total: 10 },
  ]));
  const before = JSON.parse(fixture.stored);
  assert.equal(
    fixture.scores.save({
      tab: "math",
      category: "Additions 100-1000",
      score: 12,
      total: 20,
    }),
    true,
  );
  assert.equal(
    fixture.scores.save({
      tab: "space",
      category: "Mission calcul",
      score: 77,
      total: 1,
      mode: "arcade",
    }),
    true,
  );
  const saved = JSON.parse(fixture.stored);
  assert.equal(saved[0].scoreCategory, "mission");
  assert.equal(saved[1].scoreCategory, "exercise");
  assert.equal(saved[0].category, "Mission calcul");
  assert.equal(saved[1].category, "Additions 100-1000");
  assert.deepEqual(saved.slice(2), before);
});

test("French Tout scores remain exercises and are visible in French history", () => {
  const fixture = setup("[]");
  assert.equal(fixture.scores.save({ tab: "all", score: 8, total: 10 }), true);
  assert.equal(JSON.parse(fixture.stored)[0].scoreCategory, "exercise");
  assert.match(source, /record\.tab === "all"\) return "Français · Tout"/);
  assert.match(source, /record\.tab === "s"\) return "Français · s \/ ss"/);
  assert.equal(fixture.scores.save({ tab: "s", score: 9, total: 10 }), true);
  assert.equal(JSON.parse(fixture.stored)[0].scoreCategory, "exercise");
  assert.match(source, /r\.tab === "g" \|\| r\.tab === "c" \|\| r\.tab === "s" \|\| r\.tab === "all"/);
});

test("conjugation score labels use short tab titles for old and new records", () => {
  // Read the production label function without altering its public API.
  const start = source.indexOf("  function label(record) {");
  const end = source.indexOf("  function encourage(", start);
  assert.ok(start >= 0 && end > start);
  const label = vm.runInNewContext(
    source.slice(start, end) + "\nlabel;",
  );
  for (const [category, expected] of [
    ["Présent de l’indicatif · 1er groupe", "Conjugaison · Présent - 1er"],
    ["Présent de l’indicatif · 2e groupe", "Conjugaison · Présent - 2e"],
    ["Présent · 1er groupe", "Conjugaison · Présent - 1er"],
    ["Présent · 2e groupe", "Conjugaison · Présent - 2e"],
    ["Tout", "Conjugaison · Tout"],
  ]) {
    assert.equal(label({ tab: "conjugaison", category }), expected);
  }
  assert.equal(label({ tab: "conjugaison" }), "Conjugaison · Présent - 1er");
});
