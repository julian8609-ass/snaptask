-- ========================================
-- DEMO USER SETUP FOR SNAPTASK
-- ========================================
-- Run this FIRST after creating tables
-- This creates a demo user with valid UUID
-- ========================================

-- 1. Delete demo user if exists (for reset)
-- DELETE FROM user_profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440000';
-- DELETE FROM users WHERE id = '550e8400-e29b-41d4-a716-446655440000';

-- 2. Insert demo user (REQUIRED)
INSERT INTO users (
  id,
  email,
  username,
  full_name,
  personality_type,
  energy_level,
  mood,
  created_at,
  updated_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'demo@snaptask.local',
  'demo_user',
  'Demo User',
  'explorer',
  50,
  'neutral',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
) ON CONFLICT DO NOTHING;

-- 3. Insert demo user profile (REQUIRED)
INSERT INTO user_profiles (
  user_id,
  bio,
  theme,
  timezone,
  notifications_enabled,
  email_notifications,
  push_notifications,
  total_xp,
  level,
  streak_days,
  created_at,
  updated_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'Demo account for testing SnapTask',
  'dark',
  'UTC',
  true,
  true,
  true,
  0,
  1,
  0,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
) ON CONFLICT (user_id) DO NOTHING;

-- 4. Verify user was created
SELECT 
  u.id,
  u.email,
  u.username,
  up.total_xp,
  up.level,
  up.theme
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE u.id = '550e8400-e29b-41d4-a716-446655440000';
