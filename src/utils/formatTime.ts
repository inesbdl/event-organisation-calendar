/** "14:00" → "14h" pour en-têtes compacts */
export function formatSlotLabel(time: string): string {
  const [h, m] = time.split(':')
  if (m === '00') return `${Number(h)}h`
  return `${h}:${m}`
}

export function volunteerInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}
