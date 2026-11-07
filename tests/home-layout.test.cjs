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
  assert.ok(css.includes("height: calc(clamp(184px, 24vw, 210px) - 32px)"));
  assert.ok(css.includes("bottom: var(--home-plaque-bottom);"));
  assert.ok(css.includes("width: min(88%, 620px);"));
  assert.ok(css.includes("transform: translateX(-50%);"));
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

test("daily progress heading matches exercise card typography and icons stay balanced", () => {
  const tokens = read("styles/typography.css");
  assert.ok(css.includes("font-size: var(--type-card-title)"));
  assert.ok(css.includes("font-size: var(--type-stat)"));
  assert.ok(tokens.includes("--type-card-title: var(--text-md)"));
  assert.ok(tokens.includes("--type-stat: var(--text-md)"));
  assert.ok(css.includes("--daily-icon-size: 40px;"));
  assert.ok(css.includes("--daily-icon-size: 34px;"));
  assert.ok(css.includes("width: var(--daily-icon-size);"));
  assert.ok(css.includes("height: var(--daily-icon-size);"));
  assert.ok(css.includes("font-size: clamp(var(--text-sm), 3.8vw, var(--type-stat))"));
  assert.ok(css.includes("@media (max-width: 350px)"));
  assert.match(html, /home-v3\.css\?v=/);
});

test("daily progress has symmetric horizontal and vertical spacing", () => {
  const block = (selector) => {
    const start = css.indexOf(selector + " {");
    assert.ok(start !== -1, selector);
    return css.slice(start + selector.length + 2).split("}")[0];
  };
  const prefix = 'html[data-theme="magical-academy"] ';
  const panel = block(prefix + ".daily-panel");
  const heading = block(prefix + ".daily-heading");
  const stats = block(prefix + ".daily-stats");
  const firstStat = block(prefix + ".daily-stat");
  const trophy = block(prefix + ".daily-trophy");
  const icon = block(prefix + ".daily-stat-icon");
  const headingText = block(prefix + ".daily-heading h2");
  const statText = block(prefix + ".daily-stat strong");

  // Equal panel padding on opposing sides, for both desktop and phone.
  assert.match(panel, /padding: 16px 24px;/);
  assert.ok(css.includes("padding: 14px 18px;"));
  assert.ok(css.includes("padding-inline: 14px;"));
  // One variable gives the same distance above and below the separator.
  assert.ok(heading.includes("padding: 0 0 var(--daily-divider-gap);"));
  assert.ok(stats.includes("margin-top: var(--daily-divider-gap);"));
  assert.ok(css.includes("--daily-divider-gap: 12px;"));
  assert.ok(css.includes("--daily-divider-gap: 11px;"));
  assert.ok(css.includes("--daily-divider-gap: 10px;"));
  // Both rows have identical icon geometry: text is vertically centered.
  for (const rule of [trophy, icon]) {
    assert.ok(rule.includes("width: var(--daily-icon-size);"));
    assert.ok(rule.includes("height: var(--daily-icon-size);"));
  }
  assert.match(heading, /align-items: center;/);
  assert.match(firstStat, /align-items: center;/);
  // Each stat is centered within one equal-width column.
  assert.match(firstStat, /justify-content: center;/);
  assert.ok(css.includes("width: min(calc(100% - 28px), 680px);"));
  assert.ok(css.includes("width: calc(100% - 12px);"));
  assert.ok(css.includes("margin: 0 auto var(--home-block-gap);"));
  assert.ok(css.includes("grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);"));
  assert.match(firstStat, /padding: 0;/);
  assert.ok(headingText.includes("font-size: var(--type-card-title);"));
  assert.ok(statText.includes("font-size: var(--type-stat);"));
  for (const rule of [panel, headingText, statText]) {
    assert.ok(rule.includes("font-family: var(--font-display);"));
  }
});

test("progress groups shift inward without moving dividers or changing text size", () => {
  assert.ok(css.includes("--daily-title-shift-x: -6px;"));
  assert.ok(css.includes("--daily-title-shift-y: 5px;"));
  assert.ok(css.includes("justify-content: center;"));
  assert.ok(css.includes(".daily-heading > :is(.daily-trophy, h2) {"));
  assert.ok(
    css.includes("transform: translate(var(--daily-title-shift-x), var(--daily-title-shift-y));"),
  );
  assert.ok(css.includes(".daily-stat > * {"));
  assert.ok(css.includes("transform: translateY(-2px);"));
  assert.ok(css.includes("--daily-icon-size: 40px;"));
  assert.ok(css.includes("font-size: var(--type-card-title);"));
});

test("Scores uses the shared header and the two-layer WebP icon", () => {
  const classic = read("styles/themes/magical-academy/classic.css");
  assert.ok(html.includes("data-academy-header"));
  assert.ok(html.includes('data-home="true" data-scores="true"'));
  assert.ok(html.includes("academy-home-nav"));
  assert.ok(html.includes("academy-header.js"));
  assert.ok(css.includes(".academy-home-nav"));
  assert.ok(classic.includes('background-image: url("./assets/nav-scores.webp"), url("./assets/nav-background.webp")'));
  for (const name of ["nav-background.webp", "nav-scores.webp"]) {
    assert.ok(fs.existsSync(path.join(root, "styles/themes/magical-academy/assets", name)));
  }
});

test("home has five compact activities and no unused preference controls", () => {
  assert.equal((html.match(/class="activity-card activity-/g) || []).length, 5);
  assert.equal((html.match(/data-academy-header/g) || []).length, 1);
  assert.ok(css.includes('html[data-theme="magical-academy"] .activity-card { min-height: 73px; }'));
  assert.ok(css.includes("width: calc(100% - 28px);"));
  assert.ok(css.includes("max-width: 640px;"));
  assert.equal(html.includes("hero-preferences"), false);
  assert.equal(html.includes("home-descriptions"), false);
  assert.equal(html.includes('class="description"'), false);
});
