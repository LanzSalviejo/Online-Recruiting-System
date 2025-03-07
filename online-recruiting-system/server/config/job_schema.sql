-- Create job categories table
CREATE TABLE IF NOT EXISTS job_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create job postings table
CREATE TABLE IF NOT EXISTS job_postings (
  id SERIAL PRIMARY KEY,
  creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  company_name VARCHAR(255) DEFAULT 'Company Name',
  position_type VARCHAR(50) NOT NULL CHECK (position_type IN ('Full Time', 'Part Time', 'Contract', 'Internship', 'Co-op')),
  category_id INTEGER REFERENCES job_categories(id),
  location VARCHAR(255) NOT NULL,
  contact_email VARCHAR(255) NOT NULL,
  min_education_level VARCHAR(50) DEFAULT 'High School' CHECK (min_education_level IN ('High School', 'Associate', 'Diploma', 'Bachelor', 'Master', 'PhD')),
  min_experience INTEGER DEFAULT 0,
  description TEXT NOT NULL,
  responsibilities JSONB,
  requirements JSONB,
  salary INTEGER,
  post_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create job applications table
CREATE TABLE IF NOT EXISTS job_applications (
  id SERIAL PRIMARY KEY,
  job_id INTEGER NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  applicant_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  application_date DATE NOT NULL DEFAULT CURRENT_DATE,
  cover_letter TEXT,
  resume_path VARCHAR(255),
  status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Screened Out', 'Under Review', 'Interview', 'Offer', 'Rejected', 'Accepted')),
  screening_score INTEGER,
  passed_screening BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(job_id, applicant_id)
);

-- Add a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now(); 
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for the tables
CREATE TRIGGER update_job_postings_modtime
BEFORE UPDATE ON job_postings
FOR EACH ROW
EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_job_applications_modtime
BEFORE UPDATE ON job_applications
FOR EACH ROW
EXECUTE PROCEDURE update_modified_column();

-- Insert sample job categories
INSERT INTO job_categories (name, description) VALUES
('Information Technology', 'Software development, IT support, and system administration positions'),
('Business', 'Business administration, management, and operations roles'),
('Marketing', 'Marketing, advertising, and public relations positions'),
('Finance', 'Finance, accounting, and banking roles'),
('Healthcare', 'Medical, nursing, and healthcare administration positions'),
('Education', 'Teaching, training, and educational administration roles'),
('Sales', 'Sales and business development positions'),
('Engineering', 'Engineering and technical design roles'),
('Customer Service', 'Customer support and service positions'),
('Human Resources', 'HR management, recruitment, and employee relations roles')
ON CONFLICT (name) DO NOTHING;