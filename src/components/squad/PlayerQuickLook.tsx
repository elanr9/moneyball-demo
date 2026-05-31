// A fast scouting peek for the squad page. The coach taps a player and gets the
// full FUT card, the game model indexes, and the advanced stats, all without
// leaving the squad builder. A single button opens the complete profile when
// they want to dig deeper.

import { useEffect, useMemo } from 'react'
import { ArrowRight, X } from 'lucide-react'
import { useUniverse } from '../../context/UniverseContext'
import { useRoles } from '../../context/RolesContext'
import { buildPercentiles, playerRoleFits } from '../../data/gameModel'
import { reportsFor } from '../../data/scoutReports'
import type { Player, Team } from '../../data/types'
import { PlayerCard } from './PlayerCard'
import { PlayerIndexes } from '../player/PlayerIndexes'
import { TeamCrest } from '../league/TeamCrest'
import { RatingBadge } from '../ui/RatingBadge'
import { StatTile } from '../ui/StatTile'

interface PlayerQuickLookProps {
  player: Player
  team?: Team
  onClose: () => void
  onViewProfile: () => void
}

interface StatCell {
  label: string
  value: string | number
  sublabel?: string
}

function outfieldStats(player: Player): StatCell[] {
  const s = player.season
  return [
    { label: 'Goals', value: s.goals },
    { label: 'Assists', value: s.assists },
    { label: 'xG', value: s.xg.toFixed(2) },
    { label: 'xA', value: s.xa.toFixed(2) },
    { label: 'Chances Created', value: s.chancesCreated },
    { label: 'Pass Accuracy', value: `${Math.round(s.passAccuracy)}%` },
    { label: 'Off Ball Distance', value: `${s.offBallDistanceKm.toFixed(1)} km` },
    { label: 'Top Speed', value: `${s.topSpeedKmh.toFixed(1)} km/h` },
    { label: 'Progressive Runs', value: s.progressiveRuns },
    { label: 'Runs Creating Chances', value: s.runsCreatingChances },
    { label: 'Space Created', value: s.spaceCreatedPer90.toFixed(1), sublabel: 'per 90' },
    { label: 'Press Intensity', value: s.ppda.toFixed(1), sublabel: 'PPDA' },
  ]
}

function goalkeeperStats(player: Player): StatCell[] {
  const s = player.season
  return [
    { label: 'Clean Sheets', value: s.cleanSheets },
    { label: 'Saves', value: s.saves },
    { label: 'Save Rate', value: `${Math.round(s.savePercent)}%` },
    { label: 'Goals Conceded', value: s.goalsConceded },
    { label: 'Pass Accuracy', value: `${Math.round(s.passAccuracy)}%` },
    { label: 'Goals Prevented', value: s.goalsPrevented.toFixed(1) },
    { label: 'Off Ball Distance', value: `${s.offBallDistanceKm.toFixed(1)} km` },
    { label: 'Press Intensity', value: s.ppda.toFixed(1), sublabel: 'PPDA' },
  ]
}

export function PlayerQuickLook({
  player,
  team,
  onClose,
  onViewProfile,
}: PlayerQuickLookProps) {
  const { universe } = useUniverse()
  const { roles } = useRoles()

  const percentiles = useMemo(() => buildPercentiles(universe.players), [universe.players])
  const fits = useMemo(
    () => playerRoleFits(player, roles, percentiles),
    [player, roles, percentiles],
  )
  const reportSummary = useMemo(() => reportsFor(player), [player])

  const stats = player.positionGroup === 'GK' ? goalkeeperStats(player) : outfieldStats(player)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-ink-900/50 p-4 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-navy-600 bg-navy-800 shadow-float"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 border-b border-navy-600 px-6 py-4">
          <div className="min-w-0">
            <div className="section-label text-blue-500">Quick Look</div>
            <h2 className="mt-1 truncate text-xl font-bold tracking-tight text-ink-100">
              {player.name}
            </h2>
            {team ? (
              <div className="mt-1 inline-flex items-center gap-2 text-sm text-ink-300">
                <TeamCrest team={team} size="xs" />
                {team.name}
              </div>
            ) : null}
          </div>
          <div className="flex items-center gap-4">
            <RatingBadge rating={player.season.fvRating} size="lg" />
            <button
              type="button"
              onClick={onClose}
              className="text-ink-300 transition-colors hover:text-ink-100"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="scrollbar-thin flex-1 overflow-auto p-6">
          <div className="flex flex-wrap items-start gap-6">
            <div className="mx-auto sm:mx-0">
              <PlayerCard player={player} team={team} size="detail" />
            </div>

            <div className="min-w-[260px] flex-1 space-y-4">
              <div className="flex gap-3">
                <RatingTile label="Overall" value={player.overall} />
                <RatingTile label="Potential" value={player.potential} />
                <RatingTile label="Class" value={player.classYear} />
              </div>
              <PlayerIndexes
                player={player}
                topFit={fits[0]}
                reportAverage={reportSummary.averageStars}
                reportCount={reportSummary.count}
              />
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-3 flex items-center gap-2">
              <h3 className="section-label text-ink-300">Advanced Stats</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {stats.map((cell) => (
                <StatTile
                  key={cell.label}
                  label={cell.label}
                  value={cell.value}
                  sublabel={cell.sublabel}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-navy-600 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-ink-300 transition-colors hover:text-ink-100"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onViewProfile}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_14px_-4px_rgba(37,99,235,0.7)] transition-colors hover:bg-blue-400"
          >
            View Full Profile
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}

function RatingTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex-1 rounded-md border border-navy-600 bg-navy-700 px-3 py-2 text-center">
      <div className="truncate font-mono text-xl font-bold leading-none text-ink-100">
        {value}
      </div>
      <div className="mt-1 text-[10px] uppercase tracking-widest text-ink-300">{label}</div>
    </div>
  )
}
