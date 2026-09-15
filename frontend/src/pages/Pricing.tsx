import { Link } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'
import { Navbar } from '../components/layout/Navbar'
import { Footer } from '../components/layout/Footer'

const FREE_FEATURES = [
  '3 complete bulletin generations',
  'PDF bulletin download',
  'Announcement slides content',
  'Social media posts',
  'Email newsletter copy',
]

const PAID_FEATURES = [
  'Unlimited bulletin generations',
  'PDF bulletin download',
  'Announcement slides content',
  'Social media posts (Facebook + Instagram)',
  'Email newsletter (subject + body)',
  'Bulletin history \u2014 access past bulletins',
  'Priority support',
  'Cancel anytime',
]

export default function Pricing() {
  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <main id="main-content" className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <p className="label-caps mb-2">Pricing</p>
          <h1 className="font-display text-4xl text-primary-950 mb-3">Simple pricing</h1>
          <p className="text-slate-600">No tiers, no add-ons, no surprises.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto items-stretch">
          {/* Free */}
          <div className="card flex flex-col">
            <div className="mb-6">
              <p className="label-caps mb-1.5">Free</p>
              <p className="font-display text-4xl text-primary-950">$0</p>
              <p className="text-sm text-slate-600 mt-1">No credit card required</p>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {FREE_FEATURES.map((f) => (
                <li
                  key={f}
                  className="flex items-start gap-2 text-sm text-slate-700"
                >
                  <CheckCircle
                    className="w-4 h-4 text-primary-600 flex-shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  {f}
                </li>
              ))}
            </ul>
            <Link to="/signup" className="btn-secondary w-full">
              Start free
            </Link>
          </div>

          {/* Paid */}
          <div
            className="relative bg-primary-950 bg-mesh-dark text-white rounded-2xl p-6 shadow-lift flex flex-col overflow-hidden"
          >
            <p className="absolute top-5 right-5 text-xs font-bold tracking-wider px-3 py-1 rounded-full bg-gold-400 text-primary-950">
              MOST POPULAR
            </p>
            <div className="mb-6">
              <p className="label-caps-on-dark mb-1.5">Monthly</p>
              <p className="font-display text-4xl text-white">$19</p>
              <p className="text-primary-200 mt-1">per month, cancel anytime</p>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {PAID_FEATURES.map((f) => (
                <li
                  key={f}
                  className="flex items-start gap-2 text-sm text-primary-100"
                >
                  <CheckCircle
                    className="w-4 h-4 text-gold-400 flex-shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  {f}
                </li>
              ))}
            </ul>
            <Link to="/signup" className="btn-primary w-full">
              Start free, upgrade later
            </Link>
          </div>
        </div>

        <p className="text-center text-slate-600 text-sm mt-10">
          Prices in USD. Churches outside the US, UK, CA, and AU may qualify for regional pricing
          —{' '}
          <a
            href="mailto:hello@churchpress.ai"
            className="underline text-primary-700"
          >
            contact us
          </a>
          .
        </p>
      </main>
      <Footer />
    </div>
  )
}