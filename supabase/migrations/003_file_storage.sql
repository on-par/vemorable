-- Migration 003: File Storage Setup
-- This migration adds file storage capabilities to VeMorable

-- Add file-related columns to notes table
ALTER TABLE notes ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS file_name TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS file_type TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS file_size INTEGER;

-- Create an index on file_url for faster lookups
CREATE INDEX IF NOT EXISTS idx_notes_file_url ON notes(file_url);

-- Create RLS policies for storage bucket (to be applied via Supabase Dashboard)
-- Note: Storage bucket creation and RLS policies must be done via Supabase Dashboard
-- as they cannot be created via SQL migrations

-- Storage bucket name: 'user-uploads'
-- Allowed MIME types: 
--   - application/pdf
--   - image/jpeg, image/jpg, image/png, image/gif, image/webp
--   - text/plain, text/markdown
--   - application/msword
--   - application/vnd.openxmlformats-officedocument.wordprocessingml.document

-- RLS Policies to create in Dashboard:
-- 1. Allow authenticated users to upload files to their own folder
--    - Operation: INSERT
--    - Check: auth.uid()::text = (storage.foldername(name))[1]
-- 
-- 2. Allow authenticated users to view their own files
--    - Operation: SELECT  
--    - Using: auth.uid()::text = (storage.foldername(name))[1]
--
-- 3. Allow authenticated users to delete their own files
--    - Operation: DELETE
--    - Using: auth.uid()::text = (storage.foldername(name))[1]
--
-- 4. Allow authenticated users to update their own files
--    - Operation: UPDATE
--    - Using: auth.uid()::text = (storage.foldername(name))[1]

-- Add comment to document the storage setup
COMMENT ON COLUMN notes.file_url IS 'URL to the uploaded file in Supabase Storage';
COMMENT ON COLUMN notes.file_name IS 'Original filename of the uploaded file';
COMMENT ON COLUMN notes.file_type IS 'MIME type of the uploaded file';
COMMENT ON COLUMN notes.file_size IS 'Size of the uploaded file in bytes';