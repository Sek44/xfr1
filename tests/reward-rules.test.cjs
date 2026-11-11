"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.join(__dirname, "..");
function setup(initial = {}) {
  const items = new Map(Object.entries(initial));
  const storage = {
    getItem: (key) => items.has(key) ? items.get(key) : null,
    setItem: (key, value) => items.set(key, value),
  };
  const window = { addEventListener() {}, setInterval() {} };
  const document = { addEventListener() {}, hidden: false };
  const context = vm.createContext({ window, document, localStorage: storage,
    Date, Math });
  for (const filename of ["reward-rules.js", "daily-exercises.js"])
    vm.runInContext(fs.readFileSync(path.join(root, filename), "utf8"), context);
  return { rules: window.RewardRules, daily: window.DailyExercises, storage, items };
}
function outcome(key, successes, total = 10) {
  return Array.from({ length: total }, (_, index) =>
    ({ key, correct: index < successes }));
}
function seed(api, key, answers = 50, days = 3, incorrect = 0) {
  const profile = { total: answers,
    recent: Array.from({ length: Math.min(50, answers) }, (_, i) =>
      i < incorrect ? 0 : 1),
    days: ["2026-11-01", "2026-11-02", "2026-11-03"].slice(0, days) };
  api.items.set(api.rules.KEY, JSON.stringify({
    version: 1, categories: { [key]: profile }, events: [] }));
}
test("difficulty 1 to 10 maps to one to ten minutes", () => {
  const { rules } = setup();
  assert.equal(rules.difficulty("calcul:0-10:1"), 1);
  assert.equal(rules.maxSeconds("calcul:0-10:1"), 60);
  assert.equal(rules.difficulty("monnaie:base"), 10);
  assert.equal(rules.maxSeconds("monnaie:base"), 600);
  assert.equal(rules.difficulty("conjugaison:present-2"), 6);
});
test("new reward credits seconds, keeps old public minutes and never duplicates", () => {
  const { rules, daily } = setup();
  const key = rules.key("monnaie");
  const answers = outcome(key, 9);
  const first = daily.awardResultOnce("monnaie", "session-1", answers);
  assert.equal(first.ok, true);
  assert.equal(first.receipt.seconds, 600);
  assert.equal(daily.read().points, 1);
  assert.equal(daily.read().minutes, 10);
  assert.equal(daily.read().seconds, 600);
  assert.equal(daily.awardResultOnce("monnaie", "session-1", answers).ok, true);
  assert.equal(daily.read().points, 1);
  assert.equal(rules.read().categories[key].total, 10);
});
test("score threshold 9 and mastery 6 reduce credit to 75 percent", () => {
  const api = setup();
  const key = "monnaie:base";
  // Mastery 6: 30 correct among last 50, full experience and three days.
  seed(api, key, 50, 3, 20);
  assert.equal(api.rules.inspect(key).mastery, 6);
  assert.equal(api.rules.forecast(outcome(key, 8)).seconds, 0);
  assert.equal(api.rules.forecast(outcome(key, 9)).seconds, 450);
  assert.equal(api.daily.awardResultOnce("monnaie", "high-note", outcome(key, 9)).receipt.seconds, 450);
  assert.equal(api.daily.awardResultOnce("monnaie", "low-note", outcome(key, 8)).receipt.seconds, 0);
  assert.equal(api.daily.read().minutes, 7);
  assert.equal(api.daily.read().seconds, 450);
});
test("daily attempts count from first answer and are not duplicated on resume", () => {
  const api = setup();
  const key = "monnaie:base";
  seed(api, key, 50, 3, 20);
  for (let i = 0; i < 6; i++)
    assert.equal(api.daily.start("monnaie", "id-" + i, [key]).ok, true);
  assert.equal(api.daily.canStart("monnaie", "id-2", [key]).ok, true);
  assert.equal(api.daily.canStart("monnaie", "id-6", [key]).blocked, true);
  assert.equal(api.daily.start("monnaie", "id-6", [key]).ok, false);
});
test("fully mastered games give no minutes and only one attempt per day", () => {
  const api = setup();
  const key = "monnaie:base";
  seed(api, key);
  assert.equal(api.rules.inspect(key).mastery, 10);
  assert.equal(api.daily.canStart("monnaie", "first", [key]).ok, true);
  assert.equal(api.daily.awardResultOnce("monnaie", "first", outcome(key, 10)).receipt.seconds, 0);
  assert.equal(api.daily.read().points, 1);
  assert.equal(api.daily.canStart("monnaie", "second", [key]).blocked, true);
});
test("mixed sessions preserve separate category mastery and proportional credits", () => {
  const { rules, daily } = setup();
  const answers = [
    ...outcome("francais:c", 5, 5),
    ...outcome("francais:g", 5, 5),
  ];
  const result = daily.awardResultOnce("francais", "mixed", answers);
  assert.equal(result.ok, true);
  assert.equal(result.receipt.parts.length, 2);
  assert.equal(result.receipt.seconds, 150);
  assert.equal(rules.read().categories["francais:c"].total, 5);
  assert.equal(rules.read().categories["francais:g"].total, 5);
});
test("old daily records retain historical minutes until first variable reward", () => {
  const api = setup();
  api.items.set(api.daily.KEY, JSON.stringify({
    version: 1, date: api.daily.today(), points: 2, minutes: 99,
    progress: {}, events: [],
  }));
  assert.equal(api.daily.read().minutes, 6);
  const added = api.daily.awardResultOnce("monnaie", "later", outcome("monnaie:base", 10));
  assert.equal(added.ok, true);
  assert.equal(api.daily.read().seconds, 960);
  assert.equal(api.daily.read().minutes, 16);
});
test("mission packs have adjustable difficulty and keep their progress", () => {
  const { daily } = setup();
  assert.equal(daily.recordProgress("space", 10, 10, "space-1"), 1);
  assert.equal(daily.recordProgress("magic", 20, 20, "magic-1"), 1);
  assert.equal(daily.read().points, 2);
  assert.equal(daily.read().seconds, 180);
  assert.equal(daily.read().minutes, 3);
  assert.equal(daily.recordProgress("magic", 20, 20, "magic-1"), 0);
  assert.equal(daily.read().seconds, 180);
});
test("mission launch cap is separate from packs and survives retries", () => {
  const api = setup();
  const key = "space:base";
  seed(api, key, 50, 3, 20);
  for (let i = 1; i <= 6; i++)
    assert.equal(api.daily.start("space", "mission-" + i, [key]).ok, true);
  assert.equal(api.daily.start("space", "mission-1", [key]).ok, true);
  assert.equal(api.daily.canStart("space", "mission-7", [key]).blocked, true);
  assert.equal(api.daily.recordProgress("space", 10, 10, "pack-1"), 1);
  const summary = api.daily.missionSummary("space", "unused");
  assert.equal(summary.remaining, 0);
  assert.equal(api.daily.read().sessions[key].length, 6);
  assert.equal(api.daily.read().starts[key].length, 1);
});

test("completely mastered missions only allow one launch", () => {
  const api = setup();
  seed(api, "magic:base");
  assert.equal(api.daily.start("magic", "once", ["magic:base"]).ok, true);
  assert.equal(api.daily.canStart("magic", "twice", ["magic:base"]).blocked, true);
  assert.equal(api.daily.recordProgress("magic", 20, 20, "pack"), 1);
  assert.equal(api.daily.read().seconds, 0);
});

test("failed mastery persistence retries without repeating a credited award", () => {
  const api = setup();
  const { storage, daily, rules } = api;
  const setter = storage.setItem;
  storage.setItem = (key, value) => {
    if (key === rules.KEY) throw Error("storage is full");
    setter(key, value);
  };
  const answers = outcome("monnaie:base", 10);
  assert.equal(daily.awardResultOnce("monnaie", "retry", answers).ok, false);
  assert.equal(daily.read().points, 1);
  assert.equal(daily.read().seconds, 180);
  storage.setItem = setter;
  assert.equal(daily.awardResultOnce("monnaie", "retry", answers).ok, true);
  assert.equal(daily.read().points, 1);
  assert.equal(rules.read().categories["monnaie:base"].total, 10);
});
test("broken mastery is never overwritten or rewarded", () => {
  const api = setup({ entrainement_mastery_v1: "{broken" });
  assert.equal(api.daily.awardResultOnce("monnaie", "bad", outcome("monnaie:base", 10)).ok, false);
  assert.equal(api.items.get(api.rules.KEY), "{broken");
  assert.equal(api.daily.read().points, 0);
});


function legacy(records) {
  const json = JSON.stringify(records);
  const api = setup({ exercices_francais_scores: json });
  assert.equal(api.items.get("exercices_francais_scores"), json,
    "old score records must never be rewritten");
  return api;
}
test("initial mastery is seeded from historical French, conjugation, math and money scores", () => {
  const date = "2026-11-04T12:00:00.000Z";
  const api = legacy([
    { tab: "g", score: 9, total: 10, date },
    { tab: "c", score: 7, total: 10, date },
    { tab: "s", score: 10, total: 10, date },
    { tab: "conjugaison", category: "Présent de l’indicatif · 1er groupe",
      score: 8, total: 10, date },
    { tab: "conjugaison", category: "Présent de l’indicatif · 2e groupe",
      score: 9, total: 10, date },
    { tab: "conjugaison", category: "Présent de l’indicatif · être et avoir",
      score: 10, total: 10, date },
    { tab: "math", category: "Additions 100-1000 / niveau 4",
      score: 6, total: 10, date },
    { tab: "monnaie", category: "Monnaie", score: 8, total: 10, date },
  ]);
  const categories = api.rules.read().categories;
  for (const id of ["francais:g", "francais:c", "francais:s",
    "conjugaison:present-1", "conjugaison:present-2",
    "conjugaison:etre-avoir", "calcul:100-1000:4", "monnaie:base"])
    assert.equal(categories[id].total, 10, id);
  assert.equal(categories["francais:g"].recent.reduce((sum, x) => sum + x, 0), 9);
  assert.equal(categories["calcul:100-1000:4"].recent.reduce((sum, x) => sum + x, 0), 6);
  assert.equal(api.rules.read().legacyImport.series, 8);
  assert.equal(api.daily.read().seconds, 0, "no backdated play-time credit");
  assert.equal(api.daily.read().points, 0);
});
test("mixed legacy series distribute ten questions, not ten per category", () => {
  const api = legacy([
    { tab: "all", score: 9, total: 10, date: "2026-11-09T09:00:00Z" },
    { tab: "conjugaison", category: "Tout", score: 8, total: 10,
      date: "2026-11-10T09:00:00Z" },
    { tab: "math", category: "Additions Toutes catégories / niveau 2",
      score: 7, total: 10, date: "2026-11-09T10:00:00Z" },
  ]);
  const p = api.rules.read().categories;
  const french = ["francais:g", "francais:c", "francais:s"];
  const conjugation = ["conjugaison:present-1", "conjugaison:present-2"];
  const math = ["0-10", "10-100", "100-1000", "1000-10000"]
    .map((band) => "calcul:" + band + ":2");
  for (const group of [french, conjugation, math])
    assert.equal(group.reduce((sum, id) => sum + p[id].total, 0), 10);
  assert.equal(p["conjugaison:etre-avoir"], undefined);
  assert.equal(french.reduce((sum, id) =>
    sum + p[id].recent.reduce((n, x) => n + x, 0), 0), 9);
});
test("older mixed French sessions do not create mastery for yet-unreleased s/ss", () => {
  const api = legacy([
    { tab: "all", score: 8, total: 10, date: "2026-11-06T11:00:00Z" },
  ]);
  const p = api.rules.read().categories;
  assert.equal(p["francais:g"].total + p["francais:c"].total, 10);
  assert.equal(p["francais:s"], undefined);
});
test("historical arcade wins use an estimated attempt count, not perfect scores", () => {
  const api = legacy([
    { tab: "space", score: 17, total: 1, mode: "arcade",
      date: "2026-11-04T16:00:00Z" },
    { tab: "magic", score: 34, total: 1, mode: "arcade",
      date: "2026-11-05T16:00:00Z" },
  ]);
  assert.equal(api.rules.read().categories["space:base"].total, 20);
  assert.equal(api.rules.read().categories["magic:base"].total, 40);
  assert.equal(api.rules.read().categories["space:base"].recent.reduce(
    (sum, value) => sum + value, 0), 17);
  assert.equal(api.rules.read().categories["magic:base"].recent.reduce(
    (sum, value) => sum + value, 0), 34);
});
test("import only pre-launch scores and retain unknown-date series conservatively", () => {
  const api = legacy([
    { tab: "g", score: 10, total: 10, date: "2026-11-12T08:00:00Z" },
    { tab: "g", score: 7, total: 10, date: "2026-11-11T11:21:43Z" },
    { tab: "g", score: 9, total: 10, date: "2026-11-04T08:00:00Z" },
    { tab: "c", score: 10, total: 10 },
  ]);
  assert.equal(api.rules.read().categories["francais:g"].total, 10);
  assert.equal(api.rules.read().categories["francais:c"].days.length, 1);
  assert.equal(api.rules.read().legacyImport.series, 2);
});
test("seeded mastery already reflects long-term high historical performance", () => {
  const history = Array.from({ length: 5 }, (_, i) => ({
    tab: "monnaie", score: 10, total: 10,
    date: ["2026-10-20", "2026-10-21", "2026-10-22"][i % 3] + "T10:00:00Z",
  }));
  const api = legacy(history);
  assert.equal(api.rules.inspect("monnaie:base").mastery, 10);
  assert.equal(api.daily.awardResultOnce("monnaie", "new-1",
    outcome("monnaie:base", 10)).receipt.seconds, 0);
  assert.equal(api.daily.canStart("monnaie", "new-2", ["monnaie:base"]).blocked, true);
});
test("existing live mastery stays newer than historical samples and is imported only once", () => {
  const existing = {
    version: 1, categories: {
      "monnaie:base": { total: 5, recent: [1, 1, 1, 1, 1],
        days: ["2026-11-11"] },
    }, events: ["monnaie:live-1"],
  };
  const api = setup({
    entrainement_mastery_v1: JSON.stringify(existing),
    exercices_francais_scores: JSON.stringify([
      { tab: "monnaie", score: 3, total: 10, date: "2026-10-20T10:00:00Z" },
    ]),
  });
  const profile = api.rules.read().categories["monnaie:base"];
  assert.equal(profile.total, 15);
  assert.equal(profile.recent.length, 15);
  assert.equal(profile.recent.slice(-5).join(""), "11111");
  assert.equal(api.rules.read().events[0], "monnaie:live-1");
  assert.equal(api.rules.initializeLegacy(), false);
  assert.equal(api.rules.read().categories["monnaie:base"].total, 15);
});
test("corrupted archives or mastery cannot be overwritten by a migration", () => {
  const malformed = setup({ exercices_francais_scores: "{broken" });
  assert.equal(malformed.rules.read().legacyImport, undefined);
  assert.equal(malformed.items.get("exercices_francais_scores"), "{broken");
  const stored = "{broken";
  const badMastery = setup({
    entrainement_mastery_v1: stored,
    exercices_francais_scores: JSON.stringify([
      { tab: "g", score: 10, total: 10, date: "2026-10-20T10:00:00Z" },
    ]),
  });
  assert.equal(badMastery.items.get("entrainement_mastery_v1"), stored);
  assert.equal(badMastery.rules.read(), null);
});
test("failed legacy migration retries atomically when storage becomes available", () => {
  const api = setup();
  const original = api.storage.setItem;
  const archive = JSON.stringify([
    { tab: "c", score: 8, total: 10, date: "2026-10-20T10:00:00Z" },
  ]);
  api.items.set("exercices_francais_scores", archive);
  api.storage.setItem = (key, value) => {
    if (key === api.rules.KEY) throw Error("storage unavailable");
    original(key, value);
  };
  assert.equal(api.rules.initializeLegacy(), false);
  assert.equal(api.rules.read().categories["francais:c"], undefined);
  api.storage.setItem = original;
  assert.equal(api.rules.initializeLegacy(), true);
  assert.equal(api.rules.initializeLegacy(), false);
  assert.equal(api.rules.read().categories["francais:c"].total, 10);
  assert.equal(api.items.get("exercices_francais_scores"), archive);
});
