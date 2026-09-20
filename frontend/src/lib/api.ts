import { supabase } from './supabase'

const API_URL = import.meta.env.VITE_API_URL

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession()
  const session = data.session
  if (!session) throw new Error('Not authenticated')
  return {
    Authorization: `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  }
}

export interface BulletinResult {
  bulletin_id: string
  content: GeneratedContent
  pdf_url: string
  /** Rendered images of the PDF's pages — the preview that works on phones. */
  preview_urls?: string[]
  /** The design choices this bulletin was generated with. */
  input_data?: {
    tone?: string
    brand_accent_color?: string
    church_name?: string
    logo_url?: string
    [key: string]: unknown
  }
}

export interface GeneratedContent {
  bulletin: {
    header: string
    welcome_message: string
    order_of_service: string[]
    sermon_section: {
      title: string
      scripture_reference: string
      key_points: string[]
    }
    announcements: string[]
    prayer_requests: string | null
    offering_info: string | null
    closing_thought: string
  }
  announcement_slides: Array<{
    slide_number: number
    headline: string
    body: string
    type: 'welcome' | 'scripture' | 'announcement' | 'closing'
  }>
  social_post: {
    facebook: string
    instagram: string
  }
  email_newsletter: {
    subject_line: string
    preview_text: string
    body: string
  }
}

export async function generateBulletin(formData: Record<string, unknown>): Promise<BulletinResult> {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_URL}/api/generate/bulletin`, {
    method: 'POST',
    headers,
    body: JSON.stringify(formData),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const detail = (err as { detail?: { message?: string } | string }).detail
    const message = typeof detail === 'string' ? detail : detail?.message
    if (res.status === 429 || message?.includes('limit_reached')) {
      throw new Error('limit_reached')
    }
    if (res.status === 403 && message === 'email_not_verified') {
      throw new Error('email_not_verified')
    }
    throw new Error(message || 'Generation failed')
  }
  return res.json()
}

export async function createCheckout() {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_URL}/api/billing/checkout`, {
    method: 'POST',
    headers,
  })
  if (!res.ok) throw new Error('Could not start checkout')
  const data = (await res.json()) as { checkout_url: string }
  window.location.href = data.checkout_url
}

export async function requestUpgradeInterest() {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_URL}/api/billing/interest`, {
    method: 'POST',
    headers,
  })
  if (!res.ok) throw new Error('Could not save upgrade interest')
  return res.json() as Promise<{ ok: boolean }>
}

export async function openBillingPortal() {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_URL}/api/billing/portal`, {
    method: 'POST',
    headers,
  })
  if (!res.ok) throw new Error('Could not open billing portal')
  const data = (await res.json()) as { portal_url: string }
  window.location.href = data.portal_url
}
