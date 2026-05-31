// The headline game model strip on a player profile. It blends the FieldVision
// numbers (skill and physical index) with the human scouting verdict (average
// report stars) and the player's single best role fit, so a coach reads data
// and scouting insight together exactly the way the platform pitches it.

import type { Player } from '../../data/types'
import type { RoleFit } from '../../data/gameModel'
import { skillIndex, physicalIndex } from '../../data/gameModel'
import { ScoreBar } from '../ui/ScoreBar'
import { Stars } from '../ui/Stars'

interface PlayerIndexesProps {
  player: Player
  topFit: RoleFit | undefined
  reportAverage: number
  reportCount: number
}

export function PlayerIndexes({
  player,
  topFit,
  reportAverage,
  reportCount,
}: PlayerIndexesProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <IndexTile label="Skill index">
        <ScoreBar value={skillIndex(player)} />
      </IndexTile>
      <IndexTile label="Physical index">
        <ScoreBar value={physicalIndex(player)} />
      </IndexTile>
      <IndexTile label={topFit ? topFit.role.name : 'Best role'}>
        {topFit ? (
          <ScoreBar value={topFit.score} accent />
        ) : (
          <span className="text-sm text-ink-300">No role data</span>
        )}
      </IndexTile>
      <IndexTile label={`Scout reports (${reportCount})`}>
        <div className="flex h-[18px] items-center">
          <Stars value={reportAverage} showValue />
        </div>
      </IndexTile>
    </div>
  )
}

function IndexTile({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-navy-600 bg-navy-700 p-3">
      <div className="mb-2 truncate text-[10px] uppercase tracking-widest text-ink-300" title={label}>
        {label}
      </div>
      {children}
    </div>
  )
}
