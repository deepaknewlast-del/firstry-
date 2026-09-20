import { useState } from 'react'
import {
  CheckCircle,
  Copy,
  Download,
  Facebook,
  FileText,
  Instagram,
  Mail,
  Plus,
  Presentation,
  Share2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import type { BulletinResult } from '../../lib/api'

type Tab = 'bulletin' | 'slides' | 'social' | 'email'

const TABS: { id: Tab; label: string; icon: typeof FileText; panel: string }[] = [
  { id: 'bulletin', label: 'Bulletin', icon: FileText, panel: 'panel-bulletin' },
  { id: 'slides', label: 'Slides', icon: Presentation, panel: 'panel-slides' },
  { id: 'social', label: 'Social', icon: Share2, panel: 'panel-social' },
  { id: 'email', label: 'Email', icon: Mail, panel: 'panel-email' },
]

/** Icon-only buttons still need a real 44px hit area and an accessible name. */
function CopyButton({
  label,
  onClick,
  copied,
}: {
  label: string
  onClick: () => void
  copied: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex items-center justify-center gap-1.5 min-h-11 px-3 rounded-md text-sm font-medium text-primary-700 border border-primary-200 bg-white hover:bg-primary-50 hover:border-primary-300 transition-colors flex-shrink-0"
    >
      {copied ? (
        <CheckCircle className="w-4 h-4" aria-hidden="true" />
      ) : (
        <Copy className="w-4 h-4" aria-hidden="true" />
      )}
      Copy
    </button>
  )
}

/**
 * The generated bulletin, as it will print. The PDF is rendered inline, so what
 * the church sees on screen is the file they hand out — same artwork, same
 * lettering — instead of a plain-text copy of it.
 */
const PAGE_LABELS = ['Cover', 'Inside spread']

function DesignedBulletin({
  pdfUrl,
  previewUrls,
}: {
  pdfUrl: string
  previewUrls?: string[]
}) {
  // Rendered page images are preferred: they load on phones, where a PDF in a
  // frame shows nothing at all. Older bulletins have no images, so the PDF
  // stays as the fallback.
  if (previewUrls && previewUrls.length > 0) {
    return (
      <div className="max-w-3xl space-y-6">
        {previewUrls.map((url, i) => (
          <figure key={url} className="m-0">
            <a href={url} target="_blank" rel="noopener noreferrer" className="block">
              <img
                src={url}
                alt={`Your bulletin — ${PAGE_LABELS[i] ?? `page ${i + 1}`}`}
                className="w-full rounded-2xl border border-primary-100 shadow-paper bg-white"
              />
            </a>
            <figcaption className="label-caps text-[10px] mt-2">
              {PAGE_LABELS[i] ?? `Page ${i + 1}`}
            </figcaption>
          </figure>
        ))}
        <p className="text-xs text-ink-muted">
          This is the PDF, page for page. Tap a page to see it full size, or use{' '}
          <span className="font-semibold">Download PDF</span> above to print it.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl">
      <div className="rounded-2xl border border-primary-100 shadow-paper overflow-hidden bg-white">
        <iframe
          src={`${pdfUrl}#view=FitH`}
          title="Your bulletin, ready to print"
          className="w-full h-[74vh] min-h-[520px] block border-0"
        />
      </div>
      <p className="text-xs text-ink-muted mt-3">
        Two pages, sized for a folded half-letter bulletin.{' '}
        <a
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-primary-700"
        >
          Open full screen
        </a>
      </p>
    </div>
  )
}

/** Designed view (the real PDF) or the plain text, for copying into anything. */
function BulletinViewSwitch({
  view,
  onChange,
}: {
  view: 'designed' | 'text'
  onChange: (v: 'designed' | 'text') => void
}) {
  const options: { id: 'designed' | 'text'; label: string }[] = [
    { id: 'designed', label: 'Designed bulletin' },
    { id: 'text', label: 'Text only' },
  ]
  return (
    <div className="flex flex-wrap gap-1 bg-primary-50 p-1 rounded-xl w-fit mb-5 border border-primary-100">
      {options.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          aria-pressed={view === id}
          onClick={() => onChange(id)}
          className={`min-h-11 px-4 rounded-lg text-sm font-medium transition-colors ${
            view === id
              ? 'bg-white text-primary-800 shadow-sm'
              : 'text-slate-600 hover:text-primary-800'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

export function BulletinPreview({
  result,
  onReset,
}: {
  result: BulletinResult
  onReset: () => void
}) {
  const [tab, setTab] = useState<Tab>('bulletin')
  const [view, setView] = useState<'designed' | 'text'>('designed')
  const [copied, setCopied] = useState<string | null>(null)
  const { content, pdf_url, preview_urls } = result

  const copyToClipboard = async (text: string, what: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(what)
    toast.success('Copied!')
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="animate-fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <p className="eyebrow flex items-center gap-1.5 mb-2">
            <CheckCircle className="w-3.5 h-3.5" aria-hidden="true" /> Ready to publish
          </p>
          <h1 className="font-display text-3xl text-primary-700">Your bulletin is ready</h1>
          <p className="text-ink-muted text-sm mt-1">Read it over, change anything, then print.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={onReset} className="btn-secondary gap-2">
            <Plus className="w-4 h-4" aria-hidden="true" /> New bulletin
          </button>
          {pdf_url && (
            <a
              href={pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary gap-2"
            >
              <Download className="w-4 h-4" aria-hidden="true" /> Download PDF
            </a>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Bulletin outputs"
        className="flex flex-wrap gap-1 bg-white p-1 rounded-xl w-fit mb-6 border border-primary-100 shadow-sm"
      >
        {TABS.map(({ id, label, icon: Icon, panel }) => {
          const selected = tab === id
          return (
            <button
              key={id}
              type="button"
              role="tab"
              id={`tab-${id}`}
              aria-selected={selected}
              aria-controls={panel}
              onClick={() => setTab(id)}
              className={`inline-flex items-center gap-1.5 min-h-11 px-4 rounded-lg text-sm font-medium transition-colors ${
                selected
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-primary-800 hover:bg-primary-50'
              }`}
            >
              <Icon className="w-4 h-4" aria-hidden="true" />
              {label}
            </button>
          )
        })}
      </div>

      {/* Bulletin — the designed PDF, or the text behind it */}
      {tab === 'bulletin' && (
        <div role="tabpanel" id="panel-bulletin" aria-labelledby="tab-bulletin">
          {pdf_url && <BulletinViewSwitch view={view} onChange={setView} />}

          {pdf_url && view === 'designed' ? (
            <DesignedBulletin pdfUrl={pdf_url} previewUrls={preview_urls} />
          ) : (
          <div className="bg-parchment rounded-2xl border border-rule-light shadow-paper max-w-2xl px-6 sm:px-8 py-10">
          <header className="text-center pb-5 mb-6 border-b border-primary-100">
            <h2 className="font-display text-2xl sm:text-3xl text-primary-800">
              {content.bulletin.header}
            </h2>
            <p className="text-ink-muted text-sm mt-3 leading-relaxed">
              {content.bulletin.welcome_message}
            </p>
          </header>

          <section className="mb-6">
            <h3 className="label-caps mb-3">Order of Service</h3>
            <ul className="space-y-1.5">
              {content.bulletin.order_of_service.map((item, i) => (
                <li key={i} className="text-sm text-slate-700 flex gap-2.5">
                  <span className="text-primary-600 mt-0.5" aria-hidden="true">
                    &bull;
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="mb-6">
            <h3 className="label-caps mb-3">Today&rsquo;s Message</h3>
            <p className="font-display text-xl text-primary-800">
              {content.bulletin.sermon_section.title}
            </p>
            <p className="text-primary-700 italic mt-0.5">
              {content.bulletin.sermon_section.scripture_reference}
            </p>
            <ul className="list-disc pl-5 mt-3 space-y-1.5 marker:text-primary-500">
              {content.bulletin.sermon_section.key_points.map((point, i) => (
                <li key={i} className="text-sm text-slate-700">
                  {point}
                </li>
              ))}
            </ul>
          </section>

          <section className="mb-6">
            <h3 className="label-caps mb-3">Announcements</h3>
            <ul className="space-y-2.5">
              {content.bulletin.announcements.map((a, i) => (
                <li key={i} className="text-sm text-slate-700 flex gap-2.5 leading-relaxed">
                  <span className="text-primary-600 mt-0.5" aria-hidden="true">
                    &bull;
                  </span>
                  {a}
                </li>
              ))}
            </ul>
          </section>

          {content.bulletin.prayer_requests && (
            <section className="mb-6">
              <h3 className="label-caps mb-3">Prayer Requests</h3>
              <p className="text-sm text-slate-700 leading-relaxed">
                {content.bulletin.prayer_requests}
              </p>
            </section>
          )}

          {content.bulletin.offering_info && (
            <section className="mb-6">
              <h3 className="label-caps mb-3">Giving</h3>
              <p className="text-sm text-slate-700 leading-relaxed">
                {content.bulletin.offering_info}
              </p>
            </section>
          )}

          <p className="text-sm text-slate-700 italic text-center pt-5 border-t border-primary-100">
            {content.bulletin.closing_thought}
          </p>

          <div className="flex justify-center mt-6">
            <CopyButton
              label="Copy the full bulletin"
              copied={copied === 'bulletin'}
              onClick={() =>
                copyToClipboard(
                  [
                    content.bulletin.header,
                    '',
                    content.bulletin.welcome_message,
                    '',
                    'ORDER OF SERVICE',
                    ...content.bulletin.order_of_service.map((i) => `- ${i}`),
                    '',
                    `SERMON: ${content.bulletin.sermon_section.title}`,
                    content.bulletin.sermon_section.scripture_reference,
                    ...content.bulletin.sermon_section.key_points.map((p) => `- ${p}`),
                    '',
                    'ANNOUNCEMENTS',
                    ...content.bulletin.announcements.map((a) => `- ${a}`),
                  ].join('\n'),
                  'bulletin'
                )
              }
            />
          </div>
          </div>
          )}
        </div>
      )}

      {/* Slides */}
      {tab === 'slides' && (
        <div
          role="tabpanel"
          id="panel-slides"
          aria-labelledby="tab-slides"
          className="grid sm:grid-cols-2 gap-4"
        >
          {content.announcement_slides.map((slide) => (
            <div
              key={slide.slide_number}
              className="relative overflow-hidden panel-deep rounded-2xl p-6 aspect-video flex flex-col justify-center shadow-panel-lg"
            >
              <p className="text-xs label-caps-on-dark mb-2">
                Slide {slide.slide_number} — {slide.type}
              </p>
              <h3 className="font-display text-xl text-white mb-2">{slide.headline}</h3>
              <p className="text-primary-100 leading-relaxed text-sm">{slide.body}</p>
            </div>
          ))}
          <div className="sm:col-span-2 flex justify-center">
            <CopyButton
              label="Copy all slide content"
              copied={copied === 'slides'}
              onClick={() =>
                copyToClipboard(
                  content.announcement_slides
                    .map((s) => `SLIDE ${s.slide_number}\n${s.headline}\n${s.body}`)
                    .join('\n\n'),
                  'slides'
                )
              }
            />
          </div>
        </div>
      )}

      {/* Social */}
      {tab === 'social' && (
        <div
          role="tabpanel"
          id="panel-social"
          aria-labelledby="tab-social"
          className="space-y-6 max-w-2xl"
        >
          {[
            {
              key: 'facebook' as const,
              label: 'Facebook',
              icon: Facebook,
              color: 'text-[#1558c0]',
              bg: 'bg-[#1558c0]/10',
            },
            {
              key: 'instagram' as const,
              label: 'Instagram',
              icon: Instagram,
              color: 'text-[#c1275c]',
              bg: 'bg-[#c1275c]/10',
            },
          ].map(({ key, label, icon: Icon, color, bg }) => (
            <div key={key} className="card">
              <div className="flex items-center justify-between mb-3 gap-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${color}`} aria-hidden="true" />
                  </div>
                  <h3 className="font-display text-lg text-primary-800">{label}</h3>
                </div>
                <CopyButton
                  label={`Copy the ${label} post`}
                  copied={copied === key}
                  onClick={() => copyToClipboard(content.social_post[key], key)}
                />
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-cream rounded-xl p-4 border border-primary-100">
                {content.social_post[key]}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Email */}
      {tab === 'email' && (
        <div
          role="tabpanel"
          id="panel-email"
          aria-labelledby="tab-email"
          className="bg-parchment rounded-2xl border border-rule-light shadow-paper overflow-hidden max-w-2xl"
        >
          <div className="bg-cream border-b border-primary-100 px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="label-caps mb-1">Subject</p>
                <p className="font-display text-lg text-primary-800">
                  {content.email_newsletter.subject_line}
                </p>
              </div>
              <CopyButton
                label="Copy the subject line"
                copied={copied === 'subject'}
                onClick={() =>
                  copyToClipboard(content.email_newsletter.subject_line, 'subject')
                }
              />
            </div>
            <div className="mt-4 pt-4 border-t border-primary-100">
              <p className="label-caps mb-1">Preview text</p>
              <p className="text-sm text-ink-muted">
                {content.email_newsletter.preview_text}
              </p>
            </div>
          </div>

          <div className="px-6 py-5">
            <div className="flex items-center justify-between gap-4 mb-4">
              <p className="label-caps">Body</p>
              <CopyButton
                label="Copy the email body"
                copied={copied === 'body'}
                onClick={() => copyToClipboard(content.email_newsletter.body, 'body')}
              />
            </div>
            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
              {content.email_newsletter.body}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
