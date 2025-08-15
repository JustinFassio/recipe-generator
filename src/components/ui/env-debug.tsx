import { useState } from 'react';

export function EnvDebug() {
  const [isVisible, setIsVisible] = useState(false);

  // Only show in development or when explicitly enabled
  if (import.meta.env.PROD && !isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="btn btn-ghost btn-sm btn-circle fixed bottom-4 right-4 bg-base-200"
        title="Show Environment Debug Info"
      >
        🔧
      </button>
    );
  }

  const envInfo = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY
      ? '***SET***'
      : 'NOT SET',
    VITE_OPENAI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY
      ? '***SET***'
      : 'NOT SET',
    VITE_OPENAI_MODEL: import.meta.env.VITE_OPENAI_MODEL,
    MODE: import.meta.env.MODE,
    PROD: import.meta.env.PROD,
  };

  const hasLocalhost =
    envInfo.VITE_SUPABASE_URL?.includes('127.0.0.1') ||
    envInfo.VITE_SUPABASE_URL?.includes('localhost');

  const hasValidSupabaseUrl = envInfo.VITE_SUPABASE_URL?.startsWith('https://');
  const hasValidAnonKey = envInfo.VITE_SUPABASE_ANON_KEY === '***SET***';

  return (
    <div className="card fixed bottom-4 right-4 border border-error bg-base-100 shadow-xl">
      <div className="card-body max-w-md p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="card-title text-sm">Environment Debug</h3>
          <button
            onClick={() => setIsVisible(false)}
            className="btn btn-ghost btn-sm btn-circle"
          >
            ✕
          </button>
        </div>

        {hasLocalhost && (
          <div className="alert alert-error mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 shrink-0 stroke-current"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Supabase URL points to localhost!</span>
          </div>
        )}

        {!hasLocalhost && !hasValidAnonKey && (
          <div className="alert alert-warning mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 shrink-0 stroke-current"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <span>401 Error: Missing or invalid Supabase anon key</span>
          </div>
        )}

        {!hasLocalhost && hasValidAnonKey && (
          <div className="alert alert-success mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 shrink-0 stroke-current"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Environment variables look correct!</span>
          </div>
        )}

        <div className="space-y-2 text-xs">
          {Object.entries(envInfo).map(([key, value]) => (
            <div key={key} className="flex justify-between">
              <span className="font-mono">{key}:</span>
              <span
                className={`font-mono ${
                  value === 'NOT SET' ? 'text-error' : 'text-success'
                }`}
              >
                {value}
              </span>
            </div>
          ))}
        </div>

        {hasLocalhost && (
          <div className="mt-4 rounded-lg bg-base-200 p-3">
            <h4 className="mb-2 text-sm font-bold">How to Fix Localhost:</h4>
            <ol className="list-inside list-decimal space-y-1 text-xs">
              <li>Go to Vercel Dashboard</li>
              <li>Navigate to your project</li>
              <li>Go to Settings → Environment Variables</li>
              <li>Update VITE_SUPABASE_URL to your production URL</li>
              <li>Update VITE_SUPABASE_ANON_KEY to your production key</li>
              <li>Redeploy the application</li>
            </ol>
          </div>
        )}

        {!hasLocalhost && !hasValidAnonKey && (
          <div className="mt-4 rounded-lg bg-base-200 p-3">
            <h4 className="mb-2 text-sm font-bold">How to Fix 401 Error:</h4>
            <ol className="list-inside list-decimal space-y-1 text-xs">
              <li>Go to Supabase Dashboard</li>
              <li>Select your production project</li>
              <li>Go to Settings → API</li>
              <li>Copy the "anon public" key (not service_role)</li>
              <li>Update VITE_SUPABASE_ANON_KEY in Vercel</li>
              <li>Redeploy the application</li>
            </ol>
          </div>
        )}

        <div className="mt-4 rounded-lg bg-base-200 p-3">
          <h4 className="mb-2 text-sm font-bold">Current Status:</h4>
          <div className="space-y-1 text-xs">
            <div>URL Valid: {hasValidSupabaseUrl ? '✅' : '❌'}</div>
            <div>Anon Key Set: {hasValidAnonKey ? '✅' : '❌'}</div>
            <div>Localhost: {hasLocalhost ? '❌' : '✅'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
