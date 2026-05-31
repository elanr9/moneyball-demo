# FieldVision — Build Plan

FieldVision is AI Moneyball for soccer: automated film analysis, the world's
first global soccer database, and a scouting + team management platform that
feels like FIFA Ultimate Team for coaches. This repo is the demo for a Y
Combinator application, so polish and clarity matter enormously. The target
users are coaches and scouts aged 25 to 70, so every screen must be obvious to
use with zero training.

## Product pillars (what the demo must show)

1. **Team management like FIFA Ultimate Team.** A coach sees their squad on a
   pitch in a formation, with player cards, a bench, and reserves. Clean,
   visual, drag friendly.
2. **A transfer market / scouting tool.** Natural language search ("left footed
   winger under 20 with elite progressive runs") plus every structured filter
   (position, name, league, country, club, stat ranges, height, class year).
   The ultimate scouting tool, eventually in every league and country.
3. **A league center like FotMob.** League table, fixtures and results, player
   stat leaderboards per stat, team stat leaderboards, team pages, and a coach
   view of any opponent's squad and formation.
4. **The Moneyball edge.** FieldVision-exclusive metrics (off ball distance,
   runs creating chances, progressive runs, space created, press intensity)
   that "have never existed at the D3 level," highlighted everywhere as the
   differentiator.

## Scope for the demo

NCAA Division III only for now. One league, 16 teams. Five are real programs
with real published rosters (Brandeis, Emory, Chicago, Babson, Suffolk). The
other eleven are real D3 programs with generated rosters so the table,
schedule, and leaderboards feel full and competitive. Every advanced stat is
simulated.

## Architecture

- React 18 + TypeScript (strict) + Vite + Tailwind + React Router. Dark navy
  theme. `recharts` and `lucide-react` are available.
- **Phase 1 is done:** a deterministic data engine under `src/data/` builds the
  entire universe once and caches it. It is exposed through
  `src/context/UniverseContext.tsx`. See `DATA_ENGINE.md` for the full API.
- Later phases build UI on top of the engine. Do not reach into raw generators;
  use the selectors.

### Important conventions (read before writing any code)

- **No type errors, ever.** Run `npm run build` (it runs `tsc -b`) before
  finishing. `noUnusedLocals` and `noUnusedParameters` are on.
- **No dashes and no excessive commas in any user facing frontend copy.** This
  is a hard product rule. Use plain short phrases. (Dashes are fine inside code,
  comments, and data like heights.)
- Build so any engineer can join and extend it. Keep components small, typed,
  and colocated by feature. Do not over engineer.
- Reuse the existing design tokens in `tailwind.config.js` (navy, blue, fv,
  ink) and the components in `src/components/ui` and `src/components/layout`.

## Phases

| Phase | Focus | Prompt |
| ----- | ----- | ------ |
| 1 | Data universe engine (DONE) | this file + `DATA_ENGINE.md` |
| 2 | Squad / Formation (FIFA Ultimate Team view) | `phases/PHASE_2.md` |
| 3 | Transfer Market / Scouting | `phases/PHASE_3.md` |
| 4 | League Center (FotMob table, fixtures, leaderboards, opponent scouting) | `phases/PHASE_4.md` |
| 5 | Coach dashboard, player profiles, polish, demo script | `phases/PHASE_5.md` |

Each phase prompt is self contained. Copy the file's contents into a fresh
agent to build that phase.

## Design references

The user provided FIFA Ultimate Team and FotMob screenshots saved under
`/Users/elanromo/.cursor/projects/Users-elanromo-moneyball-demo/assets/`. FIFA
shows the squad pitch, player cards, and a search/filter market. FotMob shows
the league table, player stat leaderboards (top scorer, assists, xG, etc.), and
schedules. Match those patterns.
