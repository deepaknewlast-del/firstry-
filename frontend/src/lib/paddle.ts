export async function getClientCountry(): Promise<string | undefined> {
  try {
    const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
    const res = await fetch(`${API_URL}/api/billing/config/country`)
    if (res.ok) {
      const data = await res.json()
      return data.countryCode || undefined
    }
  } catch (error) {
    console.warn('Could not fetch client country:', error)
  }
  return undefined
}
