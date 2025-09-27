#!/bin/bash

# Dual Server Integration Test Runner
# This script starts both servers and runs integration tests

set -e

echo "🚀 Starting Dual Server Integration Tests"
echo "========================================"

# Function to cleanup background processes
cleanup() {
    echo "🧹 Cleaning up background processes..."
    pkill -f "vite.*dev" 2>/dev/null || true
    pkill -f "vercel.*dev" 2>/dev/null || true
    pkill -f "npm.*dev:frontend" 2>/dev/null || true
    pkill -f "npm.*dev:api" 2>/dev/null || true
}

# Set up cleanup on script exit
trap cleanup EXIT

echo "📦 Installing dependencies..."
npm ci

echo "🔧 Starting servers in background..."

# Start frontend server in background
echo "   Starting Vite frontend server (port 5174)..."
npm run dev:frontend > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!

# Start API server in background  
echo "   Starting Vercel API server (port 3000)..."
npm run dev:api > /tmp/api.log 2>&1 &
API_PID=$!

echo "⏳ Waiting for servers to be ready..."

# Wait for servers to be available
npx wait-on tcp:5174 tcp:3000 --timeout 60000

echo "✅ Both servers are ready!"
echo "   Frontend: http://localhost:5174"
echo "   API: http://localhost:3000"

echo "🧪 Running integration tests..."
npm run test:integration

echo "✅ Integration tests completed successfully!"
