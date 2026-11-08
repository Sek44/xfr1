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
  return { api: window.DailyExercises, items, listeners, localStorage };
}

test("one exercise gives three minutes, regardless of its score", () => {
  const { api } = setup();
  assert.equal(api.MINUTES_PER_POINT, 3);
  assert.equal(api.award("francais"), true);
  assert.equal(api.award("calcul"), true);
  const day = api.read();
  assert.equal(day.points, 2);
  assert.equal(day.minutes, 6);
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
  assert.equal(api.read().minutes, 9);
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

test("existing points are converted at the new ratio", () => {
  const { api, items } = setup();
  items.set(api.KEY, JSON.stringify({
    version: 1, date: api.today(), points: 3, minutes: 15,
    progress: { magic: 12 }, events: ["magic:checkpoint"],
  }));
  const state = api.read();
  assert.equal(state.points, 3);
  assert.equal(state.minutes, 9);
  assert.equal(state.progress.magic, 12);
  assert.equal(state.events[0], "magic:checkpoint");
});

test("corrupted data is not overwritten", () => {
  const { api, items } = setup({ entrainement_daily_exercises_v1: "{broken" });
  assert.equal(api.award("calcul"), false);
  assert.equal(api.read(), null);
  assert.equal(items.get(api.KEY), "{broken");
});

test("structured progress counters show independent values and keep the daily ratio", () => {
  const { api, listeners } = setup();
  const points = { textContent: "" };
  const minutes = { textContent: "" };
  const error = { textContent: "", hidden: true };
  api.mountStats(points, minutes, error);
  assert.equal(points.textContent, "0 exercices");
  assert.equal(minutes.textContent, "0 min de jeu");
  assert.equal(error.hidden, true);

  assert.equal(api.award("francais"), true);
  listeners.focus();
  assert.equal(points.textContent, "1 exercice");
  assert.equal(minutes.textContent, "3 min de jeu");

  assert.equal(api.award("calcul"), true);
  listeners.focus();
  assert.equal(points.textContent, "2 exercices");
  assert.equal(minutes.textContent, "6 min de jeu");
});

test("structured progress counters handle inaccessible stored data without overwriting it", () => {
  const { api, items } = setup({ entrainement_daily_exercises_v1: "{broken" });
  const points = { textContent: "" };
  const minutes = { textContent: "" };
  const error = { textContent: "", hidden: true };
  api.mountStats(points, minutes, error);
  assert.equal(points.textContent, "— exercices");
  assert.equal(minutes.textContent, "— min de jeu");
  assert.equal(error.hidden, false);
  assert.match(error.textContent, /indisponible/);
  assert.equal(items.get(api.KEY), "{broken");
});

test("a failed milestone write retains uncredited kills for a later retry", () => {
  const { api, items, localStorage } = setup();
  const tracker = api.milestones("space", 10);
  let available = false;
  localStorage.setItem = (key, value) => {
    if (!available) throw new Error("storage unavailable");
    items.set(key, value);
  };
  assert.equal(tracker.record(8), 0);
  assert.equal(tracker.snapshot().seenScore, 0);
  available = true;
  assert.equal(tracker.record(8), 0);
  assert.equal(tracker.snapshot().seenScore, 8);
  assert.equal(api.read().progress.space, 8);
  assert.equal(tracker.record(10), 1);
  assert.equal(tracker.snapshot().seenScore, 10);
  assert.equal(api.read().points, 1);
  assert.equal(tracker.record(10), 0);
  assert.equal(api.read().points, 1);
});

test("corrupt daily storage never consumes progress; after repair it credits exactly once", () => {
  const { api, items } = setup({ entrainement_daily_exercises_v1: "{broken" });
  const tracker = api.milestones("magic", 20);
  assert.equal(tracker.record(20), 0);
  assert.equal(tracker.snapshot().seenScore, 0);
  assert.equal(items.get(api.KEY), "{broken");
  items.delete(api.KEY);
  assert.equal(tracker.record(20), 1);
  assert.equal(tracker.snapshot().seenScore, 20);
  assert.equal(api.read().points, 1);
  assert.equal(tracker.record(20), 0);
  assert.equal(api.read().points, 1);
});

test("idempotent daily awards distinguish duplicates from failed writes", () => {
  const { api, items, localStorage } = setup();
  assert.equal(api.awardOnce("francais", "session-A"), true);
  assert.equal(api.awardOnce("francais", "session-A"), true);
  assert.equal(api.read().points, 1);
  assert.equal(api.award("francais", "session-A"), false);
  let fail = true;
  const write = localStorage.setItem;
  localStorage.setItem = (key, value) => {
    if (fail) throw new Error("quota");
    write(key, value);
  };
  assert.equal(api.awardOnce("calcul", "session-B"), false);
  assert.equal(api.read().points, 1);
  fail = false;
  assert.equal(api.awardOnce("calcul", "session-B"), true);
  assert.equal(api.awardOnce("calcul", "session-B"), true);
  assert.equal(api.read().points, 2);
  assert.equal(api.read().minutes, 6);
  assert.equal(items.get(api.KEY) !== null, true);
});
