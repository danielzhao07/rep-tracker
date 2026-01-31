-- ============================================
-- FIX MISSING EXERCISES AND RLS POLICY
-- ============================================
-- Run this entire file in Supabase SQL Editor

-- Step 1: Insert the missing bicep curl exercises
INSERT INTO exercises (id, name, category, description, detector_type)
VALUES
  (
    'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    'Bicep Curls (Both Arms)',
    'upper-body',
    'Bicep curl exercise with both arms curling together. Tracks reps when both arms complete the curl.',
    'bicep-curl'
  ),
  (
    'b3c4d5e6-f7a8-9012-bcde-f12345678902',
    'Alternating Bicep Curls',
    'upper-body',
    'Alternating bicep curls where each arm curls independently. Tracks left and right arm reps separately.',
    'alternating-bicep-curl'
  ),
  (
    'c3d4e5f6-a7b8-9012-cdef-123456789012',
    'Squats',
    'lower-body',
    'Bodyweight squat exercise targeting quads, glutes, and hamstrings.',
    'squat'
  )
ON CONFLICT (id) DO NOTHING;

-- Step 2: Add RLS policy to allow reading exercises
DROP POLICY IF EXISTS "Anyone can view exercises" ON exercises;

CREATE POLICY "Anyone can view exercises"
  ON exercises FOR SELECT
  USING (true);

-- Step 3: Verify everything worked
SELECT '=== ALL EXERCISES IN DATABASE ===' as status;
SELECT id, name, detector_type, category
FROM exercises
ORDER BY name;

SELECT '' as spacer;
SELECT '=== RLS POLICY CHECK ===' as status;
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'exercises';

SELECT '' as spacer;
SELECT '=== READY TO USE ===' as status;
SELECT 'All exercises are now available!' as message;
