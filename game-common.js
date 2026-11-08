"use strict";
window.ExerciseGame = (() => {
  const DELAY_MS = 3000;
  function create({ onChange, onFinish }) {
    let index = 0,
      score = 0,
      failed = false,
      correct = false,
      total = 10,
      timer = null,
      deadline = 0,
      remaining = null,
      action = null;
    function cancel() {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      remaining = null;
    }
    function schedule(delay) {
      deadline = Date.now() + delay;
      timer = setTimeout(next, delay);
    }
    function suspend() {
      if (timer !== null) {
        remaining = Math.max(0, deadline - Date.now());
        clearTimeout(timer);
        timer = null;
      }
    }
    function resume() {
      if (remaining !== null) {
        const delay = remaining;
        remaining = null;
        schedule(delay);
      }
    }
    function reset(count = 10) {
      cancel();
      index = 0;
      score = 0;
      failed = false;
      correct = false;
      total = count;
      onChange();
    }
    function validate(isRight) {
      if (correct) return;
      if (isRight) {
        correct = true;
        if (!failed) score++;
        cancel();
        schedule(DELAY_MS);
      } else failed = true;
      onChange();
    }
    function next() {
      if (!correct) return;
      cancel();
      index++;
      failed = false;
      correct = false;
      if (index === total) onFinish({ score, total });
      onChange();
    }
    // The countdown resumes from the saved remainder, not elapsed wall-clock time.
    function snapshot() {
      return {
        index,
        score,
        failed,
        correct,
        total,
        remaining: correct
          ? timer !== null
            ? Math.max(0, deadline - Date.now())
            : remaining
          : null,
      };
    }
    function restore(state) {
      if (
        !state ||
        !Number.isInteger(state.total) ||
        state.total < 1 ||
        state.total > 100 ||
        !Number.isInteger(state.index) ||
        state.index < 0 ||
        state.index > state.total ||
        (state.index === state.total &&
          (state.correct || state.failed || state.remaining !== null)) ||
        !Number.isInteger(state.score) ||
        state.score < 0 ||
        state.score > state.index + 1 ||
        typeof state.failed !== "boolean" ||
        typeof state.correct !== "boolean" ||
        (state.correct &&
          (!Number.isFinite(state.remaining) ||
            state.remaining < 0 ||
            state.remaining > DELAY_MS))
      )
        return false;
      cancel();
      index = state.index;
      score = state.score;
      failed = state.failed;
      correct = state.correct;
      total = state.total;
      remaining = correct ? state.remaining : null;
      onChange();
      resume();
      return true;
    }
    // Single progress component shared by the classic exercises.
    // Question is always current/max; Score is the earned-point count only.
    function progress(container) {
      container.classList.toggle("progress-row", true);
      container.classList.toggle("academy-progress", true);
      container.replaceChildren();
      const left = document.createElement("span");
      left.className = "progress-label";
      left.textContent = "Question " + Math.min(index + 1, total) + "/" + total;
      const right = document.createElement("span");
      right.className = "progress-score";
      const label = document.createElement("span");
      label.className = "progress-score-label";
      label.textContent = "Score";
      const value = document.createElement("strong");
      value.textContent = String(score);
      right.append(label, value);
      container.append(left, right);
    }
    // One final-result card across Français, Calcul and Conjugaison.
    // The ornate parchment and button appearance live in results.css.
    function finish(container, restart, pending = null) {
      container.replaceChildren();

      const card = document.createElement("section");
      card.className = "academy-result";
      card.setAttribute("aria-label", "Résultat de l'exercice");

      const trophy = document.createElement("span");
      trophy.className = "academy-result-trophy";
      trophy.setAttribute("aria-hidden", "true");

      const heading = document.createElement("h2");
      heading.className = "academy-result-title";
      heading.textContent = "Exercice terminé !";

      const result = document.createElement("div");
      result.className = "academy-result-score";
      result.setAttribute("aria-label", "Score final : " + score);
      const label = document.createElement("span");
      label.className = "academy-result-score-label";
      label.textContent = "Ton score";
      const numbers = document.createElement("div");
      numbers.className = "academy-result-score-numbers";
      const value = document.createElement("strong");
      value.className = "academy-result-score-value";
      value.textContent = String(score);
      numbers.append(value);
      result.append(label, numbers);

      const message = document.createElement("p");
      message.className = "encouragement academy-result-message";
      message.textContent = ExerciseScores.encourage(score, total);

      const actions = document.createElement("div");
      actions.className = "academy-result-actions";
      const button = document.createElement("button");
      button.type = "button";
      button.className = "primary";
      button.textContent = pending ? "Recommencer sans enregistrer" : "Recommencer";
      button.onclick = pending
        ? async () => {
            const discard = await AppConfirm.ask({
              title: "Abandonner le résultat non enregistré ?",
              message: "Le score ou le crédit quotidien de cette série pourrait être perdu.",
              confirmText: "Abandonner",
              cancelText: "Réessayer",
            });
            if (discard) restart();
          }
        : restart;
      actions.append(button);

      if (pending) {
        const warning = document.createElement("p");
        warning.className = "result-save-warning";
        warning.setAttribute("role", "alert");
        warning.textContent = pending.message;
        const retry = document.createElement("button");
        retry.type = "button";
        retry.className = "primary result-save-retry";
        retry.textContent = "Réessayer l’enregistrement";
        retry.onclick = pending.retry;
        actions.prepend(retry);
        card.append(trophy, heading, result, message, warning, actions);
      } else {
        card.append(trophy, heading, result, message, actions);
      }
      container.append(card);
    }
    function feedback({ correction, retry }) {
      const node = GameUI.element(
        "div",
        "feedback " + (correct ? "good" : failed ? "bad" : ""),
        correct
          ? failed
            ? correction
            : "Bravo ! +1 point"
          : failed
            ? retry
            : "",
      );
      node.setAttribute("role", "status");
      return node;
    }
    function restartButton(onRestart) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "restart-series";
      button.textContent = "Recommencer la série";
      let asking = false;
      button.onclick = async () => {
        if (asking) return;
        asking = true;
        suspend();
        try {
          const confirmed = await AppConfirm.ask({
            title: "Recommencer la série ?",
            message: "La progression et le score de cette série seront perdus. Aucun résultat ne sera enregistré.",
            confirmText: "Recommencer",
            cancelText: "Annuler",
          });
          if (confirmed) onRestart();
          else resume();
        } catch (error) {
          resume();
          throw error;
        } finally {
          asking = false;
        }
      };
      return button;
    }
    // Changing settings discards work only after an explicit confirmation.
    // Keep any automatic advancement frozen while the dialog is open.
    let settingsChangePending = false;
    async function changeSettings(hasProgress, onAccept) {
      if (settingsChangePending) return false;
      if (!hasProgress || index >= total) {
        onAccept();
        return true;
      }
      settingsChangePending = true;
      suspend();
      try {
        const accepted = await AppConfirm.ask({
          title: "Changer d’exercice ?",
          message: "La progression et le score de cette série seront perdus. Aucun résultat ne sera enregistré.",
          confirmText: "Changer",
          cancelText: "Annuler",
        });
        if (accepted) onAccept();
        else resume();
        return accepted;
      } catch (error) {
        resume();
        throw error;
      } finally {
        settingsChangePending = false;
      }
    }
    function actionButton() {
      // Keep the same DOM button when validation changes its appearance.
      // Replacing the pressed element can swallow a rapid second tap on
      // mobile, leaving only the automatic next-question timer working.
      if (!action) {
        action = document.createElement("button");
        action.type = "button";
      }
      action.className = "primary";
      action.textContent = correct
        ? index === total - 1
          ? "Voir mon score maintenant"
          : "Suivant →"
        : "Vérifier";
      return action;
    }
    return {
      reset,
      restore,
      snapshot,
      validate,
      next,
      cancel,
      suspend,
      resume,
      progress,
      finish,
      feedback,
      actionButton,
      restartButton,
      changeSettings,
      get index() {
        return index;
      },
      get score() {
        return score;
      },
      get failed() {
        return failed;
      },
      get correct() {
        return correct;
      },
      get total() {
        return total;
      },
    };
  }
  // Score and daily-credit retries share a stable series ID.
  function resultTracker(game, storage, buildRecord) {
    let resultId = GameState.newSessionId();
    let pending = false;
    let message = "";

    function save(result) {
      const scoreSaved = ExerciseScores.save({
        ...buildRecord(result),
        resultId,
      });
      const daily = window.DailyExercises;
      const creditSaved = scoreSaved && (!daily ||
        (typeof daily.awardOnce === "function"
          ? daily.awardOnce(game, resultId)
          : daily.award(game, resultId)));
      pending = !(scoreSaved && creditSaved);
      message = !scoreSaved
        ? "Le score n’a pas pu être enregistré. Vérifie le stockage du navigateur et réessaie."
        : !creditSaved
          ? "Le score est enregistré, mais le crédit quotidien n’a pas pu être ajouté. Réessaie."
          : "";
      if (!pending) storage.clear();
      return !pending;
    }

    function fresh() {
      resultId = GameState.newSessionId();
      pending = false;
      message = "";
    }

    function restore(state) {
      if (state?.pendingResult === true &&
          (typeof state.resultId !== "string" || !state.resultId ||
           state.resultId.length >= 120)) return false;
      if (typeof state?.resultId === "string" && state.resultId &&
          state.resultId.length < 120) resultId = state.resultId;
      pending = state?.pendingResult === true;
      message = pending
        ? "L’enregistrement de la dernière série reste à terminer. Réessaie."
        : "";
      return true;
    }

    return {
      save,
      fresh,
      restore,
      snapshot: () => ({ resultId, pendingResult: pending }),
      get pending() { return pending; },
      get message() { return message; },
    };
  }

  return { create, resultTracker };
})();
