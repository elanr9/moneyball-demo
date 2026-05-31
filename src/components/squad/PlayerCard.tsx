// Premium FUT style player card used across the squad pitch, bench, reserves and
// the player profile. Cards are tiered by overall rating into elite, gold,
// silver and bronze, each with its own metallic finish, and carry the classic
// layout: a big rating with the position, a club logo, the name banner and the
// six core attributes split into two columns. One component renders three sizes:
// "pitch" (a compact token on the formation), "medium" (rails and the market)
// and "detail" (the large profile card). Players are shown by their initials so
// the cards stay clean without any photography.

import clsx from 'clsx'
import type { Player, Team } from '../../data/types'
import { getInitials } from '../../lib/statHelpers'
import { teamLogoUrl } from '../../data/playerMedia'

export type CardSize = 'pitch' | 'medium' | 'detail'

interface PlayerCardProps {
  player: Player
  team?: Team
  size?: CardSize
  onClick?: () => void
}

type Tier = 'elite' | 'gold' | 'silver' | 'bronze'

function tierOf(overall: number): Tier {
  if (overall >= 85) return 'elite'
  if (overall >= 78) return 'gold'
  if (overall >= 70) return 'silver'
  return 'bronze'
}

// Each tier carries its own metallic finish. The card body is a vertical
// gradient, text sits dark on the bright metals and light on the elite card,
// and a tinted hairline separates the name from the stats.
interface TierStyle {
  card: string
  text: string
  sub: string
  divider: string
  ring: string
  pill: string
  glow: string
}

const TIERS: Record<Tier, TierStyle> = {
  elite: {
    card: 'bg-gradient-to-b from-[#1b2440] via-[#101728] to-[#05070e]',
    text: 'text-amber-200',
    sub: 'text-amber-200/60',
    divider: 'border-amber-200/20',
    ring: 'ring-amber-300/70',
    pill: 'bg-amber-300/15 text-amber-100',
    glow: 'shadow-[0_10px_30px_-10px_rgba(245,200,90,0.45)]',
  },
  gold: {
    card: 'bg-gradient-to-b from-[#fff3c4] via-[#f0d069] to-[#c2962b]',
    text: 'text-[#3a2c05]',
    sub: 'text-[#3a2c05]/70',
    divider: 'border-[#3a2c05]/20',
    ring: 'ring-[#a87f1e]/70',
    pill: 'bg-[#3a2c05]/15 text-[#3a2c05]',
    glow: 'shadow-[0_10px_30px_-10px_rgba(194,150,43,0.5)]',
  },
  silver: {
    card: 'bg-gradient-to-b from-[#f6f8fb] via-[#d3d9e1] to-[#98a2b0]',
    text: 'text-[#222730]',
    sub: 'text-[#222730]/70',
    divider: 'border-[#222730]/15',
    ring: 'ring-[#7c8694]/70',
    pill: 'bg-[#222730]/12 text-[#222730]',
    glow: 'shadow-[0_10px_30px_-10px_rgba(120,132,148,0.5)]',
  },
  bronze: {
    card: 'bg-gradient-to-b from-[#f2d3a8] via-[#cf9355] to-[#8b561f]',
    text: 'text-[#3a230c]',
    sub: 'text-[#3a230c]/70',
    divider: 'border-[#3a230c]/20',
    ring: 'ring-[#8a5722]/70',
    pill: 'bg-[#3a230c]/15 text-[#3a230c]',
    glow: 'shadow-[0_10px_30px_-10px_rgba(139,86,31,0.5)]',
  },
}

interface AttrCell {
  label: string
  value: number
}

function cardAttributes(player: Player): AttrCell[] {
  const a = player.attributes
  if (a) {
    return [
      { label: 'PAC', value: a.pace },
      { label: 'SHO', value: a.shooting },
      { label: 'PAS', value: a.passing },
      { label: 'DRI', value: a.dribbling },
      { label: 'DEF', value: a.defending },
      { label: 'PHY', value: a.physical },
    ]
  }
  const g = player.gkAttributes
  if (g) {
    return [
      { label: 'DIV', value: g.diving },
      { label: 'HAN', value: g.handling },
      { label: 'KIC', value: g.kicking },
      { label: 'REF', value: g.reflexes },
      { label: 'SPD', value: g.speed },
      { label: 'POS', value: g.positioning },
    ]
  }
  return []
}

const FRAME: Record<CardSize, string> = {
  pitch: 'w-[86px] rounded-2xl p-1.5',
  medium: 'w-[140px] rounded-[20px] p-3',
  detail: 'w-[264px] rounded-[28px] p-6',
}

function Headshot({
  player,
  ringClass,
  className,
  textClass,
}: {
  player: Player
  ringClass: string
  className: string
  textClass: string
}) {
  return (
    <div
      className={clsx(
        'flex items-center justify-center overflow-hidden rounded-full bg-slate-700 font-bold text-white ring-2',
        ringClass,
        className,
        textClass,
      )}
    >
      {getInitials(player.name)}
    </div>
  )
}

function StatColumn({
  cells,
  style,
  size,
}: {
  cells: AttrCell[]
  style: TierStyle
  size: CardSize
}) {
  return (
    <div className="flex flex-1 flex-col gap-1">
      {cells.map((attr) => (
        <div key={attr.label} className="flex items-baseline gap-1.5">
          <span
            className={clsx(
              'font-bold tabular-nums leading-none',
              style.text,
              size === 'detail' ? 'text-xl' : 'text-sm',
            )}
          >
            {attr.value}
          </span>
          <span
            className={clsx(
              'font-bold uppercase leading-none tracking-wide',
              style.sub,
              size === 'detail' ? 'text-[11px]' : 'text-[9px]',
            )}
          >
            {attr.label}
          </span>
        </div>
      ))}
    </div>
  )
}

export function PlayerCard({
  player,
  team,
  size = 'pitch',
  onClick,
}: PlayerCardProps) {
  const tier = tierOf(player.overall)
  const style = TIERS[tier]
  const logo = teamLogoUrl(team)
  const showAttributes = size !== 'pitch'
  const attributes = showAttributes ? cardAttributes(player) : []
  const name = size === 'detail' ? player.name : player.lastName

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onClick()
        }
      }}
      className={clsx(
        'relative isolate flex select-none flex-col items-center overflow-hidden ring-1 ring-black/10 transition-all duration-200',
        FRAME[size],
        style.card,
        style.glow,
        onClick &&
          'cursor-pointer hover:-translate-y-1 hover:ring-2 hover:ring-white/40 hover:brightness-105',
      )}
    >
      {/* glossy highlight that gives the metal its sheen */}
      <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent" />
      <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-black/15" />

      <div className="relative z-10 flex w-full items-start justify-between">
        <div className="flex flex-col items-center leading-none">
          <span
            className={clsx(
              'font-extrabold tabular-nums tracking-tight',
              style.text,
              size === 'pitch' && 'text-lg',
              size === 'medium' && 'text-3xl',
              size === 'detail' && 'text-5xl',
            )}
          >
            {player.overall}
          </span>
          <span
            className={clsx(
              'mt-0.5 rounded font-extrabold uppercase tracking-wide',
              style.pill,
              size === 'detail' ? 'px-2 py-0.5 text-xs' : 'px-1.5 text-[9px]',
            )}
          >
            {player.primaryPosition}
          </span>
          {size !== 'pitch' ? (
            <span className={clsx('mt-1 text-[10px] font-bold uppercase', style.sub)}>
              {player.foot}
            </span>
          ) : null}
        </div>

        {logo ? (
          <img
            src={logo}
            alt={team?.shortName ?? ''}
            className={clsx(
              'object-contain drop-shadow',
              size === 'pitch' && 'h-5 w-5',
              size === 'medium' && 'h-7 w-7',
              size === 'detail' && 'h-10 w-10',
            )}
          />
        ) : team ? (
          <span
            className={clsx(
              'inline-flex items-center justify-center font-extrabold uppercase leading-none text-white shadow ring-1 ring-black/20',
              size === 'pitch' && 'h-5 w-5 rounded text-[7px]',
              size === 'medium' && 'h-7 w-7 rounded-md text-[9px]',
              size === 'detail' && 'h-10 w-10 rounded-lg text-sm',
            )}
            style={{
              background: `linear-gradient(150deg, ${team.primaryColor} 0%, ${team.primaryColor} 55%, ${team.secondaryColor} 55%, ${team.secondaryColor} 100%)`,
            }}
            title={team.name}
          >
            {team.abbreviation}
          </span>
        ) : (
          <span
            className={clsx(
              'font-mono font-bold',
              style.sub,
              size === 'detail' ? 'text-base' : 'text-[9px]',
            )}
          >
            #{player.number}
          </span>
        )}
      </div>

      {size === 'pitch' ? null : (
        <Headshot
          player={player}
          ringClass={style.ring}
          className={clsx(
            'relative z-10',
            size === 'medium' && 'my-2 h-16 w-16',
            size === 'detail' && 'my-3 h-28 w-28',
          )}
          textClass={clsx(
            size === 'medium' && 'text-lg',
            size === 'detail' && 'text-2xl',
          )}
        />
      )}

      <div
        className={clsx(
          'relative z-10 w-full truncate text-center font-extrabold uppercase tracking-wide',
          style.text,
          size === 'pitch' && 'mt-1.5 text-[10px]',
          size === 'medium' && 'text-sm',
          size === 'detail' && 'text-lg',
        )}
        title={player.name}
      >
        {name}
      </div>

      {showAttributes ? (
        <div
          className={clsx(
            'relative z-10 mt-2.5 flex w-full border-t pt-2.5',
            style.divider,
          )}
        >
          <StatColumn cells={attributes.slice(0, 3)} style={style} size={size} />
          <div className={clsx('mx-1 w-px self-stretch border-l', style.divider)} />
          <StatColumn cells={attributes.slice(3, 6)} style={style} size={size} />
        </div>
      ) : null}
    </div>
  )
}
