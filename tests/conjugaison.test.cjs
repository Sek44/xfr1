const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function load(files, storage = new Map()) {
  const context = {
    window: null,
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
    },
  };
  context.window = context;
  vm.createContext(context);
  for (const file of files) {
    vm.runInContext(
      fs.readFileSync(path.join(__dirname, "..", file), "utf8"),
      context,
      { filename: file },
    );
  }
  return { context, storage };
}

test("present first-group conjugations cover endings, cedilla, i and accents", () => {
  const { context } = load(["conjugaison-data.js"]);
  const cases = [
    ["er", "chanter", "je", "chante"],
    ["er", "écouter", "nous", "écoutons"],
    ["ger", "manger", "nous", "mangeons"],
    ["ger", "voyager", "nous", "voyageons"],
    ["ger", "manger", "ils", "mangent"],
    ["cer", "lancer", "nous", "lançons"],
    ["cer", "effacer", "nous", "effaçons"],
    ["cer", "avancer", "vous", "avancez"],
    ["guer", "conjuguer", "ils", "conjuguent"],
    ["guer", "naviguer", "nous", "naviguons"],
    ["yer", "nettoyer", "je", "nettoie"],
    ["yer", "envoyer", "ils", "envoient"],
    ["yer", "essuyer", "nous", "essuyons"],
    ["grave", "lever", "je", "lève"],
    ["grave", "acheter", "tu", "achètes"],
    ["grave", "acheter", "nous", "achetons"],
    ["grave", "promener", "elles", "promènent"],
  ];
  for (const [type, verb, person, expected] of cases)
    assert.equal(context.ConjugaisonData.conjugate(type, verb, person), expected,
      type + " / " + verb + " / " + person);
  assert.equal(context.ConjugaisonData.prefix("Je", "écoute"), "J’");
  assert.equal(context.ConjugaisonData.prefix("Je", "chante"), "Je ");
  assert.equal(context.ConjugaisonData.prefix("Paul et Julie", "conjuguent"),
    "Paul et Julie ");
});

test("on voyage en train accepts voyage with accidental outer spaces", () => {
  const { context } = load(["conjugaison-data.js"]);
  const data = context.ConjugaisonData;
  const question = {
    type: "ger", verb: "voyager", person: "on", subject: "On",
    complement: "en train.", answer: "voyage",
  };
  assert.equal(data.conjugate("ger", "voyager", "on"), "voyage");
  assert.equal(data.valid(question), true);
  for (const answer of ["voyage", "Voyage", " voyage ", "voyage "])
    assert.equal(data.matchesAnswer(question, answer), true, answer);
  for (const answer of ["voyages", "voyageons", "voyagé", "voyag"])
    assert.equal(data.matchesAnswer(question, answer), false, answer);
});

test("every bank variant has a valid answer and 10 unique weighted combinations", () => {
  const { context } = load(["conjugaison-data.js", "exercise-weighting.js"]);
  const pool = context.ConjugaisonData.possibleQuestions();
  assert.equal(pool.size, 6 * 6 * 9);
  for (const variants of pool.values()) {
    assert.ok(variants.length > 0);
    for (const question of variants)
      assert.equal(context.ConjugaisonData.valid(question), true);
  }
  const tracker = context.ExerciseWeighting.create({
    appearancesKey: "counts", errorsKey: "errors",
  });
  const session = tracker.choose(pool, 10, () => 0);
  assert.equal(session.length, 10);
  assert.equal(new Set(session.map(context.ConjugaisonData.key)).size, 10);
  assert.equal(context.ExerciseWeighting.weight(0, 0), 1);
  assert.equal(context.ExerciseWeighting.weight(1, 0), 0.25);
  assert.equal(context.ExerciseWeighting.weight(1, 1), 4);
});

test("weighted tracking persists separately and does not modify French counts", () => {
  const french = '{"legacy":8}';
  const { context, storage } = load(["exercise-weighting.js"],
    new Map([["entrainement_francais_word_counts_v1", french]]));
  const options = {
    appearancesKey: "entrainement_conjugaison_counts_v1",
    errorsKey: "entrainement_conjugaison_errors_v1",
  };
  const tracker = context.ExerciseWeighting.create(options);
  const key = '["cer","lancer","nous"]';
  tracker.appearance(key);
  tracker.error(key);
  tracker.appearance(key);
  assert.equal(JSON.parse(storage.get(options.appearancesKey))[key], 2);
  assert.equal(JSON.parse(storage.get(options.errorsKey))[key], 1);
  assert.equal(storage.get("entrainement_francais_word_counts_v1"), french);
  const reloaded = context.ExerciseWeighting.create(options);
  assert.equal(reloaded.counts[key], 2);
  assert.equal(reloaded.failures[key], 1);
});

test("second-group present conjugates all grammatical persons and filters its questions", () => {
  const { context } = load(["conjugaison-data.js", "exercise-weighting.js"]);
  const data = context.ConjugaisonData;
  const expected = {
    je: "finis", tu: "finis", il: "finit", elle: "finit", on: "finit",
    nous: "finissons", vous: "finissez", ils: "finissent", elles: "finissent",
  };
  assert.equal(data.groups.ir.length, 22);
  for (const [person, form] of Object.entries(expected))
    assert.equal(data.conjugate("ir", "finir", person), form);
  assert.equal(data.conjugate("ir", "choisir", "nous"), "choisissons");
  assert.equal(data.conjugate("ir", "réfléchir", "vous"), "réfléchissez");
  assert.equal(data.conjugate("ir", "agir", "ils"), "agissent");
  assert.equal(data.conjugate("ir", "réagir", "tu"), "réagis");
  assert.equal(data.prefix("Je", "agis"), "J’");
  assert.equal(data.conjugate("ir", "partir", "nous"), null);

  const pool = data.possibleQuestions("present-2");
  assert.equal(pool.size, 22 * 9);
  assert.equal(data.possibleQuestions().size, 6 * 6 * 9);
  for (const variants of pool.values()) {
    for (const q of variants) {
      assert.equal(q.type, "ir");
      assert.equal(data.valid(q), true);
      assert.equal(data.matchesAnswer(q, q.answer.toUpperCase()), true);
      assert.equal(data.matchesAnswer(q, " " + q.answer + " "), true);
    }
  }
  const tracker = context.ExerciseWeighting.create({
    appearancesKey: "ir-counts", errorsKey: "ir-errors",
  });
  const selected = tracker.choose(pool, 10, () => 0);
  assert.equal(selected.length, 10);
  assert.equal(new Set(selected.map(data.key)).size, 10);
});

test("conjugaison uses the shared tab component for both present groups", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "conjugaison.html"), "utf8");
  const controller = fs.readFileSync(path.join(__dirname, "..", "conjugaison.js"), "utf8");
  assert.match(html, /id="conjugaison-tabs"[^>]*role="tablist"/);
  assert.match(controller, /GameUI\.tabs\(/);
  assert.match(controller, /"present-1": "Présent de l’indicatif · 1er groupe"/);
  assert.match(controller, /"present-2": "Présent de l’indicatif · 2e groupe"/);
  assert.match(controller, /stored\.save\(\{ mode, questions/);
});
