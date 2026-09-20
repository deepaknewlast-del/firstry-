import { Copy, CheckCircle, Facebook, Instagram, Mail } from 'lucide-react'
import {
  asGround,
  coverTheme,
  type CoverTone,
  rgbTriplet,
} from './BulletinCoverPreview'
import type { GeneratedContent } from '../../lib/api'

/**
 * The three taps a church actually publishes with — the projector slides, the
 * social posts, the email newsletter.
 *
 * All of them carry the bulletin's own design: the tone's artwork, the church's
 * colour as the ground, gold accents. Before this they were plain text blocks
 * sitting beside a designed PDF.
 */
export type BulletinDesign = {
  tone: CoverTone
  accentColor: string
  churchName: string
}

function ArtPanel({
  design,
  className = '',
  veil = 0.72,
  children,
}: {
  design: BulletinDesign
  className?: string
  veil?: number
  children: React.ReactNode
}) {
  const theme = coverTheme(design.tone)
  const ground = asGround(design.accentColor || theme.ground)
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={
        {
          backgroundColor: ground,
          backgroundImage: `url(${theme.art})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          '--ground-rgb': rgbTriplet(ground),
        } as React.CSSProperties
      }
    >
      <div
        className="absolute inset-0"
        style={{ backgroundColor: `rgba(${rgbTriplet(ground)}, ${veil})` }}
        aria-hidden="true"
      />
      <div className="relative">{children}</div>
    </div>
  )
}

function PanelCopyButton({
  label,
  text,
  copied,
  onCopy,
}: {
  label: string
  text: string
  copied: boolean
  onCopy: (text: string, what: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onCopy(text, label)}
      aria-label={label}
      className="inline-flex items-center gap-1.5 min-h-11 px-3 rounded-md text-sm font-medium text-primary-700 border border-primary-200 bg-white hover:bg-primary-50 transition-colors flex-shrink-0"
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

export function SlidesPanel({
  content,
  design,
  copied,
  onCopy,
}: {
  content: GeneratedContent
  design: BulletinDesign
  copied: string | null
  onCopy: (text: string, what: string) => void
}) {
  const all = content.announcement_slides
    .map((s) => `SLIDE ${s.slide_number}\n${s.headline}\n${s.body}`)
    .join('\n\n')

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {content.announcement_slides.map((slide) => (
        <ArtPanel
          key={slide.slide_number}
          design={design}
          veil={0.78}
          className="rounded-2xl shadow-panel-lg aspect-video flex items-center"
        >
          <div className="p-6 sm:p-7">
            <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-amber-200/85 mb-2.5">
              {slide.type}
            </p>
            <h3 className="font-display text-xl sm:text-2xl text-[#f8f4ea] mb-2 leading-snug">
              {slide.headline}
            </h3>
            <p className="text-sm leading-relaxed text-[#f8f4ea]/80">{slide.body}</p>
          </div>
        </ArtPanel>
      ))}
      <div className="sm:col-span-2 flex items-center justify-between gap-4 flex-wrap">
        <p className="text-xs text-ink-muted">
          Project these as they are, or paste the text into your own slide deck.
        </p>
        <PanelCopyButton
          label="Copy all slide content"
          text={all}
          copied={copied === 'Copy all slide content'}
          onCopy={onCopy}
        />
      </div>
    </div>
  )
}

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('') || 'CP'
  )
}

export function SocialPanel({
  content,
  design,
  copied,
  onCopy,
}: {
  content: GeneratedContent
  design: BulletinDesign
  copied: string | null
  onCopy: (text: string, what: string) => void
}) {
  const networks = [
    { key: 'facebook' as const, label: 'Facebook', Icon: Facebook, tint: 'text-[#1558c0]' },
    { key: 'instagram' as const, label: 'Instagram', Icon: Instagram, tint: 'text-[#c1275c]' },
  ]

  return (
    <div className="space-y-5 max-w-2xl">
      {networks.map(({ key, label, Icon, tint }) => (
        <article key={key} className="card">
          <header className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-full bg-primary-700 text-white flex items-center justify-center font-display text-sm font-bold">
              {initials(design.churchName)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-primary-800 truncate">
                {design.churchName || 'Your Church'}
              </p>
              <p className="text-xs text-ink-muted flex items-center gap-1.5">
                <Icon className={`w-3.5 h-3.5 ${tint}`} aria-hidden="true" />
                {label} post · ready to paste
              </p>
            </div>
            <PanelCopyButton
              label={`Copy the ${label} post`}
              text={content.social_post[key]}
              copied={copied === `Copy the ${label} post`}
              onCopy={onCopy}
            />
          </header>
          <p className="text-[15px] text-slate-700 whitespace-pre-wrap leading-relaxed border-l-2 border-primary-200 pl-4">
            {content.social_post[key]}
          </p>
        </article>
      ))}
      <p className="text-xs text-ink-muted">
        Post these with a photo, or with your bulletin cover as the image.
      </p>
    </div>
  )
}

export function EmailPanel({
  content,
  design,
  copied,
  onCopy,
}: {
  content: GeneratedContent
  design: BulletinDesign
  copied: string | null
  onCopy: (text: string, what: string) => void
}) {
  const { subject_line, preview_text, body } = content.email_newsletter

  return (
    <div className="max-w-2xl rounded-2xl border border-rule-light shadow-paper overflow-hidden bg-parchment">
      {/* mail client header */}
      <div className="bg-cream border-b border-primary-100 px-5 py-4 flex items-center gap-2.5">
        <Mail className="w-4 h-4 text-primary-600" aria-hidden="true" />
        <p className="label-caps text-[10px]">Your newsletter</p>
      </div>

      {/* the email itself, starting with the church's banner */}
      <ArtPanel design={design} veil={0.66} className="px-6 py-7 text-center">
        <p className="font-display text-2xl text-[#f8f4ea]">
          {design.churchName || 'Your Church'}
        </p>
        <p className="text-[10px] tracking-[0.3em] uppercase text-amber-200/80 mt-2">
          This Sunday &bull; 10:30 AM
        </p>
      </ArtPanel>

      <div className="px-6 py-5 border-b border-primary-100">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="label-caps mb-1">Subject</p>
            <p className="font-display text-lg text-primary-800">{subject_line}</p>
          </div>
          <PanelCopyButton
            label="Copy the subject line"
            text={subject_line}
            copied={copied === 'Copy the subject line'}
            onCopy={onCopy}
          />
        </div>
        <div className="mt-4 pt-4 border-t border-primary-100">
          <p className="label-caps mb-1">Preview text</p>
          <p className="text-sm text-ink-muted">{preview_text}</p>
        </div>
      </div>

      <div className="px-6 py-5">
        <div className="flex items-center justify-between gap-4 mb-4">
          <p className="label-caps">Body</p>
          <PanelCopyButton
            label="Copy the email body"
            text={body}
            copied={copied === 'Copy the email body'}
            onCopy={onCopy}
          />
        </div>
        <p className="text-[15px] text-slate-700 whitespace-pre-wrap leading-relaxed">
          {body}
        </p>
      </div>
    </div>
  )
}
