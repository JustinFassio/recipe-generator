import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export function SupabaseTest() {
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testConnection = async () => {
    setIsLoading(true);
    setTestResult('Testing connection...');

    try {
      // Test 1: Basic connection
      const { data, error } = await supabase.from('recipes').select('count').limit(1);
      
      if (error) {
        if (error.code === 'PGRST116') {
          setTestResult('❌ 401 Error: Invalid API key. Please check your VITE_SUPABASE_ANON_KEY');
        } else if (error.code === 'PGRST301') {
          setTestResult('❌ 404 Error: Table not found. Please check your database schema');
        } else {
          setTestResult(`❌ Error: ${error.message} (Code: ${error.code})`);
        }
      } else {
        setTestResult('✅ Connection successful! Supabase is working correctly.');
      }
    } catch (err) {
      setTestResult(`❌ Connection failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const showEnvironmentInfo = () => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    setTestResult(`
🔍 Environment Information:
URL: ${url ? '✅ Set' : '❌ Missing'}
Key: ${key ? '✅ Set' : '❌ Missing'}
Key Length: ${key ? key.length : 0} characters
URL Format: ${url?.startsWith('https://') ? '✅ HTTPS' : '❌ Not HTTPS'}
    `);
  };

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Supabase Connection Test</h2>
        <p className="text-sm text-gray-600">
          Test your Supabase connection to debug the 401 error
        </p>
        
        <div className="flex gap-2">
          <button
            onClick={testConnection}
            disabled={isLoading}
            className="btn btn-primary btn-sm"
          >
            {isLoading ? 'Testing...' : 'Test Connection'}
          </button>
          <button
            onClick={showEnvironmentInfo}
            className="btn btn-secondary btn-sm"
          >
            Show Environment Info
          </button>
        </div>

        {testResult && (
          <div className="mt-4 rounded-lg bg-base-200 p-4">
            <pre className="whitespace-pre-wrap text-sm">{testResult}</pre>
          </div>
        )}

        <div className="mt-4 rounded-lg bg-base-200 p-3">
          <h4 className="mb-2 text-sm font-bold">Common 401 Error Solutions:</h4>
          <ol className="list-inside list-decimal space-y-1 text-xs">
            <li>Use the "anon public" key, not the "service_role" key</li>
            <li>Ensure the key starts with "eyJ..."</li>
            <li>Check that the key is copied completely (no truncation)</li>
            <li>Verify the key belongs to the correct Supabase project</li>
            <li>Make sure the project is active and not paused</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
