import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { KeyRound } from 'lucide-react'
import toast from 'react-hot-toast'
import { Logo } from '../components/brand/Logo'
import { useAuth } from '../hooks/useAuth'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { updatePassword } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      await updatePassword(password)
      toast.success('Password updated')
      navigate('/dashboard')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not update password'
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
          <KeyRound className="w-6 h-6 text-primary-700" aria-hidden="true" />
        </div>
        <p className="eyebrow mb-2">New password</p>
        <h1 className="font-display text-3xl text-primary-700 mb-2">Choose a new password</h1>
        <p className="text-sm text-ink-muted mb-7">Use at least 8 characters.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="new-password" className="label-caps block mb-1.5">
              Password
            </label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className="label-caps block mb-1.5">
              Confirm password
            </label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-field"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </div>
    </main>
  )
}
