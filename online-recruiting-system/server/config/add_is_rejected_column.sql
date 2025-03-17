-- Add is_rejected column to hr_staff table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'hr_staff' 
        AND column_name = 'is_rejected'
    ) THEN
        ALTER TABLE hr_staff ADD COLUMN is_rejected BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Update existing records to set is_rejected = FALSE if NULL
UPDATE hr_staff 
SET is_rejected = FALSE 
WHERE is_rejected IS NULL;