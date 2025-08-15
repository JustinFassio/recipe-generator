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

        <div className="space-y-2 text-xs">
          {Object.entries(envInfo).map(([key, value]) => (
            <div key={key} className="flex justify-between">
              <span className="font-mono">{key}:</span>
              <span
                className={`font-mono ${value === 'NOT SET' ? 'text-error' : 'text-success'}`}
              >
                {value}
              </span>
            </div>
          ))}
        </div>

        {hasLocalhost && (
          <div className="mt-4 rounded-lg bg-base-200 p-3">
            <h4 className="mb-2 text-sm font-bold">How to Fix:</h4>
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
      </div>
    </div>
  );
}
