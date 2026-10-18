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
function setup(files = ["game-ui.js", "game-common.js"]) {
  let now = 0,
    id = 0;
  const timers = new Map(),
    elements = new Map(),
    sessions = [],
    saved = [];
  const context = {
    window: null,
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
  return { context, run, advance, elements, sessions, saved, timers };
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
  const f = setup(["game-ui.js", "space-engine.js"]);
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
