// Client side overrides for player ratings and positions, used by the in app
// Player Editor at /admin. Values are persisted to localStorage so changes
// survive reloads, and a small pub/sub lets the universe rebuild whenever a
// value changes.
//
// This file is intentionally self contained so it can be deleted in one step
// once edits have been copied back into playerOverrides.ts. The only other
// touch points are UniverseContext (reads + subscribes), universe.ts (accepts
// the extra map at build time), the PlayerEditor page, and one route in
// App.tsx.

import type { PlayerOverride } from './playerOverrides'

export type DevOverrides = Record<string, Record<string, PlayerOverride>>

const STORAGE_KEY = 'fv:devPlayerOverrides:v1'
const EVENT_NAME = 'fv:devPlayerOverridesChanged'

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

function safeParse(raw: string | null): DevOverrides {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw) as unknown
    if (parsed && typeof parsed === 'object') return parsed as DevOverrides
  } catch {
    // ignore malformed payloads and fall through to empty
  }
  return {}
}

export function readDevOverrides(): DevOverrides {
  if (!isBrowser()) return {}
  return safeParse(window.localStorage.getItem(STORAGE_KEY))
}

function emit(): void {
  if (!isBrowser()) return
  window.dispatchEvent(new CustomEvent(EVENT_NAME))
}

export function writeDevOverrides(next: DevOverrides): void {
  if (!isBrowser()) return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  emit()
}

export function subscribeDevOverrides(listener: () => void): () => void {
  if (!isBrowser()) return () => {}
  const handler = () => listener()
  window.addEventListener(EVENT_NAME, handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener(EVENT_NAME, handler)
    window.removeEventListener('storage', handler)
  }
}

// Update a single player's override. Passing an empty patch clears the entry.
export function setDevOverride(
  teamId: string,
  number: string,
  patch: PlayerOverride,
): void {
  const current = readDevOverrides()
  const team: Record<string, PlayerOverride> = { ...(current[teamId] ?? {}) }
  const existing = team[number] ?? {}

  const nextEntry: PlayerOverride = { ...existing }
  if ('position' in patch) {
    if (patch.position == null) delete nextEntry.position
    else nextEntry.position = patch.position
  }
  if ('rating' in patch) {
    if (patch.rating == null) delete nextEntry.rating
    else nextEntry.rating = patch.rating
  }

  const isEmpty = nextEntry.position == null && nextEntry.rating == null
  if (isEmpty) {
    delete team[number]
  } else {
    team[number] = nextEntry
  }

  const next: DevOverrides = { ...current, [teamId]: team }
  if (Object.keys(team).length === 0) delete next[teamId]

  writeDevOverrides(next)
}

export function clearDevOverrides(): void {
  writeDevOverrides({})
}

export function getDevOverride(
  overrides: DevOverrides,
  teamId: string,
  number: string,
): PlayerOverride | undefined {
  return overrides[teamId]?.[number]
}

// Merge a dev override on top of the file override so dev edits always win.
export function mergeOverride(
  fileOverride: PlayerOverride | undefined,
  devOverride: PlayerOverride | undefined,
): PlayerOverride | undefined {
  if (!devOverride) return fileOverride
  if (!fileOverride) return devOverride
  return { ...fileOverride, ...devOverride }
}
