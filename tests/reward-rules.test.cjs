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
test("difficulty 1 to 10 maps to one to three minutes", () => {
  const { rules } = setup();
  assert.equal(rules.difficulty("calcul:0-10:1"), 1);
  assert.equal(rules.maxSeconds("calcul:0-10:1"), 60);
  assert.equal(rules.difficulty("monnaie:base"), 10);
  assert.equal(rules.maxSeconds("monnaie:base"), 180);
  assert.equal(rules.difficulty("conjugaison:present-2"), 6);
});
test("new reward credits seconds, keeps old public minutes and never duplicates", () => {
  const { rules, daily } = setup();
  const key = rules.key("monnaie");
  const answers = outcome(key, 9);
  const first = daily.awardResultOnce("monnaie", "session-1", answers);
  assert.equal(first.ok, true);
  assert.equal(first.receipt.seconds, 180);
  assert.equal(daily.read().points, 1);
  assert.equal(daily.read().minutes, 3);
  assert.equal(daily.read().seconds, 180);
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
  assert.equal(api.rules.forecast(outcome(key, 9)).seconds, 135);
  assert.equal(api.daily.awardResultOnce("monnaie", "high-note", outcome(key, 9)).receipt.seconds, 135);
  assert.equal(api.daily.awardResultOnce("monnaie", "low-note", outcome(key, 8)).receipt.seconds, 0);
  assert.equal(api.daily.read().minutes, 2);
  assert.equal(api.daily.read().seconds, 135);
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
  assert.equal(result.receipt.seconds, 90);
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
  assert.equal(api.daily.read().seconds, 540);
  assert.equal(api.daily.read().minutes, 9);
});
test("mission packs have adjustable difficulty and keep their progress", () => {
  const { daily } = setup();
  assert.equal(daily.recordProgress("space", 10, 10, "space-1"), 1);
  assert.equal(daily.recordProgress("magic", 20, 20, "magic-1"), 1);
  assert.equal(daily.read().points, 2);
  assert.equal(daily.read().seconds, 135);
  assert.equal(daily.read().minutes, 2);
  assert.equal(daily.recordProgress("magic", 20, 20, "magic-1"), 0);
  assert.equal(daily.read().seconds, 135);
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
