import { useState } from 'react'
import {
  CalendarDays,
  Church,
  Loader2,
  Megaphone,
  PenLine,
  Plus,
  ScrollText,
  X,
} from 'lucide-react'
import { generateBulletin } from '../../lib/api'
import type { BulletinResult } from '../../lib/api'

interface FormData {
  church_name: string
  service_date: string
  service_time: string
  pastor_name: string
  sermon_title: string
  scripture_reference: string
  sermon_summary: string
  announcements: string[]
  special_events: string
  prayer_requests: string
  offering_info: string
  tone: string
  denomination: string
}

const TONES = [
  'warm and welcoming',
  'formal and reverent',
  'energetic and contemporary',
  'traditional',
]

/** Shared label styling so every field is labelled the same way. */
function FieldLabel({
  htmlFor,
  children,
  optional,
}: {
  htmlFor: string
  children: React.ReactNode
  optional?: boolean
}) {
  return (
    <label htmlFor={htmlFor} className="label-caps block mb-1.5">
      {children}
      {optional && <span className="ml-1.5 normal-case text-slate-500">(optional)</span>}
    </label>
  )
}

function SectionHeader({
  icon: Icon,
  title,
  hint,
}: {
  icon: typeof Church
  title: string
  hint?: string
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0 border border-primary-100">
        <Icon className="w-4 h-4 text-primary-600" aria-hidden="true" />
      </div>
      <div>
        <h2 className="font-display text-lg text-primary-700 leading-tight">{title}</h2>
        {hint && <p className="text-xs text-ink-muted">{hint}</p>}
      </div>
    </div>
  )
}

export function BulletinForm({ onSuccess }: { onSuccess: (data: BulletinResult) => void }) {
  const [form, setForm] = useState<FormData>({
    church_name: '',
    service_date: new Date().toISOString().split('T')[0],
    service_time: '10:00 AM',
    pastor_name: '',
    sermon_title: '',
    scripture_reference: '',
    sermon_summary: '',
    announcements: [''],
    special_events: '',
    prayer_requests: '',
    offering_info: '',
    tone: 'warm and welcoming',
    denomination: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const addAnnouncement = () =>
    setForm((f) => ({ ...f, announcements: [...f.announcements, ''] }))

  const removeAnnouncement = (index: number) =>
    setForm((f) => ({ ...f, announcements: f.announcements.filter((_, i) => i !== index) }))

  const handleSubmit = async () => {
    if (!form.church_name.trim() || !form.sermon_title.trim() || !form.scripture_reference.trim()) {
      setError('Please fill in the church name, sermon title, and scripture reference.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const result = await generateBulletin({
        ...form,
        announcements: form.announcements.filter((a) => a.trim()),
      })
      onSuccess(result)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Something went wrong. Please try again.'
      if (message.includes('limit_reached')) {
        setError('Free tier limit reached. Please upgrade to continue generating bulletins.')
      } else {
        setError(message || 'Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Church details */}
      <section className="card space-y-4 animate-fade-up">
        <SectionHeader icon={Church} title="Church Details" hint="Who and where" />

        <div>
          <FieldLabel htmlFor="church-name">Church name</FieldLabel>
          <input
            id="church-name"
            name="church_name"
            placeholder="Grace Community Church"
            required
            value={form.church_name}
            onChange={(e) => set('church_name', e.target.value)}
            className="input-field"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <FieldLabel htmlFor="service-date">Service date</FieldLabel>
            <input
              id="service-date"
              name="service_date"
              type="date"
              value={form.service_date}
              onChange={(e) => set('service_date', e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <FieldLabel htmlFor="service-time">Service time</FieldLabel>
            <input
              id="service-time"
              name="service_time"
              placeholder="10:00 AM"
              value={form.service_time}
              onChange={(e) => set('service_time', e.target.value)}
              className="input-field"
            />
          </div>
        </div>

        <div>
          <FieldLabel htmlFor="pastor-name" optional>
            Pastor name
          </FieldLabel>
          <input
            id="pastor-name"
            name="pastor_name"
            placeholder="Pastor David Okafor"
            value={form.pastor_name}
            onChange={(e) => set('pastor_name', e.target.value)}
            className="input-field"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <FieldLabel htmlFor="tone">Tone</FieldLabel>
            <select
              id="tone"
              name="tone"
              value={form.tone}
              onChange={(e) => set('tone', e.target.value)}
              className="input-field"
            >
              {TONES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <FieldLabel htmlFor="denomination" optional>
              Denomination
            </FieldLabel>
            <input
              id="denomination"
              name="denomination"
              placeholder="Non-denominational"
              value={form.denomination}
              onChange={(e) => set('denomination', e.target.value)}
              className="input-field"
            />
          </div>
        </div>
      </section>

      {/* Sermon */}
      <section className="card space-y-4 animate-fade-up-slow">
        <SectionHeader
          icon={ScrollText}
          title="This Week's Message"
          hint="The heart of the bulletin"
        />

        <div>
          <FieldLabel htmlFor="sermon-title">Sermon title</FieldLabel>
          <input
            id="sermon-title"
            name="sermon_title"
            placeholder="Walking in Quiet Confidence"
            required
            value={form.sermon_title}
            onChange={(e) => set('sermon_title', e.target.value)}
            className="input-field"
          />
        </div>

        <div>
          <FieldLabel htmlFor="scripture">Scripture reference</FieldLabel>
          <input
            id="scripture"
            name="scripture_reference"
            placeholder="John 3:16-17"
            required
            value={form.scripture_reference}
            onChange={(e) => set('scripture_reference', e.target.value)}
            className="input-field"
          />
        </div>

        <div>
          <FieldLabel htmlFor="sermon-summary" optional>
            Sermon summary
          </FieldLabel>
          <textarea
            id="sermon-summary"
            name="sermon_summary"
            placeholder="A sentence or two on where the sermon is headed."
            value={form.sermon_summary}
            rows={3}
            onChange={(e) => set('sermon_summary', e.target.value)}
            className="input-field resize-none"
          />
          <p className="text-xs text-ink-muted mt-1.5">
            A sentence or two here makes the wording far more specific to your church.
          </p>
        </div>
      </section>

      {/* Announcements */}
      <section className="card space-y-4 animate-fade-up-slower">
        <SectionHeader
          icon={Megaphone}
          title="Announcements & Extras"
          hint="Written up properly, with the dates and times in place"
        />

        <fieldset className="space-y-3 border-0 p-0 m-0">
          <legend className="label-caps mb-1.5 p-0">Announcements</legend>
          {form.announcements.map((ann, i) => (
            <div key={i} className="flex items-center gap-2">
              <label htmlFor={`announcement-${i}`} className="sr-only">
                Announcement {i + 1}
              </label>
              <input
                id={`announcement-${i}`}
                name={`announcement_${i}`}
                placeholder={
                  i === 0 ? 'Youth group bake sale this Friday at 6pm' : `Announcement ${i + 1}`
                }
                value={ann}
                onChange={(e) => {
                  const updated = [...form.announcements]
                  updated[i] = e.target.value
                  set('announcements', updated)
                }}
                className="input-field"
              />
              {form.announcements.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeAnnouncement(i)}
                  aria-label={`Remove announcement ${i + 1}`}
                  className="inline-flex items-center justify-center w-11 h-11 rounded-md text-ink-muted hover:text-red-700 hover:bg-red-50 transition-colors flex-shrink-0 border border-rule"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
            </div>
          ))}
        </fieldset>

        <button
          type="button"
          onClick={addAnnouncement}
          className="inline-flex items-center gap-1.5 min-h-11 text-primary-700 text-sm font-semibold hover:text-primary-900 hover:underline transition-colors"
        >
          <Plus className="w-4 h-4" aria-hidden="true" /> Add announcement
        </button>

        <div className="grid grid-cols-1 gap-3 pt-1">
          <div>
            <FieldLabel htmlFor="special-events" optional>
              Special events
            </FieldLabel>
            <textarea
              id="special-events"
              name="special_events"
              placeholder="Fall festival on October 5th, family friendly, free entry"
              value={form.special_events}
              rows={2}
              onChange={(e) => set('special_events', e.target.value)}
              className="input-field resize-none"
            />
          </div>
          <div>
            <FieldLabel htmlFor="prayer-requests" optional>
              Prayer requests
            </FieldLabel>
            <textarea
              id="prayer-requests"
              name="prayer_requests"
              placeholder="The Henderson family, recovering after a house fire"
              value={form.prayer_requests}
              rows={2}
              onChange={(e) => set('prayer_requests', e.target.value)}
              className="input-field resize-none"
            />
          </div>
          <div>
            <FieldLabel htmlFor="offering-info" optional>
              Offering information
            </FieldLabel>
            <textarea
              id="offering-info"
              name="offering_info"
              placeholder="Giving envelopes in the pew racks, online giving at yourchurch.org/give"
              value={form.offering_info}
              rows={2}
              onChange={(e) => set('offering_info', e.target.value)}
              className="input-field resize-none"
            />
          </div>
        </div>
      </section>

      {error && (
        <div
          role="alert"
          className="bg-red-50 text-red-800 border border-red-200 rounded-xl px-4 py-3 text-sm animate-fade-in"
        >
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading}
        className="btn-primary w-full gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Generating your
            bulletin…
          </>
        ) : (
          <>
            <PenLine className="w-4 h-4" aria-hidden="true" /> Generate Bulletin
          </>
        )}
      </button>

      <p className="text-center text-xs text-ink-muted flex items-center justify-center gap-1.5">
        <CalendarDays className="w-3.5 h-3.5" aria-hidden="true" />
        Takes 15–25 seconds — uses one free credit
      </p>
    </div>
  )
}
