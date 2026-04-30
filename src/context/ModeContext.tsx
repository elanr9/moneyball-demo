import { createContext, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

export type AppMode = 'coach' | 'scout'

interface ModeContextValue {
  mode: AppMode
  setMode: (mode: AppMode) => void
  toggle: () => void
}

const ModeContext = createContext<ModeContextValue | null>(null)

export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AppMode>('coach')
  const value = useMemo<ModeContextValue>(
    () => ({
      mode,
      setMode,
      toggle: () => setMode((m) => (m === 'coach' ? 'scout' : 'coach')),
    }),
    [mode],
  )
  return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>
}

export function useMode() {
  const ctx = useContext(ModeContext)
  if (!ctx) throw new Error('useMode must be used within ModeProvider')
  return ctx
}
