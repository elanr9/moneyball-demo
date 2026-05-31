# Phase 3 — Transfer Market / Scouting

You are building Phase 3 of FieldVision, the YC demo described in `PLAN.md`.
Read `PLAN.md` and `DATA_ENGINE.md` first. The data engine and (ideally) the
Phase 2 squad view are done.

## Goal

The ultimate scouting tool, modeled on the FIFA transfer market plus FotMob
search. A scout searches the entire database in natural language and with every
structured filter, then opens any player's full profile. This is the core of
the "AI Moneyball" pitch.

## Deliverables

1. A **Transfer Market / Scout** page at route `/market` (and keep `/search`
   pointing here or redirect old routes):
   - A natural language search bar. Parse the query into filters. There is an
     existing simple parser at `src/lib/mockScoutSearch.ts` you can adapt, but it
     targets the OLD player type. Write a new parser over the universe `Player`
     type and `STAT_CATALOG` instead. Support: position, foot, class year / age
     ("under 20", "freshman"), height, country, league/team, and stat intents
     ("elite xG", "high progressive runs", "ball winner", "fast", "creative").
   - A full structured filter panel (like the FIFA market screenshot): position,
     team/club, country, class year, foot, height range, overall range, and one
     or more stat range sliders driven by `STAT_CATALOG` (group the stat options
     by `group`, mark `exclusive` ones with the FieldVision accent).
   - Results as a grid of player cards (reuse the Phase 2 PlayerCard) or dense
     rows, sortable by overall, FV rating, or any chosen stat. Show which
     filters each result matched ("why this player").
2. A **compare** affordance: select 2 to 4 players and compare attributes and
   key stats side by side (radar via `recharts` is a nice touch).
3. **Replacement suggestions:** given a selected player, surface similar players
   (same position group, near overall, similar stat profile) from across the
   league. Keep the similarity simple and explainable.

## Data to use

- `universe.players`, `universe.teams`, `getTeam`.
- `STAT_CATALOG` / `getStatDef` for both the filter UI and sorting:
  `def.get(player)` returns the sortable number, `def.format(value)` the label.
- `player.attributes`, `player.overall`, `player.country`, `player.foot`,
  `player.classYear`, `player.heightInches`, `player.season.*`.

## UX / UI

- Feel like FIFA's market: clear filter rail on the left, results on the right,
  fast and visual. Natural language bar is the hero at the top.
- Highlight FieldVision-exclusive stats as the differentiator (green `fv`
  accent) so scouts see data "that has never existed at this level."
- Use existing Tailwind tokens and `src/components/ui` (DataTable, Tabs, etc.).

## Hard rules

- No type errors. Run `npm run build` before finishing.
- No dashes and no excessive commas in any user facing copy.
- Colocate under `src/components/market/` and `src/pages/scout/`. Keep it
  typed and simple. Do not over engineer the NL parser; rules based is fine.

## Out of scope

League tables/leaderboards (Phase 4), player profile internals (Phase 5).
