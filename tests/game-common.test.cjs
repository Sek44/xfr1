const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

class Node {
  constructor(tag) {
    this.tagName = tag;
    this.children = [];
    this.attributes = {};
    this.style = { setProperty() {} };
    this.classList = { toggle() {}, add() {}, remove() {} };
  }
  append(...nodes) {
    for (const node of nodes) {
      node.parent = this;
      this.children.push(node);
    }
  }
  replaceChildren(...nodes) {
    this.children = [];
    this.append(...nodes);
  }
  setAttribute(name, value) {
    this.attributes[name] = value;
  }
  remove() {
    if (this.parent)
      this.parent.children = this.parent.children.filter(
        (node) => node !== this,
      );
  }
  get firstChild() {
    return this.children[0];
  }
  set innerHTML(value) {
    this.replaceChildren(new Node("svg"));
  }
  addEventListener() {}
  querySelector(selector) {
    return selector.startsWith(".") ? findByClass(this, selector.slice(1)) : null;
  }
}
// Exercises now nest the question and inputs inside shared visual components.
function findByClass(root, className) {
  if ((root.className || "").split(/\s+/).includes(className)) return root;
  for (const child of root.children || []) {
    const found = findByClass(child, className);
    if (found) return found;
  }
  return null;
}

function setup(files = ["game-state.js", "game-ui.js", "game-common.js", "exercise-weighting.js"], storage = new Map()) {
  let now = 0,
    id = 0;
  const timers = new Map(),
    elements = new Map(),
    sessions = [],
    saved = [];
  const context = {
    window: null,
    localStorage: {
      getItem(key) {
        return storage.has(key) ? storage.get(key) : null;
      },
      setItem(key, value) {
        storage.set(key, value);
      },
      removeItem(key) {
        storage.delete(key);
      },
    },
    document: {
      createElement: (tag) => new Node(tag),
      createTextNode: (text) =>
        Object.assign(new Node("#text"), { textContent: text }),
      getElementById: (id) => {
        if (!elements.has(id)) elements.set(id, new Node("div"));
        return elements.get(id);
      },
      addEventListener() {},
      querySelector: (selector) => selector === "main" ? new Node("main") : null,
    },
    Date: { now: () => now },
    setTimeout(callback, delay) {
      timers.set(++id, { callback, at: now + delay });
      return id;
    },
    clearTimeout(id) {
      timers.delete(id);
    },
    ExerciseScores: {
      save: (record) => saved.push(record),
      encourage: () => "Bravo",
    },
    ScoreView: {
      bind(callbacks) {
        context.visit = callbacks;
      },
    },
    requestAnimationFrame(callback) {
      context.frame = callback;
    },
    matchMedia: () => ({ matches: true }),
    addEventListener() {},
  };
  context.window = context;
  vm.createContext(context);
  function run(file) {
    vm.runInContext(
      fs.readFileSync(path.join(__dirname, "..", file), "utf8"),
      context,
      { filename: file },
    );
  }
  for (const file of files) run(file);
  if (context.ExerciseGame) {
    const create = context.ExerciseGame.create;
    context.ExerciseGame.create = (options) => {
      const game = create(options);
      sessions.push(game);
      return game;
    };
  }
  function advance(ms) {
    const end = now + ms;
    for (;;) {
      const entry = [...timers]
        .filter(([, timer]) => timer.at <= end)
        .sort((a, b) => a[1].at - b[1].at)[0];
      if (!entry) break;
      now = entry[1].at;
      timers.delete(entry[0]);
      entry[1].callback();
    }
    now = end;
  }
  return { context, run, advance, elements, sessions, saved, timers, storage };
}

test("shared progress displays Question current/max and Score number only", () => {
  const f = setup();
  const game = f.context.ExerciseGame.create({ onChange() {}, onFinish() {} });
  const holder = new Node("div");
  game.reset(10);
  game.progress(holder);
  assert.equal(holder.children[0].textContent, "Question 1/10");
  assert.equal(holder.children[1].children[0].textContent, "Score");
  assert.equal(holder.children[1].children[1].textContent, "0");
  game.validate(true);
  game.progress(holder);
  assert.equal(holder.children[1].children[1].textContent, "1");
  game.next();
  game.progress(holder);
  assert.equal(holder.children[0].textContent, "Question 2/10");
  assert.equal(holder.children[1].children[1].textContent, "1");
  game.validate(false);
  game.validate(true);
  game.progress(holder);
  assert.equal(holder.children[1].children[1].textContent, "1");
});

test("shared ornate tabs use accessible selection and preserve callbacks", () => {
  const f = setup();
  const parent = new Node("div");
  const calls = [];
  f.context.GameUI.tabs(parent, [["g", "g / gu / ge"], ["c", "c / ç"]], "c",
    (value) => calls.push(value));
  assert.equal(parent.children.length, 2);
  assert.equal(parent.children[0].className, "academy-tab");
  assert.equal(parent.children[1].className, "academy-tab active");
  assert.equal(parent.children[0].attributes["aria-selected"], "false");
  assert.equal(parent.children[1].attributes["aria-selected"], "true");
  assert.equal(parent.children[1].children[0].textContent, "c / ç");
  parent.children[0].onclick();
  assert.deepEqual(calls, ["g"]);
});

test("shared final result uses an accessible trophy card and restarts without changing scoring", () => {
  const f = setup();
  let finishes = 0;
  let restarts = 0;
  const game = f.context.ExerciseGame.create({
    onChange() {},
    onFinish() { finishes++; },
  });
  game.reset(3);
  game.validate(true);
  game.next();
  game.validate(false);
  game.validate(true);
  game.next();
  game.validate(true);
  game.next();
  assert.equal(finishes, 1);
  assert.equal(game.score, 2);

  const panel = new Node("div");
  game.finish(panel, () => { restarts++; });
  assert.equal(panel.children.length, 1);
  const card = panel.children[0];
  assert.equal(card.className, "academy-result");
  assert.equal(card.attributes["aria-label"], "Résultat de l'exercice");
  assert.equal(card.children[0].className, "academy-result-trophy");
  assert.equal(card.children[0].attributes["aria-hidden"], "true");
  assert.equal(card.children[1].textContent, "Exercice terminé !");
  const result = card.children[2];
  assert.equal(result.attributes["aria-label"], "Score final : 2");
  assert.equal(result.children[0].textContent, "Ton score");
  assert.equal(result.children[1].children[0].textContent, "2");
  assert.equal(result.children[1].children.length, 1);
  assert.equal(card.children[3].textContent, "Bravo");
  const button = card.children[4].children[0];
  assert.equal(button.type, "button");
  assert.equal(button.textContent, "Recommencer");
  button.onclick();
  assert.equal(restarts, 1);
  assert.equal(finishes, 1);
});

test("numeric controls use identical commands with game-specific labels, limits and disabled state", () => {
  const { context } = setup(),
    ui = context.GameUI,
    commands = [];
  for (const clearLabel of ["C", "Effacer"]) {
    const container = new Node("div");
    ui.keypad(container, (value) => commands.push(value), {
      clearLabel,
      disabled: true,
    });
    assert.equal(container.children.length, 12);
    assert.equal(container.children[9].textContent, clearLabel);
    assert.ok(container.children.every((key) => key.disabled));
    assert.ok(container.children.every((key) => key.className.includes("academy-key")));
    container.children[9].onclick();
    container.children[11].onclick();
  }
  assert.deepEqual(commands, ["clear", "erase", "clear", "erase"]);
  const standard = new Node("div");
  const standardCommands = [];
  ui.keypad(standard, (value) => standardCommands.push(value));
  assert.equal(standard.children.length, 12);
  assert.equal(standard.children[9].className, "academy-key erase academy-key--clear");
  assert.deepEqual(standard.children[9].children.map((span) => span.textContent),
    ["Tout", "effacer"]);
  assert.equal(standard.children[9].attributes["aria-label"], "Tout effacer");
  assert.equal(standard.children[11].className, "academy-key erase academy-key--erase");
  assert.equal(standard.children[11].children[0].tagName, "svg");
  assert.equal(standard.children[11].attributes["aria-label"], "Effacer le dernier chiffre");
  assert.equal(standard.children[11].textContent, undefined);
  standard.children[9].onclick();
  standard.children[11].onclick();
  assert.deepEqual(standardCommands, ["clear", "erase"]);
  assert.equal(ui.editNumber("123", "4", 3), "123");
  assert.equal(ui.editNumber("123", "4", 6), "1234");
  assert.equal(ui.editNumber("12", "erase", 6), "1");
  assert.equal(ui.editNumber("12", "clear", 6), "");
  assert.equal(ui.editNumber("12", "x", 6), "12");
});

test("shared AZERTY Shift, Backspace and numbers/symbols mode", () => {
  const { context } = setup();
  const ui = context.GameUI;
  const keyboard = new Node("div");
  const commands = [];
  ui.azertyKeyboard(keyboard, (command) => commands.push(command));
  const labels = (row) => keyboard.children[row].children.map((key) => key.textContent);
  assert.equal(keyboard.children.length, 5);
  assert.equal(labels(0).slice(0, 9).join(""), "àâéèêùûôç");
  assert.equal(labels(1).join(""), "azertyuiop");
  assert.equal(labels(2).join(""), "qsdfghjklm");
  assert.deepEqual(labels(3).slice(1, 7), ["w", "x", "c", "v", "b", "n"]);
  assert.equal(keyboard.children[3].children[0].children[0].tagName, "svg");
  assert.equal(keyboard.children[3].children[7].children[0].tagName, "svg");
  assert.equal(keyboard.children[3].children[7].textContent, undefined);
  assert.equal(keyboard.children[3].children[0].attributes["aria-pressed"], "false");
  assert.equal(keyboard.children[3].children[7].attributes["aria-label"], "Effacer la dernière lettre");
  assert.deepEqual(labels(4), ["Tout effacer", "Espace", "?123"]);
  assert.equal(keyboard.children[4].children[1].attributes["aria-label"], "Insérer un espace");
  keyboard.children[3].children[0].onclick();
  assert.equal(keyboard.children[3].children[0].attributes["aria-pressed"], "true");
  assert.equal(labels(3)[1], "W");
  keyboard.children[3].children[1].onclick();
  assert.equal(labels(3)[1], "w");
  keyboard.children[0].children[2].onclick();
  keyboard.children[4].children[1].onclick();
  keyboard.children[3].children[7].onclick();
  keyboard.children[4].children[2].onclick();
  assert.equal(labels(0).join(""), "1234567890");
  assert.equal(labels(1).join(""), "@#€%&-+()/");
  assert.equal(keyboard.children[3].children[7].children[0].tagName, "svg");
  assert.equal(keyboard.children[3].children[7].attributes["aria-label"], "Effacer la dernière lettre");
  assert.equal(labels(4)[2], "ABC");
  keyboard.children[0].children[0].onclick();
  keyboard.children[1].children[0].onclick();
  keyboard.children[3].children[7].onclick();
  keyboard.children[4].children[2].onclick();
  assert.equal(labels(0).slice(0, 9).join(""), "àâéèêùûôç");
  keyboard.children[4].children[0].onclick();
  assert.deepEqual(commands, ["W", "é", "space", "erase", "1", "@", "erase", "clear"]);
  assert.equal(ui.editWord("un", "space", 8), "un ");
  assert.equal(ui.editWord("un ", "é", 8), "un é");
  assert.equal(ui.editWord("un ", "erase", 8), "un");
  assert.equal(ui.editWord("un", "space", 2), "un");
  assert.equal(ui.editWord("un", "W", 8), "unW");
  assert.equal(ui.editWord("un", "1", 8), "un1");
  assert.equal(ui.editWord("un", "@", 8), "un@");
  assert.equal(ui.editWord("un", "shift", 8), "un");
  assert.equal(ui.validWordAnswer("Bonjour 2@", 24), true);
  assert.equal(ui.validWordAnswer("Bonjour🙂", 24), false);
  const disabled = new Node("div");
  ui.azertyKeyboard(disabled, () => {}, { disabled: true, clearLabel: "Effacer tout" });
  assert.ok(disabled.children.every((row) => row.children.every((button) => button.disabled)));
  assert.equal(disabled.children[4].children[0].textContent, "Effacer tout");
});

test("accent key changes only the first keyboard row and keeps its page when switching modes", () => {
  const { context } = setup();
  const keyboard = new Node("div");
  const typed = [];
  context.GameUI.azertyKeyboard(keyboard, (value) => typed.push(value));
  const characters = () => keyboard.children[0].children.slice(0, 9)
    .map((button) => button.textContent).join("");
  const accentRow = keyboard.children[0];
  const otherRows = keyboard.children.slice(1);
  const pageKey = () => keyboard.children[0].children[9];

  assert.equal(characters(), "àâéèêùûôç");
  assert.equal(keyboard.children[0].children.length, 10);
  assert.equal(pageKey().children[0].tagName, "svg");
  assert.equal(pageKey().attributes["aria-label"], "Afficher les accents rares");
  pageKey().onclick();
  assert.equal(characters(), "îïäëüöÿœæ");
  assert.equal(keyboard.children[0], accentRow, "first row stays in the same position");
  assert.deepEqual(keyboard.children.slice(1), otherRows, "only accent keys are replaced");
  assert.equal(pageKey().attributes["aria-label"], "Afficher les accents courants");
  assert.deepEqual(typed, [], "page change does not type a character");

  keyboard.children[0].children[0].onclick();
  assert.deepEqual(typed, ["î"]);
  keyboard.children[3].children[0].onclick(); // Shift preserves the second accent page.
  assert.equal(characters(), "ÎÏÄËÜÖŸŒÆ");
  keyboard.children[0].children[1].onclick();
  assert.deepEqual(typed, ["î", "Ï"]);
  assert.equal(characters(), "îïäëüöÿœæ");

  keyboard.children[4].children[2].onclick(); // ?123
  assert.equal(keyboard.children[0].children[0].textContent, "1");
  keyboard.children[4].children[2].onclick(); // ABC
  assert.equal(characters(), "îïäëüöÿœæ");
  pageKey().onclick();
  assert.equal(characters(), "àâéèêùûôç");
  assert.equal(pageKey().attributes["aria-label"], "Afficher les accents rares");

  const disabled = new Node("div");
  context.GameUI.azertyKeyboard(disabled, () => {}, { disabled: true });
  assert.ok(disabled.children[0].children.every((key) => key.disabled));
  assert.equal(disabled.children[0].children[9].disabled, true);
});

test("shared session preserves correction state and remaining delay during score visits; saves once", () => {
  const f = setup();
  let finishes = 0;
  const game = f.context.ExerciseGame.create({
    onChange() {},
    onFinish() {
      finishes++;
    },
  });
  game.reset(2);
  game.validate(false);
  game.validate(true);
  assert.equal(game.score, 0);
  assert.equal(game.failed, true);
  assert.equal(
    game.feedback({ correction: "Correction", retry: "Retry" }).textContent,
    "Correction",
  );
  f.advance(1000);
  game.suspend();
  f.advance(10000);
  assert.equal(game.index, 0);
  assert.equal(game.correct, true);
  game.resume();
  f.advance(1999);
  assert.equal(game.index, 0);
  f.advance(1);
  assert.equal(game.index, 1);
  game.validate(true);
  assert.equal(game.score, 1);
  game.next();
  f.advance(4000);
  game.next();
  assert.equal(finishes, 1);
  assert.equal(game.index, 2);
});

test("rapid Bravo tap advances once and cancels the pending timer", () => {
  const f = setup();
  let button;
  let finishes = 0;
  let game;
  game = f.context.ExerciseGame.create({
    onChange() {
      // Controllers rebuild their markup on state changes.
      button = game.actionButton();
      button.onclick = () => game.correct ? game.next() : game.validate(true);
    },
    onFinish() { finishes++; },
  });
  game.reset(2);
  const verifyButton = button;
  verifyButton.onclick();
  assert.equal(game.correct, true);
  assert.strictEqual(button, verifyButton, "Feedback must not replace the pressed button");
  assert.equal(f.timers.size, 1);
  // The next touch can happen immediately: no 3-second wait.
  button.onclick();
  assert.equal(game.index, 1);
  assert.equal(game.correct, false);
  assert.equal(f.timers.size, 0);
  f.advance(4000);
  assert.equal(game.index, 1);
  assert.equal(finishes, 0);
  game.validate(true);
  button.onclick();
  assert.equal(finishes, 1);
  f.advance(4000);
  assert.equal(finishes, 1);
});

test("all classic exercises keep the same button when success is displayed", () => {
  for (const file of ["francais.js", "calcul.js", "conjugaison.js"]) {
    const extras = file === "conjugaison.js" ? ["conjugaison-data.js"] : [];
    const f = setup(
      ["game-state.js", "game-ui.js", "game-common.js", "exercise-weighting.js", ...extras],
    );
    f.run(file);
    const game = f.sessions[0];
    const panel = f.elements.get("panel");
    const initial = findByClass(panel, "primary");
    assert.ok(initial, file + " should have an initial button");
    const originalIndex = game.index;
    game.validate(true);
    const bravo = findByClass(panel, "primary");
    assert.strictEqual(bravo, initial, file + " replaced the button after validation");
    assert.equal(bravo.disabled, false);
    assert.match(bravo.textContent, /Suivant|score/);
    bravo.onclick();
    assert.equal(game.index, originalIndex + 1, file + " did not advance immediately");
    f.advance(4000);
    assert.equal(game.index, originalIndex + 1, file + " timer advanced twice");
  }
});

test("reset cancels an earlier session auto-next timer", () => {
  const f = setup(),
    game = f.context.ExerciseGame.create({
      onChange() {},
      onFinish() {
        assert.fail("unexpected finish");
      },
    });
  game.reset();
  game.validate(true);
  f.advance(1000);
  game.reset();
  f.advance(5000);
  assert.equal(game.index, 0);
  assert.equal(game.score, 0);
  assert.equal(game.correct, false);
});

test("Additions controller uses the shared keypad and retains typed input over score visits", () => {
  const f = setup();
  f.run("calcul.js");
  const game = f.sessions[0],
    panel = f.elements.get("panel");
  let keypad = findByClass(panel, "keypad");
  keypad.children[0].onclick();
  keypad.children[1].onclick();
  const display = findByClass(panel, "answer-display");
  assert.equal(findByClass(display, "answer-visible").textContent, "12");
  f.context.visit.suspend();
  f.advance(10000);
  f.context.visit.resume();
  assert.equal(findByClass(display, "answer-visible").textContent, "12");
  assert.equal(game.index, 0);
  keypad.children[9].onclick();
  assert.equal(findByClass(display, "answer-visible").textContent.trim(), "");
  // Answer each generated equation through the real controls.
  for (let i = 0; i < game.total; i++) {
    const equation = findByClass(panel, "question").textContent;
    const [a, b] = equation.match(/\d+/g).map(Number);
    keypad = findByClass(panel, "keypad");
    for (const digit of String(a + b))
      keypad.children[digit === "0" ? 10 : Number(digit) - 1].onclick();
    findByClass(panel, "exercise-actions").children[0].onclick();
    assert.equal(game.correct, true);
    f.advance(3000);
  }
  assert.equal(f.saved.length, 1);
  assert.equal(f.saved[0].score, 10);
});

test("French controller uses shared tabs, choice keys and resumable session", () => {
  const f = setup();
  f.run("francais.js");
  const game = f.sessions[0],
    panel = f.elements.get("panel");
  assert.equal(game.total, 10);
  assert.equal(findByClass(panel, "feedback"), null);
  const tabs = f.elements.get("tabs");
  assert.equal(tabs.children.length, 4); // g, c, s, Tout
  assert.ok(tabs.children.every((tab) => tab.className.includes("academy-tab")));
  const options = findByClass(panel, "choices");
  assert.ok(options.children.every((button) => button.className.includes("academy-key")));
  options.children[0].onclick();
  const word = findByClass(panel, "word");
  const reserves = word.children.filter((node) => node.className === "word-reserve");
  assert.deepEqual(reserves.map((node) => node.children[1].textContent), ["g", "gu", "ge"]);
  assert.ok(reserves.every((node) =>
    node.attributes["aria-hidden"] === "true" && node.children.length === 3));
  const visible = findByClass(word, "word-visible");
  const selected = findByClass(visible, "hole").textContent;
  assert.equal(visible.children.length, 3);
  assert.equal(visible.children[1].className, "hole");
  f.context.visit.suspend();
  f.advance(10000);
  f.context.visit.resume();
  assert.equal(findByClass(findByClass(panel, "word-visible"), "hole").textContent, selected);
  assert.deepEqual(findByClass(panel, "word").children
    .filter((node) => node.className === "word-reserve")
    .map((node) => node.children[1].textContent), ["g", "gu", "ge"]);
  assert.equal(f.saved.length, 0);
});

test("French answer slot reserves every choice on the c / ç tab as well", () => {
  const f = setup();
  f.run("francais.js");
  f.elements.get("tabs").children[1].onclick();
  const panel = f.elements.get("panel");
  const word = findByClass(panel, "word");
  const candidates = word.children.filter((node) => node.className === "word-reserve");
  assert.deepEqual(candidates.map((node) => node.children[1].textContent), ["c", "ç"]);
  assert.equal(word.children.at(-1).className, "word-visible");
  findByClass(panel, "choices").children[1].onclick();
  const after = findByClass(panel, "word");
  assert.deepEqual(after.children.filter((node) => node.className === "word-reserve")
    .map((node) => node.children[1].textContent), ["c", "ç"]);
  assert.equal(findByClass(after, "hole").textContent, "ç");
  assert.equal(findByClass(after, "word-visible").children.length, 3);
});

test("Mission calcul uses shared input and removes old sprites on restart", () => {
  const f = setup(["game-state.js", "game-ui.js", "space-engine.js"]);
  const Base = f.context.SpaceGame;
  let game;
  f.context.SpaceGame = class extends Base {
    constructor() {
      super();
      game = this;
    }
  };
  f.context.SpaceEnemies = {
    visual: () => ({ svg: "<svg/>", color: "blue", armor: "gray" }),
  };
  f.run("space.js");
  f.elements.get("start").onclick();
  f.context.frame(1000);
  assert.ok(f.elements.get("sprites").children.length > 0);
  const old = f.elements.get("sprites").children[0];
  f.elements.get("start").onclick();
  assert.ok(!f.elements.get("sprites").children.includes(old));
  const keys = f.elements.get("keypad").children;
  keys[0].onclick();
  keys[1].onclick();
  assert.equal(f.elements.get("answer").textContent, "12");
  f.context.visit.suspend();
  f.context.frame(11000);
  assert.equal(game.time, 0);
  f.context.visit.resume();
  f.context.frame(12000);
  assert.equal(game.time, 0);
});

test("shared exercise countdown resumes after reload with the remaining time", () => {
  const before = setup();
  const first = before.context.ExerciseGame.create({
    onChange() {},
    onFinish() {},
  });
  first.reset(10);
  first.validate(false);
  first.validate(true);
  before.advance(1250);
  const data = first.snapshot();
  assert.equal(data.score, 0);
  assert.equal(data.failed, true);
  const after = setup();
  const restored = after.context.ExerciseGame.create({
    onChange() {},
    onFinish() {},
  });
  assert.equal(restored.restore(data), true);
  assert.equal(restored.failed, true);
  after.advance(1749);
  assert.equal(restored.index, 0);
  after.advance(1);
  assert.equal(restored.index, 1);
  assert.equal(restored.restore({ ...data, index: 99 }), false);
});

test("French and additions keep the same questions, answers and feedback after a refresh", () => {
  for (const file of ["calcul.js", "francais.js"]) {
    const before = setup();
    before.run(file);
    const progress = before.sessions[0];
    const panel = before.elements.get("panel");
    if (file === "calcul.js") {
      findByClass(panel, "keypad").children[1].onclick();
    } else {
      findByClass(panel, "choices").children[1].onclick();
      findByClass(panel, "actions").children[0].onclick(); // May be a correction.
    }
    const stored = JSON.parse(
      before.storage.get(
        "exercices_in_progress_" + (file === "calcul.js" ? "calcul" : "francais"),
      ),
    );
    assert.equal(stored.version, 1);
    const after = setup(undefined, before.storage);
    after.run(file);
    const loaded = JSON.parse(
      after.storage.get(
        "exercices_in_progress_" + (file === "calcul.js" ? "calcul" : "francais"),
      ),
    );
    assert.deepEqual(loaded.session.questions, stored.session.questions);
    assert.deepEqual(loaded.session.progress, stored.session.progress);
    assert.equal(loaded.session.answer ?? loaded.session.selected,
      stored.session.answer ?? stored.session.selected);
    assert.equal(after.sessions[0].index, progress.index);
    assert.equal(after.saved.length, 0);
  }
});

test("arcade state survives refresh with exact ships, missiles, bombs and score", () => {
  function open(storage) {
    const f = setup(["game-state.js", "game-ui.js", "space-engine.js"], storage);
    const Original = f.context.SpaceGame;
    let simulation;
    f.context.SpaceGame = class extends Original {
      constructor() {
        super();
        simulation = this;
      }
    };
    f.context.SpaceEnemies = {
      visual: () => ({ svg: "<svg/>", color: "blue", armor: "gray" }),
    };
    f.run("space.js");
    return { f, simulation };
  }
  const first = open();
  first.f.elements.get("start").onclick();
  first.f.context.frame(1000);
  first.simulation.score = 8;
  first.simulation.bombs = 4;
  first.simulation.missiles.push({ target: 1, x: 0.5, y: 0.8 });
  const original = first.simulation.snapshot();
  first.f.context.visit.suspend();
  const second = open(first.f.storage);
  assert.deepEqual(JSON.parse(JSON.stringify(second.simulation.snapshot())),
    JSON.parse(JSON.stringify(original)));
  assert.equal(second.f.elements.get("overlay").hidden, false);
  assert.equal(second.f.elements.get("start").textContent, "Reprendre");
  assert.equal(second.f.elements.get("points").textContent, 8);
  second.f.context.frame(999999);
  assert.equal(second.simulation.time, original.time);
  second.f.elements.get("start").onclick();
  second.f.context.frame(1000000);
  assert.equal(second.simulation.time, original.time);
  assert.equal(second.f.saved.length, 0);
});

test("explicitly ending arcade session clears recovery data and records exactly once", () => {
  const f = setup(["game-state.js", "game-ui.js", "space-engine.js"]);
  f.context.SpaceEnemies = {
    visual: () => ({ svg: "<svg/>", color: "blue", armor: "gray" }),
  };
  f.run("space.js");
  f.elements.get("start").onclick();
  assert.ok(f.storage.has("exercices_in_progress_space"));
  f.elements.get("end-game").onclick(); // Zero score needs no confirmation.
  assert.equal(f.saved.length, 1);
  assert.equal(f.storage.has("exercices_in_progress_space"), false);
});

test("game state never rewrites historical scores and tolerates broken storage", () => {
  const f = setup();
  const history = '[{"tab":"g","score":6,"legacy":true}]';
  f.storage.set("exercices_francais_scores", history);
  f.storage.set("exercices_in_progress_calcul", "{bad json");
  const saved = f.context.GameState.create("calcul");
  assert.equal(saved.load(), null);
  assert.equal(saved.save({ question: 7 }), true);
  assert.equal(f.storage.get("exercices_francais_scores"), history);
  saved.clear();
  assert.equal(f.storage.has("exercices_in_progress_calcul"), false);
});

test("finishing a question session removes the checkpoint without a duplicate score", () => {
  const f = setup();
  f.run("calcul.js");
  const game = f.sessions[0];
  assert.ok(f.storage.has("exercices_in_progress_calcul"));
  for (let i = 0; i < game.total; i++) {
    const panel = f.elements.get("panel"),
      equation = findByClass(panel, "question").textContent,
      [a, b] = equation.match(/\d+/g).map(Number),
      keypad = findByClass(panel, "keypad");
    for (const digit of String(a + b))
      keypad.children[digit === "0" ? 10 : Number(digit) - 1].onclick();
    findByClass(panel, "exercise-actions").children[0].onclick();
    game.next();
  }
  assert.equal(f.storage.has("exercices_in_progress_calcul"), false);
  assert.equal(f.saved.length, 1);
  game.next();
  assert.equal(f.saved.length, 1);
});

test("game checkpoints remain independent across all game pages", () => {
  const storage = new Map();
  for (const [page, key] of [
    ["francais.js", "francais"],
    ["calcul.js", "calcul"],
  ]) {
    const f = setup(undefined, storage);
    f.run(page);
    assert.ok(storage.has("exercices_in_progress_" + key));
  }
  assert.ok(storage.has("exercices_in_progress_francais"));
  assert.ok(storage.has("exercices_in_progress_calcul"));
  const one = setup(undefined, storage);
  one.run("francais.js");
  assert.ok(storage.has("exercices_in_progress_calcul"));
});


test("French bank keeps a pronounced u visible and tests the g only", () => {
  const source = fs.readFileSync(path.join(__dirname, "..", "francais.js"), "utf8");
  const begin = source.indexOf("  const sets = ") + "  const sets = ".length;
  const end = source.indexOf("\n  const TABS", begin);
  assert.ok(begin > 20 && end > begin);
  const sets = vm.runInNewContext("(" + source.slice(begin, end).trim().replace(/;$/, "") + ")");
  for (const [before, after, answer] of sets.g.items) {
    if (answer === "gu") {
      assert.match(after, /^[aeiouyàâäéèêëîïôöùûü]/i,
        `Pronounced u should not be hidden: ${before}_${after}`);
    }
  }
  for (const [before, after] of [
    ["Ce lé", "ume est mûr."],
    ["La dé", "ustation commence à midi."],
  ]) {
    assert.ok(sets.g.items.some((item) =>
      item[0] === before && item[1] === after && item[2] === "g"));
  }
});

test("French migration resets only corrected word weights, not scores", () => {
  const countsKey = "entrainement_francais_word_counts_v1";
  const errorsKey = "entrainement_francais_word_errors_v1";
  const resetKey = "entrainement_francais_vowel_u_reset_v1";
  const corrected = ['["g","légume"]', '["g","dégustation"]'];
  const other = '["g","guépard"]';
  const history = '[{"legacy":true,"score":7}]';
  const storage = new Map([
    [countsKey, JSON.stringify({ [corrected[0]]: 20, [corrected[1]]: 30, [other]: 8 })],
    [errorsKey, JSON.stringify({ [corrected[0]]: 3, [corrected[1]]: 5, [other]: 2 })],
    ["exercices_francais_scores", history],
  ]);
  const first = setup(undefined, storage);
  first.context.Math = Object.create(Math);
  first.context.Math.random = () => 0;
  first.run("francais.js");
  const counts = JSON.parse(storage.get(countsKey));
  const errors = JSON.parse(storage.get(errorsKey));
  for (const key of corrected) {
    assert.equal(counts[key], undefined);
    assert.equal(errors[key], undefined);
  }
  // The first random question may be this word, incrementing its count once.
  assert.ok(counts[other] === 8 || counts[other] === 9);
  assert.equal(errors[other], 2);
  assert.equal(storage.get(resetKey), "1");
  assert.equal(storage.get("exercices_francais_scores"), history);

  storage.set(countsKey, JSON.stringify({ ...counts, [corrected[0]]: 4 }));
  storage.set(errorsKey, JSON.stringify({ ...errors, [corrected[0]]: 1 }));
  const second = setup(undefined, storage);
  second.context.Math = Object.create(Math);
  second.context.Math.random = () => 0;
  second.run("francais.js");
  assert.equal(JSON.parse(storage.get(countsKey))[corrected[0]], 4);
  assert.equal(JSON.parse(storage.get(errorsKey))[corrected[0]], 1);
});

test("French resumes obsolete active questions with a fresh answer", () => {
  for (const [before, after, fixed] of [
    ["Ce lé", "me est mûr.", "ume est mûr."],
    ["La dé", "station commence à midi.", "ustation commence à midi."],
  ]) {
    const f = setup();
    f.context.GameState.create("francais").save({
      tab: "g",
      questions: Array.from({ length: 10 }, () => [before, after, "gu"]),
      selected: "gu",
      countedThrough: 0,
      progress: { index: 0, score: 1, failed: false, correct: true, total: 10, remaining: 2000 },
    });
    f.run("francais.js");
    const saved = JSON.parse(f.storage.get("exercices_in_progress_francais")).session;
    assert.deepEqual(Array.from(saved.questions[0]), [before, fixed, "g"]);
    assert.equal(saved.selected, null);
    assert.equal(saved.progress.correct, false);
    assert.equal(saved.progress.score, 0);
    assert.equal(saved.progress.remaining, null);
    assert.equal(f.saved.length, 0);
  }
});


test("conjugation keeps its checkpoint and scores only first-try successes", () => {
  const files = [
    "game-state.js", "game-ui.js", "game-common.js",
    "exercise-weighting.js", "conjugaison-data.js",
  ];
  const first = setup(files);
  first.run("conjugaison.js");
  const game = first.sessions[0];
  assert.equal(game.total, 10);
  const key = "exercices_in_progress_conjugaison";
  const checkpoint = JSON.parse(first.storage.get(key)).session;
  assert.equal(checkpoint.questions.length, 10);
  assert.equal(new Set(checkpoint.questions.map((q) =>
    JSON.stringify([q.type, q.verb, q.person]))).size, 10);
  // A full word can be typed through the virtual keyboard.
  const keyboard = findByClass(first.elements.get("panel"), "azerty-keyboard");
  const firstAnswer = checkpoint.questions[0].answer;
  for (const letter of firstAnswer) {
    const keyButton = keyboard.children.flatMap((row) => row.children)
      .find((button) => button.textContent === letter);
    assert.ok(keyButton, "Missing AZERTY key " + letter);
    keyButton.onclick();
  }
  assert.equal(JSON.parse(first.storage.get(key)).session.answer, firstAnswer);
  findByClass(first.elements.get("panel"), "exercise-actions").children[0].onclick();
  assert.equal(game.score, 1);
  first.context.visit.suspend();
  const pending = JSON.parse(first.storage.get(key)).session.progress.remaining;

  const restored = setup(files, first.storage);
  restored.run("conjugaison.js");
  assert.equal(restored.sessions[0].score, 1);
  assert.equal(restored.sessions[0].correct, true);
  assert.equal(JSON.parse(restored.storage.get(key)).session.progress.remaining, pending);
  restored.context.visit.resume();

  for (let n = 0; n < 10; n++) {
    if (!restored.sessions[0].correct) {
      restored.sessions[0].validate(false);
      restored.sessions[0].validate(true);
    }
    restored.sessions[0].next();
  }
  assert.equal(restored.saved.length, 1);
  assert.equal(restored.saved[0].tab, "conjugaison");
  assert.equal(restored.saved[0].score, 1);
  assert.equal(restored.storage.has(key), false);
});


test("settings confirmation freezes the auto-next timer and preserves progress on cancel", async () => {
  const f = setup();
  const game = f.context.ExerciseGame.create({ onChange() {}, onFinish() {} });
  let prompts = 0, applied = 0;
  f.context.AppConfirm = { ask: async () => { prompts++; return false; } };
  game.reset(3);
  await game.changeSettings(false, () => { applied++; });
  assert.equal(prompts, 0);
  assert.equal(applied, 1);
  game.validate(true);
  f.advance(1000);
  const pending = game.changeSettings(true, () => { applied++; });
  assert.equal(f.timers.size, 0);
  f.advance(10000);
  assert.equal(game.index, 0);
  assert.equal(await pending, false);
  assert.equal(applied, 1);
  f.advance(1999);
  assert.equal(game.index, 0);
  f.advance(1);
  assert.equal(game.index, 1);
  f.context.AppConfirm.ask = async () => { prompts++; return true; };
  game.validate(true);
  await game.changeSettings(true, () => { applied++; game.reset(3); });
  assert.equal(applied, 2);
  assert.equal(game.index, 0);
  assert.equal(game.score, 0);
  assert.equal(f.timers.size, 0);
  game.validate(true); game.next();
  game.validate(true); game.next();
  game.validate(true); game.next();
  await game.changeSettings(true, () => { applied++; });
  assert.equal(prompts, 2, "finished series should not ask");
});

test("French tabs do not reset on reselect and confirm only after interaction", async () => {
  const f = setup();
  let prompts = 0, accepts = false;
  f.context.AppConfirm = { ask: async () => { prompts++; return accepts; } };
  f.run("francais.js");
  const tabs = () => f.elements.get("tabs").children;
  const savedKey = "exercices_in_progress_francais";
  const initial = f.storage.get(savedKey);
  tabs()[0].onclick();
  assert.equal(f.storage.get(savedKey), initial);
  tabs()[1].onclick();
  assert.equal(prompts, 0);
  assert.equal(tabs()[1].attributes["aria-selected"], "true");
  findByClass(f.elements.get("panel"), "choices").children[0].onclick();
  const progress = f.storage.get(savedKey);
  tabs()[0].onclick();
  await Promise.resolve();
  await new Promise(setImmediate);
  assert.equal(prompts, 1);
  assert.equal(tabs()[1].attributes["aria-selected"], "true");
  assert.equal(f.storage.get(savedKey), progress);
  accepts = true;
  tabs()[0].onclick();
  await Promise.resolve();
  await new Promise(setImmediate);
  assert.equal(tabs()[0].attributes["aria-selected"], "true");
  assert.equal(f.sessions[0].score, 0);
});

test("Conjugaison tabs preserve typed answers after cancelling", async () => {
  const f = setup(["game-state.js", "game-ui.js", "game-common.js", "exercise-weighting.js", "conjugaison-data.js"]);
  let prompts = 0, accepts = false;
  f.context.AppConfirm = { ask: async () => { prompts++; return accepts; } };
  f.run("conjugaison.js");
  const tabs = () => f.elements.get("conjugaison-tabs").children;
  const savedKey = "exercices_in_progress_conjugaison";
  const initial = f.storage.get(savedKey);
  tabs()[0].onclick();
  assert.equal(f.storage.get(savedKey), initial);
  tabs()[1].onclick();
  assert.equal(prompts, 0);
  findByClass(f.elements.get("panel"), "azerty-keyboard").children[1].children[0].onclick();
  const progress = f.storage.get(savedKey);
  tabs()[0].onclick();
  await Promise.resolve();
  await new Promise(setImmediate);
  assert.equal(prompts, 1);
  assert.equal(f.storage.get(savedKey), progress);
  assert.equal(tabs()[1].attributes["aria-selected"], "true");
  accepts = true;
  tabs()[0].onclick();
  await Promise.resolve();
  await new Promise(setImmediate);
  assert.equal(tabs()[0].attributes["aria-selected"], "true");
  assert.equal(f.sessions[0].score, 0);
});

test("Calcul keeps selects unchanged until a started series confirms a change", async () => {
  const f = setup();
  let prompts = 0, accepts = false;
  f.context.AppConfirm = { ask: async () => { prompts++; return accepts; } };
  f.run("calcul.js");
  const select = (i) => f.elements.get("categories").children[i].children[1];
  const state = () => JSON.parse(f.storage.get("exercices_in_progress_calcul")).session;
  const questions = JSON.stringify(state().questions);
  select(0).onchange();
  assert.equal(JSON.stringify(state().questions), questions);
  select(0).value = "100-1000";
  select(0).onchange();
  assert.equal(prompts, 0);
  assert.equal(state().range, "100-1000");
  findByClass(f.elements.get("panel"), "keypad").children[0].onclick();
  select(1).onchange();
  assert.equal(prompts, 0);
  select(1).value = "2";
  select(1).onchange();
  assert.equal(select(1).value, "1");
  await Promise.resolve();
  await new Promise(setImmediate);
  assert.equal(prompts, 1);
  assert.equal(state().answer, "1");
  assert.equal(state().category, "1");
  accepts = true;
  select(1).value = "2";
  select(1).onchange();
  await Promise.resolve();
  await new Promise(setImmediate);
  assert.equal(state().category, "2");
  assert.equal(state().answer, "");
  assert.equal(select(1).value, "2");
});
