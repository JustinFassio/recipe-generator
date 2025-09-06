-- Add database monitoring functions for performance tracking
-- These functions provide insights into database health and performance

-- Function to get slow queries (requires pg_stat_statements extension)
-- This helps identify queries that need optimization
CREATE OR REPLACE FUNCTION get_slow_queries()
RETURNS TABLE (
  query text,
  calls bigint,
  total_exec_time double precision,
  mean_exec_time double precision
) 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pss.query,
    pss.calls,
    pss.total_exec_time,
    pss.mean_exec_time
  FROM pg_stat_statements pss
  WHERE pss.mean_exec_time > 100 -- Queries taking more than 100ms on average
    AND pss.query NOT LIKE '%pg_stat%' -- Exclude monitoring queries
    AND pss.query NOT LIKE '%information_schema%' -- Exclude system queries
  ORDER BY pss.mean_exec_time DESC
  LIMIT 10;
EXCEPTION
  WHEN undefined_table THEN
    -- pg_stat_statements not available, return empty result
    RETURN;
  WHEN insufficient_privilege THEN
    -- User doesn't have access to pg_stat_statements
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Function to get table statistics for monitoring database growth and usage
CREATE OR REPLACE FUNCTION get_table_stats()
RETURNS TABLE (
  table_name text,
  row_count bigint,
  size text,
  index_count bigint,
  last_vacuum timestamp with time zone,
  last_analyze timestamp with time zone
)
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.table_name::text,
    COALESCE(s.n_live_tup, 0) as row_count,
    pg_size_pretty(pg_total_relation_size(t.table_name::regclass)) as size,
    COALESCE(idx.index_count, 0) as index_count,
    s.last_vacuum,
    s.last_analyze
  FROM information_schema.tables t
  LEFT JOIN pg_stat_user_tables s ON s.relname = t.table_name
  LEFT JOIN (
    SELECT tablename, count(*) as index_count
    FROM pg_indexes
    WHERE schemaname = 'public'
    GROUP BY tablename
  ) idx ON idx.tablename = t.table_name
  WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
  ORDER BY s.n_live_tup DESC NULLS LAST;
EXCEPTION
  WHEN others THEN
    -- Fallback to basic table list if detailed stats aren't available
    RETURN QUERY
    SELECT 
      t.table_name::text,
      0::bigint as row_count,
      'N/A'::text as size,
      0::bigint as index_count,
      NULL::timestamp with time zone as last_vacuum,
      NULL::timestamp with time zone as last_analyze
    FROM information_schema.tables t
    WHERE t.table_schema = 'public'
      AND t.table_type = 'BASE TABLE';
END;
$$ LANGUAGE plpgsql;

-- Function to get database connection and performance metrics
CREATE OR REPLACE FUNCTION get_database_metrics()
RETURNS TABLE (
  active_connections int,
  max_connections int,
  database_size text,
  cache_hit_ratio numeric,
  transactions_per_second numeric
)
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT count(*) FROM pg_stat_activity WHERE state = 'active')::int as active_connections,
    current_setting('max_connections')::int as max_connections,
    pg_size_pretty(pg_database_size(current_database())) as database_size,
    ROUND(
      (SELECT sum(blks_hit) * 100.0 / NULLIF(sum(blks_hit + blks_read), 0) 
       FROM pg_stat_database), 2
    ) as cache_hit_ratio,
    ROUND(
      (SELECT sum(xact_commit + xact_rollback) / EXTRACT(EPOCH FROM (now() - stats_reset))
       FROM pg_stat_database 
       WHERE datname = current_database()), 2
    ) as transactions_per_second;
EXCEPTION
  WHEN others THEN
    -- Return safe defaults if metrics aren't available
    RETURN QUERY
    SELECT 
      0::int as active_connections,
      100::int as max_connections,
      'N/A'::text as database_size,
      0::numeric as cache_hit_ratio,
      0::numeric as transactions_per_second;
END;
$$ LANGUAGE plpgsql;

-- Function to check index usage and identify unused indexes
CREATE OR REPLACE FUNCTION get_index_usage()
RETURNS TABLE (
  table_name text,
  index_name text,
  index_size text,
  index_scans bigint,
  tuples_read bigint,
  tuples_fetched bigint,
  usage_ratio numeric
)
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.schemaname || '.' || i.tablename as table_name,
    i.indexrelname as index_name,
    pg_size_pretty(pg_relation_size(i.indexrelname::regclass)) as index_size,
    i.idx_scan as index_scans,
    i.idx_tup_read as tuples_read,
    i.idx_tup_fetch as tuples_fetched,
    CASE 
      WHEN i.idx_scan = 0 THEN 0
      ELSE ROUND(i.idx_tup_fetch::numeric / NULLIF(i.idx_tup_read, 0) * 100, 2)
    END as usage_ratio
  FROM pg_stat_user_indexes i
  JOIN pg_indexes idx ON idx.indexname = i.indexrelname
  WHERE i.schemaname = 'public'
  ORDER BY i.idx_scan DESC, pg_relation_size(i.indexrelname::regclass) DESC;
EXCEPTION
  WHEN others THEN
    -- Return empty result if index stats aren't available
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions to authenticated users for monitoring functions
GRANT EXECUTE ON FUNCTION get_slow_queries() TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_database_metrics() TO authenticated;
GRANT EXECUTE ON FUNCTION get_index_usage() TO authenticated;
