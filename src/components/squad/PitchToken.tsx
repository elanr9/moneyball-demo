// The token for a player standing in the formation. A clean circular initials
// badge with a tier colored ring and a single rating chip, sized to sit lightly
// on the grass without crowding its neighbours. The name and position label are
// drawn by the pitch beneath the token, so this stays a tight self contained
// avatar.

import clsx from 'clsx'
import type { Player, Team } from '../../data/types'
import { getInitials } from '../../lib/statHelpers'
import { teamLogoUrl } from '../../data/playerMedia'

type Tier = 'elite' | 'gold' | 'silver' | 'bronze'

function tierOf(overall: number): Tier {
  if (overall >= 85) return 'elite'
  if (overall >= 78) return 'gold'
  if (overall >= 70) return 'silver'
  return 'bronze'
}

const RING: Record<Tier, string> = {
  elite: 'ring-amber-300',
  gold: 'ring-yellow-400',
  silver: 'ring-slate-200',
  bronze: 'ring-orange-300',
}

const CHIP: Record<Tier, string> = {
  elite: 'bg-gradient-to-br from-amber-100 to-amber-400 text-[#3a2c05]',
  gold: 'bg-gradient-to-br from-yellow-100 to-yellow-400 text-[#3a2c05]',
  silver: 'bg-gradient-to-br from-slate-50 to-slate-300 text-slate-800',
  bronze: 'bg-gradient-to-br from-orange-100 to-orange-400 text-[#3a230c]',
}

export function PitchToken({ player, team }: { player: Player; team?: Team }) {
  const tier = tierOf(player.overall)
  const logo = teamLogoUrl(team)

  return (
    <div className="relative">
      <div
        className={clsx(
          'flex h-[60px] w-[60px] items-center justify-center overflow-hidden rounded-full bg-slate-700 ring-2',
          RING[tier],
        )}
        style={{ boxShadow: '0 8px 18px -8px rgba(0,0,0,0.85)' }}
      >
        <span className="text-sm font-bold text-white">{getInitials(player.name)}</span>
      </div>

      <span
        className={clsx(
          'absolute -left-1.5 -top-1.5 flex h-[22px] min-w-[22px] items-center justify-center rounded-full px-1 text-[12px] font-black leading-none tabular-nums shadow-md ring-2 ring-black/25',
          CHIP[tier],
        )}
      >
        {player.overall}
      </span>

      {logo ? (
        <img
          src={logo}
          alt={team?.shortName ?? ''}
          className="absolute -bottom-1 -right-1 h-[18px] w-[18px] rounded-full bg-white/90 object-contain p-0.5 shadow ring-1 ring-black/15"
        />
      ) : null}
    </div>
  )
}
