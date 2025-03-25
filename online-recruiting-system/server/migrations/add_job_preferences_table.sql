-- Create job_preferences table if it doesn't exist
CREATE TABLE IF NOT EXISTS job_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  position_type VARCHAR(50),
  category VARCHAR(100),
  location VARCHAR(255),
  min_salary INTEGER,
  keywords TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- If table exists but the column is missing, add it
DO $$
BEGIN
  -- Check if preference_id column exists (likely a naming inconsistency)
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'job_preferences' AND column_name = 'preference_id'
  ) THEN
    -- Add preference_id column
    ALTER TABLE job_preferences ADD COLUMN preference_id SERIAL;
  END IF;
END $$;