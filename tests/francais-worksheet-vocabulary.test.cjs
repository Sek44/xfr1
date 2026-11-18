"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "..", "francais-data.js"), "utf8");
const context = { window: {} };
vm.runInNewContext(source, context, { filename: "francais-data.js" });
const sets = context.window.FrancaisData.sets;

// Mots des 30 questions de la fiche du 19/11. Le mot doit être celui
// à compléter, et non simplement apparaître dans une autre phrase.
const expectedWords = {
  c: ["garçon", "glace", "citron", "hameçon", "maçon", "balançoire", "commençons", "commerçant", "cicatrice", "leçons"],
  g: ["girafe", "rangeons", "guitare", "légumes", "corrige", "gâteau", "mangeons", "bague", "gorille", "nages"],
  s: ["poisson", "dessiner", "phrase", "pense", "fusée", "monstre", "tasse", "cousin", "classe", "désert"],
};

function testedWord([before, after, answer]) {
  const prefix = before.match(/[\p{L}]+$/u)?.[0] || "";
  const suffix = after.match(/^[\p{L}]+/u)?.[0] || "";
  return (prefix + answer + suffix).toLocaleLowerCase("fr");
}

for (const [category, words] of Object.entries(expectedWords)) {
  test(`La famille ${category} permet de tester les 10 mots de la fiche`, () => {
    const items = sets[category].items;
    const actualWords = new Set(items.map(testedWord));
    const missing = words.filter((word) => !actualWords.has(word));
    assert.deepEqual(missing, [], `Mots sans question à trou : ${missing.join(", ")}`);
    for (const word of words) {
      const questions = items.filter((item) => testedWord(item) === word);
      assert.ok(questions.some((item) => sets[category].options.includes(item[2])));
    }
  });
}
