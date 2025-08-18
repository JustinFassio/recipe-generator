-- Add bio field to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio text;

-- Add length constraint for bio (optional, but reasonable limit)
ALTER TABLE profiles ADD CONSTRAINT profiles_bio_check 
  CHECK (length(bio) <= 500);

-- Add index for bio field (for potential search functionality)
CREATE INDEX IF NOT EXISTS profiles_bio_idx ON profiles USING gin(to_tsvector('english', bio));

-- Update the existing trigger to handle bio updates
-- (The moddatetime trigger already handles all columns, so no change needed)
