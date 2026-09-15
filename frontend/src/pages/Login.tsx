import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Star } from 'lucide-react'
import toast from 'react-hot-toast'
import { Logo } from '../components/brand/Logo'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await signIn(email, password)
      navigate('/dashboard')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid email or password'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream flex">
      {/* Brand panel */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] panel-deep p-12">
        <Link to="/" aria-label="ChurchPress home">
          <Logo size={42} onDark />
        </Link>

        <div>
          <div className="flex gap-1 mb-6" aria-label="Rated 5 out of 5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-gold-400 text-gold-400" aria-hidden="true" />
            ))}
          </div>
          <blockquote className="font-display text-2xl sm:text-3xl leading-snug mb-6 m-0 text-white">
            &ldquo;I used to spend 2 hours every Saturday night on the bulletin. Now it takes 10
            minutes.&rdquo;
          </blockquote>
          <p className="text-primary-200 text-sm">
            Sandra W. — Church Secretary, First Baptist Church, Texas
          </p>
        </div>

        <p className="text-primary-200/80 text-xs">
          © {new Date().getFullYear()} ChurchPress
        </p>
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
          <p className="eyebrow mb-2">Welcome back</p>
          <h1 className="font-display text-3xl text-primary-700 mb-2">Sign in</h1>
          <p className="text-sm text-ink-muted mb-7">
            Pick up where you left off and keep Sunday running smooth.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="label-caps block mb-1.5">
                Email
              </label>
              <input
                id="login-email"
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
              <label htmlFor="login-password" className="label-caps block mb-1.5">
                Password
              </label>
              <input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Your password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="text-sm text-slate-600 text-center mt-6">
            No account?{' '}
            <Link to="/signup" className="text-primary-700 font-semibold hover:underline">
              Start free
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
