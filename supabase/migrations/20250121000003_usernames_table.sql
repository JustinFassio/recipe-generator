-- Create usernames table
CREATE TABLE usernames (
  username citext PRIMARY KEY CHECK (length(username) BETWEEN 3 AND 24 AND username ~ '^[a-z0-9_]+$'),
  user_id uuid UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE usernames ENABLE ROW LEVEL SECURITY;

-- Usernames policies
CREATE POLICY "usernames_select_all" ON usernames FOR SELECT USING (true);
CREATE POLICY "usernames_insert_own" ON usernames FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "usernames_update_own" ON usernames FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "usernames_delete_own" ON usernames FOR DELETE USING (auth.uid() = user_id);
