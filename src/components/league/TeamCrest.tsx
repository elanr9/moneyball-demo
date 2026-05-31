// A team's visual mark. Featured schools render their real logo art; every
// other club falls back to a two tone shield built from its colors with the
// abbreviation. Reused anywhere a team needs a mark (table, fixtures, headers,
// leader rows, player cards).

import clsx from 'clsx'
import type { Team } from '../../data/types'
import { teamLogoUrl } from '../../data/playerMedia'

type CrestSize = 'xs' | 'sm' | 'md' | 'lg'

const SIZE_STYLES: Record<CrestSize, string> = {
  xs: 'h-4 w-4 text-[6px] rounded',
  sm: 'h-6 w-6 text-[9px] rounded-md',
  md: 'h-8 w-8 text-[11px] rounded-lg',
  lg: 'h-14 w-14 text-base rounded-xl',
}

interface TeamCrestProps {
  team: Team
  size?: CrestSize
}

export function TeamCrest({ team, size = 'md' }: TeamCrestProps) {
  const logo = teamLogoUrl(team)

  if (logo) {
    return (
      <span
        className={clsx(
          'inline-flex shrink-0 items-center justify-center bg-white/95 shadow-sm ring-1 ring-black/10',
          SIZE_STYLES[size],
        )}
      >
        <img
          src={logo}
          alt={team.shortName}
          className="h-full w-full object-contain p-0.5"
        />
      </span>
    )
  }

  return (
    <span
      className={clsx(
        'inline-flex shrink-0 items-center justify-center font-bold uppercase text-white shadow-sm ring-1 ring-black/20',
        SIZE_STYLES[size],
      )}
      style={{
        background: `linear-gradient(150deg, ${team.primaryColor} 0%, ${team.primaryColor} 55%, ${team.secondaryColor} 55%, ${team.secondaryColor} 100%)`,
      }}
    >
      {team.abbreviation}
    </span>
  )
}
