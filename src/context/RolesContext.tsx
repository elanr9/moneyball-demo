// Holds the game model role library for the whole app. The product ships a set
// of default roles and lets a coach create, tune and remove their own custom AI
// driven roles in the Roles studio. Custom roles persist to localStorage so a
// role a coach builds is still there on the next visit, while the defaults stay
// read only.

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { DEFAULT_ROLES } from '../data/gameModel'
import type { RoleDef } from '../data/gameModel'

const STORAGE_KEY = 'fieldvision.customRoles.v1'

function loadCustomRoles(): RoleDef[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as RoleDef[]
    return parsed.map((r) => ({ ...r, custom: true }))
  } catch {
    return []
  }
}

function saveCustomRoles(roles: RoleDef[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(roles))
  } catch {
    // A full or unavailable store should never break the app.
  }
}

interface RolesContextValue {
  roles: RoleDef[]
  customRoles: RoleDef[]
  getRole: (id: string) => RoleDef | undefined
  saveRole: (role: RoleDef) => void
  deleteRole: (id: string) => void
}

const RolesContext = createContext<RolesContextValue | null>(null)

export function RolesProvider({ children }: { children: ReactNode }) {
  const [customRoles, setCustomRoles] = useState<RoleDef[]>(() => loadCustomRoles())

  const saveRole = useCallback((role: RoleDef) => {
    const next: RoleDef = { ...role, custom: true }
    setCustomRoles((prev) => {
      const existing = prev.findIndex((r) => r.id === next.id)
      const updated = existing >= 0
        ? prev.map((r) => (r.id === next.id ? next : r))
        : [...prev, next]
      saveCustomRoles(updated)
      return updated
    })
  }, [])

  const deleteRole = useCallback((id: string) => {
    setCustomRoles((prev) => {
      const updated = prev.filter((r) => r.id !== id)
      saveCustomRoles(updated)
      return updated
    })
  }, [])

  const roles = useMemo(() => [...DEFAULT_ROLES, ...customRoles], [customRoles])
  const getRole = useCallback((id: string) => roles.find((r) => r.id === id), [roles])

  const value = useMemo<RolesContextValue>(
    () => ({ roles, customRoles, getRole, saveRole, deleteRole }),
    [roles, customRoles, getRole, saveRole, deleteRole],
  )

  return <RolesContext.Provider value={value}>{children}</RolesContext.Provider>
}

export function useRoles(): RolesContextValue {
  const ctx = useContext(RolesContext)
  if (!ctx) throw new Error('useRoles must be used within RolesProvider')
  return ctx
}
