#!/bin/bash

# 🚀 Development Environment Reset Script
# This script provides a bulletproof way to reset your development environment
# without manual troubleshooting or broken functionality.

set -e  # Exit on any error

echo "🔄 Starting Development Environment Reset..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to wait for service to be ready
wait_for_service() {
    local service_name=$1
    local url=$2
    local max_attempts=30
    local attempt=1
    
    print_status "Waiting for $service_name to be ready..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" >/dev/null 2>&1; then
            print_success "$service_name is ready!"
            return 0
        fi
        
        print_status "Attempt $attempt/$max_attempts - $service_name not ready yet..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "$service_name failed to start after $max_attempts attempts"
    return 1
}

# Step 1: Kill all running processes
print_status "Step 1: Stopping all development processes..."
pkill -f "vite\|dev" 2>/dev/null || true
pkill -f "supabase" 2>/dev/null || true

# Wait a moment for processes to fully stop
sleep 3

# Step 2: Clear caches
print_status "Step 2: Clearing caches..."
rm -rf node_modules/.vite .vite dist 2>/dev/null || true

# Step 3: Check prerequisites
print_status "Step 3: Checking prerequisites..."

if ! command_exists "npx"; then
    print_error "npx is not installed. Please install Node.js and npm first."
    exit 1
fi

if ! command_exists "psql"; then
    print_warning "psql not found. Database verification will be skipped."
    PSQL_AVAILABLE=false
else
    PSQL_AVAILABLE=true
fi

# Step 4: Start Supabase
print_status "Step 4: Starting Supabase..."
npx supabase start

# Step 5: Wait for Supabase to be ready
print_status "Step 5: Waiting for Supabase services..."
wait_for_service "Supabase API" "http://127.0.0.1:54321/rest/v1/"
wait_for_service "Supabase Studio" "http://127.0.0.1:54323/"

# Step 6: Reset database
print_status "Step 6: Resetting database..."
npx supabase db reset

# Step 7: Get service role key for seeding
print_status "Step 7: Setting up environment for seeding..."
SERVICE_ROLE_KEY=$(npx supabase status | grep -i 'service_role key' | awk -F': ' '{print $2}' | tr -d '\n')

if [ -z "$SERVICE_ROLE_KEY" ] || [[ ! "$SERVICE_ROLE_KEY" =~ ^eyJ ]]; then
    print_error "Failed to get a valid service role key from Supabase status. Got: '$SERVICE_ROLE_KEY'"
    exit 1
fi

export SUPABASE_URL="http://127.0.0.1:54321"
export SUPABASE_SERVICE_ROLE_KEY="$SERVICE_ROLE_KEY"

# Step 8: Seed database
print_status "Step 8: Seeding database with test data..."
npm run seed

# Step 9: Verify database state
print_status "Step 9: Verifying database state..."

if [ "$PSQL_AVAILABLE" = true ]; then
    print_status "Checking recipe count and categories..."
    psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "
        SELECT 
            COUNT(*) as total_recipes,
            COUNT(*) FILTER (WHERE array_length(categories, 1) > 0) as recipes_with_categories,
            COUNT(*) FILTER (WHERE is_public = true) as public_recipes
        FROM recipes;
    "
    
    print_status "Checking user count..."
    psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "
        SELECT COUNT(*) as total_users FROM profiles;
    "
else
    print_warning "Skipping database verification (psql not available)"
fi

# Step 10: Start development server
print_status "Step 10: Starting development server..."
print_status "The server will start on http://localhost:5174"
print_status "Press Ctrl+C to stop the server"

# Start the dev server in the background and capture its PID
npm run dev -- --port 5174 &
DEV_SERVER_PID=$!

# Wait a moment for the server to start
sleep 5

# Check if the server started successfully
if kill -0 $DEV_SERVER_PID 2>/dev/null; then
    print_success "Development server started successfully!"
    print_success "🌐 App URL: http://localhost:5174"
    print_success "📊 Supabase Studio: http://localhost:54323"
    print_success "🔑 Service Role Key: $SERVICE_ROLE_KEY"
    
    echo ""
    print_status "✅ Development environment reset complete!"
    print_status "📝 Test accounts available:"
    echo "   - alice@example.com (Password123!)"
    echo "   - bob@example.com (Password123!)"
    echo "   - cora@example.com (Password123!)"
    echo "   - david@example.com (Password123!)"
    echo "   - emma@example.com (Password123!)"
    echo "   - frank@example.com (Password123!)"
    
    # Wait for the dev server
    wait $DEV_SERVER_PID
else
    print_error "Failed to start development server"
    exit 1
fi
