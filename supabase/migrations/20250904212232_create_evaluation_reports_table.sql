-- Create evaluation_reports table for storing Dr. Luna Clearwater's health evaluation reports
CREATE TABLE IF NOT EXISTS "public"."evaluation_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "report_id" "text" NOT NULL,
    "evaluation_date" "timestamptz" NOT NULL,
    "dietitian" "text" NOT NULL,
    "report_version" "text" NOT NULL,
    "report_data" "jsonb" NOT NULL,
    "created_at" "timestamptz" DEFAULT "now"() NOT NULL,
    "updated_at" "timestamptz" DEFAULT "now"() NOT NULL,
    CONSTRAINT "evaluation_reports_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "evaluation_reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX "idx_evaluation_reports_user_id" ON "public"."evaluation_reports" USING "btree" ("user_id");
CREATE INDEX "idx_evaluation_reports_report_id" ON "public"."evaluation_reports" USING "btree" ("report_id");
CREATE INDEX "idx_evaluation_reports_evaluation_date" ON "public"."evaluation_reports" USING "btree" ("evaluation_date");
CREATE INDEX "idx_evaluation_reports_created_at" ON "public"."evaluation_reports" USING "btree" ("created_at");

-- Create unique constraint to prevent duplicate reports
CREATE UNIQUE INDEX "idx_evaluation_reports_user_report_unique" ON "public"."evaluation_reports" ("user_id", "report_id");

-- Enable RLS
ALTER TABLE "public"."evaluation_reports" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "evaluation_reports_select_own" ON "public"."evaluation_reports" FOR SELECT USING (("auth"."uid"() = "user_id"));
CREATE POLICY "evaluation_reports_insert_own" ON "public"."evaluation_reports" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));
CREATE POLICY "evaluation_reports_update_own" ON "public"."evaluation_reports" FOR UPDATE USING (("auth"."uid"() = "user_id"));
CREATE POLICY "evaluation_reports_delete_own" ON "public"."evaluation_reports" FOR DELETE USING (("auth"."uid"() = "user_id"));

-- Grant permissions
-- Note: Removed ALL permissions for 'anon' role for security
GRANT ALL ON TABLE "public"."evaluation_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."evaluation_reports" TO "service_role";

-- Create trigger for updated_at (only if moddatetime function exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'moddatetime') THEN
        CREATE OR REPLACE TRIGGER "evaluation_reports_set_updated_at" 
        BEFORE UPDATE ON "public"."evaluation_reports" 
        FOR EACH ROW EXECUTE FUNCTION "public"."moddatetime"('updated_at');
    ELSE
        RAISE WARNING 'moddatetime function not found. Trigger not created.';
    END IF;
END $$;
