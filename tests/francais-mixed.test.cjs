const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

test("Français Tout mixes families, keeps original keys and answer choices", () => {
  const source = fs.readFileSync(path.join(__dirname, "../francais.js"), "utf8");
  const weightingSource = fs.readFileSync(path.join(__dirname, "../exercise-weighting.js"), "utf8");
  const storage = new Map();
  const context = {
    window: null,
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
    },
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(weightingSource, context);
  // Exercise the actual data and sampler functions without a browser mock.
  function between(start, end) {
    const a = source.indexOf(start), b = source.indexOf(end, a);
    assert.ok(a >= 0 && b > a);
    return source.slice(a, b);
  }
  const definitions = between("  const sets = {", "  const SESSION_SIZE = 10;");
  const keyFunction = between("  function wordKey(", "  function loadWordCounts()");
  const chooser = between("  function shuffleSession(", "  function restart()");
  vm.runInContext(`(() => {
    ${definitions}
    ${keyFunction}
    const SESSION_SIZE = 10;
    const weighting = ExerciseWeighting.create({
      appearancesKey: "counts", errorsKey: "errors",
    });
    ${chooser}
    window.bank = { sets, TABS, categoryFor, isValidQuestion, wordKey, shuffleSession, weighting };
  })();`, context);
  const { sets, TABS, categoryFor, isValidQuestion, wordKey, shuffleSession, weighting } = context.bank;
  assert.equal(TABS.at(-1)[1], "Tout");
  assert.ok(sets.g.items.length > 0 && sets.c.items.length > 0 && sets.s.items.length > 0);
  assert.deepEqual(Array.from(sets.s.options), ["s", "ss"]);
  // Include a word from each family in one deterministic mixed session.
  vm.runInContext(`Math.random = (() => {
    let i = 0;
    const values = [0, 0, 0.55, 0, 0.99999, 0, 0.75, 0];
    return () => values[i++ % values.length];
  })();`, context);
  const questions = shuffleSession("all");
  assert.equal(questions.length, 10);
  // A weighted random draw need not contain every family in ten questions.
  assert.ok(questions.every((q) => ["g", "c", "s"].includes(categoryFor(q))));
  for (const category of ["g", "c", "s"]) {
    const singleFamily = shuffleSession(category);
    assert.equal(singleFamily.length, 10);
    assert.ok(singleFamily.every((q) => categoryFor(q) === category));
  }
  assert.equal(new Set(questions.map((q) => wordKey(categoryFor(q), q))).size, 10);
  for (const q of questions)
    assert.ok(sets[categoryFor(q)].options.includes(q[2]));
  // Preserve the existing meaning-dependent pairs while extending the
  // bank to « s » at word/sentence boundaries and next to consonants.
  assert.ok(sets.s.items.length >= 90);
  assert.ok(sets.s.items.filter((q) => q[2] === "s").length >= 40);
  assert.ok(sets.s.items.filter((q) => q[2] === "ss").length >= 40);
  const sWords = new Set(sets.s.items.map((q) => JSON.parse(wordKey("s", q))[1]));
  for (const word of ["poison", "poisson", "cousin", "coussin", "case", "casse", "laser", "lasser"])
    assert.ok(sWords.has(word), word);
  const vowel = /[aeiouyàâäéèêëîïôöùûüÿ]/iu;
  let atSentenceStart = 0, atSentenceEnd = 0;
  let atWordStart = 0, atWordEnd = 0, beforeConsonant = 0, afterConsonant = 0;
  for (const q of sets.s.items) {
    assert.equal(categoryFor(q), "s");
    assert.equal(isValidQuestion("s", q), true);
    const before = q[0].match(/[\p{L}]$/u)?.[0] || "";
    const after = q[1].match(/^[\p{L}]/u)?.[0] || "";
    if (q[0] === "") atSentenceStart++;
    if (q[1] === ".") atSentenceEnd++;
    if (!before) atWordStart++;
    if (!after) atWordEnd++;
    if (after && !vowel.test(after)) beforeConsonant++;
    if (before && !vowel.test(before)) afterConsonant++;
    if (q[2] === "ss") {
      assert.match(before, vowel);
      assert.match(after, vowel);
    }
  }
  assert.ok(atSentenceStart >= 10);
  assert.ok(atSentenceEnd >= 10);
  assert.ok(atWordStart >= 10);
  assert.ok(atWordEnd >= 10);
  assert.ok(beforeConsonant >= 12);
  assert.ok(afterConsonant >= 8);
  const sSession = shuffleSession("s");
  assert.equal(sSession.length, 10);
  assert.ok(sSession.every((q) => categoryFor(q) === "s"));
  assert.equal(new Set(sSession.map((q) => wordKey("s", q))).size, 10);
  const item = questions[0];
  const key = wordKey(categoryFor(item), item);
  weighting.appearance(key); // Displayed in Tout.
  assert.equal(weighting.counts[key], 1); // Same key as in the original family.
  assert.equal(context.ExerciseWeighting.weight(weighting.counts[key], 0), 0.25);
  weighting.error(wordKey(categoryFor(item), item));
  assert.equal(weighting.failures[key], 1);
  assert.equal(context.ExerciseWeighting.weight(weighting.counts[key], weighting.failures[key]), 4);
  assert.equal(JSON.parse(storage.get("counts"))[key], 1);
  assert.equal(JSON.parse(storage.get("errors"))[key], 1);
  assert.match(source, /recordAppearance\(categoryFor\(questions\[game.index\]\)/);
  assert.match(source, /recordError\(categoryFor\(questions\[game.index\]\)/);
});
