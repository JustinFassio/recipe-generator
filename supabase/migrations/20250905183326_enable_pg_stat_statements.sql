-- Enable pg_stat_statements extension for query performance monitoring
-- This extension tracks execution statistics for all SQL statements executed by a server
-- It's essential for identifying slow queries and optimizing database performance

CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Grant usage on pg_stat_statements to authenticated users (optional)
-- This allows application-level monitoring tools to access query statistics
-- GRANT SELECT ON pg_stat_statements TO authenticated;

-- Note: The extension is already enabled in local development
-- This migration ensures it's also enabled in production environments
