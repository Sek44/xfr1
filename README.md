# Entraînement

Static French, addition and space-math games, served by GitHub Pages.
No build step or runtime dependency is required.

## Code organization

| File | Responsibility | Used by |
| --- | --- | --- |
| `game-ui.js` | Numeric keypad, numeric editing and DOM element helper | Additions, French, Mission calcul |
| `game-common.js` | Question sessions, scoring on first attempt, correction feedback, auto-next timer, progress and completion UI | Additions, French |
| `scores.js` | Compatible score storage, history display, time fallbacks, encouragement and confirmed deletion | All games and score pages |
| `score-view.js` | Open scores without destroying the game; suspend and resume callbacks | All games |
| `app-confirm.js` | In-app confirmation dialog | Mission calcul and score deletion |
| `calcul.js`, `francais.js` | Exercise content, question generation and game-specific presentation | Respective exercise page |
| `space-engine.js` | Pure space simulation and arithmetic difficulty | Mission calcul |
| `space.js`, `space-enemies.js` | Space controls, lifecycle and visuals | Mission calcul |

Keep reusable behavior in these shared modules. Keep simulation and exercise
rules in their own controllers. A question-based game should use `ExerciseGame`
and register its suspend/resume callbacks with `ScoreView`. Numeric controls
should use `GameUI.keypad` and `GameUI.editNumber`; each game specifies its
own input length and clear-button label.

Scripts use private scopes to avoid accidental globals; only shared APIs are
exported on `window`. Load each shared dependency before its game controller.

## Validation

Run `node --test tests/*.test.cjs` with Node.js. Tests use Node's built-in test
runner and lightweight DOM fixtures; no dependency installation is required.
They cover shared controls, correction scoring, timer suspension, controller
integration, sprite cleanup on restart and saved-score compatibility. They do
not replace visual checks on a phone or tablet.

The localStorage compatibility and navigation requirements in `AGENTS.md`
apply to every change. Never reset score history or require new fields on old
records. Missing time is displayed as `00:00`.
