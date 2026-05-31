import clsx from 'clsx'
import { getInitials } from '../../lib/statHelpers'

interface PlayerAvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  ringColor?: string
}

const SIZE_STYLES: Record<NonNullable<PlayerAvatarProps['size']>, string> = {
  sm: 'w-7 h-7 text-[10px]',
  md: 'w-9 h-9 text-xs',
  lg: 'w-14 h-14 text-base',
  xl: 'w-[180px] h-[180px] text-5xl',
}

export function PlayerAvatar({ name, size = 'md', ringColor }: PlayerAvatarProps) {
  const initials = getInitials(name)
  return (
    <div
      className={clsx(
        'rounded-full bg-navy-700 text-blue-500 font-semibold flex items-center justify-center shrink-0 overflow-hidden',
        SIZE_STYLES[size],
        ringColor ?? 'border border-navy-600',
      )}
    >
      {initials}
    </div>
  )
}
