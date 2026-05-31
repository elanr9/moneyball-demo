# FieldVision — AI Moneyball for Soccer

FieldVision turns game and training film into the world's first global soccer
database, then puts it inside a scouting and team management platform that feels
like FIFA Ultimate Team for coaches. This repo is the Y Combinator demo.

React 18 + TypeScript (strict) + Vite + Tailwind + React Router. Dark navy theme.

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build   # runs tsc -b then vite build, must stay green
```

## How this is built

The work is split into phases. Start here:

- `PLAN.md` — the product vision, scope, conventions, and phase list.
- `DATA_ENGINE.md` — the Phase 1 data engine API (everything renders from it).
- `phases/PHASE_2.md` … `phases/PHASE_5.md` — copy/paste prompts to build each
  remaining phase in a fresh agent.

### Phase 1 (done): the data universe

`src/data/` deterministically generates the entire demo universe once and caches
it: 16 NCAA Division III teams (5 with real rosters, 11 generated), ~430 players
with FIFA style overalls + attributes and a full simulated season of stats
(including FieldVision exclusive metrics), a 16 game schedule, standings, and an
8 team postseason. Access it through `useUniverse()`
(`src/context/UniverseContext.tsx`).

The original single team Brandeis demo (Excel based, `src/context/
PlayerDataContext.tsx` and friends) still powers the legacy routes and will be
replaced by universe driven pages across phases 2 to 5.
