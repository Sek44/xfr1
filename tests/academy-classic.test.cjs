const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const read = (name) => fs.readFileSync(path.join(root, name), "utf8");

function buildHeader(dataset) {
  const element = (tag) => ({
    tag,
    children: [],
    attributes: {},
    className: "",
    dataset: {},
    setAttribute(key, value) { this.attributes[key] = value; },
    append(...nodes) { this.children.push(...nodes); },
    replaceChildren(...nodes) { this.children = nodes; },
  });
  const nav = element("nav");
  nav.dataset = dataset;
  const document = {
    querySelectorAll(selector) {
      assert.equal(selector, "[data-academy-header]");
      return [nav];
    },
    createElement: element,
  };
  const window = {};
  vm.runInNewContext(read("academy-header.js"), { document, window });
  return { nav, header: window.AcademyHeader };
}

for (const [title, icon, game] of [
  ["Conjugaison", "conjugaison", "conjugaison"],
  ["Français", "francais", "francais"],
  ["Additions", "calcul", "calcul"],
]) {
  test(title + " uses the reusable navigation with restart and scores", () => {
    const { nav, header } = buildHeader({
      title, icon, game, restart: "true", scores: "true",
    });
    assert.equal(typeof header.mount, "function");
    assert.equal(nav.children.length, 4);
    const [back, heading, restart, scores] = nav.children;
    assert.equal(back.href, "./");
    assert.equal(back.attributes["aria-label"], "Retour à l’accueil");
    assert.equal(heading.children[1].textContent, title);
    assert.match(heading.children[0].className, new RegExp("academy-title-art--" + icon));
    assert.equal(restart.id, "restart-series");
    assert.equal(restart.tag, "button");
    assert.equal(restart.type, "button");
    assert.equal(restart.attributes["aria-label"], "Recommencer la série");
    assert.equal(scores.href, "./scores.html?game=" + game);
    assert.equal(scores.attributes["aria-label"], "Voir les scores");
  });
}

test("scores navigation retains scores-back and omits restart", () => {
  const { nav } = buildHeader({
    title: "Mes scores", icon: "scores",
    restart: "false", scores: "false", backId: "scores-back",
  });
  assert.equal(nav.children.length, 3);
  assert.equal(nav.children[0].id, "scores-back");
  assert.equal(nav.children[1].children[1].textContent, "Mes scores");
  assert.equal(nav.children[2].className, "banner-spacer");
});

test("four classic pages share the theme and its header controller", () => {
  for (const page of ["francais", "conjugaison", "calcul", "scores"]) {
    const html = read(page + ".html");
    assert.match(html, /class="school-page academy-page|class="school-page academy-page conjugaison-page/);
    assert.match(html, /data-academy-header/);
    assert.match(html, /academy-header\.js/);
    assert.match(html, /magical-academy\/classic\.css/);
    assert.doesNotMatch(html, /<style>/);
  }
});

test("game-specific pages use standard question and keyboard panels", () => {
  for (const file of ["francais.js", "conjugaison.js", "calcul.js"]) {
    const js = read(file);
    assert.match(js, /academy-playing/);
    assert.match(js, /question-frame/);
    assert.match(js, /keyboard-panel/);
  }
});

test("navigation illustrations cannot be erased by the old theme background", () => {
  const css = read("styles/themes/magical-academy/classic.css");
  for (const action of ["back", "restart", "scores"]) {
    const selector = ".page-header.school-banner.academy-banner .nav-icon.academy-nav-button.academy-nav-" + action;
    assert.ok(css.includes(selector), selector);
    assert.ok(css.includes('url("./assets/nav-' + action + '-academy.webp")'));
  }
});

test("French and Calcul show correctness only in the action button", () => {
  for (const page of ["francais", "calcul"]) {
    const js = read(page + ".js");
    assert.equal(js.includes("game.feedback("), false);
    assert.ok(js.includes('"Incorrect · Réessaie"'));
    assert.ok(js.includes('"Bien corrigé ! Suivant"'));
    assert.ok(js.includes('"Bravo ! Suivant"'));
    assert.ok(js.includes('button.classList.toggle("feedback-retry"'));
  }
});

test("Conjugaison loads one specifically named stylesheet and retired files are absent", () => {
  const html = read("conjugaison.html");
  assert.ok(html.includes("magical-academy/conjugaison.css"));
  assert.equal(html.includes("conjugaison-v3.css"), false);
  for (const file of [
    "conjugaison.css",
    "styles/themes/magical-academy/conjugaison-v3.css",
    "styles/themes/magical-academy/assets/castle.svg",
    "styles/themes/magical-academy/assets/lantern.svg",
    "styles/themes/magical-academy/assets/title-frame-9slice.webp",
    "styles/themes/magical-academy/assets/question-frame-9slice.webp",
    "styles/themes/magical-academy/assets/quill-academy.webp",
  ]) {
    assert.equal(fs.existsSync(path.join(root, file)), false, file);
  }
});

test("French text reserves width at the end of its measured lines", () => {
  const script = read("francais.js");
  const css = read("francais.css");
  assert.ok(script.includes('sentence sentence-measure'));
  assert.ok(script.includes('sentence-line'));
  assert.ok(script.includes('reference.replaceWith(sentence)'));
  assert.ok(script.includes('line.right - line.left'));
  assert.ok(css.includes('.sentence-line {'));
  assert.ok(css.includes('text-align: left'));
  assert.equal(css.includes('padding-inline-end'), false);
});

test("French and Conjugaison share the ornate tabs without duplicate CSS", () => {
  const common = read("styles/themes/magical-academy/classic.css");
  const conjugaison = read("styles/themes/magical-academy/conjugaison.css");
  const french = read("francais.html");
  const conjugaisonPage = read("conjugaison.html");
  assert.ok(common.includes(".academy-tabs .academy-tab"));
  assert.ok(common.includes("title-frame-filled-9slice.webp"));
  assert.equal(conjugaison.includes("body.conjugaison-page .tabs"), false);
  assert.ok(french.includes('class="tabs academy-tabs"'));
  assert.ok(conjugaisonPage.includes('class="tab-current academy-tab"'));
  assert.ok(read("francais.js").includes("GameUI.tabs("));
});

test("French choices, numeric keys and AZERTY reuse the standard key finish", () => {
  const common = read("styles/themes/magical-academy/classic.css");
  assert.ok(common.includes("--academy-key-background"));
  assert.ok(common.includes(".academy-key, .azerty-keyboard .keyboard-key"));
  assert.ok(read("francais.js").includes('"academy-key"'));
  assert.ok(read("game-ui.js").includes('"academy-key"'));
});

test("classic exercises do not append score denominators per page", () => {
  const common = read("game-common.js");
  const conjugaison = read("conjugaison.js");
  assert.ok(common.includes('"Question " + Math.min(index + 1, total) + "/" + total'));
  assert.ok(common.includes("value.textContent = String(score)"));
  assert.ok(common.includes("academy-progress"));
  assert.equal(conjugaison.includes('score.querySelector(".progress-score strong")'), false);
});

test("Calcul has a deliberate gap after the difficulty selectors", () => {
  const css = read("calcul.css");
  assert.ok(css.includes("#categories.settings"));
  assert.ok(css.includes("margin: 9px 2px 16px"));
  assert.ok(css.includes("#score.academy-progress"));
});

test("final results reuse the shared parchment and standard button styling", () => {
  const css = read("styles/themes/magical-academy/classic.css");
  const js = read("game-common.js");
  assert.ok(css.includes(".panel:has(> .academy-result)"));
  assert.ok(css.includes(".academy-result::before"));
  assert.ok(css.includes("question-frame-filled-9slice.webp"));
  assert.ok(css.includes("home-cup.webp"));
  assert.ok(css.includes(".academy-result-score-value"));
  assert.ok(css.includes("body.academy-page:has(.academy-result) .academy-progress"));
  assert.ok(css.includes("body.francais-page:has(.academy-result) .exercise-intro"));
  assert.ok(css.includes(".academy-result-actions .primary"));
  assert.ok(js.includes('card.className = "academy-result"'));
  assert.ok(js.includes('heading.textContent = "Exercice terminé !"'));
  assert.ok(js.includes('button.textContent = "Recommencer"'));
});
