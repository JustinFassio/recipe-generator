-- Username Function Permissions
-- Grant permissions for username functions

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.claim_username_atomic(uuid, citext) TO authenticated;
