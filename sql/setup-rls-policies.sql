-- Proper RLS Policies for Production (with authentication)

-- DROP existing policies first
DROP POLICY IF EXISTS "Users can view their own data" ON tasks;
DROP POLICY IF EXISTS "Users can insert their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can view their own events" ON events;
DROP POLICY IF EXISTS "Users can insert their own events" ON events;
DROP POLICY IF EXISTS "Users can update their own events" ON events;
DROP POLICY IF EXISTS "Users can delete their own events" ON events;

-- Re-enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- TASKS Policies
CREATE POLICY "tasks_select" ON tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "tasks_insert" ON tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tasks_update" ON tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "tasks_delete" ON tasks
  FOR DELETE USING (auth.uid() = user_id);

-- EVENTS Policies
CREATE POLICY "events_select" ON events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "events_insert" ON events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "events_update" ON events
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "events_delete" ON events
  FOR DELETE USING (auth.uid() = user_id);

-- REMINDERS Policies
CREATE POLICY "reminders_select" ON reminders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "reminders_insert" ON reminders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reminders_update" ON reminders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "reminders_delete" ON reminders
  FOR DELETE USING (auth.uid() = user_id);

-- XP_LOGS Policies
CREATE POLICY "xp_logs_select" ON xp_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "xp_logs_insert" ON xp_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- DAILY_REFLECTIONS Policies
CREATE POLICY "daily_reflections_select" ON daily_reflections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "daily_reflections_insert" ON daily_reflections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "daily_reflections_update" ON daily_reflections
  FOR UPDATE USING (auth.uid() = user_id);

-- USER_PROFILES Policies
CREATE POLICY "user_profiles_select" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_profiles_update" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- TASK_TAGS Policies
CREATE POLICY "task_tags_select" ON task_tags
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "task_tags_insert" ON task_tags
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "task_tags_delete" ON task_tags
  FOR DELETE USING (auth.uid() = user_id);

-- ACHIEVEMENTS Policies
CREATE POLICY "achievements_select" ON achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "achievements_insert" ON achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);
