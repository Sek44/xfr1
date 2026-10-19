"use strict";
window.GameState = (() => {
  const PREFIX = "exercices_in_progress_";
  const VERSION = 1;

  function create(game) {
    const key = PREFIX + game;
    return {
      load() {
        try {
          const raw = localStorage.getItem(key);
          if (!raw) return null;
          const data = JSON.parse(raw);
          return data && data.version === VERSION && data.session
            ? data.session
            : null;
        } catch {
          return null;
        }
      },
      save(session) {
        try {
          localStorage.setItem(key, JSON.stringify({ version: VERSION, session }));
          return true;
        } catch {
          return false;
        }
      },
      clear() {
        try {
          localStorage.removeItem(key);
        } catch {
          // Storage can be unavailable without stopping the game.
        }
      },
    };
  }

  return { create };
})();
