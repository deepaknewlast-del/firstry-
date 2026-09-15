import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail } from 'lucide-react'
import toast from 'react-hot-toast'
import { Logo } from '../components/brand/Logo'
import { useAuth } from '../hooks/useAuth'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const { resetPassword } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await resetPassword(email)
      setSent(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not send reset email'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main id="main-content" className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="card w-full max-w-sm animate-fade-up">
        <Link to="/" aria-label="ChurchPress home" className="inline-flex mb-7">
          <Logo size={38} />
        </Link>

        <div className="w-12 h-12 bg-primary-50 border border-primary-100 rounded-2xl flex items-center justify-center mb-4">
          <Mail className="w-6 h-6 text-primary-700" aria-hidden="true" />
        </div>
        <p className="eyebrow mb-2">Password help</p>
        <h1 className="font-display text-3xl text-primary-700 mb-2">Reset your password</h1>
        <p className="text-sm text-ink-muted mb-7">
          {sent
            ? 'Check your inbox for a secure link to choose a new password.'
            : 'Enter your account email and we will send a secure reset link.'}
        </p>

        {!sent ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="reset-email" className="label-caps block mb-1.5">
                Email
              </label>
              <input
                id="reset-email"
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
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        ) : (
          <Link to="/login" className="btn-primary w-full text-center">
            Back to sign in
          </Link>
        )}
      </div>
    </main>
  )
}
