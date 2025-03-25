-- Add company_name column to hr_staff table if it doesn't exist
DO $$
BEGIN
    -- Check if company_name column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'hr_staff' AND column_name = 'company_name'
    ) THEN
        -- Add company_name column
        ALTER TABLE hr_staff ADD COLUMN company_name VARCHAR(100);
    END IF;
END $$;