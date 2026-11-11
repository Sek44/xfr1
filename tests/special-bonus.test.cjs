"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
function fixture(day = "2026-11-11", initial = {}) {
  const timestamp = new Date(day + "T12:00:00").getTime();
  class FixedDate extends Date {
    constructor(...args) {
      super(...(args.length ? args : [timestamp]));
    }
    static now() { return timestamp; }
  }
  const map = new Map(Object.entries(initial));
  const storage = {
    getItem: (key) => map.has(key) ? map.get(key) : null,
    setItem: (key, value) => map.set(key, value),
  };
  const window = { addEventListener() {}, setInterval() {} };
  const document = { addEventListener() {}, hidden: false };
  const context = vm.createContext({
    window, document, localStorage: storage, Date: FixedDate, Math,
  });
  for (const file of ["reward-rules.js", "daily-exercises.js"]) {
    vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context);
  }
  return { daily: window.DailyExercises, rules: window.RewardRules, map, storage };
}
const correct = (key, n = 10) =>
  Array.from({ length: n }, () => ({ key, correct: true }));

test("November 11 grant adds precisely 5 minutes without adding an exercise", () => {
  const { daily, map } = fixture();
  assert.equal(daily.read().seconds, 0);
  assert.equal(daily.grantSpecialBonus(), true);
  const state = daily.read();
  assert.equal(state.points, 0);
  assert.equal(state.seconds, 300);
  assert.equal(state.minutes, 5);
  assert.equal(state.bonusSeconds, 300);
  assert.deepEqual(Array.from(state.events), ["bonus:2026-11-11:5min"]);
  assert.equal(daily.grantSpecialBonus(), true);
  assert.equal(daily.read().seconds, 300);
  assert.equal(JSON.parse(map.get(daily.KEY)).seconds, 300);
});

test("existing exercise credits and history survive the bonus", () => {
  const { daily, map } = fixture();
  const state = daily.read();
  state.seconds = 135;
  state.minutes = 2;
  state.points = 1;
  state.events.push("francais:already-saved");
  map.set(daily.KEY, JSON.stringify(state));
  assert.equal(daily.grantSpecialBonus(), true);
  const result = daily.read();
  assert.equal(result.seconds, 435);
  assert.equal(result.minutes, 7);
  assert.equal(result.points, 1);
  assert.equal(result.events.includes("francais:already-saved"), true);
});

test("bonus is outside the normal 60-minute earned-credit limit", () => {
  const { daily, map } = fixture();
  const state = daily.read();
  state.seconds = 3420; // 57 minutes earned from exercises
  state.minutes = 57;
  map.set(daily.KEY, JSON.stringify(state));
  assert.equal(daily.grantSpecialBonus(), true);
  assert.equal(daily.read().seconds, 3720); // 57 + 5
  const result = daily.awardResultOnce("monnaie", "one", correct("monnaie:base"));
  assert.equal(result.ok, true);
  assert.equal(result.receipt.seconds, 180); // last 3 minutes of earned-credit cap
  assert.equal(daily.read().seconds, 3900); // 60 + 5
  const extra = daily.awardResultOnce("monnaie", "two", correct("monnaie:base"));
  assert.equal(extra.ok, true);
  assert.equal(extra.receipt.seconds, 0);
  assert.equal(daily.read().seconds, 3900);
});

test("the arcade-credit cap also excludes the 5-minute gift", () => {
  const { daily, map } = fixture();
  const state = daily.read();
  state.seconds = 3600;
  state.minutes = 60;
  map.set(daily.KEY, JSON.stringify(state));
  assert.equal(daily.grantSpecialBonus(), true);
  assert.equal(daily.recordProgress("space", 10, 10, "arcade-1"), 1);
  assert.equal(daily.read().seconds, 3900);
});

test("gift expires at midnight and is never granted on another day", () => {
  const { daily } = fixture("2026-11-12");
  assert.equal(daily.grantSpecialBonus(), false);
  assert.equal(daily.read().seconds, 0);
  const previous = fixture();
  assert.equal(previous.daily.grantSpecialBonus(), true);
  const tomorrow = fixture("2026-11-12", Object.fromEntries(previous.map));
  assert.equal(tomorrow.daily.grantSpecialBonus(), false);
  assert.equal(tomorrow.daily.read().seconds, 0);
  assert.equal(tomorrow.daily.read().bonusSeconds, 0);
});

test("storage failures never award or duplicate the gift", () => {
  const { daily, map, storage } = fixture();
  const originalWrite = storage.setItem;
  storage.setItem = () => { throw Error("storage unavailable"); };
  assert.equal(daily.grantSpecialBonus(), false);
  assert.equal(map.has(daily.KEY), false);
  storage.setItem = originalWrite;
  assert.equal(daily.grantSpecialBonus(), true);
  assert.equal(daily.grantSpecialBonus(), true);
  assert.equal(daily.read().seconds, 300);
});

test("legacy migration excludes an already recorded bonus from normal credits", () => {
  const { daily, map } = fixture();
  map.set(daily.KEY, JSON.stringify({
    version: 1, date: daily.today(), points: 1, minutes: 8, seconds: 480,
    bonusSeconds: 300, progress: {}, starts: {}, sessions: {},
    events: ["monnaie:old", "bonus:2026-11-11:5min"],
    receipts: {
      "monnaie:old": { seconds: 180, parts: [
        { key: "monnaie:base", score: 10, total: 10, mastery: 0 },
      ] },
    },
  }));
  const state = daily.read();
  assert.equal(state.rewardScaleVersion, 2);
  assert.equal(state.bonusSeconds, 300);
  assert.equal(state.receipts["monnaie:old"].seconds, 600);
  assert.equal(state.seconds, 900);
  assert.equal(daily.grantSpecialBonus(), true);
  assert.equal(daily.read().seconds, 900);
});
