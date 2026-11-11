"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.join(__dirname, "..");
function setup(initial = {}) {
  const map = new Map(Object.entries(initial));
  const localStorage = {
    getItem: (key) => map.has(key) ? map.get(key) : null,
    setItem: (key, value) => map.set(key, value),
  };
  const window = { addEventListener() {}, setInterval() {} };
  const document = { addEventListener() {}, hidden: false };
  const context = vm.createContext({ window, localStorage, document, Date, Math });
  for (const file of ["reward-rules.js", "daily-exercises.js"])
    vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context);
  return { map, window, rules: window.RewardRules, daily: window.DailyExercises };
}
const part = (key, mastery = 0, score = 10, total = 10) =>
  ({ key, mastery, score, total });
function ledger(date, receipts, events = Object.keys(receipts), seconds) {
  const earned = seconds ?? Object.values(receipts).reduce((n, r) => n + r.seconds, 0);
  return { version: 1, date, points: events.length,
    minutes: Math.floor(earned / 60), seconds: earned,
    progress: {}, events, starts: {}, sessions: {}, receipts };
}
test("reprices today's verified receipts just once using the original mastery", () => {
  const api = setup();
  const { daily } = api;
  api.map.set(daily.KEY, JSON.stringify(ledger(daily.today(), {
    "monnaie:one": { seconds: 180, parts: [part("monnaie:base")] },
    "francais:two": { seconds: 90, parts: [part("francais:g")] },
  })));
  const result = daily.read();
  assert.equal(result.points, 2);
  assert.equal(result.seconds, 780);
  assert.equal(result.minutes, 13);
  assert.equal(result.rewardScaleVersion, 2);
  assert.equal(result.receipts["monnaie:one"].seconds, 600);
  assert.equal(daily.read().seconds, 780);
});
test("preserves an older untracked grant, mastery discount and blocked rewards", () => {
  const api = setup();
  const { daily } = api;
  api.map.set(daily.KEY, JSON.stringify(ledger(daily.today(), {
    "monnaie:mastery": { seconds: 60, parts: [part("monnaie:base", 8)] },
    "monnaie:blocked": { seconds: 0, parts: [part("monnaie:base")], eligible: false },
  }, ["monnaie:mastery", "monnaie:blocked"], 240)));
  const result = daily.read();
  assert.equal(result.seconds, 390);
  assert.equal(result.receipts["monnaie:mastery"].seconds, 210);
  assert.equal(result.receipts["monnaie:blocked"].seconds, 0);
});
test("the shared hourly ceiling still applies after revaluation", () => {
  const api = setup();
  const receipts = {};
  for (let i = 0; i < 20; i++)
    receipts["monnaie:" + i] = { seconds: 180, parts: [part("monnaie:base")] };
  api.map.set(api.daily.KEY, JSON.stringify(ledger(api.daily.today(), receipts)));
  assert.equal(api.daily.read().seconds, 3600);
  assert.equal(Object.values(api.daily.read().receipts)
    .reduce((sum, r) => sum + r.seconds, 0), 3600);
});
test("converts old fixed-credit scores only with a recorded daily grant", () => {
  const archive = JSON.stringify([
    { tab: "monnaie", score: 10, total: 10, resultId: "paid", date: new Date().toISOString() },
    { tab: "monnaie", score: 10, total: 10, resultId: "unpaid", date: new Date().toISOString() },
  ]);
  const api = setup({ exercices_francais_scores: archive });
  const { daily, map } = api;
  map.set(daily.KEY, JSON.stringify({ version: 1, date: daily.today(), points: 1,
    minutes: 3, progress: {}, events: ["monnaie:paid"], receipts: {} }));
  const result = daily.read();
  assert.equal(result.points, 1);
  assert.equal(result.seconds, 600);
  assert.equal(result.receipts["monnaie:paid"].seconds, 600);
  assert.equal(result.receipts["monnaie:unpaid"], undefined);
  assert.equal(map.get("exercices_francais_scores"), archive);
  assert.equal(daily.read().seconds, 600);
});
test("cannot erase a daily ledger if today's score archive is unreadable", () => {
  const api = setup({ exercices_francais_scores: "{bad" });
  const old = JSON.stringify(ledger(api.daily.today(), {
    "monnaie:one": { seconds: 180, parts: [part("monnaie:base")] },
  }));
  api.map.set(api.daily.KEY, old);
  assert.equal(api.daily.read(), null);
  assert.equal(api.map.get(api.daily.KEY), old);
});
