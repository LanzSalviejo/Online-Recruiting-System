-- Create screening_notifications table for tracking email notifications
CREATE TABLE IF NOT EXISTS screening_notifications (
  id SERIAL PRIMARY KEY,
  application_id INTEGER NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
  passed_screening BOOLEAN NOT NULL,
  screening_score INTEGER,
  job_title VARCHAR(255),
  company_name VARCHAR(255),
  notification_type VARCHAR(50) NOT NULL, -- 'applicant_screening', 'hr_notification', etc.
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP,
  sent_at TIMESTAMP,
  
  -- Ensure we don't send duplicate notifications for the same application
  UNIQUE(application_id, notification_type)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_screening_notifications_status ON screening_notifications(status);
CREATE INDEX IF NOT EXISTS idx_screening_notifications_app_id ON screening_notifications(application_id);

-- Add screening_completed column to job_postings table to track processed jobs
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS screening_completed BOOLEAN DEFAULT FALSE;