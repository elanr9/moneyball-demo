# Phase 5 — Coach Dashboard, Player Profiles, Cleanup, Demo Polish

You are building Phase 5 of FieldVision, the YC demo described in `PLAN.md`.
Read `PLAN.md` and `DATA_ENGINE.0lmd` first. Phases 2 to 4 (squad, market, league
center) are done. This phase ties it together and makes it demo ready.

## Deliverables

1. **Coach dashboard** at `/dashboard` (the landing page), built on the
   universe (not the old Excel layer):
   - Hero strip for the managed team (`myTeamId`): league position, record,
     form, next/last result, season goals for and against.
   - Recent results and a roster spotlight (top rated and top scorer via
     `teamAggregate`).
   - A "FieldVision insights" panel that surfaces 2 to 3 auto generated talking
     points using the exclusive metrics (e.g. highest progressive runs, best
     press intensity). This is the Moneyball wow moment.
   - Keep the existing upload dropzone idea (film upload) as a visual element
     that tells the "upload your games, we analyze them" story.
2. **Player profile** at `/player/:teamId/:slug` (used by every other phase):
   - Big PlayerCard, identity (height, weight, class year, hometown, country,
     previous school, foot), overall and potential.
   - Attribute breakdown (radar via `recharts`).
   - Season stat groups (Attacking, Passing, Defending, Physical, FieldVision,
     Goalkeeping) using `STAT_CATALOG` grouped by `group`. Mark exclusive stats
     with the green accent.
   - Per match log and a FV rating trend line from `player.matches`.
   - A highlights placeholder grid (auto generated clips story).
   - Use `getPlayerBySlug(universe, teamId, slug)`.
3. **Cleanup / migration:** the original demo pages (`src/pages/coach/*`,
   `src/pages/scout/*`) and `src/context/PlayerDataContext.tsx` were built on a
   single Brandeis Excel file (`src/lib/parseSpreadsheet.ts`, the `xlsx`
   dependency, `src/types/player.ts`, `src/types/game.ts`). Once every route is
   served by the universe, remove the old context, old types, old pages,
   `parseSpreadsheet.ts`, `openaiClient.ts`/`mockScoutSearch.ts` if unused, and
   the `xlsx` dependency from `package.json`. Confirm `npm run build` stays
   green. This shrinks the bundle (currently ~640 kB, mostly xlsx).
4. **Polish pass:** consistent spacing, empty states, loading is instant (data
   is synchronous now so you can drop the Excel loading state), keyboard and
   click targets sized for older users, and a short in app "demo flow" or a
   `DEMO_SCRIPT.md` walking through: dashboard -> squad -> player profile ->
   transfer market search -> league table -> opponent scouting.

## Hard rules

- No type errors. Run `npm run build` before finishing.
- No dashes and no excessive commas in any user facing copy.
- Keep it typed, small, and obvious. Do not over engineer.

## Done means

A coach can land on the dashboard, see their team, open the squad in formation,
click a player to a rich profile, jump to the transfer market and search in
natural language, view the league table and stat leaderboards, and scout any
opponent's formation. All on simulated but believable data, with no type errors
and a clean build.
