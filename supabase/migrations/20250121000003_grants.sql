-- Grant execute permissions
GRANT EXECUTE ON FUNCTION is_username_available TO authenticated;
GRANT EXECUTE ON FUNCTION update_username_atomic TO authenticated;
