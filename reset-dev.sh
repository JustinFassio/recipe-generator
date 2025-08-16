#!/bin/bash

echo "🔄 Resetting development environment..."

# Kill all running dev servers
echo "Stopping all development servers..."
pkill -f "vite\|dev" 2>/dev/null || true

# Clear all caches
echo "Clearing caches..."
rm -rf node_modules/.vite .vite dist 2>/dev/null || true

# Wait a moment
sleep 2

# Start fresh
echo "Starting fresh development server..."
npm run dev

echo "✅ Development server started!"
echo "🌐 Visit: http://localhost:5174"
echo "📊 Supabase Studio: http://localhost:54323"
