-- Populate usernames table with existing usernames from profiles
INSERT INTO usernames (username, user_id)
SELECT username, id 
FROM profiles 
WHERE username IS NOT NULL
ON CONFLICT (username) DO NOTHING;
