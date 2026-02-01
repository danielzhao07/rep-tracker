-- Create routines table
CREATE TABLE IF NOT EXISTS routines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create routine_exercises table (junction table between routines and exercises)
CREATE TABLE IF NOT EXISTS routine_exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  routine_id UUID NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  target_sets INTEGER NOT NULL DEFAULT 3,
  target_reps INTEGER,
  rest_seconds INTEGER NOT NULL DEFAULT 90,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(routine_id, exercise_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_routines_user_id ON routines(user_id);
CREATE INDEX IF NOT EXISTS idx_routines_is_active ON routines(is_active);
CREATE INDEX IF NOT EXISTS idx_routine_exercises_routine_id ON routine_exercises(routine_id);
CREATE INDEX IF NOT EXISTS idx_routine_exercises_exercise_id ON routine_exercises(exercise_id);
CREATE INDEX IF NOT EXISTS idx_routine_exercises_order ON routine_exercises(routine_id, order_index);

-- Enable Row Level Security
ALTER TABLE routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_exercises ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own routines" ON routines;
DROP POLICY IF EXISTS "Users can insert their own routines" ON routines;
DROP POLICY IF EXISTS "Users can update their own routines" ON routines;
DROP POLICY IF EXISTS "Users can delete their own routines" ON routines;
DROP POLICY IF EXISTS "Users can view exercises in their routines" ON routine_exercises;
DROP POLICY IF EXISTS "Users can insert exercises in their routines" ON routine_exercises;
DROP POLICY IF EXISTS "Users can update exercises in their routines" ON routine_exercises;
DROP POLICY IF EXISTS "Users can delete exercises from their routines" ON routine_exercises;

-- Create RLS policies for routines
CREATE POLICY "Users can view their own routines"
  ON routines FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own routines"
  ON routines FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own routines"
  ON routines FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own routines"
  ON routines FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for routine_exercises
CREATE POLICY "Users can view exercises in their routines"
  ON routine_exercises FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM routines
      WHERE routines.id = routine_exercises.routine_id
      AND routines.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert exercises in their routines"
  ON routine_exercises FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM routines
      WHERE routines.id = routine_exercises.routine_id
      AND routines.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update exercises in their routines"
  ON routine_exercises FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM routines
      WHERE routines.id = routine_exercises.routine_id
      AND routines.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM routines
      WHERE routines.id = routine_exercises.routine_id
      AND routines.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete exercises from their routines"
  ON routine_exercises FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM routines
      WHERE routines.id = routine_exercises.routine_id
      AND routines.user_id = auth.uid()
    )
  );

-- Add created_by column to exercises table for custom exercises
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT false;

-- Create index for custom exercises
CREATE INDEX IF NOT EXISTS idx_exercises_created_by ON exercises(created_by);
CREATE INDEX IF NOT EXISTS idx_exercises_is_custom ON exercises(is_custom);

-- Update RLS policies for exercises to allow users to create custom exercises
DROP POLICY IF EXISTS "Users can insert custom exercises" ON exercises;
CREATE POLICY "Users can insert custom exercises"
  ON exercises FOR INSERT
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update their custom exercises" ON exercises;
CREATE POLICY "Users can update their custom exercises"
  ON exercises FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can delete their custom exercises" ON exercises;
CREATE POLICY "Users can delete their custom exercises"
  ON exercises FOR DELETE
  USING (auth.uid() = created_by);
