# Phase 4 — League Center (FotMob style)

You are building Phase 4 of FieldVision, the YC demo described in `PLAN.md`.
Read `PLAN.md` and `DATA_ENGINE.md` first. The data engine, squad view, and
transfer market are done.

## Goal

A FotMob style league hub for NCAA Division III, plus the coach's ability to
scout any opponent's squad and formation.

## Deliverables

1. **League home** at route `/league`:
   - **Table** tab: full standings (use `universe.standings`). Columns: rank,
     team (crest color + name), played, W, D, L, goals for, goals against, goal
     difference, points, and a form pill row (last 5). Match the FotMob table
     screenshot. Highlight the managed team and the postseason cutoff (top 8).
   - **Fixtures / Results** tab: all matches grouped by round/date
     (`universe.matches`), regular season plus the postseason bracket
     (quarterfinal, semifinal, final). Show scores and a small bracket view for
     the postseason.
   - **Player stats** tab: FotMob style leaderboards. For each stat in
     `STAT_CATALOG` (grouped by `group`), show a top list using
     `leaderboard(universe.players, key, { limit: 5 })` with a "see all" that
     expands to a full ranked table. Mark FieldVision-exclusive stats with the
     green accent. Include a goalkeeping section (clean sheets, save %, goals
     prevented) scoped to keepers.
   - **Team stats** tab: rank teams by aggregate metrics (goals for/against,
     avg overall via `teamAggregate`, etc.).
2. **Team page** at route `/team/:teamId`:
   - Header with team identity, league position (`rankOf`), record, form.
   - Squad list grouped by position (reuse PlayerCard or rows), schedule and
     results for that team (`matchesForTeam`), and the team's best XI in its
     `defaultFormation` (reuse the Phase 2 formation renderer in a read-only
     mode). This doubles as **opponent scouting** for coaches: a coach can open
     any opponent and see their likely formation and key players.
3. Wire navigation: add "League" to the nav. Team names everywhere should link
   to `/team/:teamId`.

## Data to use

- `universe.standings`, `universe.matches`, `universe.teams`, `universe.players`.
- `leaderboard`, `STAT_CATALOG`, `getStatDef`, `teamAggregate`, `rankOf`,
  `matchesForTeam`, `teamPlayers`, `getTeam`.
- Postseason matches have `stage` in `quarterfinal|semifinal|final` and
  `round: 0`; regular season has `stage: 'regular'` and `round: 1..16`.

## UX / UI

- Match the FotMob screenshots: dark cards, clean rows, a sticky tab bar, stat
  leaders with the player photo placeholder + value pill on the right.
- Use existing Tailwind tokens and `src/components/ui`.

## Hard rules

- No type errors. Run `npm run build` before finishing.
- No dashes and no excessive commas in any user facing copy.
- Colocate under `src/components/league/` and `src/pages/league/`. Keep typed
  and simple. Do not over engineer.

## Out of scope

Coach dashboard and player profile internals (Phase 5).
