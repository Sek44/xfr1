"use strict";
(() => {
  // Public by design: this password is only a guard against accidental access.
  // GitHub itself validates repository writes; localStorage is not protected.
  const ADMIN_PASSWORD = "xfr1-administration";
  const GITHUB_FILE = "https://api.github.com/repos/Sek44/xfr1/contents/reward-difficulties.js";
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
  const difficultyInputs = new Map();
  const published = { ...window.RewardDifficultyLevels };
  let pendingBonusToken = null;

  function status(id, message, error = false) {
    const output = element(id);
    output.textContent = message;
    output.dataset.error = String(error);
  }

  function readDifficultyInputs() {
    const values = {};
    for (const [key, input] of difficultyInputs) {
      if (!/^(?:[1-9]|10)$/.test(input.value))
        throw new Error("La difficulté de « " + key + " » doit être comprise entre 1 et 10.");
      values[key] = Number(input.value);
    }
    return values;
  }

  function configSource(values) {
    return '"use strict";\n' +
      "// Shared difficulty settings. Edit here or publish through admin.html.\n" +
      "// Each key identifies a playable subcategory; values range from 1 to 10.\n" +
      "window.RewardDifficultyLevels = Object.freeze(" +
      JSON.stringify(values, null, 2) + ");\n";
  }

  function updateDirtyIndicator() {
    try {
      const modified = JSON.stringify(readDifficultyInputs()) !== JSON.stringify(published);
      status("difficulty-status", modified
        ? "Difficultés modifiées : elles ne seront appliquées qu’après publication sur GitHub."
        : "Difficultés identiques à la configuration publiée.");
    } catch (error) {
      status("difficulty-status", error.message, true);
    }
  }

  function createCategoryRow(key, label) {
    const row = document.createElement("div");
    row.className = "admin-level-row";

    const name = document.createElement("label");
    name.textContent = label;
    const difficulty = document.createElement("input");
    difficulty.type = "number";
    difficulty.min = "1";
    difficulty.max = "10";
    difficulty.step = "1";
    difficulty.value = String(published[key]);
    difficulty.setAttribute("aria-label", "Difficulté : " + label);
    name.htmlFor = "difficulty-" + key.replace(/[^a-z0-9]/g, "-");
    difficulty.id = name.htmlFor;
    difficultyInputs.set(key, difficulty);
    difficulty.addEventListener("input", updateDirtyIndicator);

    const mastery = document.createElement("select");
    mastery.setAttribute("aria-label", "Maîtrise : " + label);
    const auto = document.createElement("option");
    auto.value = "auto";
    auto.textContent = "Auto";
    mastery.append(auto);
    for (let level = 0; level <= 10; level++) {
      const option = document.createElement("option");
      option.value = String(level);
      option.textContent = String(level);
      mastery.append(option);
    }
    const profile = window.RewardRules.read()?.categories[key];
    mastery.value = Number.isInteger(profile?.manualMastery)
      ? String(profile.manualMastery) : "auto";
    let saved = mastery.value;
    mastery.addEventListener("change", () => {
      const level = mastery.value === "auto" ? null : Number(mastery.value);
      if (!window.RewardRules.setMastery(key, level)) {
        mastery.value = saved;
        status("mastery-status", "Échec de l’enregistrement local. Vérifiez le stockage du navigateur.", true);
        return;
      }
      saved = mastery.value;
      const effective = window.RewardRules.inspect(key)?.mastery;
      status("mastery-status", "Maîtrise enregistrée pour « " + label +
        " » : " + effective + (level === null ? " (automatique)." : " (forcée)."));
      renderLocalData();
    });

    row.append(name, difficulty, mastery);
    return row;
  }

  function renderCategories() {
    const root = element("admin-category-list");
    for (const group of GROUPS) {
      const section = document.createElement("section");
      section.className = "admin-group";
      const title = document.createElement("h3");
      title.textContent = group.label;
      const headings = document.createElement("div");
      headings.className = "admin-level-header";
      for (const label of ["Exercice", "Difficulté", "Maîtrise"]) {
        const text = document.createElement("span");
        text.textContent = label;
        headings.append(text);
      }
      section.append(title, headings);
      for (const [key, label] of group.entries)
        section.append(createCategoryRow(key, label));
      root.append(section);
    }
    updateDirtyIndicator();
  }

  function parseGitHubConfig(source) {
    const match = source.match(/window\.RewardDifficultyLevels\s*=\s*Object\.freeze\((\{[\s\S]*?\})\);/);
    if (!match) throw new Error("Format de configuration GitHub non reconnu.");
    return JSON.parse(match[1]);
  }

  async function saveGitHub() {
    let levels;
    try { levels = readDifficultyInputs(); }
    catch (error) { status("difficulty-status", error.message, true); return; }
    const token = element("github-token").value.trim();
    if (!token) {
      status("difficulty-status", "Renseignez un jeton GitHub pour publier directement, ou utilisez l’éditeur GitHub.", true);
      return;
    }
    const button = element("github-save");
    button.disabled = true;
    status("difficulty-status", "Enregistrement GitHub en cours…");
    try {
      const headers = {
        Accept: "application/vnd.github+json",
        Authorization: "Bearer " + token,
        "X-GitHub-Api-Version": "2022-11-28",
      };
      const read = await fetch(GITHUB_FILE + "?ref=main", {
        method: "GET", headers, cache: "no-store",
      });
      if (!read.ok) throw new Error("Impossible de lire le dépôt (HTTP " + read.status + ").");
      const remote = await read.json();
      const source = atob(remote.content.replace(/\s/g, ""));
      if (JSON.stringify(parseGitHubConfig(source)) !== JSON.stringify(published))
        throw new Error("La configuration GitHub a changé. Rechargez cette page avant de publier.");
      const update = await fetch(GITHUB_FILE, {
        method: "PUT",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "Admin: update exercise difficulty levels",
          content: btoa(configSource(levels)),
          sha: remote.sha,
          branch: "main",
        }),
      });
      if (!update.ok) throw new Error("Publication refusée par GitHub (HTTP " + update.status + ").");
      Object.assign(published, levels);
      status("difficulty-status", "Modifications enregistrées sur GitHub. Elles seront actives après le déploiement et le rechargement des pages.");
    } catch (error) {
      status("difficulty-status", error.message || "Échec de la publication.", true);
    } finally {
      element("github-token").value = "";
      button.disabled = false;
    }
  }

  async function copyConfig() {
    try {
      const source = configSource(readDifficultyInputs());
      await navigator.clipboard.writeText(source);
      status("difficulty-status", "Configuration copiée. Collez-la dans le fichier ouvert avec « Modifier dans GitHub », puis validez le commit.");
    } catch (error) {
      status("difficulty-status", "Copie impossible : " + error.message, true);
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
  element("github-save").addEventListener("click", saveGitHub);
  element("github-copy").addEventListener("click", copyConfig);
  element("bonus-form").addEventListener("submit", grantBonus);
  element("admin-refresh").addEventListener("click", renderLocalData);
})();
