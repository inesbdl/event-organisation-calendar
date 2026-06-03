import type { CSSProperties } from 'react'

/** Fond pastel + bordure à partir de la couleur du bénévole */
export function volunteerChipStyle(color: string): CSSProperties {
  return {
    '--vol-color': color,
    backgroundColor: `color-mix(in srgb, ${color} 18%, white)`,
    borderColor: `color-mix(in srgb, ${color} 45%, white)`,
    color: '#1e293b',
  } as CSSProperties
}
