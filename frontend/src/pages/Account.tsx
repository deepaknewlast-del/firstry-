import { useEffect, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import { Navbar } from '../components/layout/Navbar'
import { useAuth } from '../hooks/useAuth'
import { useSubscription } from '../hooks/useSubscription'
import { createCheckout, openBillingPortal } from '../lib/api'
import { supabase } from '../lib/supabase'

export default function Account() {
  const { user } = useAuth()
  const { profile, isPaid, loading } = useSubscription()
  const [churchName, setChurchName] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (profile?.church_name) setChurchName(profile.church_name)
  }, [profile?.church_name])

  const saveProfile = async () => {
    if (!user) return
    setSaving(true)
    const { error } = await supabase.from('profiles').update({ church_name: churchName }).eq('id', user.id)
    if (error) toast.error('Save failed')
    else toast.success('Saved!')
    setSaving(false)
  }

  const handleCheckout = async () => {
    try {
      await createCheckout()
    } catch {
      toast.error('Could not start checkout. Please try again.')
    }
  }

  const handlePortal = async () => {
    try {
      await openBillingPortal()
    } catch {
      toast.error('Could not open billing portal.')
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <main id="main-content" className="max-w-2xl mx-auto px-4 py-10 space-y-6">
        <div>
          <p className="eyebrow mb-2">Settings</p>
          <h1 className="font-display text-3xl text-primary-700">Account</h1>
        </div>

        {/* Profile */}
        <div className="card space-y-5">
          <h2 className="font-display text-lg text-primary-700">Church Details</h2>

          {/* The email is read-only, so it is a value, not a form field. */}
          <div>
            <p className="label-caps mb-1.5">Email</p>
            <p className="text-sm text-ink bg-cream border border-rule rounded-lg px-4 py-3">
              {user?.email}
            </p>
          </div>

          <div>
            <label htmlFor="church-name" className="label-caps block mb-1.5">
              Church Name
            </label>
            <input
              id="church-name"
              name="church_name"
              autoComplete="organization"
              value={churchName}
              onChange={(e) => setChurchName(e.target.value)}
              placeholder="Your church name"
              className="input-field"
            />
          </div>

          <button
            type="button"
            onClick={saveProfile}
            disabled={saving || loading}
            className="btn-primary"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>

        {/* Billing */}
        <div className="card space-y-5">
          <h2 className="font-display text-lg text-primary-700">Billing</h2>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-sm font-semibold text-primary-800">
                {isPaid ? 'Active subscription' : 'Free plan'}
              </p>
              <p className="text-xs text-ink-muted mt-0.5">
                {isPaid ? '$19/month · Cancel anytime' : '3 free bulletins total'}
              </p>
            </div>
            {isPaid ? (
              <button
                type="button"
                onClick={handlePortal}
                className="btn-secondary gap-1.5"
              >
                Manage billing <ExternalLink className="w-4 h-4" aria-hidden="true" />
              </button>
            ) : (
              <button type="button" onClick={handleCheckout} className="btn-primary">
                Upgrade — $19/mo
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
