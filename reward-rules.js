"use strict";
window.RewardRules = (() => {
  // All reward tuning lives here. Category identifiers are stable across tabs.
  const KEY = "entrainement_mastery_v1";
  const CONFIG = Object.freeze({
    minSeconds: 60, maxSeconds: 180, roundingSeconds: 15,
    dailySecondsCap: 3600, recentQuestions: 50,
    requiredQuestions: 50, requiredDays: 3,
    multipliers: [1, 1, 1, 1, 1, 1, 0.75, 0.5, 0.35, 0.15, 0],
    dailyLimits: [null, null, null, null, null, null, 6, 4, 3, 2, 1],
    french: { c: 2, g: 3, s: 4 },
    conjugation: { "present-1": 5, "present-2": 6, "etre-avoir": 5 },
    mathRanges: { "0-10": 1, "10-100": 3, "100-1000": 5, "1000-10000": 8 },
    mission: { space: 1, magic: 2 },
  });
  const today = () => {
    const d = new Date();
    return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"),
      String(d.getDate()).padStart(2, "0")].join("-");
  };
  function key(game, sub = "base") {
    return game + ":" + String(sub);
  }
  function difficulty(id) {
    const [game, sub, level] = String(id).split(":");
    if (game === "francais") return CONFIG.french[sub] || 3;
    if (game === "conjugaison") return CONFIG.conjugation[sub] || 5;
    if (game === "calcul")
      return Math.min(10, (CONFIG.mathRanges[sub] || 3) +
        Math.max(0, Math.min(4, Number(level) - 1 || 0)));
    if (game === "monnaie") return 10;
    return CONFIG.mission[game] || 3;
  }
  function maxSeconds(id) {
    return Math.round((CONFIG.minSeconds +
      (CONFIG.maxSeconds - CONFIG.minSeconds) * (difficulty(id) - 1) / 9) /
      CONFIG.roundingSeconds) * CONFIG.roundingSeconds;
  }
  function empty() { return { version: 1, categories: {}, events: [] }; }
  function validEntry(p) {
    return p && Number.isSafeInteger(p.total) && p.total >= 0 &&
      Array.isArray(p.recent) && p.recent.length <= CONFIG.recentQuestions &&
      p.recent.every((x) => x === 0 || x === 1) &&
      Array.isArray(p.days) && p.days.length <= 1000 &&
      p.days.every((d) => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d));
  }
  function read() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw === null) return empty();
      const state = JSON.parse(raw);
      if (!state || state.version !== 1 || !state.categories ||
          Array.isArray(state.categories) || typeof state.categories !== "object" ||
          !Object.values(state.categories).every(validEntry) ||
          !Array.isArray(state.events) ||
          !state.events.every((e) => typeof e === "string")) return null;
      return state;
    } catch { return null; }
  }
  function mastery(profile) {
    if (!profile) return 0;
    const recent = profile.recent;
    const success = recent.length ?
      recent.reduce((sum, value) => sum + value, 0) / recent.length : 0;
    const experience = Math.min(1, profile.total / CONFIG.requiredQuestions);
    const days = Math.min(1, profile.days.length / CONFIG.requiredDays);
    return Math.max(0, Math.min(10, Math.round(10 * success * experience * days)));
  }
  function inspect(id) {
    const stored = read();
    if (!stored) return null;
    const level = mastery(stored.categories[id]);
    return { key: id, mastery: level, difficulty: difficulty(id),
      maxSeconds: maxSeconds(id), dailyLimit: CONFIG.dailyLimits[level] };
  }
  function noteFactor(score, total, masteryLevel) {
    if (!total) return 0;
    const note = 10 * score / total;
    if (masteryLevel > 5) return note >= 9 ? 1 : 0;
    return note < 5 ? 0 : note < 7 ? 0.5 : note < 9 ? 0.75 : 1;
  }
  function validAnswers(answers) {
    return Array.isArray(answers) && answers.length > 0 && answers.length <= 100 &&
      answers.every((a) => a && typeof a.key === "string" &&
        /^[a-z0-9:-]{3,80}$/.test(a.key) && typeof a.correct === "boolean");
  }
  function forecast(answers) {
    const stored = read();
    if (!stored || !validAnswers(answers)) return null;
    const groups = new Map();
    for (const answer of answers) {
      if (!groups.has(answer.key)) groups.set(answer.key, { total: 0, score: 0 });
      const group = groups.get(answer.key);
      group.total++;
      if (answer.correct) group.score++;
    }
    const parts = [];
    let seconds = 0;
    for (const [id, { total, score }] of groups) {
      const level = mastery(stored.categories[id]);
      const factor = noteFactor(score, total, level);
      const rawSeconds = maxSeconds(id) * total / answers.length *
        factor * CONFIG.multipliers[level];
      seconds += rawSeconds;
      parts.push({ key: id, mastery: level, difficulty: difficulty(id),
        score, total, seconds: rawSeconds, dailyLimit: CONFIG.dailyLimits[level] });
    }
    return { seconds: Math.round(seconds / CONFIG.roundingSeconds) *
      CONFIG.roundingSeconds, parts };
  }
  // Applied only after the daily ledger has durably recorded the reward.
  // Per-series event IDs make failures and checkpoint retries idempotent.
  function record(eventId, answers) {
    if (typeof eventId !== "string" || !eventId || !validAnswers(answers)) return false;
    const stored = read();
    if (!stored) return false;
    if (stored.events.includes(eventId)) return true;
    for (const { key: id, correct } of answers) {
      const p = stored.categories[id] ||
        (stored.categories[id] = { total: 0, recent: [], days: [] });
      if (!Number.isSafeInteger(p.total + 1)) return false;
      p.total++;
      p.recent.push(correct ? 1 : 0);
      if (p.recent.length > CONFIG.recentQuestions) p.recent.shift();
      const day = today();
      if (!p.days.includes(day)) {
        p.days.push(day);
        if (p.days.length > 1000) p.days.shift();
      }
    }
    stored.events.push(eventId);
    try { localStorage.setItem(KEY, JSON.stringify(stored)); return true; }
    catch { return false; }
  }
  return { KEY, CONFIG, key, difficulty, maxSeconds, mastery, inspect,
    noteFactor, forecast, record, read, validAnswers };
})();
