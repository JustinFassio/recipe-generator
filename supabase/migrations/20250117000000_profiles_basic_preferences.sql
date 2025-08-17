/*
# Phase 1A: Basic Profile Extensions Migration

This migration extends the existing profiles table with essential personalization fields
following the feature-first/atomic component architecture.

## Changes:
- Add region, language, units, time_per_meal, skill_level to profiles table
- Add appropriate constraints and defaults
- Maintain backward compatibility

## Phase: 1A - Basic Profile Extensions
## Atomic Feature: User personalization preferences
*/

-- Extend existing profiles table with essential fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS region text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS language text DEFAULT 'en';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS units text DEFAULT 'metric' 
  CHECK (units IN ('metric', 'imperial'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS time_per_meal int 
  CHECK (time_per_meal BETWEEN 10 AND 120);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS skill_level text DEFAULT 'beginner'
  CHECK (skill_level IN ('beginner', 'intermediate', 'advanced'));

-- Create index for performance on commonly queried fields
CREATE INDEX IF NOT EXISTS profiles_region_idx ON profiles (region);
CREATE INDEX IF NOT EXISTS profiles_skill_level_idx ON profiles (skill_level);

-- Update existing users with default values (optional - they can remain NULL)
-- This ensures existing users continue working without issues
UPDATE profiles 
SET 
  language = COALESCE(language, 'en'),
  units = COALESCE(units, 'metric'),
  skill_level = COALESCE(skill_level, 'beginner')
WHERE language IS NULL OR units IS NULL OR skill_level IS NULL;
