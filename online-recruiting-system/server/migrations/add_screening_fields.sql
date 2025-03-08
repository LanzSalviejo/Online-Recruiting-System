-- Add screening fields to job_applications table if they don't exist
DO $$
BEGIN
    -- Check if screening_score column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'job_applications' AND column_name = 'screening_score'
    ) THEN
        ALTER TABLE job_applications ADD COLUMN screening_score INTEGER;
    END IF;

    -- Check if passed_screening column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'job_applications' AND column_name = 'passed_screening'
    ) THEN
        ALTER TABLE job_applications ADD COLUMN passed_screening BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Check if screened_at column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'job_applications' AND column_name = 'screened_at'
    ) THEN
        ALTER TABLE job_applications ADD COLUMN screened_at TIMESTAMP;
    END IF;
    
    -- Make sure status has all the needed options including 'Screened Out'
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'job_applications' AND column_name = 'status'
    ) THEN
        -- Drop existing constraint if it exists
        ALTER TABLE job_applications DROP CONSTRAINT IF EXISTS job_applications_status_check;
        
        -- Add new constraint with updated status options
        ALTER TABLE job_applications ADD CONSTRAINT job_applications_status_check 
        CHECK (status IN ('Pending', 'Screened Out', 'Under Review', 'Interview', 'Offer', 'Rejected', 'Accepted'));
    END IF;
END $$;