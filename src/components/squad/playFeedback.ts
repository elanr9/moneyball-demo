// The learning layer behind the AI playbook. When a coach rates a play up or
// down, we remember it and let that signal shape what surfaces next. The model
// is intentionally simple and explainable: a play's own vote nudges its score
// directly, and votes on other plays that share the same focus generalise into
// a smaller nudge, so liking a couple of wide plays gently lifts every wide play
// and the opposite for dislikes. Nothing here is a black box, which keeps it
// honest for a demo and easy for any engineer to reason about.
//
// Feedback persists to localStorage so the playbook keeps improving across
// reloads. If storage is unavailable the hook simply runs in memory.

import { useCallback, useEffect, useState } from 'react'
import type { Play, PlayFocus } from './playbook'

export type Vote = 1 | -1

interface VoteRecord {
  vote: Vote
  focus: PlayFocus
}

type FeedbackMap = Record<string, VoteRecord>

const STORAGE_KEY = 'fv.playbook.feedback.v1'

// How hard a play's own vote and the shared focus votes pull the score, plus the
// cap so a tuned score never runs away from the underlying squad fit.
const DIRECT_WEIGHT = 9
const FOCUS_WEIGHT = 5
const MAX_ADJUST = 18

function readStorage(): FeedbackMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as FeedbackMap
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeStorage(map: FeedbackMap) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {
    // Storage can be blocked; the in memory state still works for the session.
  }
}

export interface PlaybookFeedback {
  // The coach's vote on a play, or null when they have not rated it.
  voteFor: (playId: string) => Vote | null
  // Toggle a vote. Voting the same way again clears it.
  vote: (play: Play, dir: Vote) => void
  // The learned delta applied to a play's confidence, signed and capped.
  adjustmentFor: (play: Play) => number
  // How many ratings the model has learned from so far.
  signalCount: number
  // Reset all learning.
  reset: () => void
}

export function usePlaybookFeedback(): PlaybookFeedback {
  const [map, setMap] = useState<FeedbackMap>(() => readStorage())

  useEffect(() => {
    writeStorage(map)
  }, [map])

  const voteFor = useCallback((playId: string) => map[playId]?.vote ?? null, [map])

  const vote = useCallback((play: Play, dir: Vote) => {
    setMap((prev) => {
      const next = { ...prev }
      if (next[play.id]?.vote === dir) {
        delete next[play.id]
      } else {
        next[play.id] = { vote: dir, focus: play.focus }
      }
      return next
    })
  }, [])

  const adjustmentFor = useCallback(
    (play: Play) => {
      const own = map[play.id]?.vote ?? 0
      let focusSum = 0
      let focusCount = 0
      for (const [id, record] of Object.entries(map)) {
        if (id === play.id) continue
        if (record.focus !== play.focus) continue
        focusSum += record.vote
        focusCount += 1
      }
      const focusAvg = focusCount ? focusSum / focusCount : 0
      const raw = own * DIRECT_WEIGHT + focusAvg * FOCUS_WEIGHT
      return Math.round(Math.max(-MAX_ADJUST, Math.min(MAX_ADJUST, raw)))
    },
    [map],
  )

  const reset = useCallback(() => setMap({}), [])

  return {
    voteFor,
    vote,
    adjustmentFor,
    signalCount: Object.keys(map).length,
    reset,
  }
}

// Sorts plays by their tuned score (squad fit plus learned adjustment) so the
// plays the coach responds well to rise to the top over time. Ties keep the
// higher base confidence first for a stable order.
export function rankPlays(plays: Play[], adjustmentFor: (play: Play) => number): Play[] {
  return [...plays].sort((a, b) => {
    const sa = a.confidence + adjustmentFor(a)
    const sb = b.confidence + adjustmentFor(b)
    if (sb !== sa) return sb - sa
    return b.confidence - a.confidence
  })
}
