-- Add sets_data column to routine_exercises table to store individual set data
-- This stores a JSON array like: [{"reps": 8, "weight": "50"}, {"reps": 7, "weight": "45"}]
ALTER TABLE routine_exercises ADD COLUMN IF NOT EXISTS sets_data JSONB;

-- Keep target_weight for backwards compatibility
ALTER TABLE routine_exercises ADD COLUMN IF NOT EXISTS target_weight TEXT;
