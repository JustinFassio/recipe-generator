#!/usr/bin/env node

/**
 * Production Environment Diagnostic Script
 * Run this in your browser console on the production site to diagnose the issue
 */

console.log('🔍 Production Environment Diagnostic');
console.log('====================================');

// Check if we're in a browser environment
if (typeof window !== 'undefined') {
  console.log('🌐 Browser Environment Detected');

  // Check environment variables
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  console.log('VITE_SUPABASE_URL:', supabaseUrl);
  console.log(
    'VITE_SUPABASE_ANON_KEY:',
    supabaseAnonKey ? '***SET***' : 'NOT SET'
  );

  // Extract project ID from URL
  if (supabaseUrl) {
    const projectId = supabaseUrl
      .replace('https://', '')
      .replace('.supabase.co', '');
    console.log('Project ID:', projectId);

    // Check if it matches expected
    if (projectId === 'sxvdkipywmjycithdfpp') {
      console.log('✅ Project ID matches expected');
    } else if (projectId === 'oyjwduxjeyoazwoskqve') {
      console.log(
        '❌ Project ID is the OLD one - environment variables not updated!'
      );
    } else {
      console.log('❓ Unknown project ID:', projectId);
    }
  } else {
    console.log('❌ VITE_SUPABASE_URL is not set');
  }

  // Check for any hardcoded URLs in the built JavaScript
  console.log('\n🔍 Checking for hardcoded URLs in page source...');
  const pageSource = document.documentElement.outerHTML;
  const hardcodedUrls = pageSource.match(/oyjwduxjeyoazwoskqve\.supabase\.co/g);

  if (hardcodedUrls) {
    console.log(
      '❌ Found hardcoded URLs in page source:',
      hardcodedUrls.length
    );
    console.log(
      'This suggests the build is cached or environment variables are not being injected properly.'
    );
  } else {
    console.log('✅ No hardcoded URLs found in page source');
  }

  // Test network connectivity
  console.log('\n🌐 Testing network connectivity...');
  fetch('https://sxvdkipywmjycithdfpp.supabase.co/rest/v1/')
    .then((response) => {
      console.log('✅ Correct Supabase project is reachable');
    })
    .catch((error) => {
      console.log(
        '❌ Correct Supabase project is not reachable:',
        error.message
      );
    });

  fetch('https://oyjwduxjeyoazwoskqve.supabase.co/rest/v1/')
    .then((response) => {
      console.log(
        '❌ OLD Supabase project is still reachable - this explains the issue!'
      );
    })
    .catch((error) => {
      console.log('✅ OLD Supabase project is not reachable (good)');
    });
} else {
  console.log('Node.js Environment Detected');
  console.log('Run this script in your browser console on the production site');
}

console.log('\n📋 Next Steps:');
console.log('1. If project ID is wrong: Update Vercel environment variables');
console.log('2. If hardcoded URLs found: Force redeploy in Vercel');
console.log(
  '3. If old project is reachable: Check for multiple Supabase projects'
);
console.log('4. Clear browser cache and try again');
