"use strict";
(() => {
  const $ = (id) => document.getElementById(id);
  const game = new MagicGame();
  const storage = GameState.create("magic");
  const arena = document.querySelector(".magic-arena");
  const canvas = $("ground");
  const ctx = canvas.getContext("2d");
  const creatures = new Map();
  const spells = new Map();
  const bursts = new Map();
  let width = 1, height = 1, running = false, paused = false;
  let saved = false, viewingScores = false, confirming = false;
  let answer = "", last = 0, lastPersist = 0;

  const art = [
    // Friendly ghost
    '<svg class="creature-art" viewBox="0 0 80 80" aria-hidden="true"><ellipse cx="40" cy="73" rx="27" ry="6" fill="#0e322c" opacity=".25"/><path d="M15 62V36a25 25 0 0 1 50 0v26l-9-6-8 9-9-7-9 7-8-8Z" fill="#e0e9f1" stroke="#8d9baf" stroke-width="3"/><path d="M19 37Q23 14 45 14" fill="none" stroke="#fff" stroke-width="5" opacity=".7"/><ellipse cx="31" cy="40" rx="5" ry="7" fill="#283248"/><ellipse cx="49" cy="40" rx="5" ry="7" fill="#283248"/><circle cx="32" cy="38" r="1.5" fill="white"/><circle cx="50" cy="38" r="1.5" fill="white"/><path d="M36 55q5 5 9 0" fill="none" stroke="#8f6b8c" stroke-width="2.5" stroke-linecap="round"/><circle cx="21" cy="50" r="6" fill="#efb0bd" opacity=".65"/><circle cx="59" cy="50" r="6" fill="#efb0bd" opacity=".65"/></svg>',
    // Small forest slime
    '<svg class="creature-art" viewBox="0 0 80 80" aria-hidden="true"><ellipse cx="40" cy="72" rx="28" ry="5" fill="#0e322c" opacity=".25"/><path d="M9 57Q9 39 23 35q-5-20 12-25 9-4 14 10 16-1 17 19 12 11 3 23Q55 74 27 69 10 67 9 57Z" fill="#8dd8aa" stroke="#2f866c" stroke-width="3"/><path d="M19 43Q29 25 43 28" fill="none" stroke="#d8ffe0" stroke-width="5" opacity=".7" stroke-linecap="round"/><ellipse cx="30" cy="50" rx="5" ry="7" fill="#294e45"/><ellipse cx="52" cy="50" rx="5" ry="7" fill="#294e45"/><path d="M37 60q5 6 10 0" fill="none" stroke="#276456" stroke-width="3" stroke-linecap="round"/><circle cx="20" cy="57" r="5" fill="#f9a5a7" opacity=".7"/><circle cx="61" cy="57" r="5" fill="#f9a5a7" opacity=".7"/></svg>',
    // Little winged bat
    '<svg class="creature-art" viewBox="0 0 80 80" aria-hidden="true"><ellipse cx="40" cy="73" rx="29" ry="5" fill="#0e322c" opacity=".25"/><path d="M26 36 5 24 10 45 1 49 21 61 34 52M54 36l21-12-5 21 9 4-20 12-13-9" fill="#665583" stroke="#392c59" stroke-width="3" stroke-linejoin="round"/><path d="M25 25 30 11 39 23 50 11 55 26Q71 47 55 61q-15 11-31 0-15-14 1-36Z" fill="#6c5b90" stroke="#3a3055" stroke-width="3"/><path d="M31 14 37 25 28 24M49 14 44 25 52 24" fill="#b98fc9"/><ellipse cx="32" cy="43" rx="5" ry="6" fill="#ffdd82"/><ellipse cx="50" cy="43" rx="5" ry="6" fill="#ffdd82"/><circle cx="32" cy="43" r="2" fill="#30283b"/><circle cx="50" cy="43" r="2" fill="#30283b"/><path d="M36 55q5 4 10 0" fill="none" stroke="#efbddf" stroke-width="2"/><path d="m37 56 3 5 3-5" fill="white"/></svg>',
    // Woodland mushroom sprite
    '<svg class="creature-art" viewBox="0 0 80 80" aria-hidden="true"><ellipse cx="40" cy="73" rx="27" ry="5" fill="#0e322c" opacity=".25"/><path d="M25 38q-8 23-2 29 16 11 35 0 5-8-3-29Z" fill="#eed1a0" stroke="#9e7f68" stroke-width="3"/><path d="M9 40Q14 10 40 12q26-2 31 28Q50 49 9 40Z" fill="#ce786d" stroke="#8e4c5d" stroke-width="3"/><path d="M20 32Q31 17 44 19" fill="none" stroke="#eaa99a" stroke-width="4" stroke-linecap="round"/><ellipse cx="24" cy="35" rx="5" ry="3" fill="#fff5cb"/><circle cx="47" cy="27" r="6" fill="#fff5cb"/><ellipse cx="61" cy="37" rx="4" ry="3" fill="#fff5cb"/><ellipse cx="32" cy="53" rx="4" ry="6" fill="#413a45"/><ellipse cx="49" cy="53" rx="4" ry="6" fill="#413a45"/><path d="M36 63q5 4 9 0" fill="none" stroke="#bb8069" stroke-width="2.5" stroke-linecap="round"/></svg>',
  ];

  ScoreView.bind({
    suspend() {
      viewingScores = true;
      last = 0;
      persist();
    },
    resume() {
      viewingScores = false;
      last = 0;
    },
  });

  function persist() {
    if (running && !saved)
      storage.save({ game: game.snapshot(), answer, paused });
  }

  function showPause() {
    $("overlay-title").textContent = "Petite pause magique";
    $("instructions").textContent =
      "La forêt t’attend ! Appuie sur Reprendre pour continuer ta promenade.";
    $("result").textContent = "";
    $("start").textContent = "Reprendre ✨";
    $("overlay").hidden = false;
  }

  function restore() {
    const state = storage.load();
    if (!state || typeof state.answer !== "string" ||
        !/^\d{0,2}$/.test(state.answer) ||
        !game.restore(state.game)) return false;
    answer = state.answer;
    running = true;
    paused = true; // Never advance the world before the player resumes.
    saved = false;
    showPause();
    return true;
  }

  function sync() {
    $("points").textContent = game.score;
    $("answer").textContent = answer || "?";
    const disabled = !running || paused || confirming || viewingScores;
    for (const button of $("keypad").children) button.disabled = disabled;
    $("pause").disabled = !running || confirming;
    $("end-game").disabled = !running || confirming;
    $("pause").textContent = paused ? "▶" : "Ⅱ";
    $("pause").setAttribute("aria-label", paused ? "Reprendre" : "Mettre en pause");
  }

  function edit(command) {
    if (!running || paused || viewingScores || confirming) return;
    answer = GameUI.editNumber(answer, command, 2);
    if (answer && game.shoot(answer)) {
      answer = "";
      $("hint").textContent = "Bravo ! Un sort magique est parti !";
    } else if (answer.length === 2) {
      $("hint").textContent = "Aucune créature ne porte ce résultat. Efface et réessaie.";
    } else {
      $("hint").textContent = "Trouve le résultat d’une addition affichée !";
    }
    sync();
    persist();
  }

  GameUI.keypad($("keypad"), edit, { clearLabel: "C" });

  function start() {
    game.reset();
    for (const map of [creatures, spells, bursts]) {
      for (const node of map.values()) node.remove();
      map.clear();
    }
    answer = "";
    running = true;
    paused = false;
    saved = false;
    last = 0;
    $("overlay").hidden = true;
    $("hint").textContent = "Trouve le résultat d’une addition affichée !";
    sync();
    persist();
  }

  function pause() {
    if (!running || confirming) return;
    paused = !paused;
    last = 0;
    if (paused) showPause();
    else $("overlay").hidden = true;
    sync();
    persist();
  }

  function finish() {
    if (!running || saved) return;
    saved = true;
    running = false;
    paused = false;
    storage.clear();
    // An abandoned zero-point session is not added to the history.
    if (game.score > 0)
      ExerciseScores.save({
        tab: "magic",
        category: "Mission magique",
        score: game.score,
        total: 1,
        mode: "arcade",
      });
    $("overlay-title").textContent = "Mission accomplie !";
    $("instructions").textContent =
      game.score >= 10
        ? "Fantastique ! Tu es un véritable maître des sortilèges !"
        : "Bien joué ! Chaque addition te rend plus fort en magie.";
    $("result").textContent =
      game.score + " point" + (game.score === 1 ? "" : "s");
    $("start").textContent = "Rejouer ✨";
    $("overlay").hidden = false;
    sync();
  }

  async function endGame() {
    if (!running || confirming) return;
    confirming = true;
    last = 0;
    sync();
    try {
      const yes = game.score === 0 || await AppConfirm.ask({
        theme: "dark",
        title: "Terminer l’aventure ?",
        message: "Ton score actuel sera enregistré.",
        confirmText: "Terminer et enregistrer",
        cancelText: "Continuer",
      });
      if (yes) finish();
    } finally {
      confirming = false;
      last = 0;
      sync();
    }
  }

  $("home-link").addEventListener("click", async (event) => {
    if (!running || event.defaultPrevented ||
        event.button !== 0 || event.ctrlKey || event.metaKey ||
        event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (confirming) return;
    confirming = true;
    last = 0;
    sync();
    try {
      const yes = game.score === 0 || await AppConfirm.ask({
        theme: "dark",
        title: "Retourner à l’accueil ?",
        message: "Ta partie sera sauvegardée pour la retrouver plus tard.",
        confirmText: "Retour à l’accueil",
        cancelText: "Rester dans le jeu",
      });
      if (yes) {
        persist();
        location.assign("./");
      }
    } finally {
      confirming = false;
      last = 0;
      sync();
    }
  });

  $("start").onclick = () => running && paused ? pause() : start();
  $("pause").onclick = pause;
  $("end-game").onclick = endGame;

  window.addEventListener("pagehide", persist);
  window.addEventListener("pageshow", (event) => {
    if (event.persisted && running && !paused) pause();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && running && !paused && !viewingScores && !confirming)
      pause();
  });
  window.addEventListener("blur", () => {
    if (running && !paused && !viewingScores && !confirming) pause();
  });
  document.addEventListener("keydown", (event) => {
    if (event.ctrlKey || event.altKey || event.metaKey || event.target.closest("a"))
      return;
    if (event.key === "Escape" && running && !confirming) {
      event.preventDefault();
      pause();
    } else if (running && !paused && !confirming && !viewingScores) {
      if (/^\d$/.test(event.key)) {
        event.preventDefault();
        edit(event.key);
      } else if (event.key === "Backspace" || event.key === "Delete") {
        event.preventDefault();
        edit(event.key === "Backspace" ? "erase" : "clear");
      }
    }
  });

  function rand(row, col) {
    let n = Math.imul(row + 9137, 374761393) + Math.imul(col + 269, 668265263);
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }

  function diamond(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y - h / 2);
    ctx.lineTo(x + w / 2, y);
    ctx.lineTo(x, y + h / 2);
    ctx.lineTo(x - w / 2, y);
    ctx.closePath();
    ctx.fill();
  }

  function tree(x, y, scale, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = "#122d253f";
    ctx.beginPath(); ctx.ellipse(0, 1, 23, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#513e2b";
    ctx.fillRect(-4, -20, 8, 21);
    ctx.fillStyle = color;
    for (let i = 0; i < 3; i++) {
      const top = -66 + i * 16, spread = 17 + i * 7;
      ctx.beginPath();
      ctx.moveTo(0, top);
      ctx.lineTo(-spread, top + 35);
      ctx.lineTo(spread, top + 35);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = "#f2d28c";
    ctx.globalAlpha = .19;
    ctx.beginPath(); ctx.moveTo(-3, -62); ctx.lineTo(-15, -29); ctx.lineTo(-3, -32); ctx.fill();
    ctx.restore();
  }

  function drawGround() {
    const w = arena.clientWidth, h = arena.clientHeight;
    if (!w || !h || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (width !== w || height !== h || canvas.width !== Math.round(w * dpr) ||
        canvas.height !== Math.round(h * dpr)) {
      width = w; height = h;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    ctx.fillStyle = "#255036";
    ctx.fillRect(0, 0, w, h);
    const tileW = Math.max(70, Math.min(106, w / 6));
    const tileH = tileW * .48;
    const stride = tileH / 2;
    const first = Math.floor(game.distance / stride);
    const offset = game.distance % stride;
    const cols = Math.ceil(w / tileW) + 2;
    const rows = Math.ceil(h / stride) + 3;
    for (let r = -1; r < rows; r++) {
      const worldRow = first + r;
      const y = r * stride + offset;
      for (let c = -1; c <= cols; c++) {
        const x = (c + (worldRow % 2) * .5) * tileW;
        const seed = rand(worldRow, c);
        const onPath = Math.abs(x - w * .5) < w * .33;
        diamond(x, y, tileW + 1, tileH + 1,
          onPath
            ? (seed > .6 ? "#897d62" : seed > .3 ? "#82785e" : "#79745b")
            : (seed > .6 ? "#325f3e" : seed > .3 ? "#28553a" : "#305940"));
        if (onPath && seed > .93) {
          ctx.fillStyle = "#baae85";
          ctx.fillRect(x - 2, y, 4, 2);
        }
        if (!onPath && seed < .16) {
          ctx.fillStyle = seed < .06 ? "#f1cb88" : "#9d92c6";
          ctx.beginPath(); ctx.arc(x, y, 2.2, 0, 2 * Math.PI); ctx.fill();
        }
        if (onPath && seed < .019) {
          ctx.fillStyle = "#d3b88a";
          ctx.beginPath(); ctx.ellipse(x, y, 5, 2.3, 0, 0, 2 * Math.PI); ctx.fill();
        }
      }
    }
    // Paint trees after the floor, so tiles cannot cover their foliage.
    for (let r = -1; r < rows; r++) {
      const worldRow = first + r;
      const y = r * stride + offset;
      if (r % 3 !== 0) continue;
      for (let c = -1; c <= cols; c++) {
        const x = (c + (worldRow % 2) * .5) * tileW;
        if (Math.abs(x - w * .5) < w * .33) continue;
        const seed = rand(worldRow, c);
        if (seed > .78)
          tree(x, y + 5, .56 + (y / h) * .45, seed > .88 ? "#1b4936" : "#246044");
      }
    }
    const shade = ctx.createRadialGradient(w*.5, h*.5, h*.15, w*.5, h*.5, h*.86);
    shade.addColorStop(0, "#0a261200");
    shade.addColorStop(1, "#07181078");
    ctx.fillStyle = shade; ctx.fillRect(0, 0, w, h);
    // Fireflies drifting over the scene.
    for (let i = 0; i < 9; i++) {
      const x = (rand(i, 19) * .88 + .06) * w;
      const y = (((rand(i, 71) * h + game.distance * (0.4 + i*.06)) % h) + h) % h;
      ctx.fillStyle = i % 2 ? "#fbe5a0a8" : "#b7f7c3a8";
      ctx.beginPath(); ctx.arc(x, y, 1.5 + i % 2, 0, Math.PI*2); ctx.fill();
    }
  }

  function sprite(map, parent, id, className) {
    let node = map.get(id);
    if (!node) {
      node = document.createElement("div");
      node.className = className;
      parent.append(node);
      map.set(id, node);
    }
    return node;
  }

  function drawSprites() {
    const active = new Set();
    for (const enemy of game.enemies) {
      active.add(enemy.id);
      const node = sprite(creatures, $("creatures"), enemy.id, "foe");
      if (!node.firstChild) {
        const label = document.createElement("span");
        label.className = "math-label";
        label.textContent = enemy.a + " + " + enemy.b;
        const graphic = document.createElement("div");
        graphic.innerHTML = art[enemy.kind];
        node.append(label, graphic);
        node.setAttribute("aria-label", enemy.a + " plus " + enemy.b);
      }
      node.style.left = (enemy.x * 100) + "%";
      node.style.top = (enemy.y * 100) + "%";
      node.style.transform =
        "translate(-50%, -50%) scale(" + (0.76 + enemy.y * 0.39) + ")";
      node.style.zIndex = Math.round(enemy.y * 20);
      node.classList.toggle("targeted", enemy.targeted);
    }
    for (const [id, node] of creatures) {
      if (!active.has(id)) { node.remove(); creatures.delete(id); }
    }

    const liveSpells = new Set();
    for (const spell of game.spells) {
      const target = game.enemies.find((enemy) => enemy.id === spell.id);
      if (!target) continue;
      liveSpells.add(spell.id);
      const node = sprite(spells, $("magic-effects"), spell.id, "spell-orb");
      const t = Math.min(1, spell.age / .42);
      const ease = t * t * (3 - 2 * t);
      const x = .57 + (target.x - .57) * ease;
      const y = .66 + (target.y - .66) * ease;
      node.style.left = x * 100 + "%";
      node.style.top = y * 100 + "%";
    }
    for (const [id, node] of spells) {
      if (!liveSpells.has(id)) { node.remove(); spells.delete(id); }
    }

    const liveBursts = new Set();
    for (const [i, effect] of game.effects.entries()) {
      // Effects retain stable identities until expiry through their object reference.
      liveBursts.add(effect);
      const node = sprite(bursts, $("magic-effects"), effect, "magic-pop");
      node.style.left = effect.x * 100 + "%";
      node.style.top = effect.y * 100 + "%";
      node.style.setProperty("--scale", .5 + 1.5 * effect.age / .7);
      node.style.setProperty("--opacity", 1 - effect.age / .7);
    }
    for (const [id, node] of bursts) {
      if (!liveBursts.has(id)) { node.remove(); bursts.delete(id); }
    }
  }

  function frame(now) {
    if (running && !paused && !viewingScores && !confirming) {
      if (last) game.step(Math.min((now - last) / 1000, .05));
      if (game.score !== Number($("points").textContent)) {
        sync();
        persist();
      }
      if (now - lastPersist >= 1500) {
        sync();
        persist();
        lastPersist = now;
      }
    }
    last = now;
    drawGround();
    drawSprites();
    requestAnimationFrame(frame);
  }

  restore();
  sync();
  requestAnimationFrame(frame);
})();
