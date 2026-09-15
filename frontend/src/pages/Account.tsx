import { useEffect, useState } from 'react'
import { Bell, ExternalLink, ImagePlus, Palette, Upload } from 'lucide-react'
import toast from 'react-hot-toast'
import { Navbar } from '../components/layout/Navbar'
import { useAuth } from '../hooks/useAuth'
import { useSubscription } from '../hooks/useSubscription'
import { openBillingPortal, requestUpgradeInterest } from '../lib/api'
import { supabase } from '../lib/supabase'

const ACCENT_OPTIONS = [
  { name: 'Plum', value: '#4e2456' },
  { name: 'Navy', value: '#1f3a5f' },
  { name: 'Forest', value: '#2f5d50' },
  { name: 'Burgundy', value: '#7a2434' },
  { name: 'Gold', value: '#8a6114' },
]

const LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
const MAX_LOGO_SIZE = 2 * 1024 * 1024

export default function Account() {
  const { user } = useAuth()
  const { profile, isPaid, loading } = useSubscription()
  const [churchName, setChurchName] = useState('')
  const [denomination, setDenomination] = useState('')
  const [accentColor, setAccentColor] = useState('#4e2456')
  const [logoPath, setLogoPath] = useState<string | null>(null)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  useEffect(() => {
    if (profile?.church_name) setChurchName(profile.church_name)
    if (profile?.denomination) setDenomination(profile.denomination)
    if (profile?.brand_accent_color) setAccentColor(profile.brand_accent_color)
    setLogoPath(profile?.logo_path ?? null)
  }, [profile])

  useEffect(() => {
    if (!logoPath) {
      setLogoUrl(null)
      return
    }
    supabase.storage
      .from('church-assets')
      .createSignedUrl(logoPath, 3600)
      .then(({ data }) => setLogoUrl(data?.signedUrl ?? null))
  }, [logoPath])

  const saveProfile = async () => {
    if (!user) return
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({
        church_name: churchName.trim() || null,
        denomination: denomination.trim() || null,
        brand_accent_color: accentColor,
        logo_path: logoPath,
      })
      .eq('id', user.id)
    if (error) toast.error('Save failed')
    else toast.success('Saved!')
    setSaving(false)
  }

  const uploadLogo = async (file: File) => {
    if (!user) return
    if (!LOGO_TYPES.includes(file.type)) {
      toast.error('Use a PNG, JPG, WebP, or SVG logo.')
      return
    }
    if (file.size > MAX_LOGO_SIZE) {
      toast.error('Logo must be 2 MB or smaller.')
      return
    }

    setUploadingLogo(true)
    const extension = file.name.split('.').pop()?.toLowerCase() || 'png'
    const path = `${user.id}/logo.${extension}`
    const { error } = await supabase.storage.from('church-assets').upload(path, file, {
      upsert: true,
      contentType: file.type,
    })
    if (error) {
      toast.error('Logo upload failed')
    } else {
      setLogoPath(path)
      toast.success('Logo uploaded')
    }
    setUploadingLogo(false)
  }

  const handleCheckout = async () => {
    try {
      await requestUpgradeInterest()
      toast.success('You are on the upgrade list.')
    } catch {
      toast.error('Could not save your interest. Please try again.')
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

          <div>
            <label htmlFor="denomination" className="label-caps block mb-1.5">
              Denomination
            </label>
            <input
              id="denomination"
              name="denomination"
              autoComplete="off"
              value={denomination}
              onChange={(e) => setDenomination(e.target.value)}
              placeholder="Baptist, Methodist, non-denominational..."
              className="input-field"
            />
          </div>

          <div className="grid sm:grid-cols-[1fr_140px] gap-5 items-start">
            <div>
              <p className="label-caps mb-1.5">Logo</p>
              <label className="min-h-32 border border-rule bg-cream rounded-lg px-4 py-5 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary-300 transition-colors">
                <input
                  type="file"
                  accept={LOGO_TYPES.join(',')}
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) void uploadLogo(file)
                    e.target.value = ''
                  }}
                />
                <ImagePlus className="w-6 h-6 text-primary-700 mb-2" aria-hidden="true" />
                <span className="text-sm font-semibold text-primary-800">
                  {uploadingLogo ? 'Uploading…' : 'Upload logo'}
                </span>
                <span className="text-xs text-ink-muted mt-1">PNG, JPG, WebP, or SVG up to 2 MB</span>
              </label>
            </div>
            <div>
              <p className="label-caps mb-1.5">Preview</p>
              <div className="h-32 border border-rule bg-white rounded-lg flex items-center justify-center p-3">
                {logoUrl ? (
                  <img src={logoUrl} alt="" className="max-h-full max-w-full object-contain" />
                ) : (
                  <Upload className="w-7 h-7 text-primary-200" aria-hidden="true" />
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Palette className="w-4 h-4 text-primary-700" aria-hidden="true" />
              <p className="label-caps">Accent color</p>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {ACCENT_OPTIONS.map((option) => {
                const selected = accentColor === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setAccentColor(option.value)}
                    aria-pressed={selected}
                    className={`min-h-11 rounded-md border text-xs font-semibold transition-colors ${
                      selected ? 'border-primary-700 bg-white' : 'border-rule bg-cream'
                    }`}
                  >
                    <span
                      className="block w-5 h-5 rounded-full mx-auto mb-1 border border-black/10"
                      style={{ backgroundColor: option.value }}
                      aria-hidden="true"
                    />
                    {option.name}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="rounded-xl border border-rule bg-cream p-4">
            <p className="label-caps mb-2">PDF header preview</p>
            <div className="bg-white rounded-lg border border-rule px-5 py-4 text-center">
              {logoUrl && <img src={logoUrl} alt="" className="max-h-12 mx-auto mb-2" />}
              <p className="font-display text-xl" style={{ color: accentColor }}>
                {churchName || 'Your Church'}
              </p>
              <div className="h-0.5 mt-3" style={{ backgroundColor: accentColor }} />
            </div>
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
                {isPaid ? '$19/month · Cancel anytime' : '3 free bulletins total · upgrades opening soon'}
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
                <Bell className="w-4 h-4" aria-hidden="true" />
                Notify me
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
