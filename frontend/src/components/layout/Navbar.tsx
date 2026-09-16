import { Link, useLocation } from 'react-router-dom'
import { FileText, LayoutDashboard, LogOut, Clock, Settings, PenLine } from 'lucide-react'
import { Logo } from '../brand/Logo'
import { useAuth } from '../../hooks/useAuth'
import { useSubscription } from '../../hooks/useSubscription'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/generate', label: 'Generate', icon: FileText },
  { to: '/history', label: 'History', icon: Clock },
  { to: '/account', label: 'Account', icon: Settings },
]

export function Navbar() {
  const { user, signOut } = useAuth()
  const { isPaid, loading: subLoading } = useSubscription()
  const location = useLocation()
  const showUpgrade = Boolean(user) && !subLoading && !isPaid

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <header className="sticky top-0 z-sticky bg-parchment/90 backdrop-blur-xl border-b border-rule-light">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link
          to={user ? '/dashboard' : '/'}
          aria-label="ChurchPress home"
          className="flex items-center min-h-11 transition-transform duration-200 hover:-translate-y-px"
        >
          <Logo size={36} />
        </Link>

        {user ? (
          <nav aria-label="Main" className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
              const active = location.pathname === to
              return (
                <Link
                  key={to}
                  to={to}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-1.5 text-sm min-h-11 px-3.5 rounded-lg transition-colors ${
                    active
                      ? 'bg-primary-50 text-primary-800 font-semibold'
                      : 'text-ink-muted hover:text-primary-800 hover:bg-primary-50'
                  }`}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" /> {label}
                </Link>
              )
            })}

            <Link
              to="/generate"
              className="ml-2 flex items-center gap-1.5 text-sm font-semibold min-h-11 bg-primary-600 text-white px-4 rounded-md transition-all duration-150 hover:bg-primary-500 shadow-md border border-primary-800/30"
            >
              <PenLine className="w-4 h-4" aria-hidden="true" /> New bulletin
            </Link>

            {showUpgrade && (
              <Link
                to="/pricing"
                className="ml-1.5 flex items-center text-sm font-semibold min-h-11 px-4 rounded-md btn-gold"
              >
                Upgrade
              </Link>
            )}

            <button
              type="button"
              onClick={handleSignOut}
              aria-label="Sign out"
              title="Sign out"
              className="flex items-center justify-center w-11 h-11 text-ink-muted hover:text-red-700 rounded-lg hover:bg-red-50 transition-colors ml-1"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
            </button>
          </nav>
        ) : (
          <nav aria-label="Main" className="flex items-center gap-1 sm:gap-2">
            <Link
              to="/pricing"
              className="text-sm text-ink-muted hover:text-primary-800 min-h-11 inline-flex items-center px-3 rounded-lg hover:bg-primary-50 transition-colors"
            >
              Pricing
            </Link>
            <Link
              to="/login"
              className="text-sm text-ink-muted hover:text-primary-800 min-h-11 inline-flex items-center px-3 rounded-lg hover:bg-primary-50 transition-colors"
            >
              Sign in
            </Link>
            <Link to="/signup" className="btn-primary text-sm px-5">
              Start free
            </Link>
          </nav>
        )}
      </div>

      {user && (
        <nav
          aria-label="Main, mobile"
          className="md:hidden flex items-center gap-2 px-4 pb-3 overflow-x-auto"
        >
          {NAV_ITEMS.map(({ to, label }) => {
            const active = location.pathname === to
            return (
              <Link
                key={to}
                to={to}
                aria-current={active ? 'page' : undefined}
                className={`text-sm min-h-11 inline-flex items-center px-3.5 rounded-lg whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-primary-50 text-primary-800 font-semibold'
                    : 'text-ink-muted hover:text-primary-800 hover:bg-primary-50'
                }`}
              >
                {label}
              </Link>
            )
          })}
          {showUpgrade && (
            <Link
              to="/pricing"
              className="text-sm font-semibold min-h-11 inline-flex items-center px-3.5 rounded-lg whitespace-nowrap btn-gold"
            >
              Upgrade
            </Link>
          )}
        </nav>
      )}
    </header>
  )
}
