// Holds the demo session: whether the visitor has passed the welcome screen and
// which page tutorials they have already seen. Everything lives in sessionStorage
// so a fresh browser session replays the welcome screen and every tutorial, which
// is exactly what a clean demo wants, while a reload inside the same session keeps
// the visitor where they were instead of replaying the intro.

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'

const STARTED_KEY = 'fv.session.started'
const SEEN_TOURS_KEY = 'fv.tours.seen'

function readStarted(): boolean {
  try {
    return sessionStorage.getItem(STARTED_KEY) === 'true'
  } catch {
    return false
  }
}

function readSeenTours(): string[] {
  try {
    const raw = sessionStorage.getItem(SEEN_TOURS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

interface SessionContextValue {
  started: boolean
  start: () => void
  hasSeenTour: (id: string) => boolean
  markTourSeen: (id: string) => void
  resetTours: () => void
}

const SessionContext = createContext<SessionContextValue | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [started, setStarted] = useState<boolean>(readStarted)
  const [seenTours, setSeenTours] = useState<string[]>(readSeenTours)

  const start = useCallback(() => {
    setStarted(true)
    try {
      sessionStorage.setItem(STARTED_KEY, 'true')
    } catch {
      // Storage can be unavailable in private windows. The session still works
      // in memory for the current page, so we silently carry on.
    }
  }, [])

  const hasSeenTour = useCallback(
    (id: string) => seenTours.includes(id),
    [seenTours],
  )

  const markTourSeen = useCallback((id: string) => {
    setSeenTours((prev) => {
      if (prev.includes(id)) return prev
      const next = [...prev, id]
      try {
        sessionStorage.setItem(SEEN_TOURS_KEY, JSON.stringify(next))
      } catch {
        // See note in start().
      }
      return next
    })
  }, [])

  const resetTours = useCallback(() => {
    setSeenTours([])
    try {
      sessionStorage.removeItem(SEEN_TOURS_KEY)
    } catch {
      // See note in start().
    }
  }, [])

  const value = useMemo<SessionContextValue>(
    () => ({ started, start, hasSeenTour, markTourSeen, resetTours }),
    [started, start, hasSeenTour, markTourSeen, resetTours],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used within SessionProvider')
  return ctx
}
