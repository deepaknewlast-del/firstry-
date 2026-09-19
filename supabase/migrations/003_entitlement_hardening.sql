-- Entitlement hardening: users must never control their own billing state.
--
-- The original "Users update own profile" policy allowed any signed-in user
-- to PATCH their own row from the browser — including subscription_status
-- ('free' -> 'active'), bulletins_generated_total (resetting the free-tier
-- counter), and payment identifiers. That is a complete paywall bypass.
--
-- Fix: replace the blanket policy with a column-level one. Users may update
-- only the six branding/preferences columns the Account page writes:
--   church_name, denomination, city, country, brand_accent_color, logo_path
-- Every billing and metering column (subscription_status, subscription_id,
-- stripe_customer_id, paddle_customer_id, bulletins_generated_total, trial_ends_at)
-- becomes service-role-only. The FastAPI backend uses the service key, which
-- bypasses RLS, so webhooks and usage counting keep working unchanged.
-- brand_accent_color additionally keeps its hex-format CHECK constraint.

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;

CREATE POLICY "Users update own preferences" ON public.profiles
  FOR UPDATE (church_name, denomination, city, country, brand_accent_color, logo_path)
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Defense in depth: bulletins are only ever created through the backend
-- (which bypasses RLS with the service key). The client-facing INSERT policy
-- would have allowed hand-crafted history rows from the browser; remove it.
DROP POLICY IF EXISTS "Users insert own bulletins" ON public.bulletins;
