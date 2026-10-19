"use strict";
// Pure simulation: normalized coordinates keep gameplay identical on every screen.
(function (root) {
  class SpaceGame {
    constructor(random = Math.random) {
      this.random = random;
      this.reset();
    }
    reset() {
      this.lives = 3;
      this.bombs = 2;
      this.score = 0;
      this.enemies = [];
      this.missiles = [];
      this.effects = [];
      this.time = 0;
      this.spawnIn = 0.6;
      this.over = false;
      this.nextId = 0;
      this.nextEffectId = 0;
      this.playerX = 0.5;
      this.shots = [];
      this.alignment = null;
      this.lastOperation = null;
    }
    snapshot() {
      const fields = [
        "lives", "bombs", "score", "enemies", "missiles", "effects",
        "time", "spawnIn", "over", "nextId", "nextEffectId",
        "playerX", "shots", "alignment", "lastOperation",
      ];
      return Object.fromEntries(
        fields.map((key) => [key, JSON.parse(JSON.stringify(this[key]))]),
      );
    }
    restore(state) {
      const finite = (v) => typeof v === "number" && Number.isFinite(v);
      const count = (v) => Number.isSafeInteger(v) && v >= 0;
      const object = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
      if (
        !object(state) ||
        !count(state.score) || !count(state.bombs) ||
        !Number.isInteger(state.lives) || state.lives < 1 || state.lives > 3 ||
        !finite(state.time) || state.time < 0 ||
        !finite(state.spawnIn) ||
        !count(state.nextId) || !count(state.nextEffectId) ||
        !finite(state.playerX) || state.playerX < 0 || state.playerX > 1 ||
        state.over !== false ||
        !Array.isArray(state.enemies) ||
        !Array.isArray(state.missiles) ||
        !Array.isArray(state.effects) ||
        !Array.isArray(state.shots) ||
        !state.enemies.every((e) =>
          object(e) && count(e.id) && finite(e.a) && finite(e.b) &&
          finite(e.answer) && finite(e.x) && finite(e.y) &&
          finite(e.speed) && typeof e.bomb === "boolean" &&
          typeof e.targeted === "boolean") ||
        !state.missiles.every((m) =>
          object(m) && count(m.target) && finite(m.x) && finite(m.y)) ||
        !state.effects.every((e) =>
          object(e) && count(e.id) && finite(e.x) && finite(e.y) &&
          finite(e.age) && typeof e.color === "string") ||
        !state.shots.every(count) ||
        (state.alignment !== null &&
          (!object(state.alignment) || !count(state.alignment.target) ||
            !finite(state.alignment.fromX) || !finite(state.alignment.elapsed) ||
            !finite(state.alignment.duration) || state.alignment.duration <= 0))
      ) return false;
      const fields = Object.keys(this.snapshot());
      if (!fields.every((key) => key === "lastOperation" || Object.hasOwn(state, key))) return false;
      // Restore only supported simulation fields, never the random generator.
      for (const key of fields) {
        // Older saves predate lastOperation; infer it from the latest enemy.
        if (key === "lastOperation") {
          const latest = state.enemies.reduce(
            (last, enemy) => (!last || enemy.id > last.id ? enemy : last),
            null,
          );
          this.lastOperation =
            typeof state.lastOperation === "string"
              ? state.lastOperation
              : latest ? latest.a + "+" + latest.b : null;
        } else {
          this[key] = JSON.parse(JSON.stringify(state[key]));
        }
      }
      return true;
    }
    get level() {
      return 1 + Math.floor(this.score / 5);
    }
    operation() {
      const int = (min, max) =>
        min + Math.floor(this.random() * (max - min + 1));
      const level = this.level;
      let minA = 1;
      let maxA = 9;
      let minResult = 2;
      let maxResult = level === 1 ? 10 : 18;

      if (level === 2) {
        minResult = 6;
      } else if (level === 3) {
        minResult = 11;
      } else if (level >= 4) {
        // Two levels per decade: no carry, then carry.
        const decade = Math.floor((level - 4) / 2) + 1;
        minA = decade * 10;
        maxA = minA + 9;
        minResult = minA + 1;
        maxResult = maxA + (level % 2 === 0 ? 0 : 9);
      }

      // Pick only first operands for which a one-digit second operand exists.
      const a = int(Math.max(minA, minResult - 9), Math.min(maxA, maxResult - 1));
      const b = int(Math.max(1, minResult - a), Math.min(9, maxResult - a));
      return { a, b };
    }
    spawn() {
      if (this.enemies.length >= 8) return;
      const answers = new Set(this.enemies.map((e) => e.answer));
      let a, b;
      for (let i = 0; i < 100; i++) {
        ({ a, b } = this.operation());
        if (!answers.has(a + b) && this.lastOperation !== a + "+" + b) break;
      }
      if (answers.has(a + b) || this.lastOperation === a + "+" + b) return;
      const lanes = [0.16, 0.5, 0.84];
      const free = lanes.filter(
        (x) => !this.enemies.some((e) => Math.abs(e.x - x) < 0.2 && e.y < 0.24),
      );
      if (!free.length) return;
      this.lastOperation = a + "+" + b;
      this.enemies.push({
        id: ++this.nextId,
        level: this.level,
        a,
        b,
        answer: a + b,
        x: free[Math.floor(this.random() * free.length)],
        y: 0.04,
        speed: 0.026 + Math.min(this.score, 60) * 0.0006,
        bomb: this.random() < 0.08,
        targeted: false,
      });
    }
    shoot(answer) {
      if (this.over || !/^\d+$/.test(answer)) return false;
      const target = this.enemies
        .filter((e) => !e.targeted && e.answer === Number(answer))
        .sort((a, b) => b.y - a.y)[0];
      if (!target) return false;
      target.targeted = true;
      this.shots.push(target.id);
      this.alignNext();
      return true;
    }
    alignNext() {
      if (this.alignment) return;
      while (this.shots.length) {
        const id = this.shots.shift(),
          target = this.enemies.find((e) => e.id === id);
        if (target) {
          this.alignment = {
            target: target.id,
            fromX: this.playerX,
            elapsed: 0,
            duration: 0.08,
          };
          return;
        }
      }
    }
    moveAndLaunch(dt) {
      let remaining = dt;
      this.alignNext();
      while (this.alignment && remaining > 0) {
        const a = this.alignment,
          target = this.enemies.find((e) => e.id === a.target && !e.dead);
        if (!target) {
          this.alignment = null;
          this.alignNext();
          continue;
        }
        const used = Math.min(remaining, a.duration - a.elapsed);
        a.elapsed += used;
        remaining -= used;
        const t = Math.min(1, a.elapsed / a.duration),
          ease = t * t * (3 - 2 * t);
        this.playerX = a.fromX + (target.x - a.fromX) * ease;
        if (t < 1) break;
        this.playerX = target.x;
        this.missiles.push({ target: target.id, x: target.x, y: 0.915 });
        this.alignment = null;
        this.alignNext();
      }
    }
    explode(e, color) {
      this.effects.push({
        id: ++this.nextEffectId,
        x: e.x,
        y: e.y,
        age: 0,
        color,
      });
    }
    clearWave() {
      this.enemies = [];
      this.missiles = [];
      this.shots = [];
      this.alignment = null;
    }
    bomb() {
      if (this.over || this.bombs === 0 || !this.enemies.length) return false;
      this.bombs--;
      for (const e of this.enemies) this.explode(e, "#fbbf24");
      this.clearWave();
      return true;
    }
    step(dt) {
      if (this.over) return;
      dt = Math.min(dt, 0.05);
      this.time += dt;
      for (const e of this.enemies) e.y += e.speed * dt;
      const escaped = this.enemies.find((e) => !e.dead && e.y >= 0.9);
      if (escaped) {
        this.lives = Math.max(0, this.lives - 1);
        this.explode({ ...escaped, y: 0.9 }, "#fb7185");
        this.clearWave();
        this.spawnIn = 1.1;
        this.over = this.lives === 0;
      }
      this.moveAndLaunch(dt);
      for (const m of this.missiles) {
        const target = this.enemies.find((e) => e.id === m.target);
        if (!target) {
          m.done = true;
          continue;
        }
        const move = 2 * dt;
        if (m.y - target.y <= move) {
          m.done = true;
          target.dead = true;
          this.score++;
          if (target.bomb) this.bombs++;
          this.explode(target, target.bomb ? "#fbbf24" : "#67e8f9");
        } else m.y -= move;
      }

      this.enemies = this.enemies.filter((e) => !e.dead);
      this.missiles = this.missiles.filter(
        (m) => !m.done && this.enemies.some((e) => e.id === m.target),
      );
      for (const e of this.effects) e.age += dt;
      this.effects = this.effects.filter((e) => e.age < 0.85);
      if (this.lives === 0) {
        this.over = true;
        return;
      }
      this.spawnIn -= dt;
      if (!this.enemies.length || this.spawnIn <= 0) {
        this.spawn();
        this.spawnIn = 1.5 * Math.max(2.5, 5 - this.score * 0.04);
      }
    }
  }
  root.SpaceGame = SpaceGame;
})(typeof module !== "undefined" ? module.exports : window);
