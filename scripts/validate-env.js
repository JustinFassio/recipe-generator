#!/usr/bin/env node

/*
 * Environment Variable Validation Script
 * Ensures all required environment variables are present
 */

// Load .env and .env.local
try {
  const { config } = await import('dotenv');
  const fs = await import('fs');
  if (fs.existsSync('.env')) config({ path: '.env', override: false });
  if (fs.existsSync('.env.local'))
    config({ path: '.env.local', override: true });
} catch {}

const requiredClientVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_OPENAI_MODEL',
];

const requiredServerVars = ['OPENAI_API_KEY'];

const optionalVars = ['VITE_OPENAI_API_KEY', 'SENTRY_DSN', 'VERCEL_URL'];

console.log('🔍 Validating environment variables...\n');

let hasErrors = false;

console.log('📱 Client Variables (VITE_*):');
for (const varName of requiredClientVars) {
  const value = process.env[varName];
  if (!value) {
    console.log(`❌ ${varName}: Missing`);
    hasErrors = true;
  } else {
    console.log(`✅ ${varName}: present`);
  }
}

console.log('\n🖥️  Server Variables:');
for (const varName of requiredServerVars) {
  const value = process.env[varName];
  if (!value) {
    console.log(`❌ ${varName}: Missing`);
    hasErrors = true;
  } else {
    console.log(`✅ ${varName}: present`);
  }
}

console.log('\n🔧 Optional Variables:');
for (const varName of optionalVars) {
  const value = process.env[varName];
  if (!value) {
    console.log(`⚠️  ${varName}: Not set (optional)`);
  } else {
    console.log(`✅ ${varName}: present`);
  }
}

if (hasErrors) {
  console.log('\n❌ Environment validation failed!');
  console.log('\n📋 Setup Instructions:');
  console.log('1. Local: Ensure .env.local exists with required keys');
  console.log(
    '2. Vercel: Add variables in Dashboard → Settings → Environment Variables'
  );
  console.log('3. Optionally sync: npm run env:sync');
  process.exit(1);
} else {
  console.log('\n✅ All required environment variables are present!');
}
