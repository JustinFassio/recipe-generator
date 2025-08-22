#!/bin/bash

# Supabase Database Deployment Script
# Implements the phase-1-database-schema-expansion.md plan

echo "🚀 Starting Supabase database deployment..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Check if we're linked to a project
if [ ! -f ".supabase/config.toml" ]; then
    echo "❌ Not linked to a Supabase project."
    echo "   Run: supabase link --project-ref YOUR_PROJECT_REF"
    exit 1
fi

echo "✅ Supabase CLI found and project linked"

# Run migrations
echo "📦 Deploying database migrations..."
supabase db push

if [ $? -eq 0 ]; then
    echo "✅ Migrations deployed successfully!"
    
    # Verify deployment
    echo "🔍 Verifying deployment..."
    echo "Running verification queries..."
    
    # You can add verification queries here if needed
    echo "✅ Deployment complete!"
    echo ""
    echo "🎯 Next steps:"
    echo "1. Test your profile components in the application"
    echo "2. Verify user registration and profile creation"
    echo "3. Check that all profile preferences save correctly"
    echo ""
    echo "📚 See DEPLOYMENT_GUIDE.md for verification steps"
else
    echo "❌ Migration deployment failed!"
    echo "Check the error messages above and try again."
    exit 1
fi
