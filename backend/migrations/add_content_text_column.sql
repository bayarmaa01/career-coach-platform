-- Add content_text column to resumes table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'resumes' AND column_name = 'content_text'
    ) THEN
        ALTER TABLE resumes ADD COLUMN content_text TEXT;
        RAISE NOTICE 'Added content_text column to resumes table';
    ELSE
        RAISE NOTICE 'content_text column already exists in resumes table';
    END IF;
END $$;
