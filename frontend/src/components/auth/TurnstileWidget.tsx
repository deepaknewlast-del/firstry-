import { useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: {
          sitekey: string
          action: string
          callback: (token: string) => void
          'expired-callback': () => void
          'error-callback': () => void
        }
      ) => string
      reset: (widgetId: string) => void
      remove: (widgetId: string) => void
    }
  }
}

interface TurnstileWidgetProps {
  action: string
  onVerify: (token: string) => void
  onExpire: () => void
}

const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY

export function hasTurnstileSiteKey() {
  return Boolean(siteKey)
}

export function TurnstileWidget({ action, onVerify, onExpire }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const widgetIdRef = useRef<string | null>(null)
  const [scriptReady, setScriptReady] = useState(Boolean(window.turnstile))

  useEffect(() => {
    if (!siteKey || window.turnstile) {
      setScriptReady(Boolean(window.turnstile))
      return
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"]'
    )

    if (existingScript) {
      existingScript.addEventListener('load', () => setScriptReady(true), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.async = true
    script.defer = true
    script.onload = () => setScriptReady(true)
    document.head.appendChild(script)
  }, [])

  useEffect(() => {
    if (!siteKey || !scriptReady || !window.turnstile || !containerRef.current) return
    if (widgetIdRef.current) return

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      action,
      callback: onVerify,
      'expired-callback': onExpire,
      'error-callback': onExpire,
    })

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
        widgetIdRef.current = null
      }
    }
  }, [action, onExpire, onVerify, scriptReady])

  if (!siteKey) return null

  return (
    <div className="rounded-lg border border-rule bg-white/80 p-3">
      <div ref={containerRef} />
    </div>
  )
}
