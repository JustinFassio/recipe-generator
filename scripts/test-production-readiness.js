#!/usr/bin/env node

/**
 * Production Readiness Test Script
 * Run this before deploying to verify all systems work
 */

const { createClient } = require('@supabase/supabase-js');

// Environment validation
function validateEnvironment() {
  console.log('🔍 Validating Environment Variables...');

  const required = [
    'OPENAI_API_KEY',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ Missing environment variables:', missing);
    return false;
  }

  console.log('✅ All environment variables present');
  return true;
}

// Test Supabase connection
async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase Connection...');

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Test database connection
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }

    console.log('✅ Database connection successful');

    // Test storage access
    const { data: buckets } = await supabase.storage.listBuckets();
    const recipeImagesBucket = buckets.find((b) => b.name === 'recipe-images');

    if (!recipeImagesBucket) {
      console.error('❌ recipe-images bucket not found');
      return false;
    }

    console.log('✅ Storage bucket access confirmed');
    return true;
  } catch (error) {
    console.error('❌ Supabase test failed:', error.message);
    return false;
  }
}

// Test OpenAI API
async function testOpenAIAPI() {
  console.log('🔍 Testing OpenAI API...');

  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    });

    if (!response.ok) {
      console.error(
        '❌ OpenAI API test failed:',
        response.status,
        response.statusText
      );
      return false;
    }

    const models = await response.json();
    const dallEModel = models.data.find((m) => m.id.includes('dall-e'));

    if (!dallEModel) {
      console.error('❌ DALL-E model not available');
      return false;
    }

    console.log('✅ OpenAI API access confirmed');
    return true;
  } catch (error) {
    console.error('❌ OpenAI API test failed:', error.message);
    return false;
  }
}

// Main test runner
async function runProductionTests() {
  console.log('🚀 Running Production Readiness Tests...\n');

  const tests = [
    { name: 'Environment Variables', test: validateEnvironment },
    { name: 'Supabase Connection', test: testSupabaseConnection },
    { name: 'OpenAI API', test: testOpenAIAPI },
  ];

  let allPassed = true;

  for (const { name, test } of tests) {
    console.log(`\n--- ${name} ---`);
    const passed = await test();
    if (!passed) allPassed = false;
  }

  console.log('\n' + '='.repeat(50));
  if (allPassed) {
    console.log('🎉 All tests passed! Ready for production deployment.');
  } else {
    console.log('❌ Some tests failed. Fix issues before deploying.');
    process.exit(1);
  }
}

// Run tests
runProductionTests().catch(console.error);
