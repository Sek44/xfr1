"use strict";
// Pure, screen-independent gameplay for Mission magique.
(function (root) {
  class MagicGame {
    constructor(random = Math.random) {
      this.random = random;
      this.reset();
    }

    reset() {
      this.score = 0;
      this.time = 0;
      this.distance = 0;
      this.spawnIn = 1.5;
      this.nextId = 0;
      this.lastOperation = null;
      this.enemies = [];
      this.spells = [];
      this.effects = [];
      [0.25, 0.43, 0.60].forEach((y) => this.spawn(y));
    }

    operation() {
      return {
        a: 1 + Math.floor(this.random() * 9),
        b: 1 + Math.floor(this.random() * 9),
      };
    }

    spawn(y = 0.12) {
      if (this.enemies.length >= 5) return false;
      const used = new Set(this.enemies.map((enemy) => enemy.answer));
      const lanes = [0.22, 0.5, 0.78];
      for (let attempt = 0; attempt < 120; attempt++) {
        const { a, b } = this.operation();
        const operation = a + "+" + b;
        if (used.has(a + b) || operation === this.lastOperation) continue;
        const x = lanes[Math.floor(this.random() * lanes.length)] +
          (this.random() - 0.5) * 0.065;
        if (this.enemies.some((enemy) =>
          Math.abs(enemy.y - y) < 0.17 && Math.abs(enemy.x - x) < 0.23
        )) continue;
        this.lastOperation = operation;
        this.enemies.push({
          id: ++this.nextId,
          a, b, answer: a + b,
          kind: Math.floor(this.random() * 4),
          x, y,
          vx: (this.random() - 0.5) * 0.08,
          speed: 0.022 + this.random() * 0.014,
          changeAt: this.time + 1 + this.random() * 2,
          targeted: false,
        });
        return true;
      }
      return false;
    }

    shoot(text) {
      if (!/^\d{1,2}$/.test(String(text))) return false;
      const target = this.enemies
        .filter((enemy) => !enemy.targeted && enemy.answer === Number(text))
        .sort((a, b) => b.y - a.y)[0];
      if (!target) return false;
      target.targeted = true;
      this.spells.push({ id: target.id, age: 0 });
      return true;
    }

    step(dt) {
      if (!Number.isFinite(dt) || dt <= 0) return;
      dt = Math.min(dt, 0.05);
      this.time += dt;
      this.distance += 34 * dt;
      for (const enemy of this.enemies) {
        if (enemy.targeted) continue;
        enemy.y += enemy.speed * dt;
        enemy.x += enemy.vx * dt;
        if (enemy.x < 0.14 || enemy.x > 0.86) {
          enemy.x = Math.max(0.14, Math.min(0.86, enemy.x));
          enemy.vx *= -1;
        }
        if (this.time >= enemy.changeAt) {
          enemy.vx = (this.random() - 0.5) * 0.09;
          enemy.changeAt = this.time + 1 + this.random() * 2.4;
        }
      }
      for (const spell of this.spells) {
        spell.age += dt;
        if (spell.age < 0.42) continue;
        const target = this.enemies.find((enemy) => enemy.id === spell.id);
        if (target && !target.dead) {
          target.dead = true;
          this.score++;
          this.effects.push({ x: target.x, y: target.y, age: 0 });
          this.spawnIn = Math.min(this.spawnIn, 0.8);
        }
      }
      this.spells = this.spells.filter((spell) => spell.age < 0.42);
      this.enemies = this.enemies.filter((enemy) => !enemy.dead && enemy.y < 0.91);
      for (const effect of this.effects) effect.age += dt;
      this.effects = this.effects.filter((effect) => effect.age < 0.7);
      this.spawnIn -= dt;
      if (this.spawnIn <= 0 && this.enemies.length < 4) {
        this.spawn();
        this.spawnIn = 1.8;
      }
    }

    snapshot() {
      return JSON.parse(JSON.stringify({
        score: this.score,
        time: this.time,
        distance: this.distance,
        spawnIn: this.spawnIn,
        nextId: this.nextId,
        lastOperation: this.lastOperation,
        enemies: this.enemies,
        spells: this.spells,
        effects: this.effects,
      }));
    }

    restore(state) {
      const finite = (value) => typeof value === "number" && Number.isFinite(value);
      const count = (value) => Number.isSafeInteger(value) && value >= 0;
      const validEnemy = (enemy) =>
        enemy && count(enemy.id) &&
        Number.isInteger(enemy.a) && enemy.a >= 1 && enemy.a <= 9 &&
        Number.isInteger(enemy.b) && enemy.b >= 1 && enemy.b <= 9 &&
        enemy.answer === enemy.a + enemy.b &&
        count(enemy.kind) && enemy.kind < 4 &&
        finite(enemy.x) && enemy.x >= 0 && enemy.x <= 1 &&
        finite(enemy.y) && enemy.y >= 0 && enemy.y <= 1 &&
        finite(enemy.vx) && Math.abs(enemy.vx) <= 1 &&
        finite(enemy.speed) && enemy.speed > 0 && enemy.speed < 1 &&
        finite(enemy.changeAt) && typeof enemy.targeted === "boolean";
      if (!state || typeof state !== "object" ||
          !count(state.score) || !finite(state.time) || state.time < 0 ||
          !finite(state.distance) || state.distance < 0 ||
          !finite(state.spawnIn) || !count(state.nextId) ||
          !(state.lastOperation === null || typeof state.lastOperation === "string") ||
          !Array.isArray(state.enemies) || state.enemies.length > 5 ||
          !state.enemies.every(validEnemy) ||
          new Set(state.enemies.map((enemy) => enemy.id)).size !== state.enemies.length ||
          !Array.isArray(state.spells) || state.spells.length > 5 ||
          !state.spells.every((spell) => count(spell.id) && finite(spell.age) &&
            spell.age >= 0 && spell.age < 0.42 &&
            state.enemies.some((enemy) => enemy.id === spell.id && enemy.targeted)) ||
          !Array.isArray(state.effects) || state.effects.length > 12 ||
          !state.effects.every((effect) => finite(effect.x) && finite(effect.y) &&
            finite(effect.age) && effect.age >= 0 && effect.age < 0.7))
        return false;
      for (const field of [
        "score", "time", "distance", "spawnIn", "nextId", "lastOperation",
        "enemies", "spells", "effects",
      ]) this[field] = JSON.parse(JSON.stringify(state[field]));
      return true;
    }
  }
  root.MagicGame = MagicGame;
})(typeof module !== "undefined" ? module.exports : window);
