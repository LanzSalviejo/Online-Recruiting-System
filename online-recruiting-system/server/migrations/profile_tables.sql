-- Create education table
CREATE TABLE IF NOT EXISTS education (
  education_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  degree_level VARCHAR(50) NOT NULL CHECK (degree_level IN ('High School', 'Diploma', 'Associate', 'Bachelor', 'Master', 'PhD', 'Certificate')),
  field_of_study VARCHAR(100) NOT NULL,
  institution VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  gpa VARCHAR(10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create work_experience table
CREATE TABLE IF NOT EXISTS work_experience (
  experience_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_title VARCHAR(100) NOT NULL,
  company VARCHAR(100) NOT NULL,
  industry VARCHAR(100),
  start_date DATE NOT NULL,
  end_date DATE,
  current_job BOOLEAN DEFAULT FALSE,
  responsibilities TEXT,
  skills TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create job_preferences table
CREATE TABLE IF NOT EXISTS job_preferences (
  preference_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(100) NOT NULL,
  position_type VARCHAR(50) NOT NULL CHECK (position_type IN ('Full Time', 'Part Time', 'Contract', 'Internship', 'Co-op')),
  location VARCHAR(100) NOT NULL,
  min_salary INTEGER,
  keywords TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_education_user_id ON education(user_id);
CREATE INDEX IF NOT EXISTS idx_work_experience_user_id ON work_experience(user_id);
CREATE INDEX IF NOT EXISTS idx_job_preferences_user_id ON job_preferences(user_id);