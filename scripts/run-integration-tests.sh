#!/bin/bash

# Dual Server Integration Test Runner
# This script runs integration tests against existing servers (like Critical Path Tests)
# Assumes servers are already running or skips gracefully in CI

set -e

echo "🚀 Starting Dual Server Integration Tests"
echo "========================================"

# Check if we're in CI environment
if [ "$CI" = "true" ] || [ "$GITHUB_ACTIONS" = "true" ]; then
    echo "🔧 Running in CI environment - skipping server-dependent integration tests"
    echo "✅ Integration tests completed successfully (skipped in CI)!"
    exit 0
fi

echo "📦 Installing dependencies..."
npm ci

echo "🔍 Checking if servers are already running..."

# Check if frontend server is running
if curl -s http://localhost:5174 > /dev/null 2>&1; then
    echo "✅ Frontend server is running on port 5174"
else
    echo "❌ Frontend server not found on port 5174"
    echo "   Please start the frontend server with: npm run dev:frontend"
    exit 1
fi

# Check if API server is running (try both ports due to Vercel port conflicts)
API_RUNNING=false
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ API server is running on port 3000"
    API_RUNNING=true
elif curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo "✅ API server is running on port 3001 (Vercel port conflict resolution)"
    API_RUNNING=true
else
    echo "❌ API server not found on ports 3000 or 3001"
    echo "   Please start the API server with: npm run dev:api"
    exit 1
fi

if [ "$API_RUNNING" = "true" ]; then
    echo "🧪 Running integration tests against existing servers..."
    npx vitest --config vitest.integration.config.ts
    
    echo "✅ Integration tests completed successfully!"
else
    echo "❌ Cannot run integration tests - API server not available"
    exit 1
fi
