# Entraînement project rules

## Preserve existing scores (explicit user requirement, 2026-10-18)

Every site change must remain compatible with all existing user scores in localStorage.
- Preserve the `exercices_francais_scores` key, all existing records and unknown fields.
- Never clear, reset, truncate or silently overwrite users' score history.
- Explicit exception (2026-10-18): a user may delete one chosen score only after an in-app confirmation. Preserve all other records and unknown fields; refuse a stale selection if storage changed.
- Add fields without requiring legacy records to contain them. Use display placeholders for missing fields; missing score time must display `00:00`.
- Read historical ISO timestamps when available; do not rewrite old records merely to add display fields.
- If stored JSON is unreadable, do not overwrite it when saving a new score.
- Verify mixed legacy/current records when changing storage or display.

## Navigation

Opening scores and returning must preserve the exact ongoing game state: typed answers, correction status, timers, enemies, missiles, lives, bombs and level. Scores visits must not advance gameplay timers or save duplicate results.
