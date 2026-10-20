"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { MagicGame } = require("../magic-engine.js");

function seeded() {
  let n = 20261020;
  return () => {
    n = (Math.imul(n, 1664525) + 1013904223) >>> 0;
    return n / 4294967296;
  };
}

test("simple additions and distinct answers are visible at the start", () => {
  const game = new MagicGame(seeded());
  assert.equal(game.enemies.length, 3);
  assert.equal(new Set(game.enemies.map((e) => e.answer)).size, 3);
  for (const enemy of game.enemies) {
    assert.ok(enemy.a >= 1 && enemy.a <= 9);
    assert.ok(enemy.b >= 1 && enemy.b <= 9);
    assert.equal(enemy.answer, enemy.a + enemy.b);
  }
});

test("only a matching result casts a spell, scoring once on impact", () => {
  const game = new MagicGame(seeded());
  const target = game.enemies[0];
  assert.equal(game.shoot("99"), false);
  assert.equal(game.shoot("1x"), false);
  assert.equal(game.shoot(String(target.answer)), true);
  assert.equal(game.shoot(String(target.answer)), false);
  assert.equal(game.score, 0);
  for (let i = 0; i < 10; i++) game.step(0.05);
  assert.equal(game.score, 1);
  assert.ok(!game.enemies.some((e) => e.id === target.id));
  assert.equal(game.spells.length, 0);
  assert.equal(game.effects.length, 1);
});

test("world continues moving and keeps distinct results", () => {
  const game = new MagicGame(seeded());
  for (let i = 0; i < 10000; i++) {
    game.step(0.05);
    assert.ok(game.enemies.length <= 5);
    assert.equal(new Set(game.enemies.map((e) => e.answer)).size,
      game.enemies.length);
    if (i % 37 === 0 && game.enemies.length > 0)
      game.shoot(String(game.enemies[0].answer));
  }
  assert.ok(game.distance > 0);
  assert.ok(game.score > 1);
});

test("restore preserves all enemies, unfinished spells and input-independent score", () => {
  const game = new MagicGame(seeded());
  game.shoot(String(game.enemies[1].answer));
  game.step(0.1);
  const saved = game.snapshot();
  const resumed = new MagicGame(seeded());
  assert.equal(resumed.restore(saved), true);
  assert.deepEqual(resumed.snapshot(), saved);
  for (let i = 0; i < 10; i++) resumed.step(.05);
  assert.equal(resumed.score, 1);
});

test("corrupt snapshots are declined without damaging the ongoing game", () => {
  const game = new MagicGame(seeded());
  const original = game.snapshot();
  assert.equal(game.restore({ ...original, score: -1 }), false);
  assert.equal(game.restore({ ...original, enemies: [{
    ...original.enemies[0], answer: 123,
  }] }), false);
  assert.deepEqual(game.snapshot(), original);
});
