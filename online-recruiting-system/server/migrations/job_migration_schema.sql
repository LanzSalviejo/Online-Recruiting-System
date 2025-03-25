-- Create job preferences table
CREATE TABLE IF NOT EXISTS job_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  position_type VARCHAR(50) CHECK (position_type IN ('Full Time', 'Part Time', 'Contract', 'Internship', 'Co-op')),
  category VARCHAR(100),
  location VARCHAR(255),
  min_salary INTEGER,
  keywords TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups by user
CREATE INDEX IF NOT EXISTS idx_job_preferences_user_id ON job_preferences(user_id);

-- Add a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_job_preferences_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now(); 
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for the table
CREATE TRIGGER update_job_preferences_modtime
BEFORE UPDATE ON job_preferences
FOR EACH ROW
EXECUTE PROCEDURE update_job_preferences_modified_column();