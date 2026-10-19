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
    this.classList = { toggle() {} };
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
}
function setup(files = ["game-state.js", "game-ui.js", "game-common.js"], storage = new Map()) {
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
    container.children[9].onclick();
    container.children[11].onclick();
  }
  assert.deepEqual(commands, ["clear", "erase", "clear", "erase"]);
  assert.equal(ui.editNumber("123", "4", 3), "123");
  assert.equal(ui.editNumber("123", "4", 6), "1234");
  assert.equal(ui.editNumber("12", "erase", 6), "1");
  assert.equal(ui.editNumber("12", "clear", 6), "");
  assert.equal(ui.editNumber("12", "x", 6), "12");
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
  let keypad = panel.children.find((node) => node.className === "keypad");
  keypad.children[0].onclick();
  keypad.children[1].onclick();
  const display = panel.children[0].children[1];
  assert.equal(display.textContent, "12");
  f.context.visit.suspend();
  f.advance(10000);
  f.context.visit.resume();
  assert.equal(display.textContent, "12");
  assert.equal(game.index, 0);
  keypad.children[9].onclick();
  assert.equal(display.textContent, " ");
  // Answer each generated equation through the real controls.
  for (let i = 0; i < game.total; i++) {
    const equation = panel.children[0].children[0].textContent;
    const [a, b] = equation.match(/\d+/g).map(Number);
    keypad = panel.children.find((node) => node.className === "keypad");
    for (const digit of String(a + b))
      keypad.children[digit === "0" ? 10 : Number(digit) - 1].onclick();
    panel.children.at(-1).children[0].onclick();
    assert.equal(game.correct, true);
    f.advance(3000);
  }
  assert.equal(f.saved.length, 1);
  assert.equal(f.saved[0].score, 10);
});

test("French controller starts with shared progress, feedback and resumable session", () => {
  const f = setup();
  f.run("francais.js");
  const game = f.sessions[0],
    panel = f.elements.get("panel");
  assert.equal(game.total, 10);
  assert.equal(
    panel.children.find((node) => node.className === "feedback ").attributes
      .role,
    "status",
  );
  const options = panel.children.find((node) => node.className === "choices");
  options.children[0].onclick();
  const selected = panel.children[0].children[1].children[1].textContent;
  f.context.visit.suspend();
  f.advance(10000);
  f.context.visit.resume();
  assert.equal(panel.children[0].children[1].children[1].textContent, selected);
  assert.equal(f.saved.length, 0);
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
      panel.children.find((n) => n.className === "keypad").children[1].onclick();
    } else {
      panel.children.find((n) => n.className === "choices").children[1].onclick();
      panel.children.at(-1).children[0].onclick(); // May be a correction.
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
