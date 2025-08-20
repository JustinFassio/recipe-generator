-- Fix the handle_new_user function to handle existing users gracefully
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if profile already exists to avoid conflicts
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
        INSERT INTO public.profiles (id, username, full_name)
        VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
            COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name')
        );
    END IF;
    
    -- Check if username already exists to avoid conflicts
    IF NOT EXISTS (SELECT 1 FROM public.usernames WHERE user_id = NEW.id) THEN
        INSERT INTO public.usernames (username, user_id)
        VALUES (
            COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
            NEW.id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
