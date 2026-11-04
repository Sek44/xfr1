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
      remaining = null;
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
        state.index >= state.total ||
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
    // The ornate parchment and button appearance live in classic.css.
    function finish(container, restart) {
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
      result.setAttribute("aria-label", "Score final : " + score + " sur " + total);
      const label = document.createElement("span");
      label.className = "academy-result-score-label";
      label.textContent = "Ton score";
      const numbers = document.createElement("div");
      numbers.className = "academy-result-score-numbers";
      const value = document.createElement("strong");
      value.className = "academy-result-score-value";
      value.textContent = String(score);
      const maximum = document.createElement("span");
      maximum.className = "academy-result-score-maximum";
      maximum.textContent = " / " + total;
      numbers.append(value, maximum);
      result.append(label, numbers);

      const message = document.createElement("p");
      message.className = "encouragement academy-result-message";
      message.textContent = ExerciseScores.encourage(score, total);

      const actions = document.createElement("div");
      actions.className = "academy-result-actions";
      const button = document.createElement("button");
      button.type = "button";
      button.className = "primary";
      button.textContent = "Recommencer";
      button.onclick = restart;
      actions.append(button);

      card.append(trophy, heading, result, message, actions);
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
    function actionButton() {
      const button = document.createElement("button");
      button.className = "primary";
      button.textContent = correct
        ? index === total - 1
          ? "Voir mon score maintenant"
          : "Suivant →"
        : "Vérifier";
      return button;
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
  return { create };
})();
