-- Comprehensive User System Extension
-- Implements Phase 1A, 1B, and 1C from account system documentation
-- Extends profiles table and adds user_safety and cooking_preferences tables

-- PHASE 1A: Extend profiles table with basic preferences
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS units TEXT DEFAULT 'metric'
    CHECK (units IN ('metric', 'imperial'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS time_per_meal INTEGER
    CHECK (time_per_meal BETWEEN 10 AND 120);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS skill_level TEXT DEFAULT 'beginner'
    CHECK (skill_level IN ('beginner', 'intermediate', 'advanced'));

-- PHASE 1B: Create user_safety table for safety-critical data
CREATE TABLE IF NOT EXISTS public.user_safety (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    allergies TEXT[] DEFAULT '{}',
    dietary_restrictions TEXT[] DEFAULT '{}',
    medical_conditions TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PHASE 1C: Create cooking_preferences table
CREATE TABLE IF NOT EXISTS public.cooking_preferences (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    preferred_cuisines TEXT[] DEFAULT '{}',
    available_equipment TEXT[] DEFAULT '{}',
    disliked_ingredients TEXT[] DEFAULT '{}',
    spice_tolerance INTEGER DEFAULT 3 CHECK (spice_tolerance BETWEEN 1 AND 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on new tables
ALTER TABLE public.user_safety ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cooking_preferences ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES for user_safety table
CREATE POLICY "Users can view their own safety data" ON public.user_safety
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own safety data" ON public.user_safety
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own safety data" ON public.user_safety
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own safety data" ON public.user_safety
    FOR DELETE USING (auth.uid() = user_id);

-- RLS POLICIES for cooking_preferences table
CREATE POLICY "Users can view their own cooking preferences" ON public.cooking_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cooking preferences" ON public.cooking_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cooking preferences" ON public.cooking_preferences
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cooking preferences" ON public.cooking_preferences
    FOR DELETE USING (auth.uid() = user_id);

-- Add updated_at triggers for new tables
CREATE TRIGGER update_user_safety_updated_at
    BEFORE UPDATE ON public.user_safety
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cooking_preferences_updated_at
    BEFORE UPDATE ON public.cooking_preferences
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Update the handle_new_user function to initialize safety and cooking preference records
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if profile already exists to avoid conflicts
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
        INSERT INTO public.profiles (id, username, full_name)
        VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
            COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name')
        );
    END IF;
    
    -- Check if username already exists to avoid conflicts
    IF NOT EXISTS (SELECT 1 FROM public.usernames WHERE user_id = NEW.id) THEN
        INSERT INTO public.usernames (username, user_id)
        VALUES (
            COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
            NEW.id
        );
    END IF;
    
    -- Initialize user safety record
    IF NOT EXISTS (SELECT 1 FROM public.user_safety WHERE user_id = NEW.id) THEN
        INSERT INTO public.user_safety (user_id)
        VALUES (NEW.id);
    END IF;
    
    -- Initialize cooking preferences record
    IF NOT EXISTS (SELECT 1 FROM public.cooking_preferences WHERE user_id = NEW.id) THEN
        INSERT INTO public.cooking_preferences (user_id)
        VALUES (NEW.id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_safety_user_id ON public.user_safety(user_id);
CREATE INDEX IF NOT EXISTS idx_cooking_preferences_user_id ON public.cooking_preferences(user_id);

-- Add comments for documentation
COMMENT ON TABLE public.user_safety IS 'Safety-critical user data: allergies, dietary restrictions, and medical conditions';
COMMENT ON TABLE public.cooking_preferences IS 'User cooking preferences: cuisines, equipment, spice tolerance, and ingredient dislikes';

COMMENT ON COLUMN public.profiles.region IS 'User''s geographic region for localized recipe suggestions';
COMMENT ON COLUMN public.profiles.language IS 'User''s preferred language (ISO 639-1 code)';
COMMENT ON COLUMN public.profiles.units IS 'Preferred measurement system: metric or imperial';
COMMENT ON COLUMN public.profiles.time_per_meal IS 'Preferred cooking time in minutes (10-120)';
COMMENT ON COLUMN public.profiles.skill_level IS 'User''s cooking skill level: beginner, intermediate, or advanced';

COMMENT ON COLUMN public.user_safety.allergies IS 'Array of food allergies - critical for AI safety filtering';
COMMENT ON COLUMN public.user_safety.dietary_restrictions IS 'Array of dietary restrictions (vegan, vegetarian, etc.)';
COMMENT ON COLUMN public.user_safety.medical_conditions IS 'Array of medical conditions affecting diet';

COMMENT ON COLUMN public.cooking_preferences.preferred_cuisines IS 'Array of preferred cuisine types';
COMMENT ON COLUMN public.cooking_preferences.available_equipment IS 'Array of available cooking equipment';
COMMENT ON COLUMN public.cooking_preferences.disliked_ingredients IS 'Array of ingredients the user dislikes';
COMMENT ON COLUMN public.cooking_preferences.spice_tolerance IS 'Spice tolerance level on scale of 1-5';
