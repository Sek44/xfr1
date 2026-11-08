"use strict";
(() => {
  const levels = {
    1: {
      label: "1 · Unités (1 à 9)",
      values: Array.from({ length: 9 }, (_, i) => i + 1),
    },
    2: {
      label: "2 · Dizaines (10 à 90)",
      values: Array.from({ length: 9 }, (_, i) => (i + 1) * 10),
    },
    3: {
      label: "3 · Centaines (100 à 900)",
      values: Array.from({ length: 9 }, (_, i) => (i + 1) * 100),
    },
    4: {
      label: "4 · Dizaines + unités (11 à 99)",
      values: Array.from({ length: 89 }, (_, i) => i + 11).filter(
        (n) => n % 10 !== 0,
      ),
    },
    5: {
      label: "5 · Centaines + dizaines (110 à 990)",
      values: Array.from({ length: 89 }, (_, i) => (i + 11) * 10).filter(
        (n) => n % 100 !== 0,
      ),
    },
  };
  const ranges = {
    "0-10": [0, 10],
    "10-100": [10, 100],
    "100-1000": [100, 1000],
    "1000-10000": [1000, 10000],
    "Toutes catégories": null,
  };
  let range = "10-100",
    category = "1",
    questions = [],
    answer = "",
    lastQuestionIndex = 0,
    showRetry = false,
    inputFromPhysicalKeyboard = null;
  const storedGame = GameState.create("calcul");
  const result = ExerciseGame.resultTracker(
    "calcul", storedGame, ({ score, total }) => ({
      tab: "math",
      category: "Additions " + range + " / niveau " + category,
      score, total,
    }),
  );
  const game = ExerciseGame.create({
    onChange: () => {
      if (game.index !== lastQuestionIndex) {
        answer = "";
        showRetry = false;
        lastQuestionIndex = game.index;
      }
      render();
      persist();
    },
    onFinish: (outcome) => result.save(outcome),
  });
  const el = (id) => document.getElementById(id);
  function persist() {
    if (!questions.length || (game.index === game.total && !result.pending)) {
      storedGame.clear();
      return;
    }
    storedGame.save({
      range,
      category,
      questions,
      answer,
      progress: game.snapshot(),
      ...result.snapshot(),
    });
  }
  function restore() {
    const state = storedGame.load();
    if (
      !state ||
      !Object.hasOwn(ranges, state.range) ||
      !Object.hasOwn(levels, state.category) ||
      !Array.isArray(state.questions) ||
      state.questions.length < 1 ||
      state.questions.length > 10 ||
      !state.questions.every(
        (q) =>
          q &&
          Number.isInteger(q.a) &&
          Number.isInteger(q.b) &&
          Number.isInteger(q.result) &&
          q.result === q.a + q.b,
      ) ||
      typeof state.answer !== "string" ||
      !/^\d{0,6}$/.test(state.answer) ||
      state.progress?.total !== state.questions.length ||
      (state.progress?.index === state.progress?.total &&
       state.pendingResult !== true) ||
      !result.restore(state)
    )
      return false;
    range = state.range;
    category = state.category;
    questions = state.questions;
    answer = state.answer;
    lastQuestionIndex = state.progress.index;
    return game.restore(state.progress);
  }
  function randint(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  function newSession() {
    result.fresh();
    answer = "";
    showRetry = false;
    questions = [];
    const seen = new Set(),
      values = levels[category].values,
      allRanges =
        range === "Toutes catégories"
          ? Object.values(ranges).filter(Boolean)
          : [ranges[range]];
    const possible = allRanges.flatMap(([min, max]) =>
      values.filter((b) => min + b <= max).map((b) => ({ min, max, b })),
    );
    if (!possible.length) {
      game.reset(0);
      return;
    }
    let attempts = 0;
    while (questions.length < 10 && attempts++ < 3000) {
      const { min, max, b } = possible[randint(0, possible.length - 1)],
        a = randint(min, max - b),
        key = a + "," + b;
      if (seen.has(key) || a < min || a > max || a + b > max) continue;
      seen.add(key);
      questions.push({ a, b, result: a + b });
    }
    game.reset(questions.length);
  }
  function verify() {
    if (!answer.trim() || game.correct) return;
    const isCorrect = /^\d+$/.test(answer.trim()) &&
      Number(answer.trim()) === questions[game.index].result;
    showRetry = !isCorrect;
    game.validate(isCorrect);
  }
  function next() {
    game.next();
  }
  function render() {
    const cats = el("categories");
    cats.replaceChildren();
    function selector(title, items, current, onChange) {
      const wrap = document.createElement("div");
      wrap.className = "setting";
      const label = document.createElement("label");
      label.textContent = title;
      const select = document.createElement("select");
      for (const [value, name] of items) {
        const opt = document.createElement("option");
        opt.value = value;
        opt.textContent = name;
        select.append(opt);
      }
      select.value = current;
      select.onchange = () => {
        const requested = select.value;
        select.value = current;
        if (requested !== current) onChange(requested);
      };
      wrap.append(label, select);
      cats.append(wrap);
    }
    selector(
      "Catégorie",
      Object.keys(ranges).map((x) => [x, x]),
      range,
      (v) => {
        void game.changeSettings(
          game.index > 0 || game.failed || game.correct || answer.length > 0,
          () => {
            range = v;
            newSession();
          },
        );
      },
    );
    selector(
      "Difficulté",
      Object.entries(levels).map(([k, v]) => [k, v.label]),
      category,
      (v) => {
        void game.changeSettings(
          game.index > 0 || game.failed || game.correct || answer.length > 0,
          () => {
            category = v;
            newSession();
          },
        );
      },
    );
    const sc = el("score");
    game.progress(sc, "Calcul");
    const p = el("panel");
    p.classList.toggle("academy-playing", questions.length > 0 && game.index !== game.total);
    p.replaceChildren();
    inputFromPhysicalKeyboard = null;
    if (!questions.length) {
      const message = document.createElement("p");
      message.textContent =
        "Cette difficulté ne permet aucune addition dans la catégorie choisie. Sélectionne une autre difficulté ou catégorie.";
      p.append(message);
      return;
    }
    if (game.index === game.total) {
      game.finish(p, newSession, result.pending ? {
        message: result.message,
        retry: () => {
          result.save({ score: game.score, total: game.total });
          render();
          persist();
        },
      } : null);
      return;
    }

    const equation = document.createElement("div");
    equation.className = "equation-row";
    const q = document.createElement("div");
    q.className = "question";
    q.textContent =
      questions[game.index].a + " + " + questions[game.index].b + " =";
    equation.append(q);
    const display = document.createElement("div");
    display.className = "answer-display";
    display.setAttribute("role", "status");
    display.setAttribute("aria-label", "Résultat saisi : " + (answer || "vide"));
    // Match Conjugaison: keep the field stable as digits are entered.
    const reserve = document.createElement("span");
    reserve.className = "answer-reserve";
    reserve.setAttribute("aria-hidden", "true");
    reserve.textContent = String(questions[game.index].result);
    const visible = document.createElement("span");
    visible.className = "answer-visible";
    visible.setAttribute("aria-hidden", "true");
    visible.textContent = answer || "\u00a0";
    display.append(reserve, visible);
    equation.append(display);
    const questionFrame = document.createElement("div");
    questionFrame.className = "question-frame";
    questionFrame.append(equation);
    p.append(questionFrame);
    const controls = document.createElement("div");
    controls.className = "keyboard-panel";
    const keypad = document.createElement("div");
    keypad.className = "keypad";
    function edit(value) {
      if (game.correct) return;
      const nextAnswer = GameUI.editNumber(answer, value, 6);
      if (nextAnswer !== answer) {
        answer = nextAnswer;
        showRetry = false;
        button.classList.remove("feedback-retry");
        button.textContent = "Vérifier";
      }
      visible.textContent = answer || "\u00a0";
      display.setAttribute("aria-label", "Résultat saisi : " + (answer || "vide"));
      button.disabled = !answer.length;
      persist();
    }
    inputFromPhysicalKeyboard = edit;
    GameUI.keypad(keypad, edit, { disabled: game.correct });
    controls.append(keypad);
    const button = game.actionButton();
    button.disabled = !game.correct && !answer.trim();
    button.classList.toggle("feedback-success", game.correct);
    button.classList.toggle("feedback-retry", !game.correct && showRetry);
    button.textContent = game.correct
      ? game.index === game.total - 1
        ? "Bravo ! Voir mon score"
        : game.failed ? "Bien corrigé ! Suivant" : "Bravo ! Suivant"
      : showRetry ? "Incorrect · Réessaie" : "Vérifier";
    button.onclick = () => game.correct ? next() : verify();
    const actions = document.createElement("div");
    actions.className = "exercise-actions";
    actions.append(button);
    controls.append(actions);
    p.append(controls);
  }
  document.addEventListener("keydown", (event) => {
    if (!el("panel").querySelector(".keypad")) return;
    GameUI.handlePhysicalKeyboard(
      event,
      game.correct ? null : inputFromPhysicalKeyboard,
      { onEnter: () => game.correct ? next() : verify() },
    );
  });
  document.getElementById("restart-series").onclick = game.restartButton(newSession).onclick;
  if (!restore()) newSession();

  ScoreView.bind({
    suspend: () => {
      game.suspend();
      persist();
    },
    resume: () => game.resume(),
  });
  window.addEventListener("pagehide", () => {
    game.suspend();
    persist();
  });
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) game.resume();
  });
})();
