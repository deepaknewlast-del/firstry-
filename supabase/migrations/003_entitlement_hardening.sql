-- Entitlement hardening: users must never control their own billing state.
--
-- The original "Users update own profile" policy allowed any signed-in user
-- to PATCH their own row from the browser — including subscription_status
-- ('free' -> 'active'), bulletins_generated_total (resetting the free-tier
-- counter), and payment identifiers. That is a complete paywall bypass.
--
-- Fix, in two layers (Postgres has no column lists inside CREATE POLICY —
-- column restrictions are expressed with GRANT ... UPDATE (columns)):
--
--   1. Row-level policy: a user may update only their own row.
--   2. Column-level GRANT: of that row, only the six branding columns
--      (church_name, denomination, city, country, brand_accent_color,
--      logo_path) are updatable by `authenticated`. Every billing and
--      metering column (subscription_status, subscription_id, payment IDs,
--      bulletins_generated_total, trial_ends_at) becomes service-role-only.
--
-- The FastAPI backend uses the service key, which bypasses RLS, so webhooks
-- and usage counting keep working unchanged. Reads are unaffected (the
-- "Users view own profile" SELECT policy stays in place).

BEGIN;

-- 1) Remove the blanket self-update policy (the paywall bypass).
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users update own preferences" ON public.profiles;

-- 2) Row-level: users may update only their own row.
CREATE POLICY "Users update own preferences" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 3) Column-level: even on their own row, only branding columns are writable.
--    (Defaults in Supabase grant ALL to anon/authenticated; revoke first.)
REVOKE UPDATE ON TABLE public.profiles FROM anon, authenticated;
GRANT UPDATE (church_name, denomination, city, country, brand_accent_color, logo_path)
  ON TABLE public.profiles TO authenticated;

-- 4) Defense in depth: bulletins are only ever created through the backend
--    (which bypasses RLS with the service key). The client-facing INSERT
--    policy allowed hand-crafted history rows from the browser; remove it.
DROP POLICY IF EXISTS "Users insert own bulletins" ON public.bulletins;

COMMIT;
