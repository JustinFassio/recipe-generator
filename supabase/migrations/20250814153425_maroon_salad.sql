/*
# Recipe Generator Database Schema

1. New Tables
   - `recipes`
     - `id` (uuid, primary key)
     - `title` (text, recipe name)
     - `ingredients` (text[], list of ingredients)
     - `instructions` (text, cooking instructions)
     - `notes` (text, additional notes)
     - `image_url` (text, optional recipe image)
     - `created_at` (timestamp, auto-generated)
     - `updated_at` (timestamp, auto-updated)

2. Storage
   - `recipe-images` bucket for storing recipe photos

3. Security
   - Enable RLS on `recipes` table
   - Add policies for authenticated users to manage their own recipes
   - Configure storage policies for image uploads
*/

-- Create recipes table
CREATE TABLE IF NOT EXISTS recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  ingredients text[] DEFAULT '{}',
  instructions text DEFAULT '',
  notes text DEFAULT '',
  image_url text,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own recipes"
  ON recipes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own recipes"
  ON recipes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recipes"
  ON recipes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recipes"
  ON recipes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_recipes_updated_at 
  BEFORE UPDATE ON recipes 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for recipe images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('recipe-images', 'recipe-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload their own recipe images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'recipe-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view recipe images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'recipe-images');

CREATE POLICY "Users can update their own recipe images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'recipe-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own recipe images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'recipe-images' AND auth.uid()::text = (storage.foldername(name))[1]);