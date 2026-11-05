const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const css = read("styles/themes/magical-academy/home-v3.css");
const html = read("index.html");

test("homepage title plaque and book form a compact, centered composition", () => {
  assert.ok(html.includes('class="academy-hero"'));
  assert.ok(html.includes('class="hero-book"'));
  assert.ok(html.includes('class="hero-plaque"'));
  assert.ok(html.includes('<h1 id="welcome-title">Entraînement</h1>'));
  assert.ok(css.includes("height: clamp(170px, 43vw, 205px)"));
  assert.ok(css.includes("bottom: 77px;"));
  assert.ok(css.includes("width: 80%;"));
  assert.ok(css.includes("transform: none;"));
  assert.ok(css.includes('background-image: url("./assets/home-book.webp")'));
});

test("daily progress keeps the accessible live counters inside a shared ornate frame", () => {
  assert.ok(css.includes('.daily-panel::before'));
  assert.ok(css.includes('question-frame-filled-9slice.webp'));
  assert.ok(css.includes("border-image-slice: 100 110 100 110 fill"));
  assert.ok(css.includes("border-image-width: 23px 24px 23px 24px"));
  assert.ok(html.includes('id="daily-heading"'));
  assert.ok(html.includes('id="daily-points"'));
  assert.ok(html.includes('id="daily-minutes"'));
  assert.ok(html.includes('aria-live="polite"'));
  for (const asset of [
    "question-frame-filled-9slice.webp",
    "home-cup.webp",
    "home-archery-target.webp",
    "home-hourglass.webp",
    "home-book.webp",
  ]) {
    assert.ok(
      fs.existsSync(path.join(root, "styles/themes/magical-academy/assets", asset)),
      asset,
    );
  }
});

test("daily progress uses shared responsive typography and scaled icons", () => {
  const tokens = read("styles/typography.css");
  assert.ok(css.includes("font-size: var(--type-section-title)"));
  assert.ok(css.includes("font-size: var(--type-stat)"));
  assert.ok(tokens.includes("--type-section-title: var(--text-lg)"));
  assert.ok(tokens.includes("--type-stat: var(--text-md)"));
  assert.ok(css.includes("width: 47px; height: 47px; flex-basis: 47px;"));
  assert.ok(css.includes("flex-basis: clamp(34px, 10.4vw, 46px)"));
  assert.ok(css.includes("@media (max-width: 350px)"));
  assert.ok(html.includes("home-v3.css?v=typography-1"));
});

test("daily card stays compact, enlarges all icons and uses the standard UI font", () => {
  assert.ok(css.includes("padding: 13px 22px 14px;"));
  assert.ok(css.includes("padding: 10px 16px 12px;"));
  assert.ok(css.includes("margin-top: 7px;"));
  assert.ok(css.includes("padding-bottom: 6px;"));
  assert.ok(css.includes("width: 54px;"));
  assert.ok(css.includes("flex: 0 0 50px;"));
  assert.ok(css.includes("width: 47px; height: 47px; flex-basis: 47px;"));
  assert.ok(css.includes("flex-basis: clamp(34px, 10.4vw, 46px)"));
  assert.ok(css.includes("width: 39px; height: 39px; flex-basis: 39px;"));
  assert.ok(css.includes("flex-basis: 34px; width: 34px; height: 34px;"));
  const panel = css.split('html[data-theme="magical-academy"] .daily-panel {')[1].split("}")[0];
  const heading = css.split('html[data-theme="magical-academy"] .daily-heading h2 {')[1].split("}")[0];
  const stats = css.split('html[data-theme="magical-academy"] .daily-stat strong {')[1].split("}")[0];
  for (const block of [panel, heading, stats]) {
    assert.ok(block.includes("font-family: var(--font-ui);"));
  }
});
