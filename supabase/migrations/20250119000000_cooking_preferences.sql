/*
# Phase 1C: Cooking Preferences Migration

This migration creates the cooking_preferences table for cuisine and equipment preferences
following the feature-first/atomic component architecture.

## Changes:
- Create cooking_preferences table with cuisines, equipment, and spice preferences
- Add RLS policies for self-access only
- Add triggers for automatic updated_at
- Maintain backward compatibility

## Phase: 1C - Cooking Preferences
## Atomic Feature: Cuisine and equipment preferences management
*/

-- Create cooking_preferences table for cooking-specific preferences
CREATE TABLE IF NOT EXISTS cooking_preferences (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  preferred_cuisines text[] DEFAULT '{}',
  available_equipment text[] DEFAULT '{}',
  disliked_ingredients text[] DEFAULT '{}',
  spice_tolerance int DEFAULT 3 CHECK (spice_tolerance BETWEEN 1 AND 5),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE cooking_preferences ENABLE ROW LEVEL SECURITY;

-- Create self-access policy (users can only access their own cooking preferences)
CREATE POLICY "cooking_preferences_self_access" ON cooking_preferences 
  FOR ALL USING (auth.uid() = user_id);

-- Auto-update timestamp trigger
CREATE TRIGGER cooking_preferences_set_updated_at
  BEFORE UPDATE ON cooking_preferences
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS cooking_preferences_user_id_idx ON cooking_preferences (user_id);
CREATE INDEX IF NOT EXISTS cooking_preferences_cuisines_idx ON cooking_preferences USING GIN (preferred_cuisines);
CREATE INDEX IF NOT EXISTS cooking_preferences_equipment_idx ON cooking_preferences USING GIN (available_equipment);
CREATE INDEX IF NOT EXISTS cooking_preferences_spice_idx ON cooking_preferences (spice_tolerance);

-- Add helpful comments
COMMENT ON TABLE cooking_preferences IS 'User cooking preferences including cuisines, equipment, and spice tolerance';
COMMENT ON COLUMN cooking_preferences.preferred_cuisines IS 'Array of preferred cuisine types';
COMMENT ON COLUMN cooking_preferences.available_equipment IS 'Array of available cooking equipment';
COMMENT ON COLUMN cooking_preferences.disliked_ingredients IS 'Array of ingredients the user dislikes';
COMMENT ON COLUMN cooking_preferences.spice_tolerance IS 'Spice tolerance level from 1 (mild) to 5 (very hot)';
