"use strict";
window.DailyExercises = (() => {
  // Shared across GitHub Pages projects hosted on the same origin.
  const KEY = "entrainement_daily_exercises_v1";
  const VERSION = 1;
  const MINUTES_PER_POINT = 3;

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
      seconds: 0,
      progress: {},
      events: [],
      starts: {},
      sessions: {},
      receipts: {},
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
      (state.seconds === undefined || (Number.isSafeInteger(state.seconds) && state.seconds >= 0)) &&
      (state.starts === undefined || (state.starts && typeof state.starts === "object" &&
        !Array.isArray(state.starts) && Object.values(state.starts).every((value) =>
          Array.isArray(value) && value.every((id) => typeof id === "string")))) &&
      (state.sessions === undefined || (state.sessions && typeof state.sessions === "object" &&
        !Array.isArray(state.sessions) && Object.values(state.sessions).every((value) =>
          Array.isArray(value) && value.every((id) => typeof id === "string")))) &&
      (state.receipts === undefined || (state.receipts && typeof state.receipts === "object" &&
        !Array.isArray(state.receipts))) &&
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
      if (state.date === today()) {
        // Older records keep the historical 3 min / point conversion.
        // Once seconds exists, minutes are no longer inferred from points.
        if (state.seconds !== undefined) {
          return state.minutes === Math.floor(state.seconds / 60) ? state : null;
        }
        const minutes = state.points * MINUTES_PER_POINT;
        if (!Number.isSafeInteger(minutes)) return null;
        if (state.minutes !== minutes) {
          state.minutes = minutes;
          return write(state) ? state : null;
        }
        return state;
      }
      const fresh = empty();
      return write(fresh) ? fresh : null;
    } catch {
      return null;
    }
  }

  // Distinguish a duplicate, a new credit and a failed persistence attempt.
  function commitAward(game, token) {
    if (typeof game !== "string" || !game ||
        (token !== null && (typeof token !== "string" || !token)))
      return "failed";
    const state = read();
    if (!state) return "failed";
    const event = token === null ? null : game + ":" + token;
    if (event && state.events.includes(event)) return "already";
    if (!Number.isSafeInteger(state.points + 1) ||
        !Number.isSafeInteger(state.minutes + MINUTES_PER_POINT)) return "failed";
    state.points++;
    state.minutes += MINUTES_PER_POINT;
    if (state.seconds !== undefined) state.seconds += MINUTES_PER_POINT * 60;
    if (event) state.events.push(event);
    return write(state) ? "added" : "failed";
  }

  function award(game, token = null) {
    return commitAward(game, token) === "added";
  }

  // Successful retries are idempotent, including when a prior award committed.
  function awardOnce(game, token) {
    if (typeof token !== "string" || !token) return false;
    return commitAward(game, token) !== "failed";
  }


  // Check and reserve daily attempts by stable exercise subcategory.
  // Merely opening an exercise does not count: the controller calls start()
  // on the first answer. A resumed session reuses the same token.
  function checkStart(game, token, keys, commit) {
    if (typeof game !== "string" || !game || typeof token !== "string" || !token ||
        !Array.isArray(keys) || !keys.length || !keys.every((k) => typeof k === "string"))
      return { ok: false, blocked: false };
    const state = read();
    const rules = window.RewardRules;
    if (!state || !rules) return { ok: false, blocked: false };
    const event = game + ":" + token;
    // Long-form missions limit actual play sessions separately from rewarded
    // packs of 10/20 calculations. Neither limit can be bypassed by replays.
    const field = game === "magic" || game === "space" ? "sessions" : "starts";
    const starts = state[field] || {};
    const distinct = [...new Set(keys)];
    for (const id of distinct) {
      const info = rules.inspect(id);
      if (!info) return { ok: false, blocked: false };
      const ids = starts[id] || [];
      if (!ids.includes(event) && info.dailyLimit !== null &&
          ids.length >= info.dailyLimit) return { ok: false, blocked: true };
    }
    if (commit) {
      state[field] = starts;
      for (const id of distinct) {
        if (!starts[id]) starts[id] = [];
        if (!starts[id].includes(event)) starts[id].push(event);
      }
      if (!write(state)) return { ok: false, blocked: false };
    }
    return { ok: true, blocked: false };
  }
  const canStart = (game, token, keys) => checkStart(game, token, keys, false);
  const start = (game, token, keys) => checkStart(game, token, keys, true);

  function receipt(game, token) {
    const state = read();
    return state?.receipts?.[game + ":" + token] || null;
  }
  function missionSummary(game, sessionId) {
    const state = read();
    const rules = window.RewardRules;
    if (!state || !rules || typeof sessionId !== "string" || !sessionId) return null;
    const id = rules.key(game);
    const info = rules.inspect(id);
    if (!info) return null;
    const prefix = game + ":" + sessionId + ":";
    const seconds = Object.entries(state.receipts || {})
      .filter(([token]) => token.startsWith(prefix))
      .reduce((sum, [, receipt]) => sum + (receipt.seconds || 0), 0);
    const started = state.sessions?.[id]?.length || 0;
    return { seconds, mastery: info.mastery, difficulty: info.difficulty,
      remaining: info.dailyLimit == null ? null :
        Math.max(0, info.dailyLimit - started) };
  }

  function awardResultOnce(game, token, answers) {
    const rules = window.RewardRules;
    if (!rules || !rules.validAnswers(answers)) return { ok: false };
    const event = game + ":" + token;
    let state = read();
    if (!state) return { ok: false };
    if (state.events.includes(event)) {
      return { ok: rules.record(event, answers), receipt: state.receipts?.[event] || null };
    }
    const keys = [...new Set(answers.map((a) => a.key))];
    // A saved score may be retried after the browser was closed.
    const reservation = start(game, token, keys);
    if (!reservation.ok && !reservation.blocked) return { ok: false };
    state = read();
    if (!state) return { ok: false };
    const forecast = rules.forecast(answers);
    if (!forecast) return { ok: false };
    const previous = state.seconds === undefined ? state.minutes * 60 : state.seconds;
    const amount = reservation.blocked ? 0 : Math.max(0, Math.min(
      forecast.seconds, rules.CONFIG.dailySecondsCap - previous));
    if (!Number.isSafeInteger(state.points + 1) ||
        !Number.isSafeInteger(previous + amount)) return { ok: false };
    state.points++;
    state.seconds = previous + amount;
    state.minutes = Math.floor(state.seconds / 60);
    state.receipts = state.receipts || {};
    state.receipts[event] = { seconds: amount, parts: forecast.parts };
    state.events.push(event);
    if (!write(state)) return { ok: false };
    return { ok: rules.record(event, answers), receipt: state.receipts[event] };
  }

  // Preserve partial arcade series across different sessions of the same game.
  // The event token makes a replay after a refresh idempotent.
  function commitProgress(game, count, perPoint, token) {
    if (typeof game !== "string" || !game ||
        !Number.isSafeInteger(count) || count <= 0 ||
        !Number.isSafeInteger(perPoint) || perPoint <= 0 ||
        typeof token !== "string" || !token) return { ok: false, completed: 0 };
    const state = read();
    if (!state) return { ok: false, completed: 0 };
    const event = game + ":" + token;
    if (state.events.includes(event)) {
      if (!window.RewardRules) return { ok: true, completed: 0 };
      const receipts = Object.keys(state.receipts || {}).filter((id) => id.startsWith(event + "#"));
      const answers = Array.from({ length: perPoint }, () =>
        ({ key: window.RewardRules.key(game), correct: true }));
      return { ok: receipts.every((id) => window.RewardRules.record(id, answers)), completed: 0 };
    }
    const previous = state.progress[game] || 0;
    if (!Number.isSafeInteger(previous + count)) return { ok: false, completed: 0 };
    const completed = Math.floor((previous + count) / perPoint);
    if (!Number.isSafeInteger(state.points + completed) ||
        !Number.isSafeInteger(state.minutes + completed * MINUTES_PER_POINT))
      return { ok: false, completed: 0 };
    state.progress[game] = (previous + count) % perPoint;
    if (window.RewardRules) {
      const rules = window.RewardRules;
      const id = rules.key(game);
      const answers = Array.from({ length: perPoint }, () => ({ key: id, correct: true }));
      const stored = state.receipts || (state.receipts = {});
      const starts = state.starts || (state.starts = {});
      const ids = starts[id] || (starts[id] = []);
      const awarded = [];
      let seconds = state.seconds === undefined ? state.minutes * 60 : state.seconds;
      for (let i = 0; i < completed; i++) {
        const creditId = event + "#" + i;
        const info = rules.inspect(id);
        const forecast = rules.forecast(answers);
        if (!info || !forecast) return { ok: false, completed: 0 };
        const allowed = info.dailyLimit === null || ids.length < info.dailyLimit;
        if (allowed) ids.push(creditId);
        const amount = allowed ? Math.max(0, Math.min(
          forecast.seconds, rules.CONFIG.dailySecondsCap - seconds)) : 0;
        seconds += amount;
        stored[creditId] = { seconds: amount, parts: forecast.parts };
        awarded.push(creditId);
      }
      state.seconds = seconds;
      state.minutes = Math.floor(seconds / 60);
      state.points += completed;
      state.events.push(event);
      if (!write(state)) return { ok: false, completed: 0 };
      const ok = awarded.every((creditId) => rules.record(creditId, answers));
      return { ok, completed: ok ? completed : 0 };
    }
    state.points += completed;
    state.minutes += completed * MINUTES_PER_POINT;
    if (state.seconds !== undefined) state.seconds += completed * MINUTES_PER_POINT * 60;
    state.events.push(event);
    return { ok: write(state), completed };
  }

  // Keep the numeric API for external readers and older callers.
  function recordProgress(game, count, perPoint, token) {
    const result = commitProgress(game, count, perPoint, token);
    return result.ok ? result.completed : 0;
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
      const result = commitProgress(
        game, score - previous, perPoint,
        sessionId + ":" + date + ":" + previous + "-" + score,
      );
      // A failed write must not consume kills that still need crediting.
      if (result.ok) seenScore = score;
      return result.ok ? result.completed : 0;
    }

    return {
      reset,
      restore,
      refresh,
      record,
      snapshot: () => ({ sessionId, date, seenScore }),
    };
  }

  // A shared subscription mechanism keeps both the legacy text summary and
  // the structured homepage metrics updated on focus, storage events and midnight.
  function watch(update) {
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

  function mount(element) {
    if (!element) return;
    watch(() => {
      const state = read();
      element.textContent = state
        ? state.points + " exercice" + (state.points === 1 ? "" : "s") +
          " terminé" + (state.points === 1 ? "" : "s") +
          " aujourd’hui · " + state.minutes + " min de jeu autorisées"
        : "Compteur quotidien indisponible (stockage local inaccessible).";
    });
  }

  // Presentation only: two distinct counters, same underlying daily-credit state.
  function mountStats(pointsElement, minutesElement, errorElement = null) {
    if (!pointsElement || !minutesElement) return;
    watch(() => {
      const state = read();
      pointsElement.textContent = state
        ? state.points + " exercice" + (state.points === 1 ? "" : "s")
        : "— exercices";
      minutesElement.textContent = state ? state.minutes + " min de jeu" : "— min de jeu";
      if (errorElement) {
        errorElement.hidden = Boolean(state);
        errorElement.textContent = state
          ? ""
          : "Compteur quotidien indisponible (stockage local inaccessible).";
      }
    });
  }

  return { KEY, VERSION, MINUTES_PER_POINT, today, read, award, awardOnce,
    awardResultOnce, canStart, start, receipt, missionSummary,
    recordProgress, milestones, mount, mountStats };
})();
