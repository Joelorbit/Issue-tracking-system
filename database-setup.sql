-- ASTU Smart Complaint System Database Setup
-- Run this SQL in your Supabase SQL Editor

BEGIN;

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1) departments table
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2) users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  password text NOT NULL,
  role text NOT NULL CHECK (role IN ('student', 'staff', 'admin')),
  department_id uuid REFERENCES departments(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3) complaints table
CREATE TABLE IF NOT EXISTS complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  issue_type text NOT NULL CHECK (issue_type IN (
    'Academic',
    'Finance',
    'Facilities',
    'IT',
    'Library',
    'Student Affairs',
    'Other'
  )) DEFAULT 'Other',
  status text NOT NULL CHECK (status IN ('Open', 'In Progress', 'Resolved')) DEFAULT 'Open',
  file_url text,
  student_id uuid NOT NULL REFERENCES users(id),
  department_id uuid NOT NULL REFERENCES departments(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Backward-compatible migration for existing DBs
ALTER TABLE complaints
ADD COLUMN IF NOT EXISTS issue_type text NOT NULL DEFAULT 'Other';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'complaints_issue_type_check'
  ) THEN
    ALTER TABLE complaints
    ADD CONSTRAINT complaints_issue_type_check
    CHECK (issue_type IN (
      'Academic',
      'Finance',
      'Facilities',
      'IT',
      'Library',
      'Student Affairs',
      'Other'
    ));
  END IF;
END $$;

-- 4) remarks table
CREATE TABLE IF NOT EXISTS remarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id uuid NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  staff_id uuid NOT NULL REFERENCES users(id),
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5) notifications table (in-app notifications)
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  complaint_id uuid REFERENCES complaints(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('status_update', 'new_remark')),
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_complaints_student_id ON complaints(student_id);
CREATE INDEX IF NOT EXISTS idx_complaints_department_id ON complaints(department_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_issue_type ON complaints(issue_type);
CREATE INDEX IF NOT EXISTS idx_remarks_complaint_id ON remarks(complaint_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Auto-update updated_at for complaints
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_complaints_updated_at ON complaints;
CREATE TRIGGER update_complaints_updated_at
  BEFORE UPDATE ON complaints
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Seed departments
INSERT INTO departments (name) VALUES
  ('Information Technology'),
  ('Finance'),
  ('Registrar'),
  ('Library'),
  ('Student Affairs'),
  ('Facilities Management'),
  ('Academic Affairs'),
  ('Human Resources'),
  ('Research & Development')
ON CONFLICT (name) DO NOTHING;

-- Default admin user (password: admin123)
INSERT INTO users (name, email, password, role) VALUES
  (
    'System Administrator',
    'admin@astu.edu',
    '$2a$10$7r4eCIiH10kDWvLu8UbAA.xyIgJmzFEHKGPXiWMqq2iwdH0cjqz1m',
    'admin'
  )
ON CONFLICT (email) DO NOTHING;

COMMIT;
