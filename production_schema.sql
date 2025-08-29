

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."claim_username_atomic"("p_user_id" "uuid", "p_username" "public"."citext") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."claim_username_atomic"("p_user_id" "uuid", "p_username" "public"."citext") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_username_available"("check_username" "public"."citext") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  username_exists boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM profiles
    WHERE username = check_username
  ) INTO username_exists;
  RETURN NOT username_exists;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;


ALTER FUNCTION "public"."is_username_available"("check_username" "public"."citext") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_username_atomic"("p_user_id" "uuid", "p_new_username" "public"."citext") RETURNS json
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
  username_exists boolean;
  result json;
BEGIN
  -- Security check - ensure user can only update their own username
  IF auth.uid() != p_user_id THEN
    result := json_build_object('success', false, 'error', 'unauthorized');
    RETURN result;
  END IF;

  -- Check if username is already taken by another user
  SELECT EXISTS(
    SELECT 1 FROM usernames
    WHERE username = p_new_username AND user_id != p_user_id
  ) INTO username_exists;

  IF username_exists THEN
    result := json_build_object('success', false, 'error', 'username_already_taken');
    RETURN result;
  END IF;

  -- Update the user's username in profiles table
  UPDATE profiles 
  SET username = p_new_username, updated_at = NOW()
  WHERE id = p_user_id;

  -- Update or insert into usernames table
  INSERT INTO usernames (username, user_id)
  VALUES (p_new_username, p_user_id)
  ON CONFLICT (user_id)
  DO UPDATE SET username = EXCLUDED.username, updated_at = NOW();

  IF FOUND THEN
    result := json_build_object('success', true);
  ELSE
    result := json_build_object('success', false, 'error', 'user_not_found');
  END IF;

  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    result := json_build_object('success', false, 'error', SQLERRM);
    RETURN result;
END;
$$;


ALTER FUNCTION "public"."update_username_atomic"("p_user_id" "uuid", "p_new_username" "public"."citext") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."cooking_preferences" (
    "user_id" "uuid" NOT NULL,
    "preferred_cuisines" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "available_equipment" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "disliked_ingredients" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "spice_tolerance" integer DEFAULT 3,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "cooking_preferences_spice_tolerance_check" CHECK ((("spice_tolerance" >= 1) AND ("spice_tolerance" <= 5)))
);


ALTER TABLE "public"."cooking_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "username" "public"."citext",
    "full_name" "text",
    "avatar_url" "text",
    "bio" "text",
    "region" "text",
    "language" "text" DEFAULT 'en'::"text" NOT NULL,
    "units" "text" DEFAULT 'metric'::"text" NOT NULL,
    "time_per_meal" integer,
    "skill_level" "text" DEFAULT 'beginner'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "profiles_bio_check" CHECK (("length"("bio") <= 500)),
    CONSTRAINT "profiles_full_name_check" CHECK ((("length"(TRIM(BOTH FROM "full_name")) >= 1) AND ("length"(TRIM(BOTH FROM "full_name")) <= 80))),
    CONSTRAINT "profiles_skill_level_check" CHECK (("skill_level" = ANY (ARRAY['beginner'::"text", 'intermediate'::"text", 'advanced'::"text", 'expert'::"text", 'chef'::"text"]))),
    CONSTRAINT "profiles_time_per_meal_check" CHECK ((("time_per_meal" IS NULL) OR (("time_per_meal" >= 10) AND ("time_per_meal" <= 120)))),
    CONSTRAINT "profiles_units_check" CHECK (("units" = ANY (ARRAY['metric'::"text", 'imperial'::"text"]))),
    CONSTRAINT "profiles_username_check" CHECK (((("length"(("username")::"text") >= 3) AND ("length"(("username")::"text") <= 24)) AND ("username" OPERATOR("public".~) '^[a-z0-9_]+$'::"public"."citext")))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."recipes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "ingredients" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "instructions" "text" NOT NULL,
    "notes" "text",
    "image_url" "text",
    "categories" "text"[] DEFAULT '{}'::"text"[],
    "cooking_time" "text",
    "difficulty" "text",
    "user_id" "uuid" NOT NULL,
    "is_public" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "recipes_cooking_time_check" CHECK (("cooking_time" = ANY (ARRAY['quick'::"text", 'medium'::"text", 'long'::"text"]))),
    CONSTRAINT "recipes_difficulty_check" CHECK (("difficulty" = ANY (ARRAY['beginner'::"text", 'intermediate'::"text", 'advanced'::"text"])))
);


ALTER TABLE "public"."recipes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_safety" (
    "user_id" "uuid" NOT NULL,
    "allergies" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "dietary_restrictions" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "medical_conditions" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_safety" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."usernames" (
    "username" "public"."citext" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "usernames_username_check" CHECK (((("length"(("username")::"text") >= 3) AND ("length"(("username")::"text") <= 24)) AND ("username" OPERATOR("public".~) '^[a-z0-9_]+$'::"public"."citext")))
);


ALTER TABLE "public"."usernames" OWNER TO "postgres";


ALTER TABLE ONLY "public"."cooking_preferences"
    ADD CONSTRAINT "cooking_preferences_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."recipes"
    ADD CONSTRAINT "recipes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_safety"
    ADD CONSTRAINT "user_safety_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."usernames"
    ADD CONSTRAINT "usernames_pkey" PRIMARY KEY ("username");



ALTER TABLE ONLY "public"."usernames"
    ADD CONSTRAINT "usernames_user_id_key" UNIQUE ("user_id");



CREATE INDEX "idx_profiles_created_at" ON "public"."profiles" USING "btree" ("created_at");



CREATE INDEX "idx_profiles_username" ON "public"."profiles" USING "btree" ("username");



CREATE INDEX "idx_recipes_categories_gin" ON "public"."recipes" USING "gin" ("categories");



CREATE INDEX "idx_recipes_cooking_time" ON "public"."recipes" USING "btree" ("cooking_time");



CREATE INDEX "idx_recipes_created_at" ON "public"."recipes" USING "btree" ("created_at");



CREATE INDEX "idx_recipes_difficulty" ON "public"."recipes" USING "btree" ("difficulty");



CREATE INDEX "idx_recipes_is_public" ON "public"."recipes" USING "btree" ("is_public");



CREATE INDEX "idx_recipes_user_id" ON "public"."recipes" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "cooking_preferences_set_updated_at" BEFORE UPDATE ON "public"."cooking_preferences" FOR EACH ROW EXECUTE FUNCTION "public"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "user_safety_set_updated_at" BEFORE UPDATE ON "public"."user_safety" FOR EACH ROW EXECUTE FUNCTION "public"."moddatetime"('updated_at');



ALTER TABLE ONLY "public"."cooking_preferences"
    ADD CONSTRAINT "cooking_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."recipes"
    ADD CONSTRAINT "recipes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_safety"
    ADD CONSTRAINT "user_safety_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."usernames"
    ADD CONSTRAINT "usernames_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE "public"."cooking_preferences" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "cooking_preferences_modify_own" ON "public"."cooking_preferences" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "cooking_preferences_select_all" ON "public"."cooking_preferences" FOR SELECT USING (true);



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_insert_own" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "profiles_select_all" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "profiles_update_own" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



ALTER TABLE "public"."recipes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "recipes_delete_own" ON "public"."recipes" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "recipes_insert_own" ON "public"."recipes" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "recipes_select_own" ON "public"."recipes" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "recipes_select_public" ON "public"."recipes" FOR SELECT USING (("is_public" = true));



CREATE POLICY "recipes_update_own" ON "public"."recipes" FOR UPDATE USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."user_safety" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_safety_own_data" ON "public"."user_safety" USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."usernames" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "usernames_delete_own" ON "public"."usernames" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "usernames_insert_own" ON "public"."usernames" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "usernames_select_all" ON "public"."usernames" FOR SELECT USING (true);



CREATE POLICY "usernames_update_own" ON "public"."usernames" FOR UPDATE USING (("auth"."uid"() = "user_id"));



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."claim_username_atomic"("p_user_id" "uuid", "p_username" "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."claim_username_atomic"("p_user_id" "uuid", "p_username" "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."claim_username_atomic"("p_user_id" "uuid", "p_username" "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_username_available"("check_username" "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."is_username_available"("check_username" "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_username_available"("check_username" "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_username_atomic"("p_user_id" "uuid", "p_new_username" "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."update_username_atomic"("p_user_id" "uuid", "p_new_username" "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_username_atomic"("p_user_id" "uuid", "p_new_username" "public"."citext") TO "service_role";



GRANT ALL ON TABLE "public"."cooking_preferences" TO "anon";
GRANT ALL ON TABLE "public"."cooking_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."cooking_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."recipes" TO "anon";
GRANT ALL ON TABLE "public"."recipes" TO "authenticated";
GRANT ALL ON TABLE "public"."recipes" TO "service_role";



GRANT ALL ON TABLE "public"."user_safety" TO "anon";
GRANT ALL ON TABLE "public"."user_safety" TO "authenticated";
GRANT ALL ON TABLE "public"."user_safety" TO "service_role";



GRANT ALL ON TABLE "public"."usernames" TO "anon";
GRANT ALL ON TABLE "public"."usernames" TO "authenticated";
GRANT ALL ON TABLE "public"."usernames" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






RESET ALL;
