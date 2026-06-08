/*
# Storage RLS Policies for passport-photos bucket

Adds Row Level Security policies to allow public upload and download
of passport photo files in the passport-photos storage bucket.
*/

-- Allow public SELECT (download/view) on passport-photos
DROP POLICY IF EXISTS "public_read_passport_photos" ON storage.objects;
CREATE POLICY "public_read_passport_photos"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'passport-photos');

-- Allow public INSERT (upload) on passport-photos
DROP POLICY IF EXISTS "public_insert_passport_photos" ON storage.objects;
CREATE POLICY "public_insert_passport_photos"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'passport-photos');
