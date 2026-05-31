# Phase 2 — Squad / Formation (FIFA Ultimate Team view)

You are building Phase 2 of FieldVision, the YC demo described in `PLAN.md`.
Read `PLAN.md` and `DATA_ENGINE.md` first (both in the repo root). The
deterministic data engine from Phase 1 is done and live via `useUniverse()`.

## Goal

The flagship coach experience: view the managed team's squad on a pitch in a
formation, exactly like FIFA Ultimate Team. Cards on the pitch, a bench row,
and reserves below. This should make a 25 to 70 year old coach smile instantly.

## Deliverables

1. A **PlayerCard** component (FIFA style): big overall number, position badge,
   name, team color accent, and the 6 attributes (pace/shooting/passing/
   dribbling/defending/physical, or the 6 GK attributes). Build small (pitch),
   medium, and a detail size. Use `player.attributes` or `player.gkAttributes`.
   Color the overall by tier (e.g. 80+ gold, 70+ silver, else bronze) like FIFA.
2. A **Pitch / Formation view** at route `/squad`:
   - Reads `myTeamId` from `useUniverse()`. A header lets the coach switch the
     managed club (`setMyTeamId`) and pick a formation from the common set
     (4-3-3, 4-2-3-1, 4-4-2, 3-5-2, 4-2-2-2). Default to `team.defaultFormation`.
   - Auto-fills the best XI: pick the highest `overall` player whose
     `primaryPosition` (or `secondaryPositions`) fits each formation slot, then
     fall back by position group. One GK (use the starting keeper, the highest
     overall GK).
   - Render cards on a green pitch positioned by formation coordinates.
   - A **bench** row (next ~7 by overall not in the XI) and a **reserves** grid
     (everyone else).
   - Clicking a slot opens a picker to swap in any squad player; clicking a card
     opens the player detail (link to `/player/:teamId/:slug`, built in Phase 5,
     so for now just route there).
3. A team "chemistry" style summary bar: average XI overall, average FV rating
   (use `teamAggregate`), and the formation name. Keep it light, do not invent a
   real chemistry algorithm.

## Data to use

- `teamPlayers(universe, myTeamId)` for the squad.
- `player.overall`, `player.primaryPosition`, `player.secondaryPositions`,
  `player.attributes` / `player.gkAttributes`.
- `teamAggregate(universe, myTeamId)` for the summary.
- Team colors: `team.primaryColor`, `team.secondaryColor`.

## UX / UI

- Match the FIFA screenshots in the assets folder: dark pitch, cards floating in
  formation, bench underneath, position labels under each card.
- Use existing Tailwind tokens (navy, blue, fv, ink). Smooth, modern, obvious.
- Add a "Squad" nav item to the coach section in `src/components/layout/Sidebar.tsx`.

## Hard rules

- No type errors. Run `npm run build` before finishing (`tsc -b` runs in it).
- No dashes and no excessive commas in any user facing copy.
- Keep components small and typed; colocate under `src/components/squad/` and
  `src/pages/coach/Squad.tsx`. Do not over engineer.

## Out of scope (later phases)

Transfer market, league tables, player profile page internals, opponent
scouting. Just link out to those routes.
