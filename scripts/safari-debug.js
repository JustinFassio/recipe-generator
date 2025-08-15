#!/usr/bin/env node

console.log('🍎 Safari Debug Information');
console.log('===========================\n');

// Check if we're in a browser environment
if (typeof window !== 'undefined') {
  console.log('🌐 Browser Environment Detected');

  // Detect Safari
  const userAgent = navigator.userAgent;
  const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
  const isChrome = /chrome/i.test(userAgent);
  const isFirefox = /firefox/i.test(userAgent);

  console.log('Browser Detection:');
  console.log('  Safari:', isSafari);
  console.log('  Chrome:', isChrome);
  console.log('  Firefox:', isFirefox);
  console.log('  User Agent:', userAgent);

  // Check environment variables
  console.log('\nEnvironment Variables:');
  console.log('  VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
  console.log(
    '  VITE_SUPABASE_ANON_KEY:',
    import.meta.env.VITE_SUPABASE_ANON_KEY ? '***SET***' : 'NOT SET'
  );
  console.log(
    '  VITE_OPENAI_API_KEY:',
    import.meta.env.VITE_OPENAI_API_KEY ? '***SET***' : 'NOT SET'
  );
  console.log('  MODE:', import.meta.env.MODE);
  console.log('  PROD:', import.meta.env.PROD);

  // Check for localhost issues
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (supabaseUrl) {
    const hasLocalhost =
      supabaseUrl.includes('127.0.0.1') || supabaseUrl.includes('localhost');
    const isHttp = supabaseUrl.startsWith('http://');
    const isHttps = supabaseUrl.startsWith('https://');

    console.log('\nSupabase URL Analysis:');
    console.log('  Contains localhost:', hasLocalhost);
    console.log('  Uses HTTP:', isHttp);
    console.log('  Uses HTTPS:', isHttps);

    if (hasLocalhost && isSafari) {
      console.log('\n❌ SAFARI ISSUE DETECTED:');
      console.log('   Safari blocks localhost connections from HTTPS sites');
      console.log('   This is a security feature to prevent mixed content');
      console.log('   Solution: Update VITE_SUPABASE_URL to production URL');
    }

    if (isHttp && import.meta.env.PROD) {
      console.log('\n❌ MIXED CONTENT ISSUE:');
      console.log('   Production site uses HTTPS but Supabase URL uses HTTP');
      console.log('   Safari blocks this for security reasons');
      console.log('   Solution: Use HTTPS for Supabase URL in production');
    }
  }

  // Check current protocol
  console.log('\nCurrent Page Protocol:', window.location.protocol);
  console.log('Current Page Host:', window.location.host);
} else {
  console.log('Node.js Environment Detected');
  console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL);
  console.log(
    'VITE_SUPABASE_ANON_KEY:',
    process.env.VITE_SUPABASE_ANON_KEY ? '***SET***' : 'NOT SET'
  );
  console.log(
    'VITE_OPENAI_API_KEY:',
    process.env.VITE_OPENAI_API_KEY ? '***SET***' : 'NOT SET'
  );
}

console.log('\n📋 Safari-Specific Solutions:');
console.log(
  '1. Update Vercel environment variables to use production Supabase URL'
);
console.log('2. Ensure Supabase URL starts with https:// (not http://)');
console.log('3. Remove any localhost or 127.0.0.1 references');
console.log('4. Redeploy the application after updating environment variables');
console.log('5. Clear Safari cache and reload the page');
