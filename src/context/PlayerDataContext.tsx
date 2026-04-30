import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Player } from '../types/player'
import type { PerGameStats } from '../types/game'
import { loadFieldVisionData } from '../lib/parseSpreadsheet'

interface PlayerDataContextValue {
  players: Player[]
  perGameByPlayerSlug: Record<string, PerGameStats[]>
  loading: boolean
  error: string | null
  getPlayerBySlug: (slug: string) => Player | undefined
  getPerGameForPlayer: (slug: string) => PerGameStats[]
}

const PlayerDataContext = createContext<PlayerDataContextValue | null>(null)

export function PlayerDataProvider({ children }: { children: ReactNode }) {
  const [players, setPlayers] = useState<Player[]>([])
  const [perGameByPlayerSlug, setPerGameByPlayerSlug] = useState<
    Record<string, PerGameStats[]>
  >({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    loadFieldVisionData()
      .then((data) => {
        if (cancelled) return
        setPlayers(data.players)
        setPerGameByPlayerSlug(data.perGameByPlayerSlug)
        setLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load data')
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo<PlayerDataContextValue>(() => {
    const slugIndex = new Map<string, Player>()
    players.forEach((p) => slugIndex.set(p.slug, p))
    return {
      players,
      perGameByPlayerSlug,
      loading,
      error,
      getPlayerBySlug: (slug: string) => slugIndex.get(slug),
      getPerGameForPlayer: (slug: string) => perGameByPlayerSlug[slug] ?? [],
    }
  }, [players, perGameByPlayerSlug, loading, error])

  return (
    <PlayerDataContext.Provider value={value}>
      {children}
    </PlayerDataContext.Provider>
  )
}

export function usePlayerData() {
  const ctx = useContext(PlayerDataContext)
  if (!ctx)
    throw new Error('usePlayerData must be used within PlayerDataProvider')
  return ctx
}
