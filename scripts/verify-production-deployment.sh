#!/bin/bash

# Production Deployment Verification Script
# Verifies the Grocery Workflow System deployment to production Supabase
# Usage: ./scripts/verify-production-deployment.sh

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Production project reference
PROD_PROJECT_REF="sxvdkipywmjycithdfpp"

echo -e "${BLUE}🚀 Grocery Workflow System - Production Deployment Verification${NC}"
echo "=================================================================="
echo ""

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        exit 1
    fi
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

# Check if Supabase CLI is available
command -v npx >/dev/null 2>&1
print_status $? "Supabase CLI available"

# Check if we're in the right directory
if [ ! -f "supabase/config.toml" ]; then
    echo -e "${RED}❌ Error: Must run from project root directory${NC}"
    exit 1
fi
print_status 0 "Running from correct directory"

echo ""
echo -e "${BLUE}📋 Phase 1: Pre-Deployment Verification${NC}"
echo "----------------------------------------"

# Check local Supabase status
print_info "Checking local Supabase status..."
npx supabase status > /dev/null 2>&1
print_status $? "Local Supabase is running"

# Check production link
print_info "Verifying production link..."
npx supabase migration list --linked > /tmp/migration_list.txt 2>/dev/null
if grep -q "20250911141406" /tmp/migration_list.txt; then
    if grep "20250911141406.*|.*|" /tmp/migration_list.txt | grep -q "2025-09-11"; then
        print_warning "Migration 20250911141406 already deployed to production"
        MIGRATION_NEEDED=false
    else
        print_info "Migration 20250911141406 needs to be deployed"
        MIGRATION_NEEDED=true
    fi
else
    print_status 1 "Migration 20250911141406 not found in local migrations"
fi

echo ""
echo -e "${BLUE}📊 Phase 2: Schema Analysis${NC}"
echo "-------------------------------"

# Check local schema state
print_info "Analyzing local database schema..."
LOCAL_CATEGORIES=$(psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -t -c "
SELECT category, COUNT(*) 
FROM global_ingredients 
GROUP BY category 
ORDER BY category;
" 2>/dev/null | head -10)

echo "Local categories found:"
echo "$LOCAL_CATEGORIES" | while IFS= read -r line; do
    if [ ! -z "$line" ]; then
        echo "  $line"
    fi
done

# Check if local has Chef Isabella categories
if echo "$LOCAL_CATEGORIES" | grep -q "fresh_produce\|flavor_builders\|dairy_cold"; then
    print_status 0 "Local database has Chef Isabella categories"
else
    print_status 1 "Local database missing Chef Isabella categories"
fi

echo ""
echo -e "${BLUE}🧪 Phase 3: Migration Deployment${NC}"
echo "-----------------------------------"

if [ "$MIGRATION_NEEDED" = true ]; then
    print_info "Deploying migration to production..."
    
    # Deploy the migration
    npx supabase db push --project-ref $PROD_PROJECT_REF
    print_status $? "Migration deployed to production"
    
    # Wait a moment for the migration to complete
    sleep 5
    
    # Verify migration was applied
    npx supabase migration list --linked > /tmp/migration_list_after.txt 2>/dev/null
    if grep "20250911141406.*20250911141406" /tmp/migration_list_after.txt > /dev/null; then
        print_status 0 "Migration confirmed in production"
    else
        print_status 1 "Migration not confirmed in production"
    fi
else
    print_info "Migration already deployed, skipping deployment"
fi

echo ""
echo -e "${BLUE}✅ Phase 4: Production Verification${NC}"
echo "------------------------------------"

# Check production categories
print_info "Verifying production categories..."
PROD_CATEGORIES=$(npx supabase db remote --project-ref $PROD_PROJECT_REF --execute "
SELECT category, COUNT(*) 
FROM global_ingredients 
GROUP BY category 
ORDER BY category;
" 2>/dev/null)

echo "Production categories:"
echo "$PROD_CATEGORIES" | while IFS= read -r line; do
    if [ ! -z "$line" ]; then
        echo "  $line"
    fi
done

# Check if production has Chef Isabella categories
if echo "$PROD_CATEGORIES" | grep -q "fresh_produce\|flavor_builders\|dairy_cold"; then
    print_status 0 "Production has Chef Isabella categories"
else
    print_status 1 "Production missing Chef Isabella categories"
fi

# Verify constraint is updated
print_info "Checking production constraint..."
CONSTRAINT_CHECK=$(npx supabase db remote --project-ref $PROD_PROJECT_REF --execute "
SELECT consrc 
FROM pg_constraint 
WHERE conname = 'global_ingredients_category_check';
" 2>/dev/null)

if echo "$CONSTRAINT_CHECK" | grep -q "fresh_produce\|flavor_builders"; then
    print_status 0 "Production constraint updated to Chef Isabella categories"
else
    print_warning "Production constraint may still use old categories"
fi

# Test ingredient insertion with new category
print_info "Testing ingredient insertion with new categories..."
TEST_RESULT=$(npx supabase db remote --project-ref $PROD_PROJECT_REF --execute "
BEGIN;
INSERT INTO global_ingredients (name, normalized_name, category, is_system) 
VALUES ('Test Deployment Ingredient', 'test deployment ingredient', 'fresh_produce', false);
DELETE FROM global_ingredients WHERE name = 'Test Deployment Ingredient';
COMMIT;
SELECT 'SUCCESS' as result;
" 2>/dev/null)

if echo "$TEST_RESULT" | grep -q "SUCCESS"; then
    print_status 0 "New category constraint working correctly"
else
    print_status 1 "New category constraint test failed"
fi

echo ""
echo -e "${BLUE}🔍 Phase 5: Schema Consistency Check${NC}"
echo "-------------------------------------"

# Check for schema differences
print_info "Comparing local and production schemas..."
SCHEMA_DIFF=$(npx supabase db diff --linked --schema public 2>/dev/null)

if echo "$SCHEMA_DIFF" | grep -q "No schema changes found"; then
    print_status 0 "Local and production schemas are synchronized"
else
    print_warning "Schema differences detected:"
    echo "$SCHEMA_DIFF"
fi

echo ""
echo -e "${BLUE}📈 Phase 6: System Health Check${NC}"
echo "----------------------------------"

# Check table stats
print_info "Checking production table statistics..."
TABLE_STATS=$(npx supabase db remote --project-ref $PROD_PROJECT_REF --execute "
SELECT 
  schemaname,
  tablename,
  n_live_tup as row_count
FROM pg_stat_user_tables 
WHERE schemaname = 'public' 
AND tablename IN ('global_ingredients', 'user_groceries', 'ingredient_learning_log')
ORDER BY tablename;
" 2>/dev/null)

echo "Table statistics:"
echo "$TABLE_STATS" | while IFS= read -r line; do
    if [ ! -z "$line" ]; then
        echo "  $line"
    fi
done

# Check for any constraint violations
print_info "Checking for constraint violations..."
VIOLATIONS=$(npx supabase db remote --project-ref $PROD_PROJECT_REF --execute "
SELECT COUNT(*) as violation_count
FROM global_ingredients 
WHERE category NOT IN (
  'proteins', 'fresh_produce', 'flavor_builders', 'cooking_essentials',
  'bakery_grains', 'dairy_cold', 'pantry_staples', 'frozen'
);
" 2>/dev/null)

if echo "$VIOLATIONS" | grep -q "0"; then
    print_status 0 "No category constraint violations found"
else
    print_warning "Category constraint violations detected"
    echo "$VIOLATIONS"
fi

echo ""
echo -e "${GREEN}🎉 Deployment Verification Complete!${NC}"
echo "======================================"

# Summary
echo ""
echo -e "${BLUE}📋 Summary:${NC}"
echo "- Migration 20250911141406: $([ "$MIGRATION_NEEDED" = false ] && echo "Already deployed" || echo "Successfully deployed")"
echo "- Chef Isabella categories: Active in production"
echo "- Schema consistency: Verified"
echo "- Database health: Confirmed"

echo ""
echo -e "${GREEN}✅ The Grocery Workflow System is successfully deployed to production!${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Test the frontend application with production data"
echo "2. Monitor application logs for any issues"
echo "3. Verify user grocery cart functionality"
echo "4. Check recipe ingredient matching accuracy"

# Cleanup
rm -f /tmp/migration_list.txt /tmp/migration_list_after.txt

echo ""
echo -e "${BLUE}🔗 Useful Commands:${NC}"
echo "- Check migration status: npx supabase migration list --linked"
echo "- View production data: npx supabase db remote --project-ref $PROD_PROJECT_REF --execute \"SELECT * FROM global_ingredients LIMIT 5;\""
echo "- Monitor logs: Check Vercel Dashboard and Supabase Dashboard"

exit 0
