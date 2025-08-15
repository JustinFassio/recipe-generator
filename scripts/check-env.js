#!/usr/bin/env node

console.log('🔍 Environment Variable Checker');
console.log('==============================\n');

// Check if we're in a browser environment
if (typeof window !== 'undefined') {
  console.log('🌐 Browser Environment Detected');
  console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
  console.log(
    'VITE_SUPABASE_ANON_KEY:',
    import.meta.env.VITE_SUPABASE_ANON_KEY ? '***SET***' : 'NOT SET'
  );
  console.log(
    'VITE_OPENAI_API_KEY:',
    import.meta.env.VITE_OPENAI_API_KEY ? '***SET***' : 'NOT SET'
  );
  console.log('VITE_OPENAI_MODEL:', import.meta.env.VITE_OPENAI_MODEL);

  // Check for localhost in Supabase URL
  if (
    import.meta.env.VITE_SUPABASE_URL &&
    import.meta.env.VITE_SUPABASE_URL.includes('127.0.0.1')
  ) {
    console.log('\n❌ ERROR: Supabase URL points to localhost!');
    console.log('   This should point to your production Supabase project.');
    console.log('   Current URL:', import.meta.env.VITE_SUPABASE_URL);
  } else if (import.meta.env.VITE_SUPABASE_URL) {
    console.log('\n✅ Supabase URL looks correct (not localhost)');
  } else {
    console.log('\n❌ ERROR: VITE_SUPABASE_URL is not set');
  }
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
  console.log('VITE_OPENAI_MODEL:', process.env.VITE_OPENAI_MODEL);
}

console.log('\n📋 Next Steps:');
console.log('1. Go to your Vercel dashboard');
console.log('2. Navigate to your recipe-generator project');
console.log('3. Go to Settings > Environment Variables');
console.log('4. Update VITE_SUPABASE_URL to your production Supabase URL');
console.log(
  '5. Update VITE_SUPABASE_ANON_KEY to your production Supabase anon key'
);
console.log('6. Redeploy the application');
