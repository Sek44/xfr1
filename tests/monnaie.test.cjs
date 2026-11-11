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

test("selected denominations are sorted ascending without mutating the saved selection", () => {
  const initial = [20000, 50, 1, 200, 2, 1, 500];
  const sorted = model.sortSelection(initial);
  assert.deepEqual(sorted, [1, 1, 2, 50, 200, 500, 20000]);
  assert.deepEqual(initial, [20000, 50, 1, 200, 2, 1, 500]);
  assert.deepEqual(model.sortSelection(model.remove(sorted, 0)), [1, 2, 50, 200, 500, 20000]);
  assert.deepEqual(model.sortSelection(model.add(sorted, 5)), [1, 1, 2, 5, 50, 200, 500, 20000]);
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

test("customer reacts humorously to missing or excess change without revealing the sum", () => {
  const question = { price: 105, paid: 500 }; // 3.95 euros to return.
  assert.match(model.customerRemark(question, [200]), /manque|voler/);
  assert.match(model.customerRemark(question, [500]), /généreux|chance|trop/);
  assert.equal(model.customerRemark(question, [200, 100, 50, 20, 20, 5]), "");
  assert.equal(model.customerRemark(question, []), "");
});

test("price-matched shop illustrations are deterministic, varied and accessible SVG", () => {
  const createNode = (name) => ({
    name, attributes: {}, children: [],
    setAttribute(key, value) { this.attributes[key] = value; },
    append(...children) { this.children.push(...children); },
  });
  const sandbox = { window: {}, document: { createElementNS: (_, name) => createNode(name) } };
  vm.runInNewContext(read("monnaie-objects.js"), sandbox);
  const objects = sandbox.window.MonnaieObjects;
  const used = new Set();
  for (let price = 100; price <= 19999; price += 73) {
    const paid = model.NOTES.find((note) => note.cents > price).cents;
    const question = { price, paid };
    const item = objects.choose(question);
    assert.ok(price >= item.min && price <= item.max, item.name);
    assert.equal(objects.choose(question).id, item.id, "reloading must preserve the illustration");
    const svg = objects.create(item);
    assert.equal(svg.name, "svg");
    assert.equal(svg.attributes.role, "img");
    assert.equal(svg.attributes["aria-label"], item.name);
    assert.ok(svg.children.length > 2);
    used.add(item.id);
  }
  assert.ok(used.size >= 10, "use diverse objects across the price range");
  for (const item of objects.ITEMS) {
    assert.ok(objects.create(item).children.length > 2, item.id);
  }
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
    if (item.cents === 1) {
      assert.equal(svg.children[0].attributes["stroke-width"], "1.15");
      assert.match(svg.attributes.class, /money-svg--cent/);
      assert.equal(svg.children.at(-1).attributes["font-size"], "37");
    } else if (item.cents === 100) {
      assert.equal(svg.children[0].attributes["stroke-width"], "3");
      assert.match(svg.attributes.class, /money-svg--euro/);
    } else if (item.cents === 10000) {
      // A contrast panel separates the denomination from the architectural art.
      assert.ok(svg.children.some((part) =>
        part.name === "rect" && part.attributes["fill-opacity"] === ".86"));
      assert.equal(svg.children.find((part) =>
        part.name === "text" && part.textContent === item.label).attributes["font-size"], "29");
    }
  }
});

test("compact cash controls have frame-free accessible coin buttons", () => {
  const css = read("monnaie.css");
  const controller = read("monnaie.js");
  assert.match(css, /:is\(\.money-option--coin, \.money-picked--coin\) \{/);
  assert.match(css, /width: 46px;\s*height: 46px;\s*min-height: 46px;/);
  assert.match(css, /border: 0;\s*border-radius: 50%;\s*background: transparent;/);
  assert.match(css, /\.money-grid--coins \{\s*grid-template-columns: repeat\(8,/);
  assert.match(css, /\.money-grid--notes \{\s*grid-template-columns: repeat\(6,/);
  assert.match(css, /:is\(\.visually-hidden, \.money-count\) \{[\s\S]*?clip-path: inset\(50%\)/);
  assert.match(controller, /Math\.round\(note\.width \* 0\.69\)/);
  assert.match(controller, /button\.setAttribute\(\s*"aria-label"/);
});

test("Monnaie answer is sorted, reserves two rows and removes note frames and visible titles", () => {
  const css = read("monnaie.css");
  const controller = read("monnaie.js");
  const page = read("monnaie.html");
  assert.match(css, /\.money-caption--stacked \{[\s\S]*?white-space: pre-line/);
  assert.match(css, /\.money-paid \{[\s\S]*?flex-direction: row/);
  assert.match(css, /\.money-selection \{[\s\S]*?height: auto;[\s\S]*?min-height: 106px;[\s\S]*?max-height: 206px/);
  assert.match(css, /\.money-selection \{[\s\S]*?overflow-y: auto/);
  assert.match(css, /\.money-tray \{[\s\S]*?border-bottom: 1px solid/);
  assert.match(css, /:is\(\.money-option, \.money-picked\) \{[\s\S]*?border: 0;[\s\S]*?background: transparent;/);
  assert.match(controller, /"Le client\\ndonne"/);
  assert.match(controller, /selection = model\.sortSelection\(state\.selection\)/);
  assert.match(controller, /selection = model\.sortSelection\(updated\)/);
  assert.match(controller, /selection = model\.sortSelection\(model\.remove\(selection, index\)\)/);
  assert.doesNotMatch(controller, /"Mon rendu de monnaie"|"Pièces"|"Billets"/);
  assert.match(page, /monnaie-art\.js\?v=20261111-layout3/);
  assert.match(page, /monnaie-objects\.js\?v=20261111-objects1/);
  assert.match(css, /\.money-price-line \{[\s\S]*?display: flex/);
  assert.match(css, /\.money-object-svg \{[\s\S]*?width: min\(46px, 100%\)/);
  assert.match(css, /\.money-customer-remark \{[\s\S]*?min-height: 22px/);
  assert.match(controller, /MonnaieObjects\.choose\(current\)/);
  assert.match(controller, /model\.customerRemark\(current, selection\)/);
});

test("validated answer stays visible until next question and remains disabled", () => {
  const nodes = Object.fromEntries(["score", "panel", "restart-series"].map((id) => [id, createNode(id)]));
  let liveGame;
  const stored = [];
  function createNode(tag, className = "", text = "") {
    return {
      tag, className, textContent: text, attributes: {}, children: [], disabled: false,
      style: { setProperty() {} },
      classList: { toggle() {}, remove() {} },
      setAttribute(key, value) { this.attributes[key] = value; },
      getAttribute(key) { return this.attributes[key]; },
      append(...items) { this.children.push(...items); },
      replaceChildren(...items) { this.children = items; },
    };
  }
  function descendants(element, output = []) {
    output.push(element);
    for (const child of element.children) descendants(child, output);
    return output;
  }
  const sandbox = {
    document: { getElementById: (id) => nodes[id] },
    window: { addEventListener() {} },
    GameUI: { element: createNode },
    MonnaieModel: {
      ...model,
      generateQuestions: () => Array.from({ length: 10 }, (_, i) => ({ price: 300 + i, paid: 500 })),
    },
    MonnaieArt: { create: (item) => createNode("svg", "money-svg", item.label) },
    MonnaieObjects: {
      choose: () => ({ id: "apple", name: "une pomme" }),
      create: () => createNode("svg", "money-object-svg"),
    },
    GameState: { create: () => ({
      load: () => null,
      save: (data) => stored.push(data),
      clear() {},
    }) },
    ScoreView: { bind() {} },
    ExerciseGame: {
      resultTracker: () => ({
        fresh() {}, save() {}, snapshot: () => ({}), pending: false,
      }),
      create: (handlers) => {
        liveGame = {
          index: 0, total: 10, score: 0, correct: false, failed: false,
          reset(total) { this.total = total; this.index = 0; this.correct = false; handlers.onChange(); },
          validate(right) { this.correct = right; if (!right) this.failed = true; handlers.onChange(); },
          next() { this.index++; this.correct = false; this.failed = false; handlers.onChange(); },
          progress() {},
          actionButton: () => createNode("button", "primary"),
          snapshot() {
            return { index: this.index, total: this.total, score: this.score,
              correct: this.correct, failed: this.failed, remaining: null };
          },
          restartButton: () => ({ onclick() {} }),
        };
        return liveGame;
      },
    },
  };
  vm.runInNewContext(read("monnaie.js"), sandbox);
  const all = () => descendants(nodes.panel);
  const picked = () => all().filter((n) => n.className.includes("money-picked--coin"));
  const addTwoEuro = all().find((n) => n.attributes["aria-label"] === "Ajouter la pièce de 2 euros");
  assert.ok(addTwoEuro);
  assert.equal(picked().length, 0);
  addTwoEuro.onclick();
  assert.equal(picked().length, 1);

  const verify = all().find((n) => n.className === "primary");
  verify.onclick();
  assert.equal(liveGame.correct, true);
  assert.equal(picked().length, 1, "successful validation must retain the answer");
  assert.equal(picked()[0].disabled, true, "validated answer must be locked");
  assert.deepEqual(stored.at(-1).selection, [200]);

  liveGame.next();
  assert.equal(liveGame.index, 1);
  assert.equal(picked().length, 0, "only navigation to the next question resets the answer");

  // A missing amount triggers a customer comment. Editing clears it;
  // an excessive amount then triggers a different comment.
  const addOneEuro = all().find((n) => n.attributes["aria-label"] === "Ajouter la pièce de 1 euro");
  addOneEuro.onclick();
  all().find((n) => n.className === "primary").onclick();
  const remark = () => all().find((n) => n.className === "money-customer-remark").textContent;
  assert.match(remark(), /manque|voler/);
  all().find((n) => n.attributes["aria-label"] === "Ajouter la pièce de 2 euros").onclick();
  assert.equal(remark(), "", "changing the answer hides the customer remark");
  all().find((n) => n.className === "primary").onclick();
  assert.match(remark(), /généreux|chance|trop/);
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
