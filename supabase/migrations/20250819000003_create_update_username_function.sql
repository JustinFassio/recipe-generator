-- Function to update username (allows changing existing username)
CREATE OR REPLACE FUNCTION public.update_username_atomic(
  p_user_id uuid,
  p_new_username citext
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  existing_username citext;
  existing_user_id uuid;
  result json;
BEGIN
  -- Check if the new username is already taken by someone else
  SELECT user_id INTO existing_user_id
  FROM public.usernames
  WHERE username = p_new_username;

  IF existing_user_id IS NOT NULL AND existing_user_id != p_user_id THEN
    RAISE EXCEPTION 'username_already_taken: Username % is already taken', p_new_username;
  END IF;

  -- Get current username for logging
  SELECT username INTO existing_username
  FROM public.profiles
  WHERE id = p_user_id;

  -- Begin transaction (implicit in function)
  
  -- Remove old username from usernames table if it exists
  IF existing_username IS NOT NULL THEN
    DELETE FROM public.usernames WHERE username = existing_username;
  END IF;

  -- Insert new username into usernames table
  INSERT INTO public.usernames (username, user_id)
  VALUES (p_new_username, p_user_id);

  -- Update the profile with the new username
  UPDATE public.profiles
  SET username = p_new_username,
      updated_at = now()
  WHERE id = p_user_id;

  -- Return success result
  result := json_build_object(
    'success', true,
    'username', p_new_username,
    'user_id', p_user_id,
    'previous_username', existing_username
  );

  RETURN result;

EXCEPTION
  WHEN unique_violation THEN
    -- This catches both username PK violation and profile username unique violation
    RAISE EXCEPTION 'username_already_taken: Username % is already taken', p_new_username;
  WHEN OTHERS THEN
    -- Re-raise any other exceptions
    RAISE;
END;
$$;
