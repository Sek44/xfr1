"use strict";
(() => {
  const SESSION_SIZE = 10;
  const tracker = ExerciseWeighting.create({
    appearancesKey: "entrainement_conjugaison_counts_v1",
    errorsKey: "entrainement_conjugaison_errors_v1",
  });
  const stored = GameState.create("conjugaison");
  const possible = ConjugaisonData.possibleQuestions();
  let questions = [], answer = "", lastIndex = 0, countedThrough = -1;
  const game = ExerciseGame.create({
    onChange() {
      if (lastIndex !== game.index) {
        answer = "";
        lastIndex = game.index;
      }
      if (game.index < questions.length && game.index > countedThrough) {
        tracker.appearance(ConjugaisonData.key(questions[game.index]));
        countedThrough = game.index;
      }
      render();
      persist();
    },
    onFinish({ score, total }) {
      stored.clear();
      ExerciseScores.save({
        tab: "conjugaison",
        category: "Présent de l’indicatif · 1er groupe",
        score, total,
      });
      window.DailyExercises?.award("conjugaison");
    },
  });
  function persist() {
    if (game.index === game.total) {
      stored.clear();
      return;
    }
    stored.save({ mode: "present-1", questions, answer, countedThrough, progress: game.snapshot() });
  }
  function restore() {
    const state = stored.load();
    if (!state || state.mode !== "present-1" ||
        !Array.isArray(state.questions) ||
        state.questions.length !== SESSION_SIZE ||
        !state.questions.every((q) => ConjugaisonData.valid(q)) ||
        new Set(state.questions.map(ConjugaisonData.key)).size !== SESSION_SIZE ||
        typeof state.answer !== "string" ||
        !/^[a-zàâäéèêëîïôöùûüÿçœæ ]{0,24}$/i.test(state.answer) ||
        state.progress?.total !== SESSION_SIZE) return false;
    questions = state.questions;
    answer = state.answer;
    lastIndex = state.progress.index;
    countedThrough = Number.isInteger(state.countedThrough)
      ? Math.min(lastIndex, Math.max(-1, state.countedThrough))
      : lastIndex - 1;
    return game.restore(state.progress);
  }
  function restart() {
    answer = "";
    lastIndex = 0;
    countedThrough = -1;
    questions = tracker.choose(possible, SESSION_SIZE);
    game.reset(SESSION_SIZE);
  }
  function edit(command) {
    if (game.correct) return;
    answer = GameUI.editWord(answer, command, 24);
    updateAnswer();
    persist();
  }
  function updateAnswer() {
    const field = document.getElementById("typed-answer");
    if (field) field.textContent = answer || "\u00a0\u00a0\u00a0";
    const verifyButton = document.getElementById("verify-button");
    if (verifyButton && !game.correct) verifyButton.disabled = !answer.length;
  }
  function verify() {
    if (!answer || game.correct) return;
    const current = questions[game.index];
    const success = ConjugaisonData.matchesAnswer(current, answer);
    if (!success && !game.failed) tracker.error(ConjugaisonData.key(current));
    game.validate(success);
  }
  function render() {
    const score = document.getElementById("score-card");
    const panel = document.getElementById("panel");
    game.progress(score);
    panel.replaceChildren();
    if (game.index === game.total) {
      game.finish(panel, restart);
      return;
    }
    const q = questions[game.index];
    const heading = GameUI.element("p", "verb-label");
    heading.append(GameUI.element("span", "verb-caption", "Verbe à conjuguer"));
    heading.append(GameUI.element("strong", "", q.verb));
    panel.append(heading);
    const sentence = GameUI.element("div", "conjugaison-sentence");
    sentence.append(document.createTextNode(ConjugaisonData.prefix(q.subject, q.answer)));
    const field = GameUI.element("span", "typed-answer", answer || "\u00a0\u00a0\u00a0");
    field.id = "typed-answer";
    field.setAttribute("role", "status");
    field.setAttribute("aria-label", "Réponse : " + (answer || "vide"));
    sentence.append(field, document.createTextNode(" " + q.complement));
    panel.append(sentence);
    const keyboard = GameUI.element("div", "azerty-keyboard");
    GameUI.azertyKeyboard(keyboard, edit, { disabled: game.correct });
    panel.append(keyboard);
    panel.append(game.feedback({
      correction: "Bonne correction ! Pas de point pour cette phrase.",
      retry: "Ce n’est pas la bonne conjugaison. Corrige et réessaie.",
    }));
    const actions = GameUI.element("div", "exercise-actions");
    const button = game.actionButton();
    button.id = "verify-button";
    button.disabled = !game.correct && !answer.length;
    button.onclick = game.correct ? () => game.next() : verify;
    actions.append(button);
    panel.append(actions);
  }
  document.addEventListener("keydown", (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey || ScoreViewOpen()) return;
    const target = event.target;
    if (target?.closest?.("input, textarea, select, button, a")) return;
    if (event.key === "Enter") {
      event.preventDefault();
      if (game.correct) game.next();
      else verify();
    } else if (event.key === "Backspace") {
      event.preventDefault();
      edit("erase");
    } else if (event.key === " ") {
      event.preventDefault();
      edit("space");
    } else if (event.key.length === 1) {
      if (/^[a-zàâäéèêëîïôöùûüÿçœæ]$/i.test(event.key)) {
        event.preventDefault();
        edit(event.key.toLocaleLowerCase("fr"));
      }
    }
  });
  let scoreView = null;
  function ScoreViewOpen() { return scoreView?.open; }
  document.getElementById("restart-series").onclick = game.restartButton(restart).onclick;
  if (!restore()) restart();
  scoreView = ScoreView.bind({
    suspend: () => { game.suspend(); persist(); },
    resume: () => game.resume(),
  });
  window.addEventListener("pagehide", () => { game.suspend(); persist(); });
  window.addEventListener("pageshow", (event) => { if (event.persisted) game.resume(); });
})();
