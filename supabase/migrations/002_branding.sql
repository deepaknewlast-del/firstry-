-- ChurchPress (churchbulletin.in) — Church branding profile fields and private logo storage

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS brand_accent_color TEXT DEFAULT '#4e2456',
  ADD COLUMN IF NOT EXISTS logo_path TEXT;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_brand_accent_color_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_brand_accent_color_check
  CHECK (brand_accent_color ~ '^#[0-9A-Fa-f]{6}$');

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'church-assets',
  'church-assets',
  false,
  2097152,
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users access own church assets'
  ) THEN
    CREATE POLICY "Users access own church assets" ON storage.objects
      FOR ALL USING (
        bucket_id = 'church-assets'
        AND auth.uid()::text = (storage.foldername(name))[1]
      )
      WITH CHECK (
        bucket_id = 'church-assets'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
END $$;
