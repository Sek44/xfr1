"use strict";
(() => {
  const $ = (id) => document.getElementById(id),
    game = new SpaceGame(),
    storedGame = GameState.create("space");
  let running = false,
    paused = false,
    answer = "",
    last = 0,
    saved = false,
    displayedLevel = game.level,
    levelAnimation = null,
    lastPersist = 0;
  const sprites = new Map();
  let viewingScores = false,
    confirmingLeave = false;
  ScoreView.bind({
    suspend: () => {
      viewingScores = true;
      last = 0;
      persist();
    },
    resume: () => {
      last = 0;
      viewingScores = false;
    },
  });
  function persist() {
    if (running && !saved && !game.over)
      storedGame.save({ game: game.snapshot(), answer, paused });
  }
  function showPause() {
    $("overlay").hidden = false;
    $("overlay-title").textContent = "Petite pause";
    $("instructions").textContent =
      "La galaxie peut attendre. Reprends quand tu es prêt !";
    $("bomb-help").hidden = true;
    $("result").textContent = "";
    $("start").textContent = "Reprendre";
  }
  function restore() {
    const state = storedGame.load();
    if (
      !state ||
      typeof state.answer !== "string" ||
      !/^[0-9]{0,3}$/.test(state.answer) ||
      !game.restore(state.game)
    ) return false;
    answer = state.answer;
    running = true;
    // No enemies should move before the player chooses to resume.
    paused = true;
    saved = false;
    last = 0;
    displayedLevel = game.level;
    $("level").textContent = game.level;
    showPause();
    return true;
  }
  // Independent visual randomness keeps the sky irregular without affecting gameplay.
  const starfield = $("stars");
  for (let i = 0; i < 90; i++) {
    const star = document.createElement("span"),
      bright = i % 19 === 0,
      near = i % 5 === 0;
    star.className = "star" + (bright ? " radiant" : "");
    star.style.left = Math.random() * 100 + "%";
    star.style.top = Math.random() * 100 + "%";
    star.style.setProperty(
      "--size",
      (bright
        ? 2.4
        : near
          ? 1.5 + Math.random() * 0.7
          : 0.7 + Math.random() * 0.7) + "px",
    );
    star.style.setProperty(
      "--light",
      bright ? 0.85 : near ? 0.6 : 0.2 + Math.random() * 0.25,
    );
    star.style.setProperty("--duration", 4 + Math.random() * 7 + "s");
    star.style.setProperty("--delay", -Math.random() * 12 + "s");
    star.style.setProperty(
      "--tint",
      i % 7 === 0 ? "#b9caff" : i % 11 === 0 ? "#ffe5c0" : "#e4f1ff",
    );
    starfield.append(star);
  }
  function sync() {
    $("points").textContent = game.score;
    if (game.level !== displayedLevel) {
      const level = $("level"),
        increase = game.level > displayedLevel;
      displayedLevel = game.level;
      level.textContent = game.level;
      if (levelAnimation) {
        levelAnimation.cancel();
        levelAnimation = null;
      }
      if (
        increase &&
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        levelAnimation = level.animate(
          [
            { transform: "scale(1)" },
            { transform: "scale(1.55)", offset: 0.38 },
            { transform: "scale(.92)", offset: 0.76 },
            { transform: "scale(1)" },
          ],
          { duration: 380, easing: "ease-out" },
        );
      }
    }
    $("lives").textContent = "♥ ".repeat(game.lives).trim() || "—";
    $("lives").setAttribute("aria-label", game.lives + " vies");
    $("bomb-count").textContent = game.bombs;
    $("answer").textContent = answer || "?";
    const disabled = !running || paused || game.over;
    for (const key of $("keypad").children) key.disabled = disabled;
    $("bomb").disabled = disabled || !game.bombs;
    $("pause").disabled = !running || game.over;
    $("end-game").disabled = !running || game.over;
    $("pause").textContent = paused ? "▶" : "Ⅱ";
    $("pause").setAttribute(
      "aria-label",
      paused ? "Reprendre" : "Mettre en pause",
    );
  }
  function edit(value) {
    if (!running || paused || game.over || confirmingLeave) return;
    const maxDigits = Math.max(3, ...game.enemies.map((enemy) => String(enemy.answer).length));
    answer = GameUI.editNumber(answer, value, maxDigits);
    if (answer && game.shoot(answer)) {
      answer = "";
    }
    sync();
    persist();
  }
  GameUI.keypad($("keypad"), edit, { clearLabel: "C" });
  function bomb() {
    if (!running || paused) return;
    if (game.bomb()) {
      answer = "";
      sync();
      persist();
    }
  }
  function start() {
    for (const node of sprites.values()) node.remove();
    sprites.clear();
    game.reset();
    running = true;
    paused = false;
    saved = false;
    answer = "";
    last = 0;
    $("overlay").hidden = true;
    sync();
    persist();
  }
  function pause() {
    if (!running || game.over) return;
    paused = !paused;
    last = 0;
    $("overlay").hidden = !paused;
    if (paused) showPause();
    sync();
    persist();
  }
  function finish() {
    if (saved) return;
    saved = true;
    running = false;
    paused = false;
    game.over = true;
    storedGame.clear();
    ExerciseScores.save({
      tab: "space",
      category: "Mission calcul",
      score: game.score,
      total: 1,
      mode: "arcade",
    });
    $("overlay-title").textContent = "Mission terminée !";
    $("instructions").textContent =
      game.score >= 10
        ? "Fantastique, tu es un as du calcul !"
        : "Bien joué ! Chaque mission te fait progresser.";
    $("bomb-help").hidden = true;
    $("result").textContent =
      game.score + " point" + (game.score === 1 ? "" : "s");
    $("start").textContent = "Rejouer 🚀";
    $("overlay").hidden = false;
    sync();
  }
  async function confirmEnd() {
    if (!running || saved || confirmingLeave) return;
    confirmingLeave = true;
    last = 0;
    try {
      const confirmed =
        game.score === 0 ||
        (await AppConfirm.ask({
          theme: "dark",
          title: "Terminer la partie ?",
          message: "Ton score actuel sera enregistré.",
          confirmText: "Terminer et enregistrer",
          cancelText: "Continuer",
        }));
      if (confirmed) finish();
    } finally {
      confirmingLeave = false;
      last = 0;
    }
  }
  $("start").onclick = () => (paused ? pause() : start());
  $("bomb").onclick = bomb;
  $("pause").onclick = pause;
  $("end-game").onclick = () => confirmEnd();
  // Going home no longer ends the game or records a partial score.
  window.addEventListener("pagehide", persist);
  window.addEventListener("pageshow", (event) => {
    if (event.persisted && running && !paused) pause();
  });
  document.addEventListener("visibilitychange", () => {
    if (
      document.hidden &&
      running &&
      !paused &&
      !viewingScores &&
      !confirmingLeave
    )
      pause();
  });
  window.addEventListener("blur", () => {
    if (running && !paused && !viewingScores && !confirmingLeave) pause();
  });
  document.addEventListener("keydown", (e) => {
    if (
      confirmingLeave ||
      e.ctrlKey ||
      e.altKey ||
      e.metaKey ||
      e.target.closest("a")
    )
      return;
    if (e.code === "Escape") {
      e.preventDefault();
      pause();
      return;
    }
    if (!running || paused || game.over) return;
    if (/^\d$/.test(e.key)) {
      e.preventDefault();
      edit(e.key);
    } else if (e.key === "Backspace") {
      e.preventDefault();
      edit("erase");
    } else if (e.key === "Delete") {
      e.preventDefault();
      edit("clear");
    }
  });
  // SVG and CSS render without a canvas context or resize-dependent backing buffer.

  function draw() {
    $("player").style.left = game.playerX * 100 + "%";
    const active = new Set();
    function sprite(key, type, x, y) {
      active.add(key);
      let node = sprites.get(key);
      if (!node) {
        node = document.createElement("div");
        node.className = type;
        $("sprites").append(node);
        sprites.set(key, node);
      }
      node.style.left = x * 100 + "%";
      node.style.top = y * 100 + "%";
      return node;
    }
    for (const e of game.enemies) {
      const node = sprite("enemy-" + e.id, "alien", e.x, e.y);
      if (!node.firstChild) {
        const visual = SpaceEnemies.visual(e.level || 1);
        node.innerHTML = visual.svg;
        node.style.setProperty("--enemy-color", visual.color);
        node.style.setProperty("--enemy-armor", visual.armor);
        const label = document.createElement("span");
        label.className = "calculus";
        label.textContent = e.a + " + " + e.b;
        node.append(label);
        if (e.bomb) {
          const badge = document.createElement("span");
          badge.className = "bomb-badge";
          badge.textContent = "💣";
          node.append(badge);
        }
      }
      node.classList.toggle("carrier", e.bomb);
    }
    for (const m of game.missiles) {
      const node = sprite("missile-" + m.target, "missile", m.x, m.y);
      if (!node.firstChild)
        node.innerHTML =
          '<span class="missile-trail"></span><span class="missile-body"></span><span class="missile-flame"></span>';
    }
    for (const e of game.effects) {
      const node = sprite("effect-" + e.id, "explosion", e.x, e.y);
      if (!node.firstChild) {
        const ring = document.createElement("span");
        ring.className = "blast-ring";
        node.append(ring);
        node.ring = ring;
        node.fragments = [];
        const count = 10 + Math.floor(Math.random() * 6);
        for (let i = 0; i < count; i++) {
          const shard = document.createElement("span"),
            angle = ((i + Math.random()) / count) * Math.PI * 2,
            speed = 35 + Math.random() * 85;
          shard.className = "debris";
          shard.style.width = 2 + Math.random() * 4 + "px";
          shard.style.height = 1.5 + Math.random() * 3 + "px";
          shard.style.background =
            i % 3 === 0 ? "#f4faff" : i % 3 === 1 ? e.color : "#8295af";
          node.append(shard);
          node.fragments.push({
            shard,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            spin: (Math.random() - 0.5) * 900,
            angle: Math.random() * 360,
          });
        }
      }
      const t = e.age;
      node.style.color = e.color;
      node.ring.style.opacity = Math.max(0, 1 - t / 0.5);
      node.ring.style.transform =
        "translate(-50%,-50%) scale(" + (0.2 + t * 4) + ")";
      for (const f of node.fragments) {
        f.shard.style.opacity = Math.max(0, 1 - t / 0.85);
        f.shard.style.transform =
          "translate(" +
          f.vx * t +
          "px," +
          (f.vy * t + 35 * t * t) +
          "px) rotate(" +
          (f.angle + f.spin * t) +
          "deg)";
      }
    }
    for (const [key, node] of sprites) {
      if (!active.has(key)) {
        node.remove();
        sprites.delete(key);
      }
    }
  }
  function frame(now) {
    if (running && !paused && !viewingScores && !confirmingLeave) {
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
      const lives = game.lives;
      game.step(dt);
      if (game.lives < lives) {
        answer = "";
      }
      sync();
      if (game.over) finish();
      else if (now - lastPersist >= 500) {
        persist();
        lastPersist = now;
      }
    }
    last = now;
    draw();
    requestAnimationFrame(frame);
  }
  restore();
  sync();
  requestAnimationFrame(frame);
})();
