-- Create get_complete_user_profile function
-- This function returns a complete user profile with all related data

CREATE OR REPLACE FUNCTION get_complete_user_profile(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    -- Get the profile data
    SELECT json_build_object(
        'id', p.id,
        'username', p.username,
        'full_name', p.full_name,
        'units', p.units,
        'time_per_meal', p.time_per_meal,
        'skill_level', p.skill_level,
        'created_at', p.created_at,
        'updated_at', p.updated_at
    ) INTO result
    FROM profiles p
    WHERE p.id = p_user_id;
    
    RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_complete_user_profile(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_complete_user_profile(UUID) TO service_role;
