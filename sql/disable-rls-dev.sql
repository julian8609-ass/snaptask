-- This script allows unauthenticated inserts for development
-- DISABLE RLS policies for testing (be careful in production!)

-- Disable RLS on tables temporarily
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE reminders DISABLE ROW LEVEL SECURITY;
ALTER TABLE xp_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reflections DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE task_tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE achievements DISABLE ROW LEVEL SECURITY;

-- Now data can be inserted without authentication
-- Re-enable when ready for production
