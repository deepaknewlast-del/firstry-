import { createClient } from '@supabase/supabase-js'

// Only ANON key here — safe for frontend. All privileged access goes through
// the FastAPI backend.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
