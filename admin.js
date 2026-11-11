"use strict";
(() => {
  // Public by design: this password is only a guard against accidental access.
  // The local player state is browser-editable; GitHub updates only happen on GitHub.
  const ADMIN_PASSWORD = "xfr1-administration";
  const GROUPS = [
    { label: "Orthographe", entries: [
      ["francais:c", "c / ç"], ["francais:g", "g / gue / ge"],
      ["francais:s", "s / ss"],
    ] },
    { label: "Conjugaison", entries: [
      ["conjugaison:present-1", "Présent – 1er groupe"],
      ["conjugaison:present-2", "Présent – 2e groupe"],
      ["conjugaison:etre-avoir", "Être / avoir"],
    ] },
    { label: "Calcul", entries: ["0-10", "10-100", "100-1000", "1000-10000"]
      .flatMap((range) => Array.from({ length: 5 }, (_, i) => [
        "calcul:" + range + ":" + (i + 1),
        range + " · niveau " + (i + 1),
      ])) },
    { label: "Rendu de monnaie", entries: [["monnaie:base", "Rendu de monnaie"]] },
    { label: "Missions", entries: [
      ["space:base", "Mission calcul"], ["magic:base", "Mission magique"],
    ] },
  ];

  const element = (id) => document.getElementById(id);
  let pendingBonusToken = null;

  function status(id, message, error = false) {
    const output = element(id);
    output.textContent = message;
    output.dataset.error = String(error);
  }

  function createCategoryRow(key, label) {
    const row = document.createElement("div");
    row.className = "admin-level-row";

    const name = document.createElement("span");
    name.className = "admin-level-name";
    name.textContent = label;
    const level = window.RewardRules.inspect(key);

    const difficulty = document.createElement("output");
    difficulty.className = "admin-level-difficulty";
    difficulty.dataset.caption = "Difficulté";
    difficulty.setAttribute("aria-label", "Difficulté : " + label);
    difficulty.textContent = String(level?.difficulty ?? "—");

    const automatic = document.createElement("output");
    automatic.className = "admin-level-auto";
    automatic.dataset.caption = "Auto";
    automatic.setAttribute("aria-label", "Maîtrise automatique : " + label);
    automatic.textContent = String(level?.automaticMastery ?? "—");

    const bonusField = document.createElement("div");
    bonusField.className = "admin-level-bonus";
    bonusField.dataset.caption = "Bonus";
    const bonus = document.createElement("select");
    bonus.setAttribute("aria-label", "Bonus de maîtrise : " + label);
    for (let value = -10; value <= 10; value++) {
      const option = document.createElement("option");
      option.value = String(value);
      option.textContent = value > 0 ? "+" + value : String(value);
      bonus.append(option);
    }
    if (Number.isInteger(level?.legacyManualMastery)) {
      const legacy = document.createElement("option");
      legacy.value = "legacy";
      legacy.textContent = "Fixe " + level.legacyManualMastery;
      bonus.append(legacy);
      bonus.value = "legacy";
    } else bonus.value = String(level?.masteryBonus || 0);
    bonusField.append(bonus);

    const effective = document.createElement("output");
    effective.className = "admin-level-effective";
    effective.dataset.caption = "Actuel";
    effective.setAttribute("aria-label", "Maîtrise actuelle : " + label);
    effective.textContent = String(level?.mastery ?? "—");

    let previous = bonus.value;
    bonus.addEventListener("change", () => {
      const adjustment = Number(bonus.value);
      if (!Number.isInteger(adjustment) ||
          !window.RewardRules.setMasteryBonus(key, adjustment)) {
        bonus.value = previous;
        status("mastery-status",
          "Échec de l’enregistrement local. Vérifiez le stockage du navigateur.", true);
        return;
      }
      const legacy = bonus.querySelector('option[value="legacy"]');
      if (legacy) legacy.remove();
      previous = bonus.value;
      const current = window.RewardRules.inspect(key);
      automatic.textContent = String(current.automaticMastery);
      effective.textContent = String(current.mastery);
      status("mastery-status", "Bonus de maîtrise enregistré pour « " + label +
        " » : " + (adjustment > 0 ? "+" : "") + adjustment +
        " (auto " + current.automaticMastery + " → actuel " + current.mastery + ").");
      renderLocalData();
    });

    row.append(name, difficulty, automatic, bonusField, effective);
    return row;
  }

  function renderCategories() {
    const root = element("admin-category-list");
    root.replaceChildren();
    for (const group of GROUPS) {
      const section = document.createElement("section");
      section.className = "admin-group";
      const title = document.createElement("h3");
      title.textContent = group.label;
      const headings = document.createElement("div");
      headings.className = "admin-level-header";
      for (const label of ["Exercice", "Difficulté", "Auto", "Bonus", "Actuel"]) {
        const text = document.createElement("span");
        text.textContent = label;
        headings.append(text);
      }
      section.append(title, headings);
      for (const [key, label] of group.entries)
        section.append(createCategoryRow(key, label));
      root.append(section);
    }
  }

  function localKeys() {
    const keys = [];
    try {
      for (let index = 0; index < localStorage.length; index++) {
        const key = localStorage.key(index);
        if (key && (key.startsWith("entrainement_") ||
            key.startsWith("exercices_") || key.startsWith("exercise_")))
          keys.push(key);
      }
      keys.sort();
    } catch { return null; }
    return keys;
  }

  function renderLocalData() {
    const summary = element("admin-local-summary");
    const storage = element("admin-storage-list");
    summary.replaceChildren();
    storage.replaceChildren();
    const daily = window.DailyExercises.read();
    const mastery = window.RewardRules.read();
    let scores = null;
    try {
      const raw = localStorage.getItem("exercices_francais_scores");
      if (raw === null) scores = [];
      else {
        const decoded = JSON.parse(raw);
        if (Array.isArray(decoded)) scores = decoded;
      }
    } catch {}
    const items = [
      daily ? "Date : " + daily.date : "Crédits quotidiens : indisponibles",
      daily ? "Exercices validés : " + daily.points : "",
      daily ? "Temps autorisé : " + window.DailyExercises.formatCredit(daily.seconds ?? daily.minutes * 60) : "",
      daily ? "Bonus ponctuels : " + window.DailyExercises.formatCredit(daily.bonusSeconds || 0) : "",
      scores ? "Scores enregistrés : " + scores.length : "Historique des scores illisible",
      mastery ? "Catégories de maîtrise enregistrées : " + Object.keys(mastery.categories).length
        : "Données de maîtrise illisibles",
    ];
    for (const item of items.filter(Boolean)) {
      const paragraph = document.createElement("p");
      paragraph.textContent = item;
      summary.append(paragraph);
    }
    const keys = localKeys();
    if (!keys) {
      storage.textContent = "Lecture du stockage local impossible.";
      return;
    }
    if (!keys.length) {
      storage.textContent = "Aucune donnée locale trouvée.";
      return;
    }
    for (const key of keys) {
      const details = document.createElement("details");
      const title = document.createElement("summary");
      title.textContent = key;
      details.append(title);
      details.addEventListener("toggle", () => {
        if (!details.open || details.querySelector("pre")) return;
        const pre = document.createElement("pre");
        try {
          const raw = localStorage.getItem(key);
          try { pre.textContent = JSON.stringify(JSON.parse(raw), null, 2); }
          catch { pre.textContent = raw === null ? "(absent)" : raw; }
        } catch { pre.textContent = "Lecture impossible."; }
        details.append(pre);
      });
      storage.append(details);
    }
  }

  function grantBonus(event) {
    event.preventDefault();
    const minutesInput = element("bonus-minutes");
    const minutes = Number(minutesInput.value);
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 120) {
      status("bonus-status", "Choisissez un nombre entier de minutes entre 1 et 120.", true);
      return;
    }
    if (!window.confirm("Ajouter " + minutes + " minute(s) sur cet appareil aujourd’hui ?"))
      return;
    if (!pendingBonusToken) {
      pendingBonusToken = Date.now().toString(36) + "-" +
        Math.random().toString(36).slice(2, 14).padEnd(8, "0");
    }
    const ok = window.DailyExercises.grantAdminBonus(minutes * 60, pendingBonusToken);
    if (!ok) {
      status("bonus-status", "Bonus non enregistré. Vérifiez le stockage du navigateur, puis réessayez.", true);
      return;
    }
    pendingBonusToken = null;
    status("bonus-status", "+" + minutes + " min ajoutées pour aujourd’hui.");
    renderLocalData();
  }

  function login(event) {
    event.preventDefault();
    const password = element("admin-password");
    if (password.value !== ADMIN_PASSWORD) {
      status("login-status", "Mot de passe incorrect.", true);
      password.value = "";
      password.focus();
      return;
    }
    password.value = "";
    element("login-panel").hidden = true;
    element("admin-dashboard").hidden = false;
    renderCategories();
    renderLocalData();
  }

  element("login-form").addEventListener("submit", login);
  element("bonus-form").addEventListener("submit", grantBonus);
  element("admin-refresh").addEventListener("click", renderLocalData);
})();
