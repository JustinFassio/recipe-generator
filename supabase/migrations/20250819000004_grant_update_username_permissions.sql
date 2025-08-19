-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_username_atomic(uuid, citext) TO authenticated;
