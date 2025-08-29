#!/bin/bash

# Username Functions Test Suite
# This script runs all username-related tests to ensure functionality

echo "🧪 Running Username Functions Test Suite"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run tests and count results
run_test_suite() {
    local test_name="$1"
    local test_command="$2"
    
    echo -e "\n${BLUE}📋 Running $test_name...${NC}"
    echo "----------------------------------------"
    
    # Run the test command
    if $test_command; then
        echo -e "${GREEN}✅ $test_name passed${NC}"
        ((PASSED_TESTS++))
    else
        echo -e "${RED}❌ $test_name failed${NC}"
        ((FAILED_TESTS++))
    fi
    
    ((TOTAL_TESTS++))
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Must run from project root directory${NC}"
    exit 1
fi

# Check if Supabase is running
echo -e "${YELLOW}🔍 Checking Supabase status...${NC}"
if ! npx supabase status > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Supabase is not running. Please start it first:${NC}"
    echo "   npx supabase start"
    exit 1
fi

echo -e "${GREEN}✅ Supabase is running${NC}"

# Set up environment for database tests
export SUPABASE_URL="http://127.0.0.1:54321"
export SUPABASE_SERVICE_ROLE_KEY=$(npx supabase status | sed -n 's/^service_role key: //p' | tr -d '\n')

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo -e "${RED}❌ Error: Could not get service role key${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Environment variables set${NC}"

# Run test suites
echo -e "\n${BLUE}🚀 Starting test execution...${NC}"

# 1. Unit tests for auth functions
run_test_suite "Username Auth Functions Unit Tests" \
    "npm test src/__tests__/lib/username-functions.test.ts"

# 2. Unit tests for useUsernameAvailability hook
run_test_suite "useUsernameAvailability Hook Unit Tests" \
    "npm test src/__tests__/hooks/useUsernameAvailability.test.ts"

# 3. Component integration tests
run_test_suite "ProfileInfoForm Username Integration Tests" \
    "npm test src/__tests__/components/profile/ProfileInfoForm-username.test.ts"

# 4. Database integration tests (only if service key available)
if [ -n "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    run_test_suite "Database Username Functions Integration Tests" \
        "npm test src/__tests__/database/username-functions.test.ts"
else
    echo -e "\n${YELLOW}⚠️ Skipping database integration tests - no service role key${NC}"
fi

# 5. End-to-end workflow tests
run_test_suite "Username Workflow E2E Tests" \
    "npm test src/__tests__/e2e/username-workflow.test.ts"

# Summary
echo -e "\n${BLUE}📊 Test Summary${NC}"
echo "========================================"
echo -e "Total Tests: ${TOTAL_TESTS}"
echo -e "${GREEN}Passed: ${PASSED_TESTS}${NC}"
echo -e "${RED}Failed: ${FAILED_TESTS}${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All username tests passed!${NC}"
    echo -e "${GREEN}✅ Username functionality is working correctly${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Some tests failed. Please check the output above.${NC}"
    echo -e "${YELLOW}💡 Common issues:${NC}"
    echo "   - Supabase not running"
    echo "   - Database functions not created"
    echo "   - Environment variables not set"
    echo "   - Network connectivity issues"
    exit 1
fi
