import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle, Chrome } from 'lucide-react'
import toast from 'react-hot-toast'
import { TurnstileWidget, hasTurnstileSiteKey } from '../components/auth/TurnstileWidget'
import { Logo } from '../components/brand/Logo'
import { useAuth } from '../hooks/useAuth'

const VALUE_PROPS = [
  'Three complete bulletins free, no card needed',
  'PDF, slides, social posts, and email in one sitting',
  'Ready before your coffee finishes brewing',
]

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [captchaToken, setCaptchaToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)
  const [done, setDone] = useState(false)
  const { signUp, signInWithGoogle } = useAuth()
  const captchaEnabled = hasTurnstileSiteKey()
  const handleCaptchaExpire = useCallback(() => setCaptchaToken(''), [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    if (captchaEnabled && !captchaToken) {
      toast.error('Please complete the security check')
      return
    }
    setLoading(true)
    try {
      await signUp(email, password, captchaToken || undefined)
      setDone(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Signup failed'
      toast.error(message)
      setCaptchaToken('')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setOauthLoading(true)
    try {
      await signInWithGoogle()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not start Google sign-in'
      toast.error(message)
      setOauthLoading(false)
    }
  }

  if (done)
    return (
      <main
        id="main-content"
        className="min-h-screen bg-cream flex items-center justify-center px-4"
      >
        <div className="card max-w-sm w-full text-center animate-fade-up">
          <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-rule-strong">
            <CheckCircle className="w-7 h-7 text-primary-700" aria-hidden="true" />
          </div>
          <h1 className="font-display text-2xl text-primary-700 mb-2">Check your email</h1>
          <p className="text-slate-600 text-sm leading-relaxed">
            We sent a confirmation link to{' '}
            <strong className="text-primary-900">{email}</strong>. Click it to activate your
            account.
          </p>
        </div>
      </main>
    )

  return (
    <div className="min-h-screen bg-cream flex">
      {/* Brand panel */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] panel-deep p-12">
        <Link to="/" aria-label="ChurchPress home">
          <Logo size={42} onDark />
        </Link>

        <div>
          <h2 className="font-display text-2xl sm:text-3xl leading-snug mb-6 text-white">
            Sunday&rsquo;s bulletin,
            <br />
            handled in minutes.
          </h2>
          <ul className="space-y-3.5">
            {VALUE_PROPS.map((point) => (
              <li key={point} className="flex items-start gap-2.5 text-primary-100 text-sm">
                <CheckCircle
                  className="w-4 h-4 text-gold-400 flex-shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                {point}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-primary-200/80 text-xs">© {new Date().getFullYear()} ChurchPress</p>
      </div>

      {/* Form panel */}
      <main
        id="main-content"
        className="flex-1 flex flex-col items-center justify-center px-4 py-12"
      >
        <Link to="/" aria-label="ChurchPress home" className="lg:hidden mb-8">
          <Logo size={40} />
        </Link>

        <div className="card w-full max-w-sm animate-fade-up">
          <p className="eyebrow mb-2">Start free</p>
          <h1 className="font-display text-3xl text-primary-700 mb-2">Create your account</h1>
          <p className="text-sm text-ink-muted mb-7">No credit card needed. Ever.</p>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={oauthLoading}
            className="btn-secondary w-full flex items-center justify-center gap-2 mb-5"
          >
            <Chrome className="w-4 h-4" aria-hidden="true" />
            {oauthLoading ? 'Opening Google…' : 'Continue with Google'}
          </button>

          <div className="flex items-center gap-3 mb-5" aria-hidden="true">
            <div className="h-px bg-rule flex-1" />
            <span className="text-xs text-slate-500">or</span>
            <div className="h-px bg-rule flex-1" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="signup-email" className="label-caps block mb-1.5">
                Email
              </label>
              <input
                id="signup-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@yourchurch.org"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label htmlFor="signup-password" className="label-caps block mb-1.5">
                Password
              </label>
              <input
                id="signup-password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="8+ characters"
                required
                minLength={8}
                aria-describedby="signup-password-hint"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
              />
              <p id="signup-password-hint" className="text-xs text-slate-600 mt-1.5">
                At least 8 characters.
              </p>
            </div>

            <TurnstileWidget
              action="signup"
              onVerify={setCaptchaToken}
              onExpire={handleCaptchaExpire}
            />

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Creating account…' : 'Create free account'}
            </button>
          </form>

          <p className="text-xs text-slate-600 text-center mt-5">
            By signing up you agree to our{' '}
            <Link to="/terms" className="underline text-primary-700">
              Terms
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="underline text-primary-700">
              Privacy Policy
            </Link>
            .
          </p>
          <p className="text-sm text-slate-600 text-center mt-3">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-700 font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
