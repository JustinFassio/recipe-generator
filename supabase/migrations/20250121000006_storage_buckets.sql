-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES 
  ('avatars', 'avatars', true, 5242880),
  ('recipe-images', 'recipe-images', true, 10485760)
ON CONFLICT (id) DO NOTHING;
