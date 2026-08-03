-- Tracks the Supabase Storage object path alongside the public URL already stored in
-- media_files.file_url, so a delete (see apps/api/src/routes/media.ts DELETE /media/:id)
-- can remove the actual storage object instead of only the DB row.
ALTER TABLE media_files ADD COLUMN IF NOT EXISTS storage_path TEXT;
