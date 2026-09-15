import { Link } from 'react-router-dom'
import { ArrowRight, CalendarDays, Clock, FileText, Gift, Lock, Plus } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { Navbar } from '../components/layout/Navbar'
import { useBulletins } from '../hooks/useBulletins'
import { useSubscription } from '../hooks/useSubscription'
import { createCheckout } from '../lib/api'

export default function Dashboard() {
  const { bulletins, loading } = useBulletins()
  const { profile, isPaid, isAtFreeLimit, freeUsed } = useSubscription()

  const handleUpgrade = async () => {
    try {
      await createCheckout()
    } catch {
      toast.error('Could not start checkout. Please try again.')
    }
  }

  const thisMonth = bulletins.filter(
    (b) => new Date(b.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  ).length

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <main id="main-content" className="max-w-4xl mx-auto px-4 py-10">
        {/* Header - breathable layout */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <p className="eyebrow mb-1">Dashboard</p>
            <h1 className="font-display text-2xl text-primary-700">
              {profile?.church_name || 'Welcome back'}
            </h1>
            <p className="text-ink-muted text-sm mt-1">
              {isPaid ? (
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" aria-hidden="true" />
                  Active subscription
                </span>
              ) : (
                `Free tier — ${freeUsed}/3 bulletins used`
              )}
            </p>
          </div>
          {isAtFreeLimit ? (
            <button
              onClick={handleUpgrade}
              className="btn-gold flex items-center gap-2 text-sm"
            >
              <Lock className="w-4 h-4" /> Upgrade — $19/mo
            </button>
          ) : (
            <Link
              to="/generate"
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" /> New Bulletin
            </Link>
          )}
        </div>

        {/* Upgrade banner - intentional, not panic-inducing */}
        {!isPaid && (
          <div className="rounded-2xl bg-gold-50 border border-gold-200 p-5 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Gift className="w-5 h-5 text-gold-700 flex-shrink-0" aria-hidden="true" />
              <div>
                <p className="font-semibold text-primary-900">
                  {isAtFreeLimit ? 'Free limit reached' : `${3 - freeUsed} free bulletin${3 - freeUsed === 1 ? '' : 's'} remaining`}
                </p>
                <p className="text-xs text-ink-muted">
                  Upgrade for $19/month — unlimited bulletins, cancel anytime
                </p>
              </div>
            </div>
            <button
              onClick={handleUpgrade}
              className="btn-primary text-sm font-semibold px-5 py-2.5 rounded-xl hover:opacity-95 transition-all flex-shrink-0"
            >
              Upgrade
            </button>
          </div>
        )}

        {/* Stats - balanced, not cramped */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 stagger">
          {[
            { icon: FileText, label: 'Bulletins generated', value: profile?.bulletins_generated_total ?? 0 },
            { icon: CalendarDays, label: 'This month', value: thisMonth },
            { icon: Clock, label: 'Hours saved', value: Math.round((profile?.bulletins_generated_total ?? 0) * 2.5) },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="card card-hover text-center p-6">
              <Icon className="w-6 h-6 text-primary-600 mx-auto mb-4" aria-hidden="true" />
              <p className="font-display text-2xl text-primary-800">{value}</p>
              <p className="text-ink-muted text-sm">{label}</p>
            </div>
          ))}
        </div>

        {/* Recent bulletins - clean, readable */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl text-primary-700">Recent bulletins</h2>
          {bulletins.length > 0 && (
            <Link
              to="/history"
              className="text-primary-700 font-medium hover:underline min-h-11 inline-flex items-center"
            >
              View all
            </Link>
          )}
        </div>
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-primary-100 animate-shimmer" />
            ))}
          </div>
        ) : bulletins.length === 0 ? (
          <div className="card text-center py-14">
            <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mx-auto mb-4 border border-primary-100">
              <FileText className="w-6 h-6 text-primary-600" aria-hidden="true" />
            </div>
            <p className="text-primary-800 font-display text-lg">No bulletins yet.</p>
            <p className="text-ink-muted text-sm mt-1 mb-5">
              Your first one takes about 2 minutes.
            </p>
            <Link
              to="/generate"
              className="btn-primary inline-flex items-center gap-2 text-sm"
            >
              Generate your first bulletin <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {bulletins.slice(0, 5).map((b) => (
              <Link
                key={b.id}
                to="/history"
                className="card card-hover flex items-center justify-between py-4 group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0 border border-primary-100">
                    <FileText className="w-5 h-5 text-primary-600" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-medium text-primary-800 text-sm group-hover:text-primary-600 transition-colors">
                      {b.title}
                    </p>
                    <p className="text-ink-muted text-xs mt-0.5">
                      {format(new Date(b.service_date), 'MMMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <ArrowRight
                  className="w-4 h-4 text-primary-600 group-hover:translate-x-0.5 transition-transform"
                  aria-hidden="true"
                />
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}