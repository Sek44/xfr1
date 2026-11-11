"use strict";
window.RewardRules = (() => {
  // All reward tuning lives here. Category identifiers are stable across tabs.
  const KEY = "entrainement_mastery_v1";
  const CONFIG = Object.freeze({
    minSeconds: 60, maxSeconds: 600, roundingSeconds: 15,
    dailySecondsCap: 3600, recentQuestions: 50,
    requiredQuestions: 50, requiredDays: 3,
    legacyMissionAccuracy: 0.85,
    multipliers: [1, 1, 1, 1, 1, 1, 0.75, 0.5, 0.35, 0.15, 0],
    dailyLimits: [null, null, null, null, null, null, 6, 4, 3, 2, 1],
    french: { c: 2, g: 3, s: 4 },
    conjugation: { "present-1": 5, "present-2": 6, "etre-avoir": 5 },
    mathRanges: { "0-10": 1, "10-100": 3, "100-1000": 5, "1000-10000": 8 },
    mission: { space: 1, magic: 2 },
  });
  // Initial rewards deployment: historical scores before this point are
  // estimates only, not a source of retroactive play-time credits.
  const LEGACY_CUTOFF = Date.parse("2026-11-11T11:21:43Z");
  const LEGACY_DAY_UNKNOWN = "2000-01-01";
  const SCORE_KEY = "exercices_francais_scores";
  const today = () => {
    const d = new Date();
    return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"),
      String(d.getDate()).padStart(2, "0")].join("-");
  };
  function key(game, sub = "base") {
    return game + ":" + String(sub);
  }
  function difficulty(id) {
    // A separate, publishable configuration makes public difficulty changes
    // independent of the local player's mastery and score archive.
    const published = window.RewardDifficultyLevels?.[id];
    if (Number.isInteger(published) && published >= 1 && published <= 10)
      return published;
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
      p.days.every((d) => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) &&
      (p.manualMastery === undefined ||
        (Number.isInteger(p.manualMastery) && p.manualMastery >= 0 && p.manualMastery <= 10)) &&
      (p.masteryBonus === undefined ||
        (Number.isInteger(p.masteryBonus) && p.masteryBonus >= -10 && p.masteryBonus <= 10));
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
  // Evidence-based estimate is independent from a local bonus.
  function automaticMastery(profile) {
    if (!profile) return 0;
    const recent = profile.recent;
    const success = recent.length ?
      recent.reduce((sum, value) => sum + value, 0) / recent.length : 0;
    const experience = Math.min(1, profile.total / CONFIG.requiredQuestions);
    const days = Math.min(1, profile.days.length / CONFIG.requiredDays);
    return Math.max(0, Math.min(10, Math.round(10 * success * experience * days)));
  }
  function mastery(profile) {
    if (!profile) return 0;
    // Older fixed mastery values remain valid until explicitly converted.
    if (Number.isInteger(profile.manualMastery) &&
        profile.manualMastery >= 0 && profile.manualMastery <= 10)
      return profile.manualMastery;
    return Math.max(0, Math.min(10,
      automaticMastery(profile) + (profile.masteryBonus || 0)));
  }
  function inspect(id) {
    const stored = read();
    if (!stored) return null;
    const profile = stored.categories[id];
    const level = mastery(profile);
    return { key: id, mastery: level, automaticMastery: automaticMastery(profile),
      masteryBonus: profile?.masteryBonus || 0,
      legacyManualMastery: profile?.manualMastery,
      difficulty: difficulty(id), maxSeconds: maxSeconds(id),
      dailyLimit: CONFIG.dailyLimits[level] };
  }
  // Positive or negative persistent adjustment to the evolving base mastery.
  function setMasteryBonus(id, bonus) {
    if (!Object.hasOwn(window.RewardDifficultyLevels || {}, id) ||
        !Number.isInteger(bonus) || bonus < -10 || bonus > 10) return false;
    const stored = read();
    if (!stored) return false;
    if (!stored.categories[id] && bonus === 0) return true;
    const profile = stored.categories[id] ||
      (stored.categories[id] = { total: 0, recent: [], days: [] });
    delete profile.manualMastery;
    if (bonus === 0) delete profile.masteryBonus;
    else profile.masteryBonus = bonus;
    try { localStorage.setItem(KEY, JSON.stringify(stored)); return true; }
    catch { return false; }
  }
  // Compatibility with previously written absolute overrides.
  function setMastery(id, value) {
    if (!Object.hasOwn(window.RewardDifficultyLevels || {}, id) ||
        (value !== null && (!Number.isInteger(value) || value < 0 || value > 10)))
      return false;
    const state = read();
    if (!state) return false;
    if (!state.categories[id] && value === null) return true;
    const profile = state.categories[id] ||
      (state.categories[id] = { total: 0, recent: [], days: [] });
    if (value === null) delete profile.manualMastery;
    else {
      profile.manualMastery = value;
      delete profile.masteryBonus;
    }
    try { localStorage.setItem(KEY, JSON.stringify(state)); return true; }
    catch { return false; }
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
  // Reprice an archived receipt using its ORIGINAL mastery and results.
  // The score archive itself is never modified during a credit migration.
  function repriceParts(parts) {
    if (!Array.isArray(parts) || !parts.length) return null;
    const total = parts.reduce((sum, part) => sum + part.total, 0);
    if (!Number.isSafeInteger(total) || total <= 0 || total > 100) return null;
    let seconds = 0;
    for (const part of parts) {
      if (!part || typeof part.key !== "string" ||
          !Number.isInteger(part.mastery) || part.mastery < 0 || part.mastery > 10 ||
          !Number.isSafeInteger(part.score) || !Number.isSafeInteger(part.total) ||
          part.total <= 0 || part.score < 0 || part.score > part.total) return null;
      seconds += maxSeconds(part.key) * part.total / total *
        noteFactor(part.score, part.total, part.mastery) *
        CONFIG.multipliers[part.mastery];
    }
    return Math.round(seconds / CONFIG.roundingSeconds) * CONFIG.roundingSeconds;
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

  // The score archive stores only a series total, not its question-by-question
  // successes. Reconstruct evenly spaced answers; this estimates competence
  // without pretending to know their order. No historical minutes are awarded.
  function historyCategory(record, date) {
    const tab = record.tab;
    if (tab === "g" || tab === "c" || tab === "s")
      return [key("francais", tab)];
    if (tab === "all") {
      // The s/ss family was introduced on 2026-11-07.
      return (date && date < "2026-11-07")
        ? [key("francais", "g"), key("francais", "c")]
        : [key("francais", "g"), key("francais", "c"), key("francais", "s")];
    }
    if (tab === "monnaie") return [key("monnaie")];
    if (tab === "space" || tab === "magic")
      return [key(tab)];
    if (tab === "conjugaison") {
      const name = typeof record.category === "string" ? record.category
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .toLowerCase() : "";
      if (/tout|^all$/.test(name)) {
        // The être/avoir mode appeared on November 11.
        return date && date < "2026-11-11"
          ? [key("conjugaison", "present-1"), key("conjugaison", "present-2")]
          : [key("conjugaison", "present-1"),
            key("conjugaison", "present-2"), key("conjugaison", "etre-avoir")];
      }
      if (/2e|2eme|second|groupe\s*2\b/.test(name))
        return [key("conjugaison", "present-2")];
      if (/etre|avoir/.test(name))
        return [key("conjugaison", "etre-avoir")];
      if (!name || /1er|premier|groupe\s*1\b/.test(name))
        return [key("conjugaison", "present-1")];
      return [];
    }
    if (tab === "math" || tab === "calcul") {
      const name = typeof record.category === "string"
        ? record.category.replace(/[\u2013\u2014]/g, "-") : "";
      const match = name.match(/(?:^|\s)(0-10|10-100|100-1000|1000-10000|Toutes cat[eé]gories)\s*\/\s*niveau\s*([1-5])\b/i);
      if (!match) return [];
      const band = match[1];
      const level = match[2];
      return /^Toutes/i.test(band)
        ? ["0-10", "10-100", "100-1000", "1000-10000"]
          .map((range) => key("calcul", range + ":" + level))
        : [key("calcul", band + ":" + level)];
    }
    return [];
  }

  // Only used for same-day fixed-credit scores whose result ID is present
  // in the existing daily ledger. Mixed tabs are estimates, never duplicates.
  function estimateHistoricalParts(record, date) {
    if (!record || typeof record !== "object" ||
        !Number.isSafeInteger(record.score) || record.score < 0) return null;
    const total = record.total === undefined || record.total === null
      ? 10 : record.total;
    if (!Number.isSafeInteger(total) || total < 1 || total > 100 ||
        record.score > total) return null;
    const categories = historyCategory(record, date);
    if (!categories.length || categories.some((id) =>
      id === "space:base" || id === "magic:base")) return null;
    const answers = Array.from({ length: total }, (_, i) => ({
      key: categories[i % categories.length],
      correct: Boolean(estimatedCorrect(i, record.score, total)),
    }));
    return forecast(answers)?.parts || null;
  }

  // Distributed correctly/incorrectly outcomes approximate a historical
  // aggregate mark without falsely treating every archived question as correct.
  function estimatedCorrect(index, score, total) {
    return Math.floor((index + 1) * score / total) >
      Math.floor(index * score / total) ? 1 : 0;
  }
  function addEstimated(profile, score, count, day) {
    if (!Number.isSafeInteger(profile.total + count)) return false;
    profile.total += count;
    for (let i = Math.max(0, count - CONFIG.recentQuestions); i < count; i++) {
      profile.recent.push(estimatedCorrect(i, score, count));
      if (profile.recent.length > CONFIG.recentQuestions) profile.recent.shift();
    }
    if (!profile.days.includes(day)) profile.days.push(day);
    return true;
  }

  // This migration is atomic and marked in the existing mastery record. Later
  // rewards keep accumulating normally. All imported samples precede live ones
  // when their last-50-question windows are merged.
  function initializeLegacy() {
    const state = read();
    if (!state || state.legacyImport?.version === 1) return false;
    let records;
    try {
      const raw = localStorage.getItem(SCORE_KEY);
      if (raw === null) return false;
      records = JSON.parse(raw);
      if (!Array.isArray(records)) return false;
    } catch {
      return false; // Never overwrite corrupted history or mastery storage.
    }
    const imported = Object.create(null);
    let count = 0;
    const ordered = records.slice().reverse();
    for (let ordinal = 0; ordinal < ordered.length; ordinal++) {
      const record = ordered[ordinal];
      if (!record || typeof record !== "object" || Array.isArray(record)) continue;
      let day = LEGACY_DAY_UNKNOWN;
      if (typeof record.date === "string" && record.date.trim()) {
        const ms = Date.parse(record.date);
        if (Number.isFinite(ms)) {
          if (ms >= LEGACY_CUTOFF) continue;
          const date = new Date(ms);
          day = [date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, "0"),
            String(date.getDate()).padStart(2, "0")].join("-");
        }
        // Invalid or missing dates count as a single estimated practice day.
      }
      const categories = historyCategory(record, day === LEGACY_DAY_UNKNOWN ? null : day);
      if (!categories.length) continue;
      const isMission = record.tab === "space" || record.tab === "magic";
      const score = Number(record.score);
      if (record.score === null || record.score === "" ||
          !Number.isSafeInteger(score) || score < 0) continue;
      let total;
      if (isMission) {
        // Arcade histories count successes, not attempted shots. Use a
        // conservative 85% estimated accuracy; never assume 100% perfection.
        if (score === 0 || score > 10000) continue;
        total = Math.ceil(score / CONFIG.legacyMissionAccuracy);
      } else {
        // Older exercise entries may lack a total; a series has 10 questions.
        total = record.total === undefined || record.total === null
          ? 10 : Number(record.total);
        if (!Number.isSafeInteger(total) || total < 1 || total > 100 ||
            score > total) continue;
      }
      const balanced = categories.map((id) => ({
        id, score: 0, count: 0,
      }));
      // Interleave questions from the mixed-mode families, rather than
      // crediting the same ten answers to each category.
      if (balanced.length > 1) {
        const start = ordinal % balanced.length;
        for (let i = 0; i < total; i++) {
          const slot = balanced[(start + i) % balanced.length];
          slot.count++;
          slot.score += estimatedCorrect(i, score, total);
        }
      } else {
        balanced[0].count = total;
        balanced[0].score = score;
      }
      for (const part of balanced) {
        if (!part.count) continue;
        const profile = imported[part.id] ||
          (imported[part.id] = { total: 0, recent: [], days: [] });
        if (!addEstimated(profile, part.score, part.count, day)) return false;
      }
      count++;
    }
    if (count === 0) return false;
    for (const [id, historical] of Object.entries(imported)) {
      const existing = state.categories[id];
      if (!existing) {
        state.categories[id] = historical;
        continue;
      }
      if (!Number.isSafeInteger(historical.total + existing.total)) return false;
      state.categories[id] = {
        ...existing,
        total: historical.total + existing.total,
        recent: historical.recent.concat(existing.recent)
          .slice(-CONFIG.recentQuestions),
        days: [...new Set(historical.days.concat(existing.days))].slice(-1000),
      };
    }
    state.legacyImport = { version: 1, series: count };
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      return true;
    } catch {
      return false;
    }
  }

  const api = { KEY, CONFIG, key, difficulty, maxSeconds, automaticMastery,
    mastery, inspect, noteFactor, forecast, repriceParts,
    estimateHistoricalParts, record, read, validAnswers, initializeLegacy,
    setMastery, setMasteryBonus };
  initializeLegacy(); // Runs once when any xfr1 page first loads.
  return api;
})();
