-- Migration: Add content_text column to resumes table
-- This fixes the "content_text does not exist" error

-- Check if column exists before adding
ALTER TABLE resumes 
ADD COLUMN IF NOT EXISTS content_text TEXT;

-- Add comment for documentation
COMMENT ON COLUMN resumes.content_text IS 'Extracted text content from uploaded resume files';
