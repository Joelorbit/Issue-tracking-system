-- Migration V2: complaint issue categories + in-app notifications
-- Run this in Supabase SQL Editor for existing projects

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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

CREATE INDEX IF NOT EXISTS idx_complaints_issue_type ON complaints(issue_type);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

COMMIT;
