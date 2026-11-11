"use strict";
(() => {
  const model = MonnaieModel;
  const storedGame = GameState.create("monnaie");
  let questions = [];
  let selection = [];
  let lastQuestionIndex = 0;
  let showRetry = false;
  const result = ExerciseGame.resultTracker(
    "monnaie", storedGame, ({ score, total }) => ({
      tab: "monnaie",
      category: "Monnaie",
      score, total,
    }),
  );
  const game = ExerciseGame.create({
    onChange: () => {
      if (game.index !== lastQuestionIndex) {
        selection = [];
        showRetry = false;
        lastQuestionIndex = game.index;
      }
      render();
      persist();
    },
    onFinish: (outcome) => result.save(outcome),
  });
  const el = (id) => document.getElementById(id);
  const findItem = (cents) =>
    [...model.COINS, ...model.NOTES].find((item) => item.cents === cents);

  function persist() {
    if (!questions.length || (game.index === game.total && !result.pending)) {
      storedGame.clear();
      return;
    }
    storedGame.save({
      questions,
      selection,
      progress: game.snapshot(),
      ...result.snapshot(),
    });
  }

  function restore() {
    const state = storedGame.load();
    if (!state ||
        !Array.isArray(state.questions) || state.questions.length !== 10 ||
        !state.questions.every(model.validQuestion) ||
        new Set(state.questions.map((q) => q.paid + ":" + q.price)).size !== state.questions.length ||
        !model.validSelection(state.selection) ||
        state.progress?.total !== state.questions.length ||
        (state.progress?.index === state.progress?.total &&
          state.pendingResult !== true) ||
        !result.restore(state)) return false;
    questions = state.questions;
    selection = model.sortSelection(state.selection);
    lastQuestionIndex = state.progress.index;
    showRetry = state.progress.failed && !state.progress.correct;
    return game.restore(state.progress);
  }

  function newSession() {
    result.fresh();
    questions = model.generateQuestions();
    selection = [];
    showRetry = false;
    lastQuestionIndex = 0;
    game.reset(questions.length);
  }

  function verify() {
    if (game.correct || !selection.length) return;
    const right = model.isCorrect(questions[game.index], selection);
    showRetry = !right;
    game.validate(right);
  }

  function element(tag, className, text) {
    return GameUI.element(tag, className, text);
  }

  function moneyButton(item, action, selected = false) {
    const kind = item.cents <= 200 ? "coin" : "note";
    const button = element(
      "button",
      "money-" + (selected ? "picked" : "option") + " money-" +
        (selected ? "picked" : "option") + "--" + kind,
    );
    button.type = "button";
    button.disabled = game.correct;
    button.setAttribute(
      "aria-label",
      (selected ? "Retirer " : "Ajouter ") +
        (kind === "coin" ? "la pièce de " : "le billet de ") + item.name,
    );
    button.title = button.getAttribute("aria-label");
    if (kind === "coin")
      button.style.setProperty("--coin-size", item.size + "px");
    else
      button.style.setProperty("--banknote-width", item.width + "px");
    button.append(MonnaieArt.create(item));
    button.onclick = action;
    return button;
  }

  function render() {
    game.progress(el("score"));
    const panel = el("panel");
    panel.classList.toggle("academy-playing", questions.length > 0 && game.index < game.total);
    panel.replaceChildren();

    if (game.index === game.total) {
      game.finish(panel, newSession, result.pending ? {
        message: result.message,
        retry: () => {
          result.save({ score: game.score, total: game.total });
          render();
          persist();
        },
      } : null);
      return;
    }

    const current = questions[game.index];
    const questionFrame = element("section", "question-frame money-question");
    questionFrame.setAttribute("aria-label", "Achat et paiement");

    const purchase = element("div", "money-purchase");
    const price = element("div", "money-price");
    const priceLine = element("div", "money-price-line");
    const object = MonnaieObjects.choose(current);
    priceLine.append(
      MonnaieObjects.create(object),
      element("strong", "money-price-value", model.format(current.price)),
    );
    price.append(element("span", "money-caption", "Prix de l’achat"), priceLine);
    const paid = element("div", "money-paid");
    const note = model.NOTES.find((item) => item.cents === current.paid);
    paid.style.setProperty("--banknote-width", Math.round(note.width * 0.69) + "px");
    paid.append(
      element("span", "money-caption money-caption--stacked", "Le client\ndonne"),
      MonnaieArt.create(note),
    );
    const paidText = element("span", "visually-hidden", "Billet de " + note.name);
    paid.append(paidText);
    purchase.append(price, paid);
    questionFrame.append(purchase);
    panel.append(questionFrame);

    const controls = element("div", "keyboard-panel money-controls");
    const tray = element("section", "money-tray");
    const chosen = element("div", "money-selection");
    chosen.setAttribute("role", "group");
    chosen.setAttribute("aria-label", "Pièces et billets à rendre au client");
    const remark = element("p", "money-customer-remark");
    remark.setAttribute("role", "status");
    remark.setAttribute("aria-live", "polite");
    const count = element("p", "money-count");
    count.setAttribute("role", "status");
    count.setAttribute("aria-live", "polite");
    tray.append(chosen, remark, count);
    controls.append(tray);

    const button = game.actionButton();
    // Rebuild the answer after every game state change, including validation.
    // Only user edits reset retry feedback and write an extra saved snapshot.
    function refreshSelection(edited = false) {
      chosen.replaceChildren();
      if (!selection.length) {
        chosen.append(element("p", "money-empty", "Choisis les pièces et billets à rendre."));
      } else {
        for (const [index, cents] of selection.entries()) {
          const item = findItem(cents);
          chosen.append(moneyButton(item, () => {
            if (game.correct) return;
            selection = model.sortSelection(model.remove(selection, index));
            showRetry = false;
            refreshSelection(true);
          }, true));
        }
      }
      count.textContent = selection.length
        ? selection.length + " élément" + (selection.length > 1 ? "s" : "") + " sélectionné" +
          (selection.length > 1 ? "s" : "")
        : "Aucun élément sélectionné";
      const customerMessage = game.correct
        ? model.customerThanks(current)
        : showRetry ? model.customerRemark(current, selection) : "";
      remark.replaceChildren();
      if (customerMessage) {
        remark.append(
          MonnaieCustomers.create(current),
          element("span", "money-customer-text", customerMessage),
        );
      }
      remark.classList.toggle("is-visible", !!customerMessage);
      remark.classList.toggle("is-success", game.correct && !!customerMessage);
      button.disabled = !game.correct && !selection.length;
      if (edited) {
        if (!game.correct) {
          button.classList.remove("feedback-retry");
          button.textContent = "Vérifier";
        }
        persist();
      }
    }

    function palette(items, kind) {
      const group = element("section", "money-palette");
      group.setAttribute("role", "group");
      group.setAttribute("aria-label", kind === "coins" ? "Ajouter des pièces" : "Ajouter des billets");
      const grid = element("div", "money-grid money-grid--" + kind);
      for (const item of items) {
        grid.append(moneyButton(item, () => {
          if (game.correct) return;
          const updated = model.add(selection, item.cents);
          if (updated === selection) return;
          selection = model.sortSelection(updated);
          showRetry = false;
          refreshSelection(true);
        }));
      }
      group.append(grid);
      controls.append(group);
    }
    palette(model.COINS, "coins");
    palette(model.NOTES, "notes");

    button.disabled = !game.correct && !selection.length;
    button.classList.toggle("feedback-success", game.correct);
    button.classList.toggle("feedback-retry", !game.correct && showRetry);
    button.textContent = game.correct
      ? game.index === game.total - 1
        ? "Bravo ! Voir mon score"
        : game.failed ? "Bien corrigé ! Suivant" : "Bravo ! Suivant"
      : showRetry ? "Incorrect · Réessaie" : "Vérifier";
    button.onclick = () => game.correct ? game.next() : verify();
    const actions = element("div", "exercise-actions");
    actions.append(button);
    controls.append(actions);
    panel.append(controls);
    // Validation re-renders the panel but must keep all submitted pieces
    // visible (and disabled on success) until the next question begins.
    refreshSelection();
  }

  document.getElementById("restart-series").onclick =
    game.restartButton(newSession).onclick;
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
