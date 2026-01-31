-- ============================================
-- ADD RLS POLICIES FOR EXERCISES TABLE (SAFE VERSION)
-- ============================================
-- This version won't fail if RLS is already enabled or policy exists

-- Enable RLS (will skip if already enabled)
DO $$
BEGIN
  ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
EXCEPTION22
  WHEN OTHERS THEN
    RAISE NOTICE 'RLS already enabled on exercises';
END $$;

-- Drop existing policy if it exists, then create it
DROP POLICY IF EXISTS "Anyone can view exercises" ON exercises;

CREATE POLICY "Anyone can view exercises"
  ON exercises FOR SELECT
  USING (true);

-- Verify it worked
SELECT 'RLS Status:' as check,
       CASE WHEN rowsecurity THEN 'ENABLED ✓' ELSE 'DISABLED ✗' END as status
FROM pg_tables
WHERE tablename = 'exercises';

SELECT 'Policy Status:' as check, policyname
FROM pg_policies
WHERE tablename = 'exercises';
