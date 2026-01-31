-- ============================================
-- DIAGNOSTIC CHECK FOR REP TRACKER DATABASE
-- ============================================
-- Run this in Supabase SQL Editor to diagnose issues

-- 1. Check if exercises exist
SELECT 'Checking exercises...' as step;
SELECT id, name, detector_type FROM exercises ORDER BY name;

-- 2. Check RLS status on exercises table
SELECT 'Checking RLS on exercises table...' as step;
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'exercises';

-- 3. Check RLS policies on exercises table
SELECT 'Checking RLS policies on exercises...' as step;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'exercises';

-- 4. Check recent workouts
SELECT 'Checking recent workouts...' as step;
SELECT w.id, e.name as exercise_name, w.rep_count, w.created_at, w.video_url IS NOT NULL as has_video
FROM workouts w
JOIN exercises e ON e.id = w.exercise_id
ORDER BY w.created_at DESC
LIMIT 10;

-- 5. Check RLS policies on workouts table
SELECT 'Checking RLS policies on workouts...' as step;
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'workouts';
