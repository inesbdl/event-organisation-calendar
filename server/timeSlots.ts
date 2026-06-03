export function parseTime(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + (m ?? 0)
}

export function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function generateTimeSlots(startTime: string, endTime: string): string[] {
  const start = parseTime(startTime)
  let end = parseTime(endTime)
  if (end <= start) end += 24 * 60

  const slots: string[] = []
  for (let t = start; t < end; t += 30) {
    slots.push(formatTime(t))
  }
  return slots
}
