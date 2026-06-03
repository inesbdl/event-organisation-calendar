import type { Volunteer } from '../types'
import { volunteerChipStyle } from '../utils/chipStyle'

interface Props {
  volunteer: Volunteer
  selected?: boolean
  onSelect?: () => void
  inCell?: boolean
  picker?: boolean
}

export function VolunteerBadge({ volunteer, selected, onSelect, inCell, picker }: Props) {
  const chipStyle = volunteerChipStyle(volunteer.color)

  if (inCell) {
    return (
      <button
        type="button"
        className="w-full rounded-lg border px-1 py-0.5 text-left text-[10px] font-bold leading-snug text-slate-800 transition hover:brightness-95 sm:text-[11px]"
        style={chipStyle}
        title={volunteer.name}
        onClick={(e) => {
          e.stopPropagation()
          onSelect?.()
        }}
      >
        <span className="line-clamp-2 break-words">{volunteer.name}</span>
      </button>
    )
  }

  return (
    <button
      type="button"
      className={`inline-flex max-w-full items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition hover:brightness-95 ${
        selected ? 'ring-2 ring-indigo-400 ring-offset-2' : ''
      } ${picker ? '' : ''}`}
      style={chipStyle}
      onClick={onSelect}
    >
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: volunteer.color }}
      />
      <span className="max-w-[12rem] break-words text-left leading-snug sm:max-w-none">
        {volunteer.name}
      </span>
    </button>
  )
}
