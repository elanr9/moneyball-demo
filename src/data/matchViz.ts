// Derives spatial match visualizations (heat map, shot map, touch scatter) from
// a player's per match stat line. The raw stats have no positional data, so we
// generate believable positions deterministically from a stable seed
// (player id + match id). This keeps every visualization identical on reload,
// which matters for a demo, while staying coherent with the player's position
// and the goals, shots, and minutes they actually logged that game.

import type { DetailedPosition, Player, PlayerMatchStat } from './types'
import { clamp, createRng, gaussian, range, round2, type Rng } from './rng'

// Pitch coordinate space is landscape: x runs 0 (own goal, left) to 100
// (attacking goal, right), y runs 0 (top touchline) to 100 (bottom touchline).
export interface VizPoint {
  x: number
  y: number
}

export interface VizShot {
  x: number
  y: number
  onTarget: boolean
  goal: boolean
  xg: number
}

export interface MatchViz {
  zone: VizPoint
  touches: VizPoint[]
  heatGrid: number[][] // [row][col], normalized 0 to 1
  cols: number
  rows: number
  shots: VizShot[]
}

// Average activity zone per detailed position on a left to right attacking pitch.
const ZONES: Record<DetailedPosition, VizPoint> = {
  GK: { x: 7, y: 50 },
  CB: { x: 26, y: 50 },
  LB: { x: 32, y: 78 },
  RB: { x: 32, y: 22 },
  LWB: { x: 44, y: 80 },
  RWB: { x: 44, y: 20 },
  CDM: { x: 40, y: 50 },
  CM: { x: 52, y: 50 },
  CAM: { x: 66, y: 50 },
  LM: { x: 58, y: 80 },
  RM: { x: 58, y: 20 },
  LW: { x: 73, y: 80 },
  RW: { x: 73, y: 20 },
  CF: { x: 75, y: 50 },
  ST: { x: 80, y: 50 },
}

const HEAT_COLS = 30
const HEAT_ROWS = 20

interface Anchor {
  x: number
  y: number
  weight: number
  sx: number
  sy: number
}

// A player does not stand still. We spread touches across a few movement
// anchors derived from their home zone (home base, a forward push, a drop to
// recover, and a wide drift) so the heat map covers a believable area with
// several hotspots rather than one tight blob.
function buildAnchors(zone: VizPoint): Anchor[] {
  return [
    { x: zone.x, y: zone.y, weight: 0.42, sx: 11, sy: 12 },
    { x: clamp(zone.x + 13, 6, 94), y: zone.y, weight: 0.22, sx: 10, sy: 14 },
    { x: clamp(zone.x - 11, 6, 94), y: zone.y, weight: 0.16, sx: 10, sy: 13 },
    { x: clamp(zone.x + 4, 6, 94), y: clamp(zone.y + 16, 8, 92), weight: 0.1, sx: 12, sy: 11 },
    { x: clamp(zone.x + 4, 6, 94), y: clamp(zone.y - 16, 8, 92), weight: 0.1, sx: 12, sy: 11 },
  ]
}

function pickAnchor(rng: Rng, anchors: Anchor[]): Anchor {
  const roll = rng()
  let acc = 0
  for (const a of anchors) {
    acc += a.weight
    if (roll <= acc) return a
  }
  return anchors[0]
}

function buildTouches(rng: Rng, zone: VizPoint, m: PlayerMatchStat): VizPoint[] {
  const count = Math.round(clamp((m.minutes / 90) * 95 + m.passes * 0.4, 40, 170))
  const anchors = buildAnchors(zone)
  const touches: VizPoint[] = []
  for (let i = 0; i < count; i += 1) {
    const a = pickAnchor(rng, anchors)
    const x = clamp(gaussian(rng, a.x, a.sx), 2, 98)
    const y = clamp(gaussian(rng, a.y, a.sy), 3, 97)
    touches.push({ x, y })
  }
  return touches
}

// Kernel density estimate onto a fine grid: each touch deposits a soft gaussian
// bump into the cells around it. The overlapping bumps produce the organic
// green to red hotspots of a real tracking heat map instead of hard squares.
function buildHeatGrid(touches: VizPoint[]): number[][] {
  const grid: number[][] = Array.from({ length: HEAT_ROWS }, () =>
    Array.from({ length: HEAT_COLS }, () => 0),
  )
  const sigma = 1.6
  const radius = 4
  const twoSigmaSq = 2 * sigma * sigma
  let max = 0
  for (const t of touches) {
    const fc = (t.x / 100) * HEAT_COLS - 0.5
    const fr = (t.y / 100) * HEAT_ROWS - 0.5
    const c0 = Math.round(fc)
    const r0 = Math.round(fr)
    for (let dr = -radius; dr <= radius; dr += 1) {
      for (let dc = -radius; dc <= radius; dc += 1) {
        const rr = r0 + dr
        const cc = c0 + dc
        if (rr < 0 || rr >= HEAT_ROWS || cc < 0 || cc >= HEAT_COLS) continue
        const distSq = (cc - fc) * (cc - fc) + (rr - fr) * (rr - fr)
        grid[rr][cc] += Math.exp(-distSq / twoSigmaSq)
      }
    }
  }
  for (let r = 0; r < HEAT_ROWS; r += 1) {
    for (let c = 0; c < HEAT_COLS; c += 1) {
      if (grid[r][c] > max) max = grid[r][c]
    }
  }
  if (max > 0) {
    for (let r = 0; r < HEAT_ROWS; r += 1) {
      for (let c = 0; c < HEAT_COLS; c += 1) {
        grid[r][c] = grid[r][c] / max
      }
    }
  }
  return grid
}

function buildShots(rng: Rng, m: PlayerMatchStat): VizShot[] {
  const shots: VizShot[] = []
  for (let i = 0; i < m.shots; i += 1) {
    const isGoal = i < m.goals
    const onTarget = i < m.shotsOnTarget
    // Goals and on target efforts come from closer, more central positions.
    const x = isGoal ? range(rng, 80, 93) : onTarget ? range(rng, 70, 90) : range(rng, 60, 88)
    const spreadY = isGoal ? 9 : onTarget ? 15 : 23
    const y = clamp(gaussian(rng, 50, spreadY), 16, 84)
    const baseXg = isGoal ? 0.32 : onTarget ? 0.16 : 0.06
    const xg = round2(clamp(baseXg + rng() * 0.22, 0.02, 0.94))
    shots.push({ x, y, onTarget, goal: isGoal, xg })
  }
  return shots
}

export function buildMatchViz(player: Player, m: PlayerMatchStat): MatchViz {
  const rng = createRng(`${player.id}-${m.matchId}-viz`)
  const zone = ZONES[player.primaryPosition] ?? { x: 50, y: 50 }
  const touches = buildTouches(rng, zone, m)
  const heatGrid = buildHeatGrid(touches)
  const shots = buildShots(rng, m)
  return { zone, touches, heatGrid, cols: HEAT_COLS, rows: HEAT_ROWS, shots }
}

// Maps a normalized heat value (0 to 1) to an rgba color on a cool to hot ramp.
// Returns fully transparent for empty cells so the grass shows through.
export function heatColor(value: number): string {
  if (value <= 0.05) return 'rgba(0,0,0,0)'
  const stops: Array<{ t: number; c: [number, number, number]; a: number }> = [
    { t: 0.05, c: [34, 197, 94], a: 0.0 },
    { t: 0.24, c: [34, 197, 94], a: 0.42 },
    { t: 0.46, c: [132, 204, 22], a: 0.54 },
    { t: 0.66, c: [234, 179, 8], a: 0.66 },
    { t: 0.84, c: [249, 115, 22], a: 0.76 },
    { t: 1.0, c: [239, 68, 68], a: 0.86 },
  ]
  let lo = stops[0]
  let hi = stops[stops.length - 1]
  for (let i = 0; i < stops.length - 1; i += 1) {
    if (value >= stops[i].t && value <= stops[i + 1].t) {
      lo = stops[i]
      hi = stops[i + 1]
      break
    }
  }
  const span = hi.t - lo.t || 1
  const f = clamp((value - lo.t) / span, 0, 1)
  const r = Math.round(lo.c[0] + (hi.c[0] - lo.c[0]) * f)
  const g = Math.round(lo.c[1] + (hi.c[1] - lo.c[1]) * f)
  const b = Math.round(lo.c[2] + (hi.c[2] - lo.c[2]) * f)
  const a = lo.a + (hi.a - lo.a) * f
  return `rgba(${r},${g},${b},${round2(a)})`
}
