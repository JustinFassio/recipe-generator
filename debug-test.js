import { createClient } from '@supabase/supabase-js';

async function testConnection() {
  const supabase = createClient(
    'http://127.0.0.1:54321',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
  );

  console.log('Testing basic connection...');
  const { data, error } = await supabase.from('recipes').select('*').limit(1);

  console.log('Error:', error);
  console.log('Data:', data);
}

testConnection().catch(console.error);
