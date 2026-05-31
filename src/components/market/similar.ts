// Replacement suggestions. Given a target player we surface players from the
// same position group with the closest overall and attribute profile. The score
// is a simple normalized distance so it is easy to explain to a scout.

import type { Player } from '../../data/types'

export interface SimilarPlayer {
  player: Player
  score: number // 0 to 100, higher is more similar
  reasons: string[]
}

const OUTFIELD_KEYS = [
  ['pace', 'PAC'],
  ['shooting', 'SHO'],
  ['passing', 'PAS'],
  ['dribbling', 'DRI'],
  ['defending', 'DEF'],
  ['physical', 'PHY'],
] as const

const GK_KEYS = [
  ['diving', 'DIV'],
  ['handling', 'HAN'],
  ['kicking', 'KIC'],
  ['reflexes', 'REF'],
  ['speed', 'SPD'],
  ['positioning', 'POS'],
] as const

interface Vector {
  values: number[]
  labels: string[]
}

function vectorOf(player: Player): Vector {
  if (player.attributes) {
    return {
      values: OUTFIELD_KEYS.map(([k]) => player.attributes![k]),
      labels: OUTFIELD_KEYS.map(([, l]) => l),
    }
  }
  if (player.gkAttributes) {
    return {
      values: GK_KEYS.map(([k]) => player.gkAttributes![k]),
      labels: GK_KEYS.map(([, l]) => l),
    }
  }
  return { values: [], labels: [] }
}

export function similarPlayers(
  target: Player,
  players: Player[],
  limit = 6,
): SimilarPlayer[] {
  const targetVec = vectorOf(target)

  const pool = players.filter(
    (p) => p.id !== target.id && p.positionGroup === target.positionGroup,
  )

  const scored = pool.map((p) => {
    const vec = vectorOf(p)
    let sumSq = 0
    const diffs: Array<{ label: string; diff: number }> = []
    for (let i = 0; i < vec.values.length; i++) {
      const diff = vec.values[i]! - targetVec.values[i]!
      sumSq += diff * diff
      diffs.push({ label: vec.labels[i]!, diff: Math.abs(diff) })
    }
    const overallDiff = Math.abs(p.overall - target.overall)
    const attrDistance = Math.sqrt(sumSq)
    // Blend attribute distance with overall closeness, then map to 0 to 100.
    const distance = attrDistance + overallDiff * 1.5
    const score = Math.max(0, Math.round(100 - distance * 1.6))

    const closest = [...diffs].sort((a, b) => a.diff - b.diff).slice(0, 2)
    const reasons = [
      'Same position group',
      `${p.overall} vs ${target.overall} overall`,
    ]
    if (closest.length) {
      reasons.push(`Close on ${closest.map((c) => c.label).join(', ')}`)
    }

    return { player: p, score, reasons }
  })

  return scored.sort((a, b) => b.score - a.score).slice(0, limit)
}
