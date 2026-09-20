import { useState } from 'react'
import artContemporary from '../../assets/bulletin/contemporary-cover.jpg'
import artFormal from '../../assets/bulletin/formal-cover.jpg'
import artTraditional from '../../assets/bulletin/traditional-cover.jpg'
import artWarm from '../../assets/bulletin/warm-cover.jpg'
import '../../styles/bulletin-cover.css'

/**
 * The bulletin cover, live.
 *
 * Mirrors backend/services/pdf_service.py — the same artwork, veil, palette and
 * faces — so a church sees what it is actually buying when it types its name,
 * picks a colour, or uploads a logo. Kept deliberately close to that file: if
 * the printed cover changes, this has to change with it.
 */
export type CoverTone = 'traditional' | 'formal' | 'warm' | 'contemporary'

const TONES: {
  id: CoverTone
  label: string
  art: string
  ground: string
  tagline: string
  ornament: string
}[] = [
  {
    id: 'traditional',
    label: 'Traditional',
    art: artTraditional,
    ground: '#0d1a2b',
    ornament: '\u2726',
    tagline: '\u201cI was glad when they said unto me, let us go into the house of the Lord.\u201d',
  },
  {
    id: 'formal',
    label: 'Formal & reverent',
    art: artFormal,
    ground: '#1c0f1e',
    ornament: '\u271d',
    tagline: '\u201cHoly, holy, holy is the Lord of hosts; the whole earth is full of his glory.\u201d',
  },
  {
    id: 'warm',
    label: 'Warm & welcoming',
    art: artWarm,
    ground: '#1d2a1a',
    ornament: '\u2767',
    tagline: '\u201cCome to me, all who labor and are heavy laden, and I will give you rest.\u201d',
  },
  {
    id: 'contemporary',
    label: 'Energetic & contemporary',
    art: artContemporary,
    ground: '#0b141c',
    ornament: '\u2014',
    tagline: 'A place to belong. A place to believe.',
  },
]

const GOLD = '#d7b463'

function rgbTriplet(hex: string): string {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = parseInt(full, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].join(', ')
}

function channelLuminance(v: number): number {
  const s = v / 255
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}

function luminance(hex: string): number {
  const [r, g, b] = rgbTriplet(hex).split(',').map((s) => Number(s.trim()))
  return 0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b)
}

/**
 * Dark accents become the page ground, exactly as the PDF does it: gold
 * lettering needs a dark page, and a church's colour has to be visible or the
 * setting means nothing.
 */
function asGround(hex: string): string {
  if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) return '#1d2a1a'
  const lum = luminance(hex)
  if (lum <= 0.22) return hex
  const k = (0.16 / Math.max(lum, 1e-6)) ** (1 / 2.2)
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  return (
    '#' +
    [0, 2, 4]
      .map((i) =>
        Math.max(0, Math.min(255, Math.round(parseInt(full.slice(i, i + 2), 16) * k)))
          .toString(16)
          .padStart(2, '0')
      )
      .join('')
  )
}

/** The tone picker on its own, for laying out beside the cover. */
export function CoverTonePicker({
  value,
  onChange,
}: {
  value: CoverTone
  onChange: (tone: CoverTone) => void
}) {
  return (
    <div>
      <p className="label-caps text-[10px] mb-1.5">See it in each tone</p>
      <div className="flex flex-wrap gap-1.5">
        {TONES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            aria-pressed={value === t.id}
            className={`min-h-11 px-3 rounded-md text-xs font-medium border transition-colors ${
              value === t.id
                ? 'border-primary-700 bg-white text-primary-800'
                : 'border-rule bg-cream text-slate-600 hover:text-primary-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-ink-muted mt-2">
        You choose the tone when you generate — this only previews them.
      </p>
    </div>
  )
}

export function BulletinCoverPreview({
  churchName,
  accentColor,
  logoSrc,
  tone,
  onToneChange,
  showTonePicker = true,
  className = '',
}: {
  churchName: string
  accentColor: string
  logoSrc?: string | null
  tone?: CoverTone
  onToneChange?: (tone: CoverTone) => void
  showTonePicker?: boolean
  className?: string
}) {
  const [ownTone, setOwnTone] = useState<CoverTone>('traditional')
  const active = tone ?? ownTone
  const theme = TONES.find((t) => t.id === active) ?? TONES[0]
  const ground = asGround(accentColor)
  // A light accent would vanish against dark artwork, so it becomes the
  // lettering colour instead — same rule as the PDF.
  const gold = luminance(accentColor) >= 0.62 ? accentColor : GOLD

  const setTone = (t: CoverTone) => {
    setOwnTone(t)
    onToneChange?.(t)
  }

  return (
    <div className={className}>
      <div
        className={`bcover bcover-tone-${theme.id} rounded-xl border border-rule shadow-paper`}
        style={
          {
            backgroundColor: ground,
            backgroundImage: `url(${theme.art})`,
            '--ground-rgb': rgbTriplet(ground),
            '--gold': gold,
          } as React.CSSProperties
        }
      >
        <div className="bcover-veil" aria-hidden="true" />
        <div className="bcover-shade" aria-hidden="true" />
        <div className="bcover-frame" aria-hidden="true" />
        <div className="bcover-frame-in" aria-hidden="true" />

        <div className="bcover-body">
          {logoSrc && <img src={logoSrc} alt="" className="bcover-logo" />}
          <p className="bcover-kick">Sunday Worship</p>
          <h3 className="bcover-name">{churchName.trim() || 'Your Church'}</h3>
          <div className="bcover-rule">
            <span>{theme.ornament}</span>
          </div>
          <p className="bcover-tag">{theme.tagline}</p>
          <p className="bcover-when">
            Sunday{' '}
            <span className="bcover-sep" aria-hidden="true">
              &bull;
            </span>{' '}
            10:30 AM
          </p>
        </div>
      </div>

      {showTonePicker && (
        <div className="mt-3">
          <CoverTonePicker value={active} onChange={setTone} />
        </div>
      )}
    </div>
  )
}
