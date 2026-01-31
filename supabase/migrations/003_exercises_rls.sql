-- ============================================
-- ADD RLS POLICIES FOR EXERCISES TABLE
-- ============================================
-- Exercises should be readable by all authenticated users
-- since they're public reference data

ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read exercises
CREATE POLICY "Anyone can view exercises"
  ON exercises FOR SELECT
  USING (true);

-- Only allow system/admin to insert/update/delete exercises
-- (For now, we'll rely on the seed data in migrations)
