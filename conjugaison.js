"use strict";
(() => {
  const SESSION_SIZE = 10;
  const MODES = {
    "present-1": "Présent de l’indicatif · 1er groupe",
    "present-2": "Présent de l’indicatif · 2e groupe",
    "etre-avoir": "Présent de l’indicatif · être et avoir",
    all: "Tout",
  };
  const TABS = [
    ["present-1", "Présent - 1er"],
    ["present-2", "Présent - 2e"],
    ["etre-avoir", "Être et avoir"],
    ["all", "Tout"],
  ];
  const tracker = ExerciseWeighting.create({
    appearancesKey: "entrainement_conjugaison_counts_v1",
    errorsKey: "entrainement_conjugaison_errors_v1",
  });
  const stored = GameState.create("conjugaison");
  let mode = "present-1";
  let questions = [], answer = "", lastIndex = 0, countedThrough = -1;
  const result = ExerciseGame.resultTracker(
    "conjugaison", stored,
    ({ score, total }) => ({ tab: "conjugaison", category: MODES[mode], score, total }),
  );
  // A persistent live region announces feedback without occupying any layout space.
  const feedbackStatus = GameUI.element("div", "conjugaison-feedback-live");
  feedbackStatus.setAttribute("role", "status");
  feedbackStatus.setAttribute("aria-live", "polite");
  feedbackStatus.setAttribute("aria-atomic", "true");
  document.querySelector("main").append(feedbackStatus);
  let showRetry = false;
  const rewardCategory = (index) => window.RewardRules
    ? RewardRules.key("conjugaison", questions[index].type === "ir" ?
    "present-2" : questions[index].type === "aux" ? "etre-avoir" : "present-1") : "conjugaison:base";
  function configureRewards() {
    result.configure?.(questions.map((_, index) => rewardCategory(index)));
  }
  const game = ExerciseGame.create({
    onChange() {
      if (lastIndex !== game.index) {
        answer = "";
        lastIndex = game.index;
        showRetry = false;
      }
      if (game.index < questions.length && game.index > countedThrough) {
        tracker.appearance(ConjugaisonData.key(questions[game.index]));
        countedThrough = game.index;
      }
      render();
      persist();
    },
    categoryForQuestion: rewardCategory,
    onAttempt: () => result.begin?.() !== false,
    onFinish(outcome) {
      result.save(outcome);
    },
  });
  function persist() {
    if (game.index === game.total && !result.pending) {
      stored.clear();
      return;
    }
    stored.save({
      mode, questions, answer, countedThrough, progress: game.snapshot(),
      ...result.snapshot(),
    });
  }
  function restore() {
    const state = stored.load();
    if (!state || !Object.hasOwn(MODES, state.mode) ||
        !Array.isArray(state.questions) ||
        state.questions.length !== SESSION_SIZE ||
        !state.questions.every((q) =>
          ConjugaisonData.valid(q) &&
          ConjugaisonData.inMode(state.mode, q.type)) ||
        new Set(state.questions.map(ConjugaisonData.key)).size !== SESSION_SIZE ||
        typeof state.answer !== "string" ||
        !GameUI.validWordAnswer(state.answer, 24) ||
        state.progress?.total !== SESSION_SIZE ||
        (state.progress?.index === state.progress?.total &&
         state.pendingResult !== true) ||
        !result.restore(state)) return false;
    mode = state.mode;
    questions = state.questions;
    configureRewards();
    answer = state.answer;
    lastIndex = state.progress.index;
    countedThrough = Number.isInteger(state.countedThrough)
      ? Math.min(lastIndex, Math.max(-1, state.countedThrough))
      : lastIndex - 1;
    return game.restore(state.progress);
  }
  function restart() {
    result.fresh();
    answer = "";
    lastIndex = 0;
    countedThrough = -1;
    questions = tracker.choose(ConjugaisonData.possibleQuestions(mode), SESSION_SIZE);
    configureRewards();
    game.reset(SESSION_SIZE);
  }
  function switchMode(nextMode) {
    if (!Object.hasOwn(MODES, nextMode) || nextMode === mode) return;
    void game.changeSettings(
      game.index > 0 || game.failed || game.correct || answer.length > 0,
      () => {
        mode = nextMode;
        GameUI.tabs(document.getElementById("conjugaison-tabs"), TABS, mode, switchMode);
        restart();
      },
    );
  }
  function edit(command) {
    if (game.correct) return;
    const updated = GameUI.editWord(answer, command, 24);
    // Once the child starts correcting, restore the normal blue action button.
    if (updated !== answer) showRetry = false;
    answer = updated;
    updateAnswer();
    persist();
  }
  function updateAnswer() {
    const visible = document.getElementById("typed-answer-visible");
    if (visible) visible.textContent = answer || "\u00a0";
    const field = document.getElementById("typed-answer");
    if (field) field.setAttribute("aria-label", "Réponse : " + (answer || "vide"));
    const verifyButton = document.getElementById("verify-button");
    if (verifyButton && !game.correct) {
      verifyButton.disabled = !answer.length;
      if (!showRetry) {
        verifyButton.classList.remove("feedback-retry");
        verifyButton.textContent = "Vérifier";
        feedbackStatus.textContent = "";
      }
    }
  }
  function verify() {
    if (!answer || game.correct) return;
    const current = questions[game.index];
    const success = ConjugaisonData.matchesAnswer(current, answer);
    if (!success && !game.failed) tracker.error(ConjugaisonData.key(current));
    showRetry = !success;
    game.validate(success);
  }
  function render() {
    const score = document.getElementById("score-card");
    const panel = document.getElementById("panel");
    game.progress(score);
    panel.classList.toggle("academy-playing", game.index !== game.total);
    panel.replaceChildren();
    if (game.index === game.total) {
      game.finish(panel, restart, result.pending ? {
        message: result.message,
        retry: () => {
          result.save({ score: game.score, total: game.total, answers: game.answers });
          render();
          persist();
        },
      } : null, result.reward?.());
      return;
    }
    if (result.allowed?.() === false) {
      panel.append(GameUI.element("p", "academy-reward-unavailable",
        "Cet exercice a atteint sa limite quotidienne, ou le stockage des récompenses est indisponible."));
      return;
    }
    const q = questions[game.index];
    // A decorative frame groups the verb and the sentence without narrowing the shared keyboard.
    const questionFrame = GameUI.element("div", "question-frame");
    const heading = GameUI.element("p", "verb-label");
    heading.append(GameUI.element("span", "verb-caption", "Verbe à conjuguer :"));
    heading.append(GameUI.element("strong", "", q.verb));
    questionFrame.append(heading);
    const sentence = GameUI.element("div", "conjugaison-sentence");
    sentence.append(document.createTextNode(ConjugaisonData.prefix(q.subject, q.answer)));
    // Reserve the exact rendered width of the expected conjugation from the
    // beginning. Typing changes only the visible overlay; an incorrect answer
    // expands the slot only when its own rendered text is wider.
    const field = GameUI.element("span", "typed-answer");
    field.id = "typed-answer";
    field.setAttribute("role", "status");
    field.setAttribute("aria-label", "Réponse : " + (answer || "vide"));
    const reserve = GameUI.element("span", "answer-reserve", q.answer);
    reserve.setAttribute("aria-hidden", "true");
    const visible = GameUI.element("span", "answer-visible", answer || "\u00a0");
    visible.id = "typed-answer-visible";
    visible.setAttribute("aria-hidden", "true");
    field.append(reserve, visible);
    sentence.append(field, document.createTextNode(" " + q.complement));
    questionFrame.append(sentence);
    panel.append(questionFrame);
    // The keyboard and action area form their own parchment card, separate
    // from the image-backed question frame.
    const keyboardPanel = GameUI.element("div", "keyboard-panel");
    const keyboard = GameUI.element("div", "azerty-keyboard");
    GameUI.azertyKeyboard(keyboard, edit, { disabled: game.correct });
    // A deliberately two-line caption allows comfortable side padding while
    // retaining the original accessible label and clear-button action.
    const clearButton = keyboard.querySelector(".keyboard-key--clear");
    if (clearButton) {
      clearButton.replaceChildren(
        GameUI.element("span", "", "Tout"),
        GameUI.element("span", "", "effacer"),
      );
    }
    keyboardPanel.append(keyboard);
    // Feedback goes through the button and the existing live region, not a
    // visible panel that would push the action off-screen.
    const actions = GameUI.element("div", "exercise-actions");
    const button = game.actionButton();
    button.id = "verify-button";
    button.disabled = !game.correct && !answer.length;
    if (game.correct) {
      button.classList.add("feedback-success");
      button.textContent = game.index === game.total - 1
        ? "Bravo ! Voir mon score"
        : game.failed ? "Bien corrigé ! Suivant" : "Bravo ! Suivant";
      feedbackStatus.textContent = game.failed
        ? "Bonne correction ! Pas de point pour cette phrase."
        : "Bravo ! +1 point";
    } else if (game.failed && showRetry) {
      button.classList.add("feedback-retry");
      button.textContent = "Incorrect · Réessaie";
      feedbackStatus.textContent = "Ce n’est pas la bonne conjugaison. Corrige et réessaie.";
    } else {
      feedbackStatus.textContent = "";
    }
    button.onclick = () => game.correct ? game.next() : verify();
    actions.append(button);
    keyboardPanel.append(actions);
    panel.append(keyboardPanel);
  }
  document.addEventListener("keydown", (event) => {
    if (ScoreViewOpen() || !document.querySelector("#panel .azerty-keyboard")) return;
    GameUI.handlePhysicalKeyboard(event, game.correct ? null : edit, {
      layout: "word",
      onEnter: () => game.correct ? game.next() : verify(),
    });
  });
  let scoreView = null;
  function ScoreViewOpen() { return scoreView?.open; }
  document.getElementById("restart-series").onclick = game.restartButton(restart).onclick;
  if (!restore()) restart();
  GameUI.tabs(document.getElementById("conjugaison-tabs"), TABS, mode, switchMode);
  scoreView = ScoreView.bind({
    suspend: () => { game.suspend(); persist(); },
    resume: () => game.resume(),
    subcategory: () => mode,
  });
  window.addEventListener("pagehide", () => { game.suspend(); persist(); });
  window.addEventListener("pageshow", (event) => { if (event.persisted) game.resume(); });
})();
