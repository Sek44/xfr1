"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.join(__dirname, "..");

function fixture(initial = {}) {
  const data = new Map(Object.entries(initial));
  const storage = {
    getItem: (key) => data.has(key) ? data.get(key) : null,
    setItem: (key, value) => data.set(key, value),
  };
  const window = { addEventListener() {}, setInterval() {} };
  const document = { addEventListener() {}, hidden: false };
  const context = vm.createContext({
    window, document, localStorage: storage, Date, Math,
  });
  for (const file of ["reward-difficulties.js", "reward-rules.js", "daily-exercises.js"])
    vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context);
  return { window, storage, data, rules: window.RewardRules, daily: window.DailyExercises };
}

test("published difficulty configuration covers every exercise and preserves initial difficulty", () => {
  const { rules, window } = fixture();
  assert.equal(Object.keys(window.RewardDifficultyLevels).length, 29);
  assert.equal(rules.difficulty("monnaie:base"), 10);
  assert.equal(rules.difficulty("calcul:0-10:1"), 1);
  assert.equal(rules.difficulty("calcul:1000-10000:5"), 10);
  assert.equal(rules.difficulty("francais:s"), 4);
  for (const [key, level] of Object.entries(window.RewardDifficultyLevels)) {
    assert.equal(rules.difficulty(key), level, key);
    assert.ok(level >= 1 && level <= 10);
  }
});

test("manual mastery overrides only the requested category and can revert to automatic", () => {
  const { rules, data } = fixture();
  const key = "monnaie:base";
  const history = JSON.stringify([{ tab: "monnaie", score: 8 }]);
  data.set("exercices_francais_scores", history);
  assert.equal(rules.setMastery(key, 9), true);
  assert.equal(rules.inspect(key).mastery, 9);
  assert.equal(rules.read().categories[key].manualMastery, 9);
  assert.equal(rules.setMastery("francais:g", 0), true);
  assert.equal(rules.inspect("francais:g").mastery, 0);
  assert.equal(rules.inspect(key).mastery, 9);
  assert.equal(rules.setMastery(key, null), true);
  assert.equal(rules.inspect(key).mastery, 0);
  assert.equal(data.get("exercices_francais_scores"), history);
  assert.equal(rules.setMastery("arbitrary:base", 5), false);
  assert.equal(rules.setMastery(key, -1), false);
  assert.equal(rules.setMastery(key, 11), false);
  assert.equal(rules.setMastery(key, 3.5), false);
});

test("manual mastery is not lost when answering more questions", () => {
  const { rules } = fixture();
  assert.equal(rules.setMastery("francais:c", 7), true);
  assert.equal(rules.record("sample-1", [
    { key: "francais:c", correct: true },
    { key: "francais:c", correct: false },
  ]), true);
  assert.equal(rules.inspect("francais:c").mastery, 7);
  assert.equal(rules.read().categories["francais:c"].total, 2);
});

test("admin bonus is measured in seconds, is idempotent and leaves scores unchanged", () => {
  const { daily, data } = fixture();
  const scores = '[{"tab":"g","score":10}]';
  data.set("exercices_francais_scores", scores);
  assert.equal(daily.grantAdminBonus(5 * 60, "test-unique-1"), true);
  assert.equal(daily.grantAdminBonus(5 * 60, "test-unique-1"), true);
  assert.equal(daily.grantAdminBonus(2 * 60, "test-unique-2"), true);
  assert.equal(daily.read().seconds, 420);
  assert.equal(daily.read().bonusSeconds, 420);
  assert.equal(daily.read().minutes, 7);
  assert.equal(daily.read().points, 0);
  assert.equal(data.get("exercices_francais_scores"), scores);
  assert.equal(daily.grantAdminBonus(0, "test-unique-3"), false);
  assert.equal(daily.grantAdminBonus(121 * 60, "test-unique-3"), false);
  assert.equal(daily.grantAdminBonus(90, "test-unique-3"), false);
});

test("broken local storage is not overwritten by admin mutations", () => {
  const { rules, daily, data } = fixture({
    entrainement_mastery_v1: "{broken",
    entrainement_daily_exercises_v1: "{broken",
  });
  assert.equal(rules.setMastery("monnaie:base", 6), false);
  assert.equal(rules.setMasteryBonus("monnaie:base", -2), false);
  assert.equal(daily.grantAdminBonus(60, "test-unique-1"), false);
  assert.equal(data.get(rules.KEY), "{broken");
  assert.equal(data.get(daily.KEY), "{broken");
});

test("the administration page has no public navigation link, and every game loads difficulties first", () => {
  const home = fs.readFileSync(path.join(root, "index.html"), "utf8");
  assert.doesNotMatch(home, /href=["'][^"']*admin\.html/);
  for (const name of ["index", "francais", "conjugaison", "calcul", "monnaie", "scores", "space", "magic"]) {
    const html = fs.readFileSync(path.join(root, name + ".html"), "utf8");
    assert.ok(html.indexOf("reward-difficulties.js") < html.indexOf("reward-rules.js"));
  }
  assert.match(fs.readFileSync(path.join(root, "admin.html"), "utf8"), /name="robots" content="noindex,nofollow"/);
});

test("signed bonus follows changing automatic mastery, clamps range and preserves scores", () => {
  const { rules, data } = fixture();
  const key = "francais:c";
  const archive = '[{"tab":"c","score":8,"unknown":"preserve"}]';
  data.set("exercices_francais_scores", archive);
  assert.equal(rules.inspect(key).automaticMastery, 0);
  assert.equal(rules.setMasteryBonus(key, 3), true);
  assert.equal(rules.inspect(key).mastery, 3);
  assert.equal(rules.record("new-questions", Array.from({ length: 50 },
    () => ({ key, correct: true }))), true);
  assert.equal(rules.inspect(key).automaticMastery, 3);
  assert.equal(rules.inspect(key).mastery, 6);
  assert.equal(rules.setMasteryBonus(key, -10), true);
  assert.equal(rules.inspect(key).mastery, 0);
  assert.equal(rules.setMasteryBonus(key, 10), true);
  assert.equal(rules.inspect(key).mastery, 10);
  assert.equal(rules.setMasteryBonus(key, 0), true);
  assert.equal(rules.inspect(key).mastery, 3);
  assert.equal("masteryBonus" in rules.read().categories[key], false);
  assert.equal(data.get("exercices_francais_scores"), archive);
  assert.equal(rules.setMasteryBonus(key, -11), false);
  assert.equal(rules.setMasteryBonus(key, 11), false);
  assert.equal(rules.setMasteryBonus(key, 1.5), false);
  assert.equal(rules.setMasteryBonus("unknown:key", 2), false);
});

test("an older fixed mastery remains until explicitly converted to a signed bonus", () => {
  const { rules } = fixture();
  const key = "conjugaison:present-1";
  assert.equal(rules.setMastery(key, 8), true);
  assert.equal(rules.inspect(key).legacyManualMastery, 8);
  assert.equal(rules.inspect(key).mastery, 8);
  assert.equal(rules.setMasteryBonus(key, -2), true);
  assert.equal(rules.read().categories[key].manualMastery, undefined);
  assert.equal(rules.inspect(key).mastery, 0);
  assert.equal(rules.inspect(key).masteryBonus, -2);
});

test("admin shows read-only difficulty and only an official GitHub edit link", () => {
  const html = fs.readFileSync(path.join(root, "admin.html"), "utf8");
  const script = fs.readFileSync(path.join(root, "admin.js"), "utf8");
  assert.match(html, /github\.com\/Sek44\/xfr1\/edit\/main\/reward-difficulties\.js/);
  assert.doesNotMatch(html, /github-token|github-save|github-copy/);
  assert.doesNotMatch(script, /github-token|Bearer|Authorization|fetch\(|saveGitHub|configSource|copyConfig/);
  assert.match(script, /setMasteryBonus/);
  assert.match(script, /createElement\("output"\)/);
});

test("gain matrix cells match repricing for every published difficulty, mastery and score", () => {
  const { rules, window } = fixture();
  for (const [id, difficulty] of Object.entries(window.RewardDifficultyLevels)) {
    for (let mastery = 0; mastery <= 10; mastery++) {
      const range = rules.gainRange(difficulty, mastery);
      let first = null;
      let minimum = null;
      let max = 0;
      for (let score = 0; score <= 10; score++) {
        const amount = rules.gainForScore(difficulty, mastery, score);
        const original = rules.repriceParts([
          { key: id, mastery, score, total: 10 },
        ]);
        assert.equal(amount, original,
          "Mismatch " + id + ", mastery " + mastery + ", score " + score);
        if (amount > 0 && first === null) {
          first = score;
          minimum = amount;
        }
        max = Math.max(max, amount);
      }
      assert.equal(range.minSeconds, minimum ?? 0);
      assert.equal(range.maxSeconds, max);
      assert.equal(range.minScore, first);
      assert.equal(range.maxScore, max > 0 ? 9 : null);
      assert.equal(range.dailyLimit, rules.CONFIG.dailyLimits[mastery]);
    }
  }
});

test("gain ranges include threshold, cutoff and mission pack behaviour", () => {
  const { rules } = fixture();
  assert.equal(rules.gainForScore(1, 0, 4), 0);
  assert.equal(rules.gainForScore(1, 0, 5), 30);
  assert.equal(rules.gainForScore(1, 0, 9), 60);
  assert.equal(rules.gainForScore(10, 0, 5), 300);
  assert.equal(rules.gainForScore(10, 0, 9), 600);
  assert.equal(rules.gainForScore(10, 6, 8), 0);
  assert.equal(rules.gainForScore(10, 6, 9), 450);
  assert.equal(rules.gainForScore(1, 9, 9), 15);
  assert.equal(rules.gainForScore(10, 10, 10), 0);
  assert.equal(rules.gainRange(10, 10).minScore, null);
  assert.equal(rules.gainRange(10, 10).dailyLimit, 1);
  assert.equal(rules.gainRange(0, 2), null);
  assert.equal(rules.gainForScore(1, 2, 11), null);
  const admin = fs.readFileSync(path.join(root, "admin.js"), "utf8");
  assert.match(admin, /space:base" \? 10/);
  assert.match(admin, /magic:base" \? 20/);
  assert.match(admin, /gainSummaryFor\(key, current\)/);
  const html = fs.readFileSync(path.join(root, "admin.html"), "utf8");
  assert.match(html, /admin-gains-matrix/);
});
