-- ChurchPress — Paddle fulfillment layer (additive; nothing existing is altered)
--
-- Adaptation of the reference `customers`/`subscriptions` schema to this DB:
-- profiles is already the per-customer table (unique email, one row per user),
-- so the customer mirror is a single new column here instead of a second table.
-- The frontend gates paid access on profiles.subscription_status, so webhook
-- handlers keep that column in sync from verified Paddle events.

-- Link a Paddle customer (ctm_...) to the app user. Set by webhook events
-- (customer.created/updated, transaction.completed, subscription events).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS paddle_customer_id TEXT;

-- Postgres treats NULLs as distinct, so several not-yet-linked users are fine.
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_paddle_customer_id_key UNIQUE (paddle_customer_id);

-- Mirror of Paddle subscriptions, upserted keyed on subscription_id so
-- at-least-once, out-of-order deliveries stay idempotent.
CREATE TABLE IF NOT EXISTS public.subscriptions (
  subscription_id         TEXT PRIMARY KEY,
  customer_id             TEXT NOT NULL,
  user_id                 UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status                  TEXT NOT NULL,
  price_id                TEXT,
  product_id              TEXT,
  scheduled_change_action TEXT,
  scheduled_change_at     TIMESTAMPTZ,
  occurred_at             TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- user_id is nullable on purpose: a delivery we cannot resolve to a user is
-- still mirrored (never dropped); the link is filled in by later events.

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer_id ON public.subscriptions(customer_id);

-- Row Level Security, matching the convention of every other table:
-- the service role (webhook) bypasses RLS; users may read their own rows.
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);
