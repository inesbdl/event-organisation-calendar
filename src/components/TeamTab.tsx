import { MapPin, Plus, Trash2, UserPlus } from 'lucide-react'
import type { EventState } from '../types'
import { VolunteerBadge } from './VolunteerChip'
import { Btn, Card, CardTitle, Input, Label } from './ui'

interface Props {
  state: EventState
  volunteerName: string
  postName: string
  postCount: number
  onVolunteerName: (v: string) => void
  onPostName: (v: string) => void
  onPostCount: (v: number) => void
  onAddVolunteer: (e: React.FormEvent) => void
  onAddPost: (e: React.FormEvent) => void
  onRemoveVolunteer: (id: string) => void
  onRemovePost: (id: string) => void
}

export function TeamTab({
  state,
  volunteerName,
  postName,
  postCount,
  onVolunteerName,
  onPostName,
  onPostCount,
  onAddVolunteer,
  onAddPost,
  onRemoveVolunteer,
  onRemovePost,
}: Props) {
  const { volunteers, posts } = state

  return (
    <div className="space-y-5">
      <p className="text-sm font-medium leading-relaxed text-slate-600">
        Ajoutez d&apos;abord votre équipe et les postes à couvrir, puis passez à l&apos;onglet
        Planning pour placer chaque bénévole sur le tableau.
      </p>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardTitle icon={<UserPlus className="h-5 w-5 text-indigo-600" />}>
            Bénévoles
          </CardTitle>
          <form onSubmit={onAddVolunteer} className="mb-4 flex flex-col gap-3 sm:flex-row">
            <Input
              value={volunteerName}
              onChange={(e) => onVolunteerName(e.target.value)}
              placeholder="Prénom et nom"
              className="flex-1"
            />
            <Btn type="submit" variant="primary" className="shrink-0 sm:px-5">
              <Plus className="h-4 w-4" />
              Ajouter
            </Btn>
          </form>
          {volunteers.length === 0 ? (
            <p className="py-6 text-center text-sm font-medium text-slate-500">
              Aucun bénévole pour l&apos;instant.
            </p>
          ) : (
            <ul className="space-y-2">
              {volunteers.map((v) => (
                <li
                  key={v.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2"
                >
                  <VolunteerBadge volunteer={v} />
                  <Btn
                    variant="ghost"
                    className="h-9 px-3 text-rose-600 hover:border-rose-200 hover:bg-rose-50"
                    onClick={() => onRemoveVolunteer(v.id)}
                    aria-label={`Retirer ${v.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Btn>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardTitle icon={<MapPin className="h-5 w-5 text-indigo-600" />}>Postes</CardTitle>
          <form onSubmit={onAddPost} className="mb-4 space-y-3">
            <Input
              value={postName}
              onChange={(e) => onPostName(e.target.value)}
              placeholder="Ex. Stand, Buvette…"
            />
            <Label>
              Minimum de personnes par créneau
              <Input
                type="number"
                min={1}
                max={20}
                value={postCount}
                onChange={(e) => onPostCount(Number(e.target.value))}
              />
            </Label>
            <Btn type="submit" variant="primary" className="w-full">
              <Plus className="h-4 w-4" />
              Ajouter le poste
            </Btn>
          </form>
          {posts.length === 0 ? (
            <p className="py-6 text-center text-sm font-medium text-slate-500">
              Aucun poste pour l&apos;instant.
            </p>
          ) : (
            <ul className="space-y-2">
              {posts.map((p) => (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-[15px] font-bold leading-snug text-slate-900 break-words">
                      {p.name}
                    </p>
                    <p className="text-xs font-semibold text-slate-500">
                      min. {p.required_count} personne{p.required_count > 1 ? 's' : ''} / créneau
                    </p>
                  </div>
                  <Btn
                    variant="ghost"
                    className="h-9 px-3 text-rose-600 hover:border-rose-200 hover:bg-rose-50"
                    onClick={() => onRemovePost(p.id)}
                    aria-label={`Supprimer ${p.name}`}
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
