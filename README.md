# Entraînement

Static French, addition, space-math and magical-forest games, served by GitHub Pages.
No build step or runtime dependency is required.

## Code organization

| File | Responsibility | Used by |
| --- | --- | --- |
| `game-ui.js` | Numeric keypad, numeric editing and DOM element helper | Additions, French, Mission calcul |
| `game-common.js` | Question sessions, scoring on first attempt, correction feedback, auto-next timer, progress and completion UI | Additions, French |
| `scores.js` | Compatible score storage, history display, time fallbacks, encouragement and confirmed deletion | All games and score pages |
| `daily-exercises.js` | Shared local daily exercise credits, authorized play minutes, and arcade milestones | Home page and all games |
| `score-view.js` | Open scores without destroying the game; suspend and resume callbacks | All games |
| `app-confirm.js` | In-app confirmation dialog | Mission calcul and score deletion |
| `calcul.js`, `francais.js` | Exercise content, question generation and game-specific presentation | Respective exercise page |
| `space-engine.js` | Pure space simulation and arithmetic difficulty | Mission calcul |
| `space.js`, `space-enemies.js` | Space controls, lifecycle and visuals | Mission calcul |
| `magic-engine.js`, `magic.js`, `magic.css` | Pure world simulation, animated isometric woodland and magical adventure controls | Mission magique |

Keep reusable behavior in these shared modules. Keep simulation and exercise
rules in their own controllers. A question-based game should use `ExerciseGame`
and register its suspend/resume callbacks with `ScoreView`. Numeric controls
should use `GameUI.keypad` and `GameUI.editNumber`; each game specifies its
own input length and clear-button label. Arcade games keep movement and
targeting rules in a pure engine and share `GameState`, `ScoreView`,
`AppConfirm` and `ExerciseScores`.

Scripts use private scopes to avoid accidental globals; only shared APIs are
exported on `window`. Load each shared dependency before its game controller.

## Daily exercise credits

Every completed French or addition session earns one daily exercise point, regardless of answers. Mission calcul earns one point per 10 successful calculations; Mission magique earns one per 20. Each point currently grants 10 minutes of authorized play time. The home page shows both totals. Arcade partial progress carries over between sessions on the same day.

The stable shared localStorage key is `entrainement_daily_exercises_v1`, with `date` (browser-local `YYYY-MM-DD`), `points`, `minutes`, `progress`, `events` and `version: 1`. It is readable from other apps on the **same web origin**, for example `sek44.github.io/rblx/` if published there. An external reader must compare the stored date to its own current local date and use zero on a mismatch. Different domains/browsers/devices do not share localStorage. No game-time consumption or cross-device sync is implemented yet. See [architecture](docs/ARCHITECTURE.md) for the contract.

## Formatting

HTML, JavaScript (including tests), and CSS use Prettier with the repository's
`.prettierrc.json` configuration. Prettier preserves significant whitespace
around inline HTML content.

Format source files with `npx prettier@3.6.2 --write "**/*.{html,js,cjs,css}"`.
Check formatting with `npx prettier@3.6.2 --check "**/*.{html,js,cjs,css}"`.
Prettier is a development tool; the site still needs no build step or runtime
dependencies.

## Validation

Run `node --test tests/*.test.cjs` with Node.js. Tests use Node's built-in test
runner and lightweight DOM fixtures; no dependency installation is required.
They cover shared controls, correction scoring, timer suspension, controller
integration, sprite cleanup on restart and saved-score compatibility. They do
not replace visual checks on a phone or tablet.

The localStorage compatibility and navigation requirements in `AGENTS.md`
apply to every change. Never reset score history or require new fields on old
records. Missing time is displayed as `00:00`.

## Documentation and development rules

Current-state documentation follows the same methodology as `gmr`, adapted to this repository's **flat source layout**:

- [Documentation index and maintenance rules](docs/README.md)
- [Site-wide architecture](docs/ARCHITECTURE.md) and [global backlog](docs/BACKLOG.md)
- [French exercise](docs/games/francais/SPECIFICATIONS.md), [addition exercise](docs/games/calcul/SPECIFICATIONS.md), [Mission calcul](docs/games/space/SPECIFICATIONS.md), and [Mission magique](docs/games/magic/SPECIFICATIONS.md)
- [Architecture decisions](docs/adr/README.md)

Each game also has its own `ARCHITECTURE.md` and `BACKLOG.md` beside its specifications in `docs/games/<id>/`. Specifications and architecture describe only **what is currently implemented**; pending work uses permanent backlog IDs and important technical decisions use ADRs. No permanent changelog or refactoring journal is kept. [AGENTS.md](AGENTS.md) defines the update and compatibility rules for coding agents.
