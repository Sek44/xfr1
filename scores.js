"use strict";
window.ExerciseScores = (() => {
  const KEY = "exercices_francais_scores";
  const origins = new WeakMap();
  // Do not reuse the existing "category" field: it names exercise levels.
  // Legacy records are classified on read without changing stored history.
  function scoreCategory(record) {
    if (record.tab === "space" || record.tab === "magic" || record.mode === "arcade")
      return "mission";
    if (["g", "c", "s", "all", "math", "conjugaison"].includes(record.tab))
      return "exercise";
    return record.scoreCategory === "mission" ? "mission" : "exercise";
  }
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
            scoreCategory: scoreCategory(record),
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
    if (record.tab === "conjugaison") return "Conjugaison · " + (record.category || "Présent · 1er groupe");
    if (record.tab === "g") return "Français · g / gu / ge";
    if (record.tab === "c") return "Français · c / ç";
    if (record.tab === "s") return "Français · s / ss";
    if (record.tab === "all") return "Français · Tout";
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
    container.replaceChildren();
    const heading = document.createElement("h2");
    heading.textContent = "Évolution du score";
    container.append(heading);

    // Every saved session is represented, including gaps for missing scores.
    // Newest records are stored first; reverse a copy without changing history.
    const sessions = records.slice().reverse();
    const points = sessions.flatMap((record, index) => {
      if (
        record.score == null ||
        String(record.score).trim() === "" ||
        !Number.isFinite(Number(record.score)) ||
        Number(record.score) < 0
      )
        return [];
      const score = Number(record.score);
      // The "Tous" chart compares only exercises, with their results on /10.
      // Missing/invalid denominators cannot be normalized reliably.
      const total = Number(record.total);
      if (
        game === null &&
        (record.total == null ||
          String(record.total).trim() === "" ||
          !Number.isFinite(total) ||
          total <= 0 ||
          score > total)
      )
        return [];
      return [
        {
          record,
          index,
          value: game === null ? (score / total) * 10 : score,
          score,
        },
      ];
    });
    if (!points.length) {
      const empty = document.createElement("p");
      empty.textContent =
        game === null && records.length
          ? "Aucun score avec un total valide à tracer sur 10."
          : "Pas encore de score à afficher sur le graphique.";
      container.append(empty);
      return;
    }

    const width = 600,
      height = 320,
      right = 24,
      top = 24,
      bottom = 52;
    const maximum =
      game === null
        ? 10
        : Math.max(
            game === "space" || game === "magic" ? 1 : 10,
            ...points.map((point) => point.value),
          );
    const step = game === null ? 2 : Math.max(1, Math.ceil(maximum / 5)),
      ceiling = step * 5,
      left = Math.max(56, 20 + String(ceiling).length * 12),
      // All sessions share the same chart width. Dense curves keep their
      // lines but omit markers; intermediate curves hide markers on mobile.
      hideDots = sessions.length > 28,
      hideDotsMobile = sessions.length > 14;
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
      if (text !== undefined) node.textContent = String(text);
      return node;
    }
    const svg = svgNode("svg", {
      viewBox: "0 0 " + width + " " + height,
      class: hideDotsMobile ? "score-chart-mobile-dense" : "score-chart-compact",
      role: "img",
      "aria-label":
        "Évolution des scores, " +
        points.length +
        " résultat(s), du plus ancien au plus récent, " +
        (game === null ? "ramenés sur 10." : "en points."),
    });

    const defs = svgNode("defs");
    const gradient = svgNode("linearGradient", {
      id: "score-area-gradient",
      gradientUnits: "userSpaceOnUse",
      x1: 0,
      y1: top,
      x2: 0,
      y2: height - bottom,
    });
    gradient.append(
      svgNode("stop", {
        offset: "0%",
        "stop-color": "#70b8fa",
        "stop-opacity": 0.76,
      }),
      svgNode("stop", {
        offset: "60%",
        "stop-color": "#90cbfb",
        "stop-opacity": 0.43,
      }),
      svgNode("stop", {
        offset: "100%",
        "stop-color": "#acdfff",
        "stop-opacity": 0.10,
      }),
    );
    defs.append(gradient);
    svg.append(defs);

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
          { x: left - 12, y: position + 5, "text-anchor": "end" },
          value,
        ),
      );
    }

    svg.append(
      svgNode("line", {
        x1: left,
        x2: left,
        y1: top,
        y2: height - bottom,
        class: "score-axis",
      }),
      svgNode("line", {
        x1: left,
        x2: width - right,
        y1: height - bottom,
        y2: height - bottom,
        class: "score-axis",
      }),
    );

    // Draw the translucent blue area and lines independently for each sequence
    // of valid scores, so missing legacy values never become invented zeroes.
    const segments = [];
    let segment = [];
    let previousIndex = -1;
    for (const point of points) {
      if (point.index !== previousIndex + 1 && segment.length) {
        segments.push(segment);
        segment = [];
      }
      segment.push(point);
      previousIndex = point.index;
    }
    if (segment.length) segments.push(segment);
    for (const part of segments) {
      if (part.length < 2) continue;
      const coordinates = part.map(
        (point) => x(point.index) + "," + y(point.value),
      );
      const first = part[0],
        last = part[part.length - 1];
      svg.append(
        svgNode("path", {
          d:
            "M " +
            x(first.index) +
            "," +
            y(0) +
            " L " +
            coordinates.join(" L ") +
            " L " +
            x(last.index) +
            "," +
            y(0) +
            " Z",
          class: "score-area",
        }),
        svgNode("polyline", {
          points: coordinates.join(" "),
          class: "score-line",
        }),
      );
    }

    for (const point of hideDots ? [] : points) {
      const dot = svgNode("circle", {
        cx: x(point.index),
        cy: y(point.value),
        r: 6,
        class: "score-dot",
      });
      const date =
          typeof point.record.date === "string"
            ? new Date(point.record.date)
            : new Date(NaN),
        dateLabel = Number.isNaN(date.getTime())
          ? "—"
          : date.toLocaleDateString("fr-FR");
      dot.append(
        svgNode(
          "title",
          {},
          "Partie " +
            (records.length - sessions.length + point.index + 1) +
            " · " +
            dateLabel +
            " " +
            time(point.record) +
            " · " +
            label(point.record) +
            " · " +
            (game === null
              ? point.value.toLocaleString("fr-FR", {
                  maximumFractionDigits: 1,
                }) +
                " / 10 (" +
                point.score +
                " / " +
                point.record.total +
                ")"
              : point.value + " points"),
        ),
      );
      svg.append(dot);
    }

    // Keep date labels readable regardless of the number of points.
    const labelEvery = Math.max(
      1,
      Math.ceil((sessions.length - 1) / 3),
    );
    const ticks = new Set();
    for (let index = 0; index < sessions.length; index += labelEvery)
      ticks.add(index);
    ticks.add(sessions.length - 1);
    for (const index of ticks) {
      const date =
        typeof sessions[index].date === "string"
          ? new Date(sessions[index].date)
          : new Date(NaN);
      svg.append(
        svgNode(
          "text",
          {
            x: x(index),
            y: height - 16,
            "text-anchor": "middle",
            class: "score-date",
          },
          Number.isNaN(date.getTime())
            ? "n° " + (records.length - sessions.length + index + 1)
            : date.toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "2-digit",
              }),
        ),
      );
    }
    container.append(svg);
  }
  function render(container, game = null, chartContainer = null) {
    container.replaceChildren();
    const records = read().filter(
      (r) =>
        (game === null && scoreCategory(r) === "exercise") ||
        (game === "conjugaison"
          ? r.tab === "conjugaison"
          : game === "math"
          ? r.tab === "math"
          : game === "space" || game === "magic"
            ? r.tab === game
            : r.tab === "g" || r.tab === "c" || r.tab === "s" || r.tab === "all"),
    );
    if (chartContainer) renderGraph(chartContainer, records, game);
    else renderGraph(container, records, game);
    const title = document.createElement("h2");
    title.textContent =
      game === null
        ? "Tous mes exercices"
        : game === "conjugaison"
          ? "Mes résultats en conjugaison"
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
      return;
    }
    const summary = document.createElement("p");
    summary.className = "history-summary";
    const exercises = records.filter(
      (r) =>
        scoreCategory(r) === "exercise" &&
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
      render(container, game, chartContainer);
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
      tr.className = "history-entry";
      const date =
        typeof r.date === "string" ? new Date(r.date) : new Date(NaN);
      const values = [
        Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("fr-FR"),
        time(r),
        label(r),
        r.score == null
          ? "—"
          : scoreCategory(r) === "mission"
            ? r.score + " points"
            : String(r.score),
      ];
      for (const [index, value] of values.entries()) {
        const td = document.createElement("td");
        td.textContent = value;
        td.setAttribute("data-label", ["Date", "Heure", "Exercice", "Score"][index]);
        if (index === 3) {
          td.className = "history-score-value";
          if (scoreCategory(r) === "mission")
            td.className += " history-score-mission";
        }
        tr.append(td);
      }
      longPress(tr, r);
      body.append(tr);
    }
    table.append(body);
    scroll.append(table);
    container.append(scroll);
  }
  return { read, save, render, encourage, time, remove };
})();
