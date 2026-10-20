"use strict";
window.ExerciseScores = (() => {
  const KEY = "exercices_francais_scores";
  const origins = new WeakMap();
  const encouragements = {
    perfect: [
      "Incroyable ! Un sans-faute, tu es une vraie star !",
      "Fantastique ! 10 sur 10, quel champion !",
      "Bravo ! Tu as tout réussi, c'est exceptionnel !",
    ],
    high: [
      "Excellent travail ! Continue comme ça !",
      "Super résultat ! Tu progresses à toute vitesse !",
      "Très bien joué ! Tu peux être fier de toi !",
    ],
    middle: [
      "Bien joué ! Chaque exercice te fait progresser !",
      "C'est un bon début ! Continue à t'entraîner !",
      "Tu es sur la bonne voie, persévère !",
    ],
    low: [
      "Ne te décourage pas, tu vas y arriver !",
      "Chaque essai te rend plus fort. Continue !",
      "Courage ! Le plus important, c'est d'essayer et de progresser !",
    ],
  };
  function raw() {
    const value = JSON.parse(localStorage.getItem(KEY) || "[]");
    if (!Array.isArray(value)) throw new Error("Invalid score history");
    return value;
  }
  function read() {
    try {
      const records = raw(),
        snapshot = JSON.stringify(records);
      return records.filter((record, index) => {
        if (!record || typeof record !== "object") return false;
        origins.set(record, { index, snapshot });
        return true;
      });
    } catch {
      return [];
    }
  }
  function remove(record) {
    try {
      const origin = origins.get(record),
        records = raw();
      if (!origin || JSON.stringify(records) !== origin.snapshot) return false;
      records.splice(origin.index, 1);
      localStorage.setItem(KEY, JSON.stringify(records));
      return true;
    } catch {
      return false;
    }
  }
  function save(record) {
    try {
      const previous = raw(),
        now = new Date();
      localStorage.setItem(
        KEY,
        JSON.stringify([
          {
            ...record,
            date: now.toISOString(),
            time: now.toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }),
          },
          ...previous,
        ]),
      );
      return true;
    } catch {
      return false;
    }
  }
  function time(record) {
    if (
      typeof record.time === "string" &&
      /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(record.time)
    )
      return record.time;
    if (typeof record.date === "string" && /T\d{2}:\d{2}/.test(record.date)) {
      const date = new Date(record.date);
      if (!Number.isNaN(date.getTime()))
        return date.toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
    }
    return "00:00";
  }
  function label(record) {
    if (record.tab === "space") return "Mission calcul";
    if (record.tab === "magic") return "Mission magique";
    if (record.tab === "math") return record.category || "Additions";
    if (record.tab === "g") return "Français · g / gu / ge";
    if (record.tab === "c") return "Français · c / ç";
    return String(record.category || record.tab || "Exercice");
  }
  function encourage(score, total) {
    const ratio = score / total;
    const group =
      ratio === 1
        ? "perfect"
        : ratio >= 0.8
          ? "high"
          : ratio >= 0.5
            ? "middle"
            : "low";
    const choices = encouragements[group];
    return choices[Math.floor(Math.random() * choices.length)];
  }
  function renderGraph(container, records, game) {
    const section = document.createElement("section");
    section.className = "score-evolution";
    const heading = document.createElement("h3");
    heading.textContent = "Évolution des scores";
    section.append(heading);
    // Saved history is newest first. Reverse a copy; never modify stored records.
    const sessions = records.slice().reverse();
    const points = sessions.flatMap((record, index) =>
      record.score !== null &&
      record.score !== undefined &&
      String(record.score).trim() !== "" &&
      Number.isFinite(Number(record.score)) &&
      Number(record.score) >= 0
        ? [{ record, index, value: Number(record.score) }]
        : [],
    );
    if (!points.length) {
      const empty = document.createElement("p");
      empty.textContent = "Pas encore de score à afficher sur le graphique.";
      section.append(empty);
      container.append(section);
      return;
    }
    const width = 640,
      height = 260,
      left = 64,
      right = 20,
      top = 24,
      bottom = 46;
    const maximum = Math.max(
      game === "space" || game === "magic" ? 1 : 10,
      ...points.map((point) => point.value),
    );
    const step = Math.max(1, Math.ceil(maximum / 5)),
      ceiling = step * 5;
    const x = (index) =>
      sessions.length === 1
        ? (left + width - right) / 2
        : left + (index / (sessions.length - 1)) * (width - left - right);
    const y = (value) =>
      height - bottom - (value / ceiling) * (height - top - bottom);
    function svgNode(tag, attributes = {}, text) {
      const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
      for (const [name, value] of Object.entries(attributes))
        node.setAttribute(name, String(value));
      if (text !== undefined) node.textContent = text;
      return node;
    }
    const svg = svgNode("svg", {
      viewBox: `0 0 ${width} ${height}`,
      role: "img",
      "aria-label":
        "Évolution des scores : " +
        points.length +
        " résultat(s), du plus ancien au plus récent. Scores en points.",
    });
    for (let tick = 0; tick <= 5; tick++) {
      const value = tick * step,
        position = y(value);
      svg.append(
        svgNode("line", {
          x1: left,
          x2: width - right,
          y1: position,
          y2: position,
          class: "score-grid",
        }),
        svgNode(
          "text",
          { x: left - 10, y: position + 4, "text-anchor": "end" },
          value,
        ),
      );
    }
    svg.append(svgNode("text", { x: left, y: 14 }, "Score"));
    // Leave a gap for legacy records without a usable score instead of inventing zeroes.
    let segment = [],
      previousIndex = -1;
    function drawSegment() {
      if (segment.length > 1)
        svg.append(
          svgNode("polyline", {
            points: segment.join(" "),
            class: "score-line",
          }),
        );
      segment = [];
    }
    for (const point of points) {
      if (point.index !== previousIndex + 1) drawSegment();
      segment.push(`${x(point.index)},${y(point.value)}`);
      previousIndex = point.index;
    }
    drawSegment();
    for (const point of points) {
      const dot = svgNode("circle", {
        cx: x(point.index),
        cy: y(point.value),
        r: 4,
        class: "score-dot",
      });
      const date = new Date(point.record.date),
        dateLabel = Number.isNaN(date.getTime())
          ? "—"
          : date.toLocaleDateString("fr-FR");
      dot.append(
        svgNode(
          "title",
          {},
          `Partie ${point.index + 1} · ${dateLabel} ${time(point.record)} · ${label(point.record)} · ${point.value} points`,
        ),
      );
      svg.append(dot);
    }
    const ticks = new Set([
      0,
      Math.floor((sessions.length - 1) / 2),
      sessions.length - 1,
    ]);
    for (const index of ticks)
      svg.append(
        svgNode(
          "text",
          { x: x(index), y: height - bottom + 22, "text-anchor": "middle" },
          index + 1,
        ),
      );
    svg.append(
      svgNode(
        "text",
        {
          x: (left + width - right) / 2,
          y: height - 4,
          "text-anchor": "middle",
        },
        "Parties · de la plus ancienne à la plus récente",
      ),
    );
    section.append(svg);
    if (points.length < sessions.length) {
      const note = document.createElement("p");
      note.textContent =
        "Les résultats sans score renseigné ne sont pas tracés.";
      section.append(note);
    }
    container.append(section);
  }
  function render(container, game = null) {
    container.replaceChildren();
    const records = read().filter(
      (r) =>
        game === null ||
        (game === "math"
          ? r.tab === "math"
          : game === "space" || game === "magic"
            ? r.tab === game
            : r.tab === "g" || r.tab === "c"),
    );
    const title = document.createElement("h2");
    title.textContent =
      game === null
        ? "Tous mes résultats"
        : game === "math"
          ? "Mes résultats en calcul"
          : game === "space"
            ? "Mes missions spatiales"
            : game === "magic"
              ? "Mes aventures magiques"
              : "Mes résultats en français";
    container.append(title);
    if (!records.length) {
      const p = document.createElement("p");
      p.textContent = "Aucun exercice terminé pour le moment.";
      container.append(p);
      if (game !== null) renderGraph(container, records, game);
      return;
    }
    const summary = document.createElement("p");
    summary.className = "history-summary";
    const exercises = records.filter(
      (r) =>
        r.mode !== "arcade" &&
        Number.isFinite(Number(r.score)) &&
        Number(r.total) > 0,
    );
    const points = exercises.reduce((n, r) => n + Number(r.score), 0),
      total = exercises.reduce((n, r) => n + Number(r.total), 0);
    summary.textContent =
      records.length +
      " session(s) · " +
      (exercises.length
        ? Math.round((points / total) * 100) + " % de réussite"
        : "Record : " +
          Math.max(0, ...records.map((r) => Number(r.score) || 0)) +
          " points");
    container.append(summary);
    const hint = document.createElement("p");
    hint.className = "history-hint";
    hint.textContent = "Appui long sur un résultat pour le supprimer.";
    container.append(hint);
    async function askDelete(record) {
      const confirmed = await AppConfirm.ask({
        title: "Supprimer ce score ?",
        message:
          label(record) +
          " · " +
          (record.score ?? "—") +
          " point(s) · " +
          time(record),
        confirmText: "Supprimer",
        cancelText: "Conserver",
      });
      if (!confirmed) return;
      const removed = remove(record);
      render(container, game);
      if (!removed) {
        const error = document.createElement("p");
        error.className = "history-error";
        error.setAttribute("role", "status");
        error.textContent =
          "Le score n’a pas été supprimé. La liste a été actualisée : réessaie.";
        container.append(error);
      }
    }
    function longPress(row, record) {
      let timer = null,
        x = 0,
        y = 0;
      function cancel() {
        if (timer !== null) clearTimeout(timer);
        timer = null;
        row.classList.remove("holding");
      }
      row.tabIndex = 0;
      row.setAttribute(
        "aria-label",
        label(record) + ". Appui long ou touche Suppr pour supprimer.",
      );
      row.addEventListener("pointerdown", (event) => {
        if (event.button !== 0 || event.isPrimary === false) return;
        cancel();
        x = event.clientX;
        y = event.clientY;
        row.classList.add("holding");
        timer = setTimeout(() => {
          cancel();
          askDelete(record);
        }, 600);
      });
      row.addEventListener("pointermove", (event) => {
        if (Math.hypot(event.clientX - x, event.clientY - y) > 10) cancel();
      });
      for (const event of ["pointerup", "pointercancel", "pointerleave"])
        row.addEventListener(event, cancel);
      row.addEventListener("contextmenu", (event) => event.preventDefault());
      row.addEventListener("keydown", (event) => {
        if (event.key === "Delete" || event.key === "Enter") {
          event.preventDefault();
          askDelete(record);
        }
      });
    }
    const scroll = document.createElement("div");
    scroll.className = "history-scroll";
    const table = document.createElement("table");
    table.className = "history-table";
    const head = document.createElement("thead"),
      hr = document.createElement("tr");
    for (const name of ["Date", "Heure", "Exercice", "Score"]) {
      const th = document.createElement("th");
      th.textContent = name;
      hr.append(th);
    }
    head.append(hr);
    table.append(head);
    const body = document.createElement("tbody");
    for (const r of records) {
      const tr = document.createElement("tr");
      const date = new Date(r.date);
      for (const value of [
        Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("fr-FR"),
        time(r),
        label(r),
        r.score == null
          ? "—"
          : r.mode === "arcade"
            ? r.score + " points"
            : r.score + " / " + (r.total ?? "—"),
      ]) {
        const td = document.createElement("td");
        td.textContent = value;
        tr.append(td);
      }
      longPress(tr, r);
      body.append(tr);
    }
    table.append(body);
    scroll.append(table);
    container.append(scroll);
    if (game !== null) renderGraph(container, records, game);
  }
  return { read, save, render, encourage, time, remove };
})();
