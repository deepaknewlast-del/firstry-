import type { Config } from 'tailwindcss'

/**
 * ChurchPress design system.
 *
 * Built with the `ui-ux-pro-max` skill — style: "Editorial Grid / Magazine"
 * (print-inspired, low complexity, accessibility risk: low), typography:
 * "Classic Elegant" (Playfair Display + Inter), pattern: Hero + Testimonials + CTA.
 * Persisted at `design-system/churchpress/MASTER.md`.
 *
 * Design intent: this is a *print studio for the local church*. It should read
 * like something a designer set by hand for a specific congregation — warm
 * parchment, liturgical plum ink, gold foil, and real physical depth. No
 * gradient-washed startup palette, no sparkle icons, no "AI" vocabulary.
 *
 * Every text/background pair below is verified against WCAG AA (4.5:1):
 *   #241528 on #FBF7F0 = 16.21   white on #632F6D = 9.73
 *   #5B4A5E on #FBF7F0 =  7.60   white on #8A6114 = 5.53
 *   #4E2456 on #FBF7F0 = 11.50   #D9A93B on #1E0D22 = 8.53
 *   #8B4F96 on #FBF7F0 =  5.38   #E2D0E4 on #1E0D22 = 12.66
 *
 * Shade contract — the ramp is split by *where a shade may be used*:
 *   50-300   light tints, for text/icons on the deep panels (primary-950)
 *   400-700  text and icons on paper and card surfaces
 *   400 is the lightest text-safe step on paper — it does NOT work on
 *   the deep panels, where 200/300 must be used instead.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'Times New Roman', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Liturgical plum — deep, inky, hand-mixed. Not electric violet.
        primary: {
          50: '#faf6fa',
          100: '#f2e9f3',
          200: '#e2d0e4', // text on deep panels
          300: '#c9aecd', // secondary text on deep panels
          400: '#8b4f96', // lightest text-safe step on paper
          500: '#7d3e88',
          600: '#632f6d', // primary button fill
          700: '#4e2456', // headings
          800: '#3d1c44',
          900: '#2e1433',
          950: '#1e0d22', // deep panel surface
        },
        // Gold foil — the accent that carries the primary action.
        gold: {
          50: '#fdf9ef',
          100: '#faf0d7',
          200: '#f2dfac',
          300: '#e8c97d',
          400: '#d9a93b', // foil on deep panels
          500: '#c08f22',
          600: '#a87a16',
          700: '#8a6114', // CTA fill under white text
          800: '#6e4c12',
          900: '#573c11',
        },
        // Warm paper, like an actual printed bulletin.
        cream: '#fbf7f0',
        parchment: '#fffdf9',
        paper: '#fbf7f0',
        ink: {
          DEFAULT: '#241528',
          muted: '#5b4a5e',
        },
        // Rules and edges, drawn from the plum ink.
        rule: {
          light: '#ece3e6',
          DEFAULT: '#ded0d8',
          strong: '#c9aecd',
        },
      },
      // Print-like radius: paper is squared off, buttons stay tactile.
      borderRadius: {
        none: '0',
        sm: '3px',
        DEFAULT: '4px',
        md: '6px',
        lg: '8px',
        xl: '10px',
        '2xl': '14px',
        '3xl': '20px',
        pill: '9999px',
      },
      /**
       * Depth system. Every elevated surface gets a light top edge and a soft
       * drop shadow, which is what makes a flat rectangle read as pressed
       * paper or a raised gold seal rather than a web card.
       */
      boxShadow: {
        // Raised paper / cards
        paper: '0 1px 0 rgba(255,255,255,0.9) inset, 0 1px 2px rgba(36,21,40,0.06), 0 8px 20px -8px rgba(36,21,40,0.16)',
        raised:
          '0 1px 0 rgba(255,255,255,0.9) inset, 0 -1px 0 rgba(36,21,40,0.05) inset, 0 2px 4px rgba(36,21,40,0.08), 0 10px 22px -10px rgba(36,21,40,0.20)',
        'raised-hover':
          '0 1px 0 rgba(255,255,255,0.95) inset, 0 -1px 0 rgba(36,21,40,0.05) inset, 0 4px 8px rgba(36,21,40,0.10), 0 18px 34px -12px rgba(36,21,40,0.24)',
        // Debossed / inset (pressed states, wells, inputs on paper)
        pressed: 'inset 0 2px 5px rgba(36,21,40,0.18), inset 0 1px 1px rgba(36,21,40,0.12)',
        deboss: 'inset 0 1px 3px rgba(36,21,40,0.10)',
        // Gold foil seal — highlight on top, shadow beneath, warm glow
        foil: '0 1px 0 rgba(255,255,255,0.45) inset, 0 -1px 1px rgba(87,60,17,0.35) inset, 0 2px 5px rgba(138,97,20,0.35)',
        'foil-lg':
          '0 1px 0 rgba(255,255,255,0.5) inset, 0 -1px 1px rgba(87,60,17,0.4) inset, 0 4px 10px rgba(138,97,20,0.4), 0 12px 24px -8px rgba(138,97,20,0.3)',
        // Deep panel lift
        'panel-lg': '0 24px 50px -18px rgba(30,13,34,0.5)',
        // Aliases the app already referenced
        sm: '0 1px 2px rgba(36,21,40,0.06)',
        md: '0 2px 4px rgba(36,21,40,0.08), 0 10px 22px -10px rgba(36,21,40,0.20)',
        lg: '0 4px 8px rgba(36,21,40,0.10), 0 18px 34px -12px rgba(36,21,40,0.24)',
        xl: '0 24px 50px -18px rgba(30,13,34,0.5)',
        delicate: '0 1px 2px rgba(36,21,40,0.06)',
        soft: '0 2px 4px rgba(36,21,40,0.08), 0 10px 22px -10px rgba(36,21,40,0.20)',
        card: '0 1px 0 rgba(255,255,255,0.9) inset, 0 1px 2px rgba(36,21,40,0.06), 0 8px 20px -8px rgba(36,21,40,0.16)',
        'card-hover':
          '0 1px 0 rgba(255,255,255,0.95) inset, 0 4px 8px rgba(36,21,40,0.10), 0 18px 34px -12px rgba(36,21,40,0.24)',
        lift: '0 2px 4px rgba(36,21,40,0.08), 0 10px 22px -10px rgba(36,21,40,0.20)',
        'lift-hover':
          '0 4px 8px rgba(36,21,40,0.10), 0 18px 34px -12px rgba(36,21,40,0.24)',
        focus: '0 0 0 3px rgba(139,79,150,0.35)',
      },
      zIndex: {
        base: '0',
        raised: '10',
        sticky: '20',
        overlay: '30',
        dropdown: '40',
        modal: '50',
        toast: '60',
      },
      backgroundImage: {
        // Faint laid-paper striations — barely visible, adds physical texture.
        'paper-grain':
          'repeating-linear-gradient(0deg, rgba(36,21,40,0.014) 0px, rgba(36,21,40,0.014) 1px, transparent 1px, transparent 3px)',
        // Deep panel: warm vignette rather than a neon mesh.
        'panel-deep':
          'radial-gradient(120% 100% at 50% 0%, rgba(99,47,109,0.55) 0%, transparent 60%), linear-gradient(180deg, #25102a 0%, #1e0d22 60%, #180a1c 100%)',
        // Gold foil sheen for the seal and the primary CTA.
        foil: 'linear-gradient(135deg, #e8c97d 0%, #d9a93b 32%, #a87a16 62%, #d9a93b 100%)',
        'foil-soft':
          'linear-gradient(160deg, rgba(217,169,59,0.16) 0%, rgba(138,97,20,0.05) 55%, transparent 100%)',
      },
      transitionTimingFunction: {
        entrance: 'cubic-bezier(0.34, 1.3, 0.64, 1)',
        exit: 'cubic-bezier(0.4, 0, 1, 1)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 380ms cubic-bezier(0.34, 1.3, 0.64, 1) both',
        'fade-in': 'fade-in 280ms ease both',
        shimmer: 'shimmer 1.8s infinite',
      },
    },
  },
  plugins: [],
} satisfies Config
