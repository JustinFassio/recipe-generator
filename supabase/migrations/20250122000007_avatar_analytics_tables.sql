-- Avatar Analytics Tables
-- Tracks avatar upload performance, compression ratios, and user engagement

-- Individual avatar events table
CREATE TABLE avatar_analytics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type text NOT NULL CHECK (event_type IN ('upload', 'view', 'cache')),
  event_data jsonb NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Analytics summary table for aggregated data
CREATE TABLE avatar_analytics_summary (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  analytics_data jsonb NOT NULL,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE avatar_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE avatar_analytics_summary ENABLE ROW LEVEL SECURITY;

-- RLS Policies for avatar_analytics
CREATE POLICY "avatar_analytics_insert_own" ON avatar_analytics
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "avatar_analytics_select_own" ON avatar_analytics
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- RLS Policies for avatar_analytics_summary (admin only)
CREATE POLICY "avatar_analytics_summary_select_admin" ON avatar_analytics_summary
  FOR SELECT USING (false); -- Only accessible via service role

CREATE POLICY "avatar_analytics_summary_insert_admin" ON avatar_analytics_summary
  FOR INSERT WITH CHECK (false); -- Only accessible via service role

-- Indexes for performance
CREATE INDEX idx_avatar_analytics_event_type ON avatar_analytics(event_type);
CREATE INDEX idx_avatar_analytics_user_id ON avatar_analytics(user_id);
CREATE INDEX idx_avatar_analytics_created_at ON avatar_analytics(created_at);
CREATE INDEX idx_avatar_analytics_summary_period ON avatar_analytics_summary(period_start, period_end);

-- Function to clean up old analytics data (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_avatar_analytics()
RETURNS void AS $$
BEGIN
  DELETE FROM avatar_analytics 
  WHERE created_at < now() - interval '30 days';
  
  DELETE FROM avatar_analytics_summary 
  WHERE created_at < now() - interval '90 days';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up old data (if pg_cron is available)
-- This would need to be set up manually in production
-- SELECT cron.schedule('cleanup-avatar-analytics', '0 2 * * *', 'SELECT cleanup_old_avatar_analytics();');

-- Grant permissions
GRANT SELECT, INSERT ON avatar_analytics TO authenticated;
GRANT SELECT, INSERT ON avatar_analytics_summary TO service_role;
