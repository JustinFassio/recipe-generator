-- Geographic Fields Expansion for North America
-- Replaces single 'region' field with granular geographic data
-- Supports countries, states/provinces, and cities for better recipe personalization

-- Add new geographic fields to profiles table
ALTER TABLE profiles 
ADD COLUMN country text,
ADD COLUMN state_province text,
ADD COLUMN city text;

-- Add constraints for geographic fields
ALTER TABLE profiles 
ADD CONSTRAINT profiles_country_check 
  CHECK (country IS NULL OR length(trim(country)) BETWEEN 2 AND 50);

ALTER TABLE profiles 
ADD CONSTRAINT profiles_state_province_check 
  CHECK (state_province IS NULL OR length(trim(state_province)) BETWEEN 2 AND 50);

ALTER TABLE profiles 
ADD CONSTRAINT profiles_city_check 
  CHECK (city IS NULL OR length(trim(city)) BETWEEN 2 AND 50);

-- Add indexes for better query performance
CREATE INDEX idx_profiles_country ON profiles(country) WHERE country IS NOT NULL;
CREATE INDEX idx_profiles_state_province ON profiles(state_province) WHERE state_province IS NOT NULL;
CREATE INDEX idx_profiles_city ON profiles(city) WHERE city IS NOT NULL;

-- Create a composite index for geographic queries
CREATE INDEX idx_profiles_geographic ON profiles(country, state_province, city) 
WHERE country IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN profiles.country IS 'Country name (e.g., United States, Canada, Mexico)';
COMMENT ON COLUMN profiles.state_province IS 'State or Province name (e.g., California, Ontario, Jalisco)';
COMMENT ON COLUMN profiles.city IS 'City name (e.g., San Francisco, Toronto, Guadalajara)';
COMMENT ON COLUMN profiles.region IS 'Legacy field - will be deprecated after migration';

-- Create a function to generate geographic display name
CREATE OR REPLACE FUNCTION get_geographic_display_name(
  p_country text,
  p_state_province text,
  p_city text
) RETURNS text AS $$
BEGIN
  -- If all three fields are provided, return full address
  IF p_city IS NOT NULL AND p_state_province IS NOT NULL AND p_country IS NOT NULL THEN
    RETURN p_city || ', ' || p_state_province || ', ' || p_country;
  END IF;
  
  -- If city and state/province are provided
  IF p_city IS NOT NULL AND p_state_province IS NOT NULL THEN
    RETURN p_city || ', ' || p_state_province;
  END IF;
  
  -- If only state/province and country are provided
  IF p_state_province IS NOT NULL AND p_country IS NOT NULL THEN
    RETURN p_state_province || ', ' || p_country;
  END IF;
  
  -- If only city and country are provided
  IF p_city IS NOT NULL AND p_country IS NOT NULL THEN
    RETURN p_city || ', ' || p_country;
  END IF;
  
  -- Return the first non-null field
  IF p_city IS NOT NULL THEN
    RETURN p_city;
  END IF;
  
  IF p_state_province IS NOT NULL THEN
    RETURN p_state_province;
  END IF;
  
  IF p_country IS NOT NULL THEN
    RETURN p_country;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create a view for easy geographic data access
CREATE VIEW profiles_with_geography AS
SELECT 
  id,
  username,
  full_name,
  avatar_url,
  bio,
  country,
  state_province,
  city,
  region, -- Legacy field
  get_geographic_display_name(country, state_province, city) as geographic_display_name,
  language,
  units,
  time_per_meal,
  skill_level,
  created_at,
  updated_at
FROM profiles;

-- Grant permissions on the view
GRANT SELECT ON profiles_with_geography TO authenticated;

-- Create a function to migrate existing region data to new fields
CREATE OR REPLACE FUNCTION migrate_region_to_geographic_fields()
RETURNS void AS $$
DECLARE
  profile_record RECORD;
  country_name text;
  state_name text;
  city_name text;
BEGIN
  -- Loop through all profiles with region data
  FOR profile_record IN 
    SELECT id, region 
    FROM profiles 
    WHERE region IS NOT NULL AND trim(region) != ''
  LOOP
    -- Parse common North American region formats
    -- This is a basic parser - can be enhanced based on actual data patterns
    
    -- Check for common country patterns
    IF profile_record.region ILIKE '%united states%' OR 
       profile_record.region ILIKE '%usa%' OR 
       profile_record.region ~* '\mus\M' THEN
      country_name := 'United States';
    ELSIF profile_record.region ILIKE '%canada%' THEN
      country_name := 'Canada';
    ELSIF profile_record.region ILIKE '%mexico%' THEN
      country_name := 'Mexico';
    ELSIF profile_record.region ILIKE '%north america%' THEN
      country_name := 'North America';
    ELSE
      -- For other regions, try to extract country name
      country_name := profile_record.region;
    END IF;
    
    -- Update the profile with parsed data
    UPDATE profiles 
    SET 
      country = country_name,
      state_province = NULL, -- Will need manual review for state/province
      city = NULL -- Will need manual review for city
    WHERE id = profile_record.id;
    
  END LOOP;
  
  RAISE NOTICE 'Migration completed. Please review and update state_province and city fields manually.';
END;
$$ LANGUAGE plpgsql;

-- Run the migration function
SELECT migrate_region_to_geographic_fields();

-- Drop the migration function after use
DROP FUNCTION migrate_region_to_geographic_fields();
