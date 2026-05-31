# FieldVision Data Engine (Phase 1) — API Reference

Everything the app renders comes from a single deterministic universe built in
`src/data/`. It is generated once, cached, and identical on every reload. Read
this before building any UI.

## Getting the data

```tsx
import { useUniverse } from '../context/UniverseContext'

function Example() {
  const { universe, myTeamId, setMyTeamId } = useUniverse()
  // universe.teams, universe.players, universe.matches, universe.standings, universe.league
}
```

- `myTeamId` defaults to `"brandeis"`. It is the team the coach manages. Use it
  for the squad view and coach dashboard. `setMyTeamId` lets the user switch the
  managed club.
- The provider is already mounted in `src/main.tsx`.

## Types (`src/data/types.ts`)

- `Universe` = `{ league, teams: Team[], players: Player[], matches: Match[], standings: StandingsRow[] }`
- `Team` — id, name (e.g. "Emory Eagles"), school, shortName, abbreviation,
  mascot, city, state, primaryColor, secondaryColor, conference,
  defaultFormation, isFeatured (true for the 5 real-roster schools).
- `Player` — id (`"{teamId}-{number}"`), teamId, number, name, firstName,
  lastName, slug, positionGroup (`GK|DEF|MID|FWD`), primaryPosition
  (`DetailedPosition`: GK, CB, LB, RB, CDM, CM, CAM, LM, RM, LW, RW, ST, ...),
  secondaryPositions, heightInches, heightLabel, weightLbs, classYear, age,
  hometown, country, previousSchool, foot (`L|R`), overall (1-99), potential,
  `attributes` (OutfieldAttributes or null), `gkAttributes` (or null),
  `season` (SeasonStats), `matches` (PlayerMatchStat[]).
- `OutfieldAttributes` — pace, shooting, passing, dribbling, defending,
  physical (FIFA style, 1-99). `GoalkeeperAttributes` — diving, handling,
  kicking, reflexes, speed, positioning.
- `SeasonStats` — appearances, starts, minutes, goals, assists, shots,
  shotsOnTarget, xg, xa, keyPasses, passes, passAccuracy, chancesCreated,
  bigChancesCreated, tackles, interceptions, clearances, blocks, recoveries,
  duelsWon, duelsWonPercent, aerialsWon, **offBallDistanceKm, sprintDistanceM,
  topSpeedKmh, pressures, runsCreatingChances, progressiveRuns,
  progressiveCarriesDistanceM, spaceCreatedPer90, defensiveActionsPer90, ppda**
  (these bold ones are the FieldVision-exclusive metrics), cleanSheets, saves,
  savePercent, goalsConceded, goalsPrevented, fvRating.
- `PlayerMatchStat` — one row per appearance, including a `rating` (5.0 to 9.9)
  and `opponentTeamId`. Use for player match logs and form.
- `Match` — id, date (ISO), round, stage (`regular|quarterfinal|semifinal|final`),
  homeTeamId, awayTeamId, homeGoals, awayGoals, played.
- `StandingsRow` — teamId, played, wins, draws, losses, goalsFor, goalsAgainst,
  goalDifference, points, form (last 5, e.g. `['W','D','L']`).

## Selectors (`src/data/selectors.ts`) — prefer these over raw filtering

```ts
getTeam(u, teamId)                 // Team | undefined
getTeamByAbbr(u, "EMO")            // Team | undefined
getPlayer(u, playerId)             // Player | undefined
getPlayerBySlug(u, teamId, slug)   // Player | undefined
teamPlayers(u, teamId)             // Player[]
matchesForTeam(u, teamId)          // Match[] sorted by date
standingFor(u, teamId)             // StandingsRow | undefined
rankOf(u, teamId)                  // 1-based league position
teamAggregate(u, teamId)           // { goalsFor, goalsAgainst, avgOverall, avgFvRating, topScorer, topRated }

leaderboard(players, statKey, { limit?, minMinutes? })  // LeaderboardEntry[] { player, value, rank }
```

### Stat catalog (`STAT_CATALOG`, `getStatDef`)

`STAT_CATALOG: StatDef[]` powers leaderboards AND transfer-market filters. Each
`StatDef` has `{ key, label, short, group, scope, get(player), format(value), exclusive? }`.

- `group`: `Attacking | Passing | Defending | Physical | FieldVision | Goalkeeping`
- `scope`: `all | outfield | gk` (use to hide GK-only stats from outfielders)
- `exclusive: true` marks FieldVision-only metrics. Highlight these in the UI
  (e.g. the green `fv` accent) as the differentiator.
- `format(value)` returns the display string. `get(player)` returns the number
  for sorting/filtering.

Example leaderboard:

```ts
const topScorers = leaderboard(universe.players, 'goals', { limit: 10 })
const fvRuns = leaderboard(universe.players, 'runsCreatingChances', { limit: 10 })
```

## What the universe contains

- 16 teams in `NCAA Division III National Showcase`, season `2025-26`.
- 5 featured teams with real rosters: `brandeis`, `emory`, `uchicago`,
  `babson`, `suffolk`. 11 filler teams: `washu`, `nyu`, `rochester`, `cwru`,
  `cmu`, `tufts`, `amherst`, `williams`, `mit`, `middlebury`, `hopkins`.
- ~430 players, each with a full 16 game season of stats and per-match logs.
- A 16 game regular season (round robin via circle method + a rivalry rematch),
  full standings, and an 8 team postseason bracket (quarterfinals, semifinals,
  final). All games are played, so the season is complete.
- `Elan Romo` (Brandeis, slug `elan-romo`) is a marquee 86-overall player and a
  good default "hero" profile for demos.

## Rules when extending the engine

- Keep it deterministic. Seed any new randomness with `createRng(stableKey)`
  from `src/data/rng.ts`. Never use `Math.random`.
- The universe is cached in `buildUniverse()`. If you add fields, regenerate by
  reloading; there is no persistence layer yet.
- If a later phase needs "upcoming" (unplayed) fixtures, the cleanest approach
  is to add a second future season of fixtures rather than un-playing the
  current one (player season stats assume the regular season is complete).
