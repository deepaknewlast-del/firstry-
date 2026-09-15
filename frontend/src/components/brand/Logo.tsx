import { useId } from 'react'

/**
 * ChurchPress brand mark.
 *
 * Hand-set rather than assembled from an icon library: an open book (the Word,
 * and the bulletin itself) beneath a cross, struck inside a gold seal with an
 * inner engraved rule. Drawn on a 48-unit grid so it stays crisp from a 24px
 * favicon up to a hero.
 */
export function LogoMark({
  size = 40,
  title = 'ChurchPress',
  className = '',
}: {
  size?: number
  title?: string
  className?: string
}) {
  const uid = useId().replace(/:/g, '')
  const foil = `foil-${uid}`
  const sheen = `sheen-${uid}`

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role="img"
      aria-label={title}
      className={className}
      style={{ filter: 'drop-shadow(0 2px 3px rgba(36,21,40,0.28))' }}
    >
      <defs>
        {/* Foil runs light-to-dark-to-light, the way stamped metal catches a room. */}
        <linearGradient id={foil} x1="12%" y1="0%" x2="88%" y2="100%">
          <stop offset="0%" stopColor="#f0d99b" />
          <stop offset="30%" stopColor="#d9a93b" />
          <stop offset="62%" stopColor="#a87a16" />
          <stop offset="100%" stopColor="#e2c377" />
        </linearGradient>
        {/* Catching light across the top-left of the seal. */}
        <linearGradient id={sheen} x1="0%" y1="0%" x2="60%" y2="70%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="55%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Seal */}
      <circle cx="24" cy="24" r="22.5" fill={`url(#${foil})`} />
      <circle cx="24" cy="24" r="22.5" fill={`url(#${sheen})`} />
      <circle cx="24" cy="24" r="22.5" fill="none" stroke="#6e4c12" strokeWidth="0.75" />

      {/* Inner engraved rule */}
      <circle
        cx="24"
        cy="24"
        r="18.75"
        fill="none"
        stroke="#3d1c44"
        strokeWidth="1"
        strokeOpacity="0.42"
      />

      {/* Cross */}
      <g stroke="#2a0e2f" strokeWidth="2.1" strokeLinecap="round">
        <line x1="24" y1="12.2" x2="24" y2="23.4" />
        <line x1="20.6" y1="16.6" x2="27.4" y2="16.6" />
      </g>

      {/* Open book — two leaves meeting at the spine */}
      <path
        d="M13.6 29.1c3.5-2.5 7.2-2.5 10.4-0.7 3.2-1.8 6.9-1.8 10.4 0.7v5.6c-3.5-2.3-7.2-2.3-10.4-0.5-3.2-1.8-6.9-1.8-10.4 0.5z"
        fill="#2a0e2f"
      />
      {/* Spine + the light falling on the gutter */}
      <line x1="24" y1="28.6" x2="24" y2="34.2" stroke="#e8c97d" strokeWidth="0.9" />
      {/* Page striations, cut out of the ink */}
      <g stroke="#d9a93b" strokeWidth="0.55" strokeOpacity="0.75" strokeLinecap="round">
        <line x1="16.6" y1="30.7" x2="21.4" y2="30.7" />
        <line x1="16.6" y1="32.5" x2="21.4" y2="32.5" />
        <line x1="26.6" y1="30.7" x2="31.4" y2="30.7" />
        <line x1="26.6" y1="32.5" x2="31.4" y2="32.5" />
      </g>
    </svg>
  )
}

/**
 * Mark + wordmark. `onDark` swaps the wordmark colours for the deep panels,
 * where the plum ink would disappear.
 */
export function Logo({
  size = 40,
  onDark = false,
  className = '',
}: {
  size?: number
  onDark?: boolean
  className?: string
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} title="ChurchPress" />
      <span
        className={`font-display tracking-tight leading-none ${
          size >= 36 ? 'text-xl' : 'text-lg'
        } ${onDark ? 'text-white' : 'text-primary-950'}`}
      >
        Church
        <span className={onDark ? 'text-gold-400' : 'text-gold-700'}>Press</span>
      </span>
    </span>
  )
}
