"use strict";
// Reusable weighted sampling and first-attempt tracking. Keep legacy storage keys per game.
window.ExerciseWeighting = (() => {
  function validCount(value) {
    return Number.isSafeInteger(value) && value >= 0 ? value : 0;
  }
  function weight(appearances, errors) {
    const successful = Math.max(0, validCount(appearances) - validCount(errors));
    return (1 + 3 * validCount(errors)) / ((successful + 1) ** 2);
  }
  function read(key) {
    try {
      const data = JSON.parse(localStorage.getItem(key));
      return data && typeof data === "object" && !Array.isArray(data) ? data : {};
    } catch {
      return {};
    }
  }
  function create({ appearancesKey, errorsKey, appearances, errors }) {
    const counts = appearances || read(appearancesKey);
    const failures = errors || read(errorsKey);
    function increment(store, key, storageKey) {
      store[key] = Math.min(Number.MAX_SAFE_INTEGER, validCount(store[key]) + 1);
      try {
        localStorage.setItem(storageKey, JSON.stringify(store));
      } catch {
        // Tracking is optional when storage is unavailable or full.
      }
    }
    function choose(grouped, amount, random = Math.random) {
      const remaining = [...grouped.keys()];
      const chosen = [];
      while (remaining.length && chosen.length < amount) {
        const weights = remaining.map((key) => weight(counts[key], failures[key]));
        let draw = random() * weights.reduce((sum, n) => sum + n, 0);
        let index = remaining.length - 1;
        for (let i = 0; i < remaining.length; i++) {
          draw -= weights[i];
          if (draw < 0) {
            index = i;
            break;
          }
        }
        const variants = grouped.get(remaining.splice(index, 1)[0]);
        chosen.push(variants[Math.floor(random() * variants.length)]);
      }
      return chosen;
    }
    return {
      counts,
      failures,
      appearance: (key) => increment(counts, key, appearancesKey),
      error: (key) => increment(failures, key, errorsKey),
      choose,
    };
  }
  return { weight, create };
})();
