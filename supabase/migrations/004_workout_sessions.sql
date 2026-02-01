-- Migration: Create workout_sessions table for storing routine-based workouts
-- This stores complete workout sessions with all exercises and sets data

-- Create workout_sessions table
CREATE TABLE IF NOT EXISTS public.workout_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    routine_id UUID REFERENCES public.routines(id) ON DELETE SET NULL,
    routine_name TEXT NOT NULL,
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    total_volume NUMERIC NOT NULL DEFAULT 0,
    completed_sets INTEGER NOT NULL DEFAULT 0,
    total_sets INTEGER NOT NULL DEFAULT 0,
    exercises_data JSONB NOT NULL DEFAULT '[]'::jsonb,
    description TEXT,
    photo_url TEXT,
    visibility TEXT NOT NULL DEFAULT 'everyone' CHECK (visibility IN ('everyone', 'friends', 'private')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_id ON public.workout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_routine_id ON public.workout_sessions(routine_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_created_at ON public.workout_sessions(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own workout sessions
CREATE POLICY "Users can view their own workout sessions"
    ON public.workout_sessions
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workout sessions"
    ON public.workout_sessions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workout sessions"
    ON public.workout_sessions
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workout sessions"
    ON public.workout_sessions
    FOR DELETE
    USING (auth.uid() = user_id);

-- Comment on table
COMMENT ON TABLE public.workout_sessions IS 'Stores complete workout sessions with exercises and sets data';
COMMENT ON COLUMN public.workout_sessions.exercises_data IS 'JSONB array of exercises with sets: [{exerciseId, exerciseName, exerciseCategory, detectorType, sets: [{setNumber, weight, reps, completed}], notes}]';
