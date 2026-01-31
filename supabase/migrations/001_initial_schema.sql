-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- EXERCISES TABLE
-- ============================================
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  detector_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed data: Push-ups (MVP exercise)
INSERT INTO exercises (id, name, category, description, detector_type)
VALUES
  (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'Push-ups',
    'upper-body',
    'Classic push-up exercise targeting chest, triceps, and shoulders.',
    'pushup'
  ),
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
  );

-- ============================================
-- WORKOUTS TABLE
-- ============================================
CREATE TABLE workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES exercises(id) NOT NULL,
  rep_count INTEGER NOT NULL,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  form_score INTEGER,
  avg_time_per_rep FLOAT,
  video_url TEXT,
  manual_entry BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row-level security
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workouts"
  ON workouts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workouts"
  ON workouts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workouts"
  ON workouts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workouts"
  ON workouts FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- WORKOUT_REPS TABLE
-- ============================================
CREATE TABLE workout_reps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE NOT NULL,
  rep_number INTEGER NOT NULL,
  duration_ms INTEGER NOT NULL,
  quality TEXT NOT NULL,
  form_score INTEGER,
  feedback JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE workout_reps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workout reps"
  ON workout_reps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workouts
      WHERE workouts.id = workout_reps.workout_id
      AND workouts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own workout reps"
  ON workout_reps FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workouts
      WHERE workouts.id = workout_reps.workout_id
      AND workouts.user_id = auth.uid()
    )
  );

-- ============================================
-- STORAGE BUCKET FOR WORKOUT VIDEOS
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'workout-videos',
  'workout-videos',
  true,  -- Public bucket so videos can be played back
  104857600,  -- 100MB
  ARRAY['video/webm', 'video/mp4']
) ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage policies: users can only access their own folder
CREATE POLICY "Users can upload own videos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'workout-videos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own videos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'workout-videos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own videos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'workout-videos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
