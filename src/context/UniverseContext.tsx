// Provides the generated FieldVision universe to the whole app, plus the notion
// of "my team" (the team the coach manages). The universe is built once and
// cached, so this is synchronous and stable across reloads.

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Universe } from '../data/types'
import { buildUniverse } from '../data/universe'
import {
  readDevOverrides,
  subscribeDevOverrides,
  type DevOverrides,
} from '../data/devOverrides'

const DEFAULT_TEAM_ID = 'brandeis'

interface Rgb {
  r: number
  g: number
  b: number
}

function parseHex(hex: string): Rgb | null {
  const clean = hex.replace('#', '')
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  if ([r, g, b].some(Number.isNaN)) return null
  return { r, g, b }
}

// Many club colors are deep navies, maroons and forest greens that vanish on a
// near black canvas. We lift the color toward a readable accent: keep its hue,
// guarantee enough saturation and a minimum lightness so every club gets a
// vivid, legible accent on the dark theme without losing its identity.
function readableAccent(hex: string): string {
  const rgb = parseHex(hex)
  if (!rgb) return '#3D7DFF'
  const r = rgb.r / 255
  const g = rgb.g / 255
  const b = rgb.b / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  const l = (max + min) / 2
  const d = max - min
  let s = 0
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1))
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  const targetL = Math.max(l, 0.6)
  const targetS = Math.max(s, 0.62)
  return hslToHex(h, targetS, targetL)
}

function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let r = 0
  let g = 0
  let b = 0
  if (h < 60) [r, g, b] = [c, x, 0]
  else if (h < 120) [r, g, b] = [x, c, 0]
  else if (h < 180) [r, g, b] = [0, c, x]
  else if (h < 240) [r, g, b] = [0, x, c]
  else if (h < 300) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]
  const to = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, '0')
  return `#${to(r)}${to(g)}${to(b)}`
}

// Soft team tint, derived from the readable accent so the fill and text agree.
function softTint(hex: string, alpha: number): string {
  const rgb = parseHex(hex)
  if (!rgb) return `rgba(61, 125, 255, ${alpha})`
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`
}

interface UniverseContextValue {
  universe: Universe
  myTeamId: string
  setMyTeamId: (teamId: string) => void
}

const UniverseContext = createContext<UniverseContextValue | null>(null)

export function UniverseProvider({ children }: { children: ReactNode }) {
  const [devOverrides, setDevOverrides] = useState<DevOverrides>(() => readDevOverrides())
  useEffect(() => subscribeDevOverrides(() => setDevOverrides(readDevOverrides())), [])

  const universe = useMemo(() => buildUniverse(devOverrides), [devOverrides])
  const [myTeamId, setMyTeamId] = useState<string>(DEFAULT_TEAM_ID)

  // Publish the managed club's color to the document so any surface can theme
  // itself through var(--team-primary) without prop drilling.
  useEffect(() => {
    const team = universe.teams.find((t) => t.id === myTeamId)
    const accent = readableAccent(team?.primaryColor ?? '#3D7DFF')
    const root = document.documentElement
    root.style.setProperty('--team-primary', accent)
    root.style.setProperty('--team-soft', softTint(accent, 0.14))
  }, [universe.teams, myTeamId])

  const value = useMemo<UniverseContextValue>(
    () => ({ universe, myTeamId, setMyTeamId }),
    [universe, myTeamId],
  )

  return <UniverseContext.Provider value={value}>{children}</UniverseContext.Provider>
}

export function useUniverse(): UniverseContextValue {
  const ctx = useContext(UniverseContext)
  if (!ctx) throw new Error('useUniverse must be used within UniverseProvider')
  return ctx
}
