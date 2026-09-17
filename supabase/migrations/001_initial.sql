-- ChurchPress (churchbulletin.in) — Initial schema
-- Run in Supabase SQL editor (or `supabase db push`)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------------
-- Profiles (extends auth.users)
-- ---------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  church_name TEXT,
  denomination TEXT,
  city TEXT,
  country TEXT DEFAULT 'US',
  brand_accent_color TEXT DEFAULT '#4e2456' CHECK (brand_accent_color ~ '^#[0-9A-Fa-f]{6}$'),
  logo_path TEXT,
  stripe_customer_id TEXT UNIQUE,
  subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'active', 'past_due', 'canceled')),
  subscription_id TEXT,
  trial_ends_at TIMESTAMPTZ,
  bulletins_generated_total INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Bulletins
-- ---------------------------------------------------------------------------
CREATE TABLE public.bulletins (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  service_date DATE NOT NULL,
  input_data JSONB NOT NULL,         -- raw form input
  generated_content JSONB NOT NULL,  -- AI output: bulletin, slides, social, email
  pdf_url TEXT,                      -- Supabase Storage path (private bucket)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Usage logs (durable backup to Redis rate limiting)
-- ---------------------------------------------------------------------------
CREATE TABLE public.usage_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX idx_bulletins_user_id ON public.bulletins(user_id);
CREATE INDEX idx_bulletins_created_at ON public.bulletins(created_at DESC);
CREATE INDEX idx_usage_logs_user_id_created ON public.usage_logs(user_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- Auto-create profile on signup
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulletins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users view own bulletins" ON public.bulletins
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own bulletins" ON public.bulletins
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own bulletins" ON public.bulletins
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users view own usage" ON public.usage_logs
  FOR SELECT USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Storage: private bucket + per-user folder access
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public) VALUES ('bulletins', 'bulletins', false);
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'church-assets',
  'church-assets',
  false,
  2097152,
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
);

CREATE POLICY "Users access own PDFs" ON storage.objects
  FOR ALL USING (auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users access own church assets" ON storage.objects
  FOR ALL USING (
    bucket_id = 'church-assets'
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'church-assets'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
