import { useEffect, useState } from 'react'
import { CalendarPlus, CalendarRange, Trash2 } from 'lucide-react'
import { api } from '../api'
import type { EventSummary } from '../types'
import { Btn, Card, CardTitle, Input, Label } from './ui'

interface Props {
  onSelect: (id: string) => void
}

export function EventList({ onSelect }: Props) {
  const [events, setEvents] = useState<EventSummary[]>([])
  const [name, setName] = useState('')
  const [startTime, setStartTime] = useState('14:00')
  const [endTime, setEndTime] = useState('00:00')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    try {
      setEvents(await api.listEvents())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur')
    }
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError(null)
    try {
      const { id } = await api.createEvent({ name, startTime, endTime })
      setName('')
      await load()
      onSelect(id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, ev: React.MouseEvent) => {
    ev.stopPropagation()
    if (!confirm('Supprimer cet événement ?')) return
    await api.deleteEvent(id)
    await load()
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 pb-16">
      <header className="mb-10">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Planning{' '}
          <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            bénévoles
          </span>
        </h1>
        <p className="mt-3 max-w-md text-base font-medium text-slate-600">
          Postes, horaires et couleurs : une grille partagée en temps réel.
        </p>
      </header>

      <div className="grid gap-5 sm:grid-cols-2">
        <Card>
          <CardTitle icon={<CalendarPlus className="h-5 w-5 text-indigo-600" />}>
            Nouvel événement
          </CardTitle>
          <form onSubmit={handleCreate}>
            <Label>
              Nom de l&apos;événement
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Fête de la morue "
                required
              />
            </Label>
            <div className="mb-3 grid grid-cols-2 gap-3">
              <Label>
                Heure de début
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  step={1800}
                  required
                />
              </Label>
              <Label>
                Heure de fin
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  step={1800}
                  required
                />
              </Label>
            </div>
            <p className="mb-4 text-[13px] font-medium leading-relaxed text-slate-500">
              Créneaux par demi-heure. Si la fin est avant le début, la journée se prolonge après
              minuit.
            </p>
            {error && <p className="mb-3 text-sm font-medium text-rose-600">{error}</p>}
            <Btn type="submit" variant="primary" className="w-full" disabled={loading}>
              {loading ? 'Création…' : "Créer l'événement"}
            </Btn>
          </form>
        </Card>

        <Card>
          <CardTitle icon={<CalendarRange className="h-5 w-5 text-indigo-600" />}>
            Vos événements
          </CardTitle>
          {events.length === 0 ? (
            <p className="py-8 text-center text-sm font-medium text-slate-500">
              Aucun événement pour l&apos;instant.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {events.map((ev) => (
                <li key={ev.id} className="flex items-center gap-2 py-1">
                  <button
                    type="button"
                    className="min-w-0 flex-1 rounded-xl px-2 py-3 text-left transition hover:bg-indigo-50"
                    onClick={() => onSelect(ev.id)}
                  >
                    <span className="block truncate text-[15px] font-semibold text-slate-900">
                      {ev.name}
                    </span>
                    <span className="text-[13px] font-medium text-slate-500">
                      {ev.start_time} → {ev.end_time}
                    </span>
                  </button>
                  <Btn
                    variant="danger"
                    className="h-9 px-3"
                    onClick={(e) => handleDelete(ev.id, e)}
                    aria-label={`Supprimer ${ev.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Btn>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
