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

test("progress title, values and icons are enlarged and remain mobile-responsive", () => {
  assert.ok(css.includes("font-size: clamp(1.22rem, 3.45vw, 1.65rem)"));
  assert.ok(css.includes("font-size: clamp(1.08rem, 4.65vw, 1.42rem)"));
  assert.ok(css.includes("font-size: clamp(.9rem, 4vw, 1.13rem)"));
  assert.ok(css.includes("font-size: clamp(1rem, 2.85vw, 1.38rem)"));
  assert.ok(css.includes("width: 40px; height: 40px; flex-basis: 40px;"));
  assert.ok(css.includes("flex-basis: clamp(31px, 8.8vw, 40px)"));
  assert.ok(css.includes("@media (max-width: 350px)"));
  assert.ok(html.includes("home-v3.css?v=3-progress-heading"));
});
