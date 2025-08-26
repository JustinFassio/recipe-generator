drop extension if exists "pg_net";

drop trigger if exists "profiles_set_updated_at" on "public"."profiles";

drop trigger if exists "recipes_set_updated_at" on "public"."recipes";

drop policy "Public recipes are viewable by everyone" on "public"."recipes";

drop policy "Users can delete their own recipes" on "public"."recipes";

drop policy "Users can insert their own recipes" on "public"."recipes";

drop policy "Users can update their own recipes" on "public"."recipes";

drop policy "Users can view their own recipes" on "public"."recipes";

alter table "public"."recipes" drop constraint "check_category_count";

drop function if exists "public"."update_username_atomic"(p_user_id uuid, p_new_username citext);

alter table "public"."recipes" add column "cooking_time" text;

alter table "public"."recipes" add column "difficulty" text;

alter table "public"."recipes" alter column "categories" drop not null;

CREATE INDEX idx_profiles_created_at ON public.profiles USING btree (created_at);

CREATE INDEX idx_profiles_username ON public.profiles USING btree (username);

CREATE INDEX idx_recipes_cooking_time ON public.recipes USING btree (cooking_time);

CREATE INDEX idx_recipes_created_at ON public.recipes USING btree (created_at);

CREATE INDEX idx_recipes_difficulty ON public.recipes USING btree (difficulty);

CREATE INDEX idx_recipes_is_public ON public.recipes USING btree (is_public);

CREATE INDEX idx_recipes_user_id ON public.recipes USING btree (user_id);

alter table "public"."recipes" add constraint "recipes_cooking_time_check" CHECK ((cooking_time = ANY (ARRAY['quick'::text, 'medium'::text, 'long'::text]))) not valid;

alter table "public"."recipes" validate constraint "recipes_cooking_time_check";

alter table "public"."recipes" add constraint "recipes_difficulty_check" CHECK ((difficulty = ANY (ARRAY['beginner'::text, 'intermediate'::text, 'advanced'::text]))) not valid;

alter table "public"."recipes" validate constraint "recipes_difficulty_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.claim_username_atomic(p_user_id uuid, p_username citext)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  username_exists boolean;
BEGIN
  SELECT EXISTS(SELECT 1 FROM profiles WHERE username = p_username AND id != p_user_id) INTO username_exists;
  IF username_exists THEN
    RETURN false;
  END IF;
  UPDATE profiles SET username = p_username WHERE id = p_user_id;
  RETURN FOUND;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$function$
;


