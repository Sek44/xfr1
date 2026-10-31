"use strict";
window.DailyExercises = (() => {
  // Shared across GitHub Pages projects hosted on the same origin.
  const KEY = "entrainement_daily_exercises_v1";
  const VERSION = 1;
  const MINUTES_PER_POINT = 10;

  function today() {
    const date = new Date();
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");
  }

  function empty() {
    return {
      version: VERSION,
      date: today(),
      points: 0,
      minutes: 0,
      progress: {},
      events: [],
    };
  }

  function valid(state) {
    return (
      state &&
      state.version === VERSION &&
      /^\d{4}-\d{2}-\d{2}$/.test(state.date) &&
      Number.isSafeInteger(state.points) &&
      state.points >= 0 &&
      Number.isSafeInteger(state.minutes) &&
      state.minutes >= 0 &&
      state.progress &&
      typeof state.progress === "object" &&
      !Array.isArray(state.progress) &&
      Object.values(state.progress).every((value) => Number.isSafeInteger(value) && value >= 0) &&
      Array.isArray(state.events) &&
      state.events.every((event) => typeof event === "string")
    );
  }

  function write(state) {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      return true;
    } catch {
      return false;
    }
  }

  function read() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw === null) {
        const state = empty();
        return write(state) ? state : null;
      }
      const state = JSON.parse(raw);
      // Never destroy unreadable or unsupported data.
      if (!valid(state)) return null;
      if (state.date === today()) return state;
      const fresh = empty();
      return write(fresh) ? fresh : null;
    } catch {
      return null;
    }
  }

  function award(game, token = null) {
    if (typeof game !== "string" || !game || (token !== null && typeof token !== "string"))
      return false;
    const state = read();
    if (!state) return false;
    const event = token === null ? null : game + ":" + token;
    if (event && state.events.includes(event)) return false;
    if (!Number.isSafeInteger(state.points + 1) ||
        !Number.isSafeInteger(state.minutes + MINUTES_PER_POINT)) return false;
    state.points++;
    state.minutes += MINUTES_PER_POINT;
    if (event) state.events.push(event);
    return write(state);
  }

  // Preserve partial arcade series across different sessions of the same game.
  // The event token makes a replay after a refresh idempotent.
  function recordProgress(game, count, perPoint, token) {
    if (typeof game !== "string" || !game ||
        !Number.isSafeInteger(count) || count <= 0 ||
        !Number.isSafeInteger(perPoint) || perPoint <= 0 ||
        typeof token !== "string" || !token) return 0;
    const state = read();
    if (!state) return 0;
    const event = game + ":" + token;
    if (state.events.includes(event)) return 0;
    const previous = state.progress[game] || 0;
    if (!Number.isSafeInteger(previous + count)) return 0;
    const completed = Math.floor((previous + count) / perPoint);
    if (!Number.isSafeInteger(state.points + completed) ||
        !Number.isSafeInteger(state.minutes + completed * MINUTES_PER_POINT)) return 0;
    state.progress[game] = (previous + count) % perPoint;
    state.points += completed;
    state.minutes += completed * MINUTES_PER_POINT;
    state.events.push(event);
    return write(state) ? completed : 0;
  }

  function newSessionId() {
    return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
  }

  // Each arcade game declares its own series length in its controller.
  function milestones(game, perPoint) {
    let sessionId = newSessionId();
    let date = today();
    let seenScore = 0;

    function reset() {
      sessionId = newSessionId();
      date = today();
      seenScore = 0;
    }

    function refresh(score) {
      if (date === today()) return;
      date = today();
      // A partial series from yesterday must not carry into today.
      seenScore = score;
    }

    function restore(state, score) {
      if (state && typeof state.sessionId === "string" &&
          state.sessionId.length > 0 && state.sessionId.length < 120 &&
          typeof state.date === "string" &&
          Number.isSafeInteger(state.seenScore) &&
          state.seenScore >= 0 && state.seenScore <= score) {
        sessionId = state.sessionId;
        date = state.date;
        seenScore = state.seenScore;
      } else {
        // Old saved sessions have no reward metadata: do not credit earlier kills.
        reset();
        seenScore = score;
      }
      refresh(score);
    }

    function record(score) {
      refresh(score);
      if (!Number.isSafeInteger(score) || score <= seenScore) return 0;
      const previous = seenScore;
      const earned = recordProgress(
        game, score - previous, perPoint,
        sessionId + ":" + date + ":" + previous + "-" + score,
      );
      seenScore = score;
      return earned;
    }

    return {
      reset,
      restore,
      refresh,
      record,
      snapshot: () => ({ sessionId, date, seenScore }),
    };
  }

  function mount(element) {
    if (!element) return;
    const update = () => {
      const state = read();
      element.textContent = state
        ? state.points + " exercice" + (state.points === 1 ? "" : "s") +
          " terminé" + (state.points === 1 ? "" : "s") +
          " aujourd’hui · " + state.minutes + " min de jeu autorisées"
        : "Compteur quotidien indisponible (stockage local inaccessible).";
    };
    window.addEventListener("storage", (event) => {
      if (event.key === KEY || event.key === null) update();
    });
    window.addEventListener("focus", update);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) update();
    });
    window.setInterval(update, 60000);
    update();
  }

  return { KEY, VERSION, MINUTES_PER_POINT, today, read, award, recordProgress, milestones, mount };
})();
