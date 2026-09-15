import { useState } from 'react'
import { Bell, Copy, Download, FileText, Lock, Mail, PenLine, Presentation } from 'lucide-react'
import toast from 'react-hot-toast'
import { Navbar } from '../components/layout/Navbar'
import { BulletinForm } from '../components/bulletin/BulletinForm'
import { BulletinPreview } from '../components/bulletin/BulletinPreview'
import { useSubscription } from '../hooks/useSubscription'
import { requestUpgradeInterest } from '../lib/api'
import type { BulletinResult } from '../lib/api'

const LOCKED_OUTPUTS = [
  {
    icon: FileText,
    label: 'Branded PDF',
    title: 'Grace Community Church',
    body: 'A polished Sunday bulletin with your church name, service order, sermon notes, announcements, prayer requests, and giving details.',
  },
  {
    icon: Presentation,
    label: 'Announcement slides',
    title: 'This Week at Grace',
    body: 'Four ready-to-use slide layouts for welcome, scripture, announcements, and the closing thought.',
  },
  {
    icon: Mail,
    label: 'Newsletter',
    title: 'Ready for Sunday',
    body: 'A complete email subject, preview text, and body copy for your church list.',
  },
]

export default function Generate() {
  const [result, setResult] = useState<BulletinResult | null>(null)
  const [savingInterest, setSavingInterest] = useState(false)
  const { isAtFreeLimit } = useSubscription()

  const handleUpgrade = async () => {
    setSavingInterest(true)
    try {
      await requestUpgradeInterest()
      toast.success('You are on the upgrade list.')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not save your interest'
      toast.error(message)
    } finally {
      setSavingInterest(false)
    }
  }

  if (isAtFreeLimit)
    return (
      <div className="min-h-screen bg-cream">
        <Navbar />
        <main id="main-content" className="max-w-5xl mx-auto px-4 py-10">
          <div className="max-w-2xl mx-auto text-center mb-8 animate-fade-up">
            <div className="w-14 h-14 bg-primary-50 border border-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-7 h-7 text-primary-700" aria-hidden="true" />
            </div>
            <p className="eyebrow mb-2">Free limit reached</p>
            <h1 className="font-display text-3xl text-primary-700 mb-3">
              Your next bulletin is a paid feature
            </h1>
            <p className="text-ink-muted text-sm leading-relaxed">
              You&rsquo;ve used your 3 free bulletins. Paid upgrades are opening soon; join the
              early list and we&rsquo;ll let you know when unlimited generation is available.
            </p>
            <button
              type="button"
              onClick={handleUpgrade}
              disabled={savingInterest}
              className="btn-primary mt-6"
            >
              <Bell className="w-4 h-4" aria-hidden="true" />
              {savingInterest ? 'Saving…' : 'Notify me when upgrades open'}
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {LOCKED_OUTPUTS.map(({ icon: Icon, label, title, body }) => (
              <article key={label} className="card relative overflow-hidden min-h-[260px]">
                <div className="absolute inset-0 bg-parchment/55 backdrop-blur-[3px] z-10 flex items-center justify-center">
                  <div className="bg-primary-950 text-white rounded-xl px-4 py-3 shadow-lift flex items-center gap-2 text-sm font-semibold">
                    <Lock className="w-4 h-4" aria-hidden="true" />
                    Paid plan preview
                  </div>
                </div>
                <div className="opacity-70 select-none">
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-10 h-10 bg-primary-50 rounded-lg border border-primary-100 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary-700" aria-hidden="true" />
                    </div>
                    <p className="label-caps text-[10px]">{label}</p>
                  </div>
                  <h2 className="font-display text-xl text-primary-800 mb-3">{title}</h2>
                  <p className="text-sm text-slate-700 leading-relaxed mb-5">{body}</p>
                  <div className="flex gap-2" aria-hidden="true">
                    <div className="btn-secondary px-3 py-2 text-sm">
                      <Copy className="w-4 h-4" aria-hidden="true" />
                      Copy
                    </div>
                    {label === 'Branded PDF' && (
                      <div className="btn-primary px-3 py-2 text-sm">
                        <Download className="w-4 h-4" aria-hidden="true" />
                        PDF
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </main>
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
