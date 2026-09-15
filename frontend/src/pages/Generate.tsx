import { useState } from 'react'
import { Lock, PenLine } from 'lucide-react'
import toast from 'react-hot-toast'
import { Navbar } from '../components/layout/Navbar'
import { BulletinForm } from '../components/bulletin/BulletinForm'
import { BulletinPreview } from '../components/bulletin/BulletinPreview'
import { useSubscription } from '../hooks/useSubscription'
import { createCheckout } from '../lib/api'
import type { BulletinResult } from '../lib/api'

export default function Generate() {
  const [result, setResult] = useState<BulletinResult | null>(null)
  const { isAtFreeLimit } = useSubscription()

  const handleUpgrade = async () => {
    try {
      await createCheckout()
    } catch {
      toast.error('Could not start checkout. Please try again.')
    }
  }

  if (isAtFreeLimit)
    return (
      <div className="min-h-screen bg-cream">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <div className="card animate-fade-up">
            <div className="w-14 h-14 bg-primary-50 border border-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-7 h-7 text-primary-700" aria-hidden="true" />
            </div>
            <p className="eyebrow mb-2">Free limit reached</p>
            <h2 className="font-display text-2xl text-primary-700 mb-3">
              You have used your three free bulletins
            </h2>
            <p className="text-ink-muted text-sm mb-7 leading-relaxed">
              You&rsquo;ve used your 3 free bulletins. Upgrade to keep generating — unlimited
              bulletins for $19/month, cancel anytime.
            </p>
            <button onClick={handleUpgrade} className="btn-primary w-full">
              Upgrade for $19/month
            </button>
          </div>
        </div>
      </div>
    )

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <main id="main-content" className="max-w-5xl mx-auto px-4 py-10">
        {!result ? (
          <>
            <div className="mb-8">
              <p className="eyebrow mb-1">This week</p>
              <h1 className="font-display text-3xl text-primary-700">New Bulletin</h1>
              <p className="text-ink-muted text-sm mt-1.5 flex items-center gap-1.5">
                <PenLine className="w-3.5 h-3.5 text-primary-400" aria-hidden="true" />
                Fill in this week&rsquo;s details — takes about two minutes.
              </p>
            </div>
            <BulletinForm onSuccess={setResult} />
          </>
        ) : (
          <BulletinPreview result={result} onReset={() => setResult(null)} />
        )}
      </main>
    </div>
  )
}