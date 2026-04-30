# FieldVision AI Moneyball Demo

A pitch deck demo for the FieldVision AI Moneyball platform built for Brandeis Sparktank 2026. React + TypeScript + Vite + Tailwind. Dark navy theme. Two modes that share one database.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:5173 (or whatever port Vite picks). The app loads in Coach Mode by default. Use the toggle in the sidebar to switch to Scout Mode.

## Build

```bash
npm run build
npm run preview
```

## Data

`public/data/Brandeis-Soccer-FieldVision-Data.xlsx` is parsed once at app mount and held in React Context. Three sheets: Roster (29 players), Season Stats (38 KPIs per player), Per Game Elan Romo (18 games).

## Demo flow

1. Coach Dashboard (hero stats + recent games + roster spotlight + upload dropzone)
2. Roster (full table, sortable, filter by position)
3. Player profile for Elan Romo (5 stat groups, FieldVision-only highlights in green)
4. Per Game tab (full season breakdown)
5. Highlights tab (auto generated clip grid)
6. Toggle to Scout Mode
7. Search "Forward under 22 with high xG and progressive runs"
8. View results, click through to player profile
9. Database (38 column dense table)
10. Leaderboard (4 categories)
