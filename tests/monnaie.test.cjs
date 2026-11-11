const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const model = require("../monnaie-model.js");

const root = path.resolve(__dirname, "..");
const read = (filename) => fs.readFileSync(path.join(root, filename), "utf8");

test("all 14 real euro denominations have distinct values and readable labels", () => {
  assert.deepEqual(model.COINS.map((item) => item.cents),
    [1, 2, 5, 10, 20, 50, 100, 200]);
  assert.deepEqual(model.NOTES.map((item) => item.cents),
    [500, 1000, 2000, 5000, 10000, 20000]);
  assert.equal(model.COINS[0].label, "1c");
  assert.equal(model.COINS[6].label, "1€");
  assert.equal(model.NOTES[3].label, "50€");
  assert.equal(new Set([...model.COINS, ...model.NOTES].map((item) => item.cents)).size, 14);
});

test("generated prices are always 1.00-199.99 euros, strictly below the banknote", () => {
  assert.deepEqual(model.makeQuestion(() => 0), { price: 100, paid: 500 });
  assert.deepEqual(model.makeQuestion(() => .999999999), { price: 19999, paid: 20000 });
  let seed = 14532;
  const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < 2000; i++) {
    const question = model.makeQuestion(random);
    assert.equal(model.validQuestion(question), true);
    assert.ok(question.paid - question.price > 0);
  }
  for (const note of model.NOTES) {
    assert.equal(model.validQuestion({ price: note.cents - 1, paid: note.cents }), true);
    assert.equal(model.validQuestion({ price: note.cents, paid: note.cents }), false);
  }
});

test("ten generated questions are distinct even with a constant RNG", () => {
  const questions = model.generateQuestions(10, () => 0);
  assert.equal(questions.length, 10);
  assert.equal(new Set(questions.map((q) => q.paid + ":" + q.price)).size, 10);
  assert.ok(questions.every(model.validQuestion));
});

test("coins, notes and repetitions are added and removed one by one", () => {
  const before = [200, 50];
  const next = model.add(before, 50);
  assert.deepEqual(next, [200, 50, 50]);
  assert.deepEqual(before, [200, 50]);
  assert.deepEqual(model.remove(next, 1), [200, 50]);
  assert.deepEqual(model.remove(next, 99), next);
  assert.deepEqual(model.add(next, 3), next);
  assert.equal(model.validSelection(Array(model.MAX_PIECES + 1).fill(1)), false);
  assert.equal(model.add(Array(model.MAX_PIECES).fill(1), 1).length, model.MAX_PIECES);
});

test("validation uses integer cents with no floating-point rounding or partial credit", () => {
  const question = { price: 105, paid: 500 }; // 3.95 euros change.
  const right = [200, 100, 50, 20, 20, 5];
  assert.equal(model.sum(right), 395);
  assert.equal(model.isCorrect(question, right), true);
  assert.equal(model.isCorrect(question, [...right, 1]), false);
  assert.equal(model.isCorrect(question, model.remove(right, 0)), false);
  assert.equal(model.isCorrect(question, []), false);
  assert.equal(model.sum([100, 0]), null);
  assert.equal(model.format(19999), "199,99 €");
  assert.equal(model.format(1), "0,01 €");
});

test("coin and banknote artwork is SVG with the right amount written inside", () => {
  const createNode = (name) => ({
    name, attributes: {}, children: [], textContent: "",
    setAttribute(key, value) { this.attributes[key] = value; },
    append(...children) { this.children.push(...children); },
  });
  const sandbox = {
    window: {},
    document: { createElementNS(_ns, name) { return createNode(name); } },
  };
  vm.runInNewContext(read("monnaie-art.js"), sandbox);
  function collect(node, output = []) {
    output.push(node.textContent || "");
    for (const child of node.children) collect(child, output);
    return output;
  }
  for (const item of [...model.COINS, ...model.NOTES]) {
    const svg = sandbox.window.MonnaieArt.create(item);
    assert.equal(svg.name, "svg");
    assert.match(svg.attributes.viewBox, /^0 0 /);
    assert.equal(svg.attributes["aria-hidden"], "true");
    assert.ok(collect(svg).includes(item.label), item.label);
  }
});

test("Monnaie links, score filter and complete shared exercise integration exist", () => {
  const home = read("index.html");
  const page = read("monnaie.html");
  const scores = read("scores.html");
  const controller = read("monnaie.js");
  assert.match(home, /href="\.\/monnaie\.html"/);
  assert.match(scores, /data-game="monnaie"/);
  assert.match(page, /data-game="monnaie"/);
  assert.match(page, /game-common\.js/);
  assert.match(page, /score-view\.js/);
  assert.match(page, /monnaie-model\.js/);
  assert.match(page, /monnaie-art\.js/);
  assert.match(controller, /ExerciseGame\.resultTracker/);
  assert.match(controller, /GameState\.create\("monnaie"\)/);
  assert.match(controller, /ScoreView\.bind/);
  assert.match(controller, /model\.remove\(selection, index\)/);
  // The answer is intentionally never displayed as a running total.
  assert.doesNotMatch(controller, /model\.sum\(/);
});
