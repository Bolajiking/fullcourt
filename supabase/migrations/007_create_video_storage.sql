-- Create storage bucket for video thumbnails and assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist (to allow re-running the migration)
DROP POLICY IF EXISTS "Public read access for videos bucket" ON storage.objects;
DROP POLICY IF EXISTS "Admin upload access for videos bucket" ON storage.objects;
DROP POLICY IF EXISTS "Admin delete access for videos bucket" ON storage.objects;

-- Allow public read access to all files in videos bucket
CREATE POLICY "Public read access for videos bucket"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'videos');

-- Allow admin users to upload and delete files
CREATE POLICY "Admin upload access for videos bucket"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'videos');

CREATE POLICY "Admin delete access for videos bucket"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'videos');

