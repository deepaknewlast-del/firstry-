import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, Loader2 } from 'lucide-react'
import type { Paddle, PaddleEventData } from '@paddle/paddle-js'
import { initializePaddle } from '@paddle/paddle-js'
import { Navbar } from '../components/layout/Navbar'
import { Footer } from '../components/layout/Footer'
import { useAuth } from '../hooks/useAuth'
import { getClientCountry } from '../lib/paddle'

// ─── Fail loudly if Paddle env vars are missing ───────────────────────────
const PADDLE_ENV = import.meta.env.VITE_PADDLE_ENVIRONMENT as 'production' | 'sandbox' | undefined
const PADDLE_TOKEN = import.meta.env.VITE_PADDLE_CLIENT_TOKEN as string | undefined

if (!PADDLE_ENV) throw new Error('[Paddle] VITE_PADDLE_ENVIRONMENT is not set. Check your .env file.')
if (!PADDLE_TOKEN) throw new Error('[Paddle] VITE_PADDLE_CLIENT_TOKEN is not set. Check your .env file.')

// ─── Tier definitions — easy to edit ────────────────────────────────────
export interface Tier {
  name: string
  description: string
  features: string[]
  badge?: string
  highlight?: boolean
  priceId: {
    month: string
    year: string
  }
}

const TIERS: Tier[] = [
  {
    name: 'Pro',
    description: 'For growing congregations that generate weekly.',
    badge: 'MOST POPULAR',
    highlight: true,
    features: [
      'Unlimited bulletin generations',
      'PDF bulletin download',
      'Announcement slides content',
      'Social media posts (Facebook + Instagram)',
      'Email newsletter (subject + body)',
      'Bulletin history — access past bulletins',
      'Priority support',
      'Cancel anytime',
    ],
    priceId: {
      month: 'pri_01m3280xqyymmf75vrc3vfyw1w',
      year: 'pri_01m3280yc9fvksz3vwgn91gx5j',
    },
  },
]

// ─── Component ────────────────────────────────────────────────────────────
export default function Pricing() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [billing, setBilling] = useState<'month' | 'year'>('month')
  const paddleRef = useRef<Paddle | null>(null)

  // prices[priceId] = formattedTotal string
  const [prices, setPrices] = useState<Record<string, string>>({})
  const [priceLoading, setPriceLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [debugError, setDebugError] = useState<string | null>(null)

  // ── Initialize Paddle once ──────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    async function setup() {
      const country = await getClientCountry() // undefined = Paddle auto-detects

      console.log('[Paddle] init env:', PADDLE_ENV, '| token prefix:', PADDLE_TOKEN?.slice(0, 12))

      let paddle: Paddle | undefined
      try {
        paddle = await initializePaddle({
          environment: PADDLE_ENV!,
          token: PADDLE_TOKEN!,
          eventCallback(event: PaddleEventData) {
            if (event.name === 'checkout.completed') {
              navigate('/welcome')
            }
          },
        })
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error('[Paddle] initializePaddle failed:', err)
        if (!cancelled) setDebugError(`Paddle init failed: ${msg}`)
        setPriceLoading(false)
        return
      }

      if (cancelled || !paddle) {
        if (!cancelled) setDebugError('Paddle returned undefined — token or environment may be wrong.')
        setPriceLoading(false)
        return
      }
      paddleRef.current = paddle

      // ── Fetch localized prices for all tiers and both billing cycles ──
      const allPriceIds = TIERS.flatMap((t) => [t.priceId.month, t.priceId.year]).filter(
        (id) => !id.includes('PLACEHOLDER')
      )

      if (allPriceIds.length === 0) {
        setPriceLoading(false)
        return
      }

      try {
        const preview = await paddle.PricePreview({
          items: allPriceIds.map((priceId) => ({ priceId, quantity: 1 })),
          ...(country ? { address: { countryCode: country } } : {}),
        })

        const map: Record<string, string> = {}
        for (const item of preview.data.details.lineItems) {
          // Use Paddle's already-formatted total — no custom math
          map[item.price.id] = item.formattedTotals.total
        }
        if (!cancelled) setPrices(map)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error('[Paddle] PricePreview failed:', err)
        if (!cancelled) setDebugError(`PricePreview failed: ${msg}`)
      } finally {
        if (!cancelled) setPriceLoading(false)
      }
    }

    setup()
    return () => {
      cancelled = true
    }
  }, [navigate])

  // ── Subscribe handler ───────────────────────────────────────────────────
  const handleSubscribe = (tier: Tier) => {
    const priceId = billing === 'month' ? tier.priceId.month : tier.priceId.year
    if (priceId.includes('PLACEHOLDER') || !paddleRef.current) return

    setCheckoutLoading(priceId)
    paddleRef.current.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      settings: {
        displayMode: 'overlay',
        variant: 'one-page',
        successUrl: `${window.location.origin}/welcome`,
      },
      customer: user?.email ? { email: user.email } : undefined,
      // Sent back on every webhook entity so the backend can attribute the
      // payment to this account server-side.
      customData: user?.id ? { user_id: user.id } : undefined,
    })
    // Reset loading after a moment (Paddle takes over UI)
    setTimeout(() => setCheckoutLoading(null), 1500)
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />

      {/* DEBUG BANNER — remove after fixing */}
      {debugError && (
        <div className="bg-red-600 text-white text-sm px-4 py-3 text-center font-mono">
          ⚠️ Paddle Error: {debugError}
        </div>
      )}
      <main id="main-content" className="flex-1 max-w-6xl mx-auto w-full px-4 py-16">

        {/* Header */}
        <div className="text-center mb-10">
          <p className="label-caps mb-2">Pricing</p>
          <h1 className="font-display text-4xl text-primary-950 mb-3">
            Simple, honest pricing
          </h1>
          <p className="text-slate-600">
            Pick the plan that fits your church. Localized pricing shown for your region.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex items-center gap-1 bg-white border border-slate-200 rounded-full p-1 shadow-sm">
            <button
              id="billing-toggle-monthly"
              onClick={() => setBilling('month')}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                billing === 'month'
                  ? 'bg-primary-950 text-white shadow'
                  : 'text-slate-600 hover:text-primary-950'
              }`}
            >
              Monthly
            </button>
            <button
              id="billing-toggle-yearly"
              onClick={() => setBilling('year')}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                billing === 'year'
                  ? 'bg-primary-950 text-white shadow'
                  : 'text-slate-600 hover:text-primary-950'
              }`}
            >
              Yearly
              <span className="ml-1.5 text-xs font-bold text-gold-600">Save ~15%</span>
            </button>
          </div>
        </div>

        {/* Tier cards */}
        <div className="flex justify-center">
          {TIERS.map((tier) => {
            const priceId = billing === 'month' ? tier.priceId.month : tier.priceId.year
            const isPlaceholder = priceId.includes('PLACEHOLDER')
            const formattedPrice = prices[priceId]
            const isCheckingOut = checkoutLoading === priceId

            return (
              <div
                key={tier.name}
                id={`tier-${tier.name.toLowerCase()}`}
                className={`relative flex flex-col rounded-2xl p-8 overflow-hidden transition-all w-full max-w-sm ${
                  tier.highlight
                    ? 'bg-primary-950 bg-mesh-dark text-white shadow-lift'
                    : 'card'
                }`}
              >
                {/* Badge */}
                {tier.badge && (
                  <p className="absolute top-5 right-5 text-xs font-bold tracking-wider px-3 py-1 rounded-full bg-gold-400 text-primary-950">
                    {tier.badge}
                  </p>
                )}

                {/* Tier name + description */}
                <div className="mb-6">
                  <p className={`label-caps mb-1.5 ${tier.highlight ? 'text-primary-300' : ''}`}>
                    {tier.name}
                  </p>
                  <p className={`text-sm mt-1 ${tier.highlight ? 'text-primary-200' : 'text-slate-500'}`}>
                    {tier.description}
                  </p>

                  {/* Price display */}
                  <div className="mt-4 min-h-[3rem] flex items-baseline gap-1">
                    {priceLoading && !isPlaceholder ? (
                      <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                    ) : isPlaceholder ? (
                      <span className={`font-display text-2xl ${tier.highlight ? 'text-primary-300' : 'text-slate-400'}`}>
                        Coming soon
                      </span>
                    ) : formattedPrice ? (
                      <>
                        <span className={`font-display text-4xl font-bold ${tier.highlight ? 'text-white' : 'text-primary-950'}`}>
                          {formattedPrice}
                        </span>
                        <span className={`text-sm ${tier.highlight ? 'text-primary-300' : 'text-slate-500'}`}>
                          /{billing === 'month' ? 'mo' : 'yr'}
                        </span>
                      </>
                    ) : (
                      <span className={`font-display text-2xl ${tier.highlight ? 'text-primary-300' : 'text-slate-400'}`}>
                        —
                      </span>
                    )}
                  </div>
                </div>

                {/* Feature list */}
                <ul className="space-y-3 mb-8 flex-1">
                  {tier.features.map((f) => (
                    <li key={f} className={`flex items-start gap-2 text-sm ${tier.highlight ? 'text-primary-100' : 'text-slate-700'}`}>
                      <CheckCircle
                        className={`w-4 h-4 flex-shrink-0 mt-0.5 ${tier.highlight ? 'text-gold-400' : 'text-primary-600'}`}
                        aria-hidden="true"
                      />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA button */}
                {isPlaceholder ? (
                  <button
                    id={`subscribe-${tier.name.toLowerCase()}-disabled`}
                    disabled
                    className={`w-full py-3 rounded-xl text-sm font-semibold opacity-50 cursor-not-allowed border ${
                      tier.highlight
                        ? 'border-primary-600 text-primary-300'
                        : 'border-slate-300 text-slate-400'
                    }`}
                  >
                    Coming soon
                  </button>
                ) : (
                  <button
                    id={`subscribe-${tier.name.toLowerCase()}`}
                    onClick={() => handleSubscribe(tier)}
                    disabled={isCheckingOut}
                    className={`w-full flex items-center justify-center gap-2 ${
                      tier.highlight ? 'btn-primary' : tier.badge === 'BEST VALUE' ? 'btn-gold' : 'btn-secondary'
                    }`}
                  >
                    {isCheckingOut && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isCheckingOut ? 'Opening checkout…' : 'Subscribe'}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer note */}
        <p className="text-center text-slate-500 text-sm mt-10">
          Prices shown in your local currency. Taxes may apply.
          Questions?{' '}
          <a href="mailto:hello@churchbulletin.in" className="underline text-primary-700">
            Contact us
          </a>
          .
        </p>
      </main>
      <Footer />
    </div>
  )
}
