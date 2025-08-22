#!/usr/bin/env node

/**
 * Environment Variable Checker
 * Run this in production to verify environment variables are set correctly
 */

console.log('🔍 Environment Variable Checker');
console.log('==============================');

// Check Supabase URL
const supabaseUrl = process.env.VITE_SUPABASE_URL;
console.log(
  'VITE_SUPABASE_URL:',
  supabaseUrl ? `✅ ${supabaseUrl}` : '❌ Missing'
);

// Check Supabase Anon Key
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
console.log(
  'VITE_SUPABASE_ANON_KEY:',
  supabaseAnonKey ? '✅ Set' : '❌ Missing'
);

// Check if keys match expected project
if (supabaseUrl) {
  const expectedProject = 'sxvdkipywmjycithdfpp';
  const actualProject = supabaseUrl
    .replace('https://', '')
    .replace('.supabase.co', '');

  if (actualProject === expectedProject) {
    console.log('✅ Project ID matches expected:', expectedProject);
  } else {
    console.log('❌ Project ID mismatch!');
    console.log('   Expected:', expectedProject);
    console.log('   Actual:  ', actualProject);
    console.log('   This explains the ERR_NAME_NOT_RESOLVED errors!');
  }
}

console.log('\n📋 Next Steps:');
console.log('1. Check Vercel Environment Variables');
console.log('2. Update to match local .env.local values');
console.log('3. Redeploy the application');
