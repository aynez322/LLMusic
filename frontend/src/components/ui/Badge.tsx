import { getGenreColor } from '../../utils/featureLabels'

interface BadgeProps {
  genre: string
  className?: string
}

export function Badge({ genre, className = '' }: BadgeProps) {
  const color = getGenreColor(genre)
  const display = genre || 'unknown'

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-badge-bg text-text-secondary ${className}`}
    >
      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
      {display}
    </span>
  )
}
