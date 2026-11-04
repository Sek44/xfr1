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
    const selector = new RegExp(
      String.raw`\\.page-header\\.school-banner\\.academy-banner \\.nav-icon\\.academy-nav-button\\.academy-nav-${action}`,
    );
    assert.match(css, selector);
    assert.match(css, new RegExp(String.raw`nav-${action}-academy\\.webp`));
  }
});

test("French and Calcul show correctness only in the action button", () => {
  for (const page of ["francais", "calcul"]) {
    const js = read(page + ".js");
    assert.doesNotMatch(js, /game\\.feedback\\(/);
    assert.match(js, /"Incorrect · Réessaie"/);
    assert.match(js, /"Bien corrigé ! Suivant"/);
    assert.match(js, /"Bravo ! Suivant"/);
    assert.match(js, /button\\.classList\\.toggle\\("feedback-retry"/);
  }
});

test("Conjugaison loads one specifically named stylesheet and retired files are absent", () => {
  const html = read("conjugaison.html");
  assert.match(html, /magical-academy\\/conjugaison\\.css/);
  assert.doesNotMatch(html, /conjugaison-v3\\.css/);
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
