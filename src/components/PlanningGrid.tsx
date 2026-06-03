import { Ban, LayoutGrid } from 'lucide-react'
import { api } from '../api'
import type { EventState, Volunteer } from '../types'
import { formatSlotLabel } from '../utils/formatTime'
import { VolunteerBadge } from './VolunteerChip'

interface Props {
  state: EventState
  selectedVolunteerId: string | null
  onSelectVolunteer: (id: string | null) => void
  onUpdate: () => void
  onError: (msg: string) => void
}

export function PlanningGrid({
  state,
  selectedVolunteerId,
  onSelectVolunteer,
  onUpdate,
  onError,
}: Props) {
  const { event, timeSlots, posts, volunteers, assignments, closures } = state
  const selected = volunteers.find((v) => v.id === selectedVolunteerId)

  const isClosed = (postId: string, slotIndex: number) =>
    closures.some((c) => c.post_id === postId && c.slot_index === slotIndex)

  const isColumnClosed = (slotIndex: number) =>
    posts.length > 0 && posts.every((p) => isClosed(p.id, slotIndex))

  const getAssigned = (postId: string, slotIndex: number): Volunteer[] =>
    assignments
      .filter((a) => a.post_id === postId && a.slot_index === slotIndex)
      .map((a) => volunteers.find((v) => v.id === a.volunteer_id))
      .filter((v): v is Volunteer => Boolean(v))

  const toggleAssign = async (postId: string, slotIndex: number, volunteerId: string) => {
    try {
      await api.toggleAssignment({ volunteerId, postId, slotIndex })
      onUpdate()
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Erreur')
    }
  }

  const toggleClosure = async (postId: string, slotIndex: number) => {
    try {
      await api.toggleClosure({ postId, slotIndex })
      onUpdate()
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Erreur')
    }
  }

  const toggleColumnClosure = async (slotIndex: number) => {
    try {
      await api.toggleClosure({
        slotIndex,
        eventId: event.id,
        scope: 'column',
      })
      onUpdate()
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Erreur')
    }
  }

  const handleCell = async (postId: string, slotIndex: number) => {
    if (isClosed(postId, slotIndex)) {
      await toggleClosure(postId, slotIndex)
      return
    }
    if (!selectedVolunteerId) {
      await toggleClosure(postId, slotIndex)
      return
    }
    const assigned = getAssigned(postId, slotIndex)
    const already = assigned.find((v) => v.id === selectedVolunteerId)
    if (already) {
      await toggleAssign(postId, slotIndex, selectedVolunteerId)
      return
    }
    await toggleAssign(postId, slotIndex, selectedVolunteerId)
  }

  const gridStyle = {
    gridTemplateColumns: `minmax(7.5rem, 9.5rem) repeat(${timeSlots.length}, minmax(4.75rem, 1fr))`,
  } as React.CSSProperties

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-14 text-center">
        <LayoutGrid className="h-8 w-8 text-slate-400" />
        <p className="text-sm font-medium text-slate-600">
          Ajoutez des postes dans l&apos;onglet Équipe.
        </p>
      </div>
    )
  }

  if (volunteers.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-14 text-center">
        <LayoutGrid className="h-8 w-8 text-slate-400" />
        <p className="text-sm font-medium text-slate-600">
          Ajoutez des bénévoles dans l&apos;onglet Équipe.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <p className="mb-3 text-sm font-medium leading-relaxed text-slate-600">
          {selected ? (
            <>
              <strong style={{ color: selected.color }}>{selected.name}</strong>
              {' '}
              : touchez une case pour l&apos;affecter.
            </>
          ) : (
            <>
              Sans sélection : touchez une case ou un horaire pour indiquer{' '}
              <span className="font-semibold text-slate-500">pas de bénévoles</span>{' '}
              (cellule grisée).
            </>
          )}
        </p>
        <div className="flex flex-wrap gap-2">
          {volunteers.map((v) => (
            <VolunteerBadge
              key={v.id}
              volunteer={v}
              picker
              selected={selectedVolunteerId === v.id}
              onSelect={() =>
                onSelectVolunteer(selectedVolunteerId === v.id ? null : v.id)
              }
            />
          ))}
        </div>
      </div>

      <div className="-mx-1 overflow-x-auto pb-1">
        <div
          className="inline-grid min-w-full gap-px rounded-xl border border-slate-200 bg-slate-200 p-px text-xs"
          style={gridStyle}
        >
          <div className="sticky left-0 z-10 flex items-center rounded-tl-lg bg-slate-50 px-2 py-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
            Poste
          </div>
          {timeSlots.map((t, i) => {
            const colClosed = isColumnClosed(i)
            return (
              <button
                key={`h-${i}`}
                type="button"
                className={`flex min-h-[2.5rem] items-center justify-center px-1 py-2 text-center text-[11px] font-bold leading-tight transition sm:text-xs ${
                  colClosed
                    ? 'bg-slate-200 text-slate-500'
                    : 'bg-indigo-50 text-indigo-900 hover:bg-indigo-100'
                } ${!selectedVolunteerId && !colClosed ? 'ring-1 ring-inset ring-indigo-200' : ''}`}
                title={
                  selectedVolunteerId
                    ? t
                    : `${t} : toucher pour griser toute la colonne (pas de bénévoles)`
                }
                disabled={!!selectedVolunteerId}
                onClick={() => !selectedVolunteerId && void toggleColumnClosure(i)}
              >
                {formatSlotLabel(t)}
              </button>
            )
          })}

          {posts.flatMap((post) => [
            <div
              key={`${post.id}-l`}
              className="sticky left-0 z-10 flex min-h-[3.25rem] flex-col justify-center gap-0.5 rounded-l-lg bg-white px-2 py-2"
            >
              <span className="text-[13px] font-bold leading-snug text-slate-900 break-words">
                {post.name}
              </span>
              <span className="text-[10px] font-semibold text-slate-500">
                min. {post.required_count}
              </span>
            </div>,
            ...timeSlots.map((_, slotIndex) => {
              const closed = isClosed(post.id, slotIndex)
              const assigned = getAssigned(post.id, slotIndex)
              const metMinimum =
                !closed && assigned.length >= post.required_count
              const understaffed =
                !closed && assigned.length < post.required_count
              const canAdd =
                !closed &&
                selectedVolunteerId &&
                !assigned.some((v) => v.id === selectedVolunteerId)

              return (
                <button
                  key={`${post.id}-${slotIndex}`}
                  type="button"
                  className={`relative flex min-h-[3.25rem] min-w-0 flex-col gap-0.5 bg-white p-1 text-left transition ${
                    closed
                      ? 'bg-slate-100 hover:bg-slate-200/80'
                      : metMinimum
                        ? 'bg-emerald-50/60'
                        : understaffed
                          ? 'bg-amber-50/80'
                          : canAdd
                            ? 'ring-2 ring-inset ring-indigo-300 hover:bg-indigo-50/50'
                            : 'hover:bg-slate-50'
                  }`}
                  onClick={() => void handleCell(post.id, slotIndex)}
                  title={
                    closed
                      ? 'Pas de bénévoles : toucher pour réactiver'
                      : selectedVolunteerId
                        ? 'Affecter la personne sélectionnée'
                        : 'Marquer : pas de bénévoles'
                  }
                >
                  {closed ? (
                    <span className="flex h-full w-full items-center justify-center text-slate-400">
                      <Ban className="h-4 w-4" aria-hidden />
                      <span className="sr-only">Fermé</span>
                    </span>
                  ) : (
                    <>
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        {assigned.map((v) => (
                          <VolunteerBadge
                            key={v.id}
                            volunteer={v}
                            inCell
                            onSelect={() => void toggleAssign(post.id, slotIndex, v.id)}
                          />
                        ))}
                      </div>
                      <span
                        className={`self-end text-[9px] font-bold tabular-nums ${
                          metMinimum ? 'text-emerald-600' : 'text-amber-600'
                        }`}
                      >
                        {assigned.length}/{post.required_count}
                      </span>
                    </>
                  )}
                </button>
              )
            }),
          ])}
        </div>
      </div>
    </div>
  )
}
