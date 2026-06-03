import { useState } from 'react'
import { ArrowLeft, CalendarDays, LayoutGrid, Radio, Users } from 'lucide-react'
import { api } from '../api'
import { useEvent } from '../hooks/useEvent'
import { PlanningGrid } from './PlanningGrid'
import { TeamTab } from './TeamTab'
import { Btn } from './ui'

type TabId = 'team' | 'planning'

interface Props {
  eventId: string
  onBack: () => void
}

export function EventPlanning({ eventId, onBack }: Props) {
  const { state, loading, error, refresh } = useEvent(eventId)
  const [tab, setTab] = useState<TabId>('team')
  const [volunteerName, setVolunteerName] = useState('')
  const [postName, setPostName] = useState('')
  const [postCount, setPostCount] = useState(1)
  const [toast, setToast] = useState<string | null>(null)
  const [selectedVolunteerId, setSelectedVolunteerId] = useState<string | null>(null)

  const showError = (msg: string) => {
    if (!msg) return
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  const addVolunteer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!volunteerName.trim()) return
    try {
      const { id } = await api.addVolunteer(eventId, volunteerName.trim())
      setVolunteerName('')
      setSelectedVolunteerId(id)
      refresh()
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Erreur')
    }
  }

  const addPost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!postName.trim()) return
    try {
      await api.addPost(eventId, { name: postName.trim(), requiredCount: postCount })
      setPostName('')
      setPostCount(1)
      refresh()
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Erreur')
    }
  }

  const removeVolunteer = async (id: string) => {
    await api.deleteVolunteer(id)
    if (selectedVolunteerId === id) setSelectedVolunteerId(null)
    refresh()
  }

  const removePost = async (id: string) => {
    await api.deletePost(id)
    refresh()
  }

  if (loading && !state) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm font-semibold text-slate-500">
        Chargement…
      </div>
    )
  }

  if (error && !state) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-5">
        <p className="text-sm font-medium text-rose-600">{error}</p>
        <Btn variant="secondary" onClick={onBack}>
          Retour
        </Btn>
      </div>
    )
  }

  if (!state) return null

  const { event, volunteers, posts } = state
  const canPlan = volunteers.length > 0 && posts.length > 0

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 pb-10 pt-5 sm:px-6">
      <header className="mb-6 flex flex-wrap items-start gap-3 sm:gap-4">
        <Btn variant="ghost" className="h-10 shrink-0 px-3" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Btn>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
            {event.name}
          </h1>
          <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-sm font-medium text-slate-500">
            <CalendarDays className="h-4 w-4 shrink-0" />
            {event.start_time} → {event.end_time}
            <span className="text-slate-300">|</span>
            créneaux de 30 min
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
          <Radio className="h-3 w-3 fill-emerald-500 text-emerald-500" />
          En direct
        </span>
      </header>

      <nav
        className="mb-5 flex gap-2 rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-sm"
        role="tablist"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'team'}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
            tab === 'team'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
          onClick={() => setTab('team')}
        >
          <Users className="h-4 w-4" />
          Équipe
          <span
            className={`rounded-full px-2 py-0.5 text-xs ${
              tab === 'team' ? 'bg-white/20' : 'bg-slate-100'
            }`}
          >
            {volunteers.length + posts.length}
          </span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'planning'}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition disabled:opacity-40 ${
            tab === 'planning'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
          onClick={() => setTab('planning')}
          disabled={!canPlan}
        >
          <LayoutGrid className="h-4 w-4" />
          Planning
        </button>
      </nav>

      <main>
        {tab === 'team' && (
          <TeamTab
            state={state}
            volunteerName={volunteerName}
            postName={postName}
            postCount={postCount}
            onVolunteerName={setVolunteerName}
            onPostName={setPostName}
            onPostCount={setPostCount}
            onAddVolunteer={addVolunteer}
            onAddPost={addPost}
            onRemoveVolunteer={removeVolunteer}
            onRemovePost={removePost}
          />
        )}
        {tab === 'planning' && canPlan && (
          <PlanningGrid
            state={state}
            selectedVolunteerId={selectedVolunteerId}
            onSelectVolunteer={setSelectedVolunteerId}
            onUpdate={refresh}
            onError={showError}
          />
        )}
        {tab === 'planning' && !canPlan && (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-14 text-center">
            <LayoutGrid className="h-8 w-8 text-slate-400" />
            <p className="max-w-sm text-sm font-medium text-slate-600">
              Complétez l&apos;onglet Équipe (bénévoles et postes) pour ouvrir le planning.
            </p>
            <Btn variant="primary" onClick={() => setTab('team')}>
              Aller à l&apos;onglet Équipe
            </Btn>
          </div>
        )}
      </main>

      {toast && (
        <div
          className="fixed bottom-6 left-1/2 z-50 max-w-[min(90vw,24rem)] -translate-x-1/2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-center text-sm font-semibold text-rose-800 shadow-lg"
          role="alert"
        >
          {toast}
        </div>
      )}
    </div>
  )
}
