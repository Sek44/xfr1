"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

const source = fs.readFileSync(path.join(__dirname, "..", "daily-exercises.js"), "utf8");

function setup(initial = {}) {
  const items = new Map(Object.entries(initial));
  const localStorage = {
    getItem: (key) => items.has(key) ? items.get(key) : null,
    setItem: (key, value) => items.set(key, value),
  };
  const listeners = {};
  const window = {
    addEventListener: (type, handler) => { listeners[type] = handler; },
    setInterval: () => {},
  };
  const document = {
    hidden: false,
    addEventListener: (type, handler) => { listeners[type] = handler; },
  };
  vm.runInNewContext(source, { window, document, localStorage, Date, Math });
  return { api: window.DailyExercises, items, listeners };
}

test("one exercise gives ten minutes, regardless of its score", () => {
  const { api } = setup();
  assert.equal(api.award("francais"), true);
  assert.equal(api.award("calcul"), true);
  const day = api.read();
  assert.equal(day.points, 2);
  assert.equal(day.minutes, 20);
  assert.equal(day.date, api.today());
});

test("partial magical series carry over between sessions and duplicates cannot re-credit", () => {
  const { api } = setup();
  assert.equal(api.recordProgress("magic", 12, 20, "session1:0-12"), 0);
  assert.equal(api.recordProgress("magic", 8, 20, "session2:0-8"), 1);
  assert.equal(api.recordProgress("magic", 8, 20, "session2:0-8"), 0);
  assert.equal(api.read().points, 1);
  assert.equal(api.read().progress.magic, 0);
  assert.equal(api.recordProgress("magic", 46, 20, "session2:8-54"), 2);
  assert.equal(api.read().progress.magic, 6);
  assert.equal(api.read().minutes, 30);
});

test("independent arcade progress and restored score snapshots", () => {
  const { api } = setup();
  const tracker = api.milestones("space", 10);
  tracker.record(8);
  const saved = tracker.snapshot();
  const next = api.milestones("space", 10);
  next.restore(saved, 8);
  assert.equal(next.record(10), 1);
  next.restore(saved, 8);
  assert.equal(next.record(10), 0);
  assert.equal(api.read().points, 1);
  assert.equal(api.recordProgress("magic", 10, 20, "other"), 0);
  assert.equal(api.read().progress.magic, 10);
});

test("previous days reset points, authorized minutes, progress and deduplication", () => {
  const { api, items } = setup();
  const key = api.KEY;
  items.set(key, JSON.stringify({
    version: 1, date: "2020-01-01", points: 50, minutes: 500,
    progress: { magic: 19 }, events: ["magic:old"],
  }));
  const fresh = api.read();
  assert.equal(fresh.points, 0);
  assert.equal(fresh.minutes, 0);
  assert.equal(Object.keys(fresh.progress).length, 0);
  assert.equal(fresh.events.length, 0);
  assert.equal(api.award("calcul"), true);
  assert.equal(api.read().points, 1);
});

test("corrupted data is not overwritten", () => {
  const { api, items } = setup({ entrainement_daily_exercises_v1: "{broken" });
  assert.equal(api.award("calcul"), false);
  assert.equal(api.read(), null);
  assert.equal(items.get(api.KEY), "{broken");
});
