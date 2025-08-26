#!/bin/bash

# Sync environment variables between local .env.local and Vercel
echo "🔄 Syncing environment variables..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local not found!"
    exit 1
fi

# Extract OpenAI API key from .env.local
OPENAI_KEY=$(grep "VITE_OPENAI_API_KEY=" .env.local | cut -d'=' -f2- | tr -d '"')

if [ -z "$OPENAI_KEY" ]; then
    echo "❌ VITE_OPENAI_API_KEY not found in .env.local"
    exit 1
fi

echo "📋 Current local OpenAI key: ${OPENAI_KEY:0:20}..."

# Check current Vercel environment variable
echo "🔍 Checking current Vercel environment variable..."
vercel env pull .env.vercel.tmp 2>/dev/null

if [ -f .env.vercel.tmp ]; then
    VERCEL_KEY=$(grep "VITE_OPENAI_API_KEY=" .env.vercel.tmp | cut -d'=' -f2- | tr -d '"')
    rm .env.vercel.tmp
    
    if [ "$OPENAI_KEY" = "$VERCEL_KEY" ]; then
        echo "✅ Environment variables are already in sync!"
        exit 0
    else
        echo "⚠️  Keys are different, updating Vercel..."
    fi
fi

# Update Vercel environment variable
echo "🔄 Updating Vercel environment variable..."
vercel env rm VITE_OPENAI_API_KEY -y
echo "$OPENAI_KEY" | vercel env add VITE_OPENAI_API_KEY

echo "✅ Environment variables synced!"
echo "🚀 Triggering new deployment..."
vercel --prod

echo "🎉 Done! Your production environment should now use the same API key as local."
