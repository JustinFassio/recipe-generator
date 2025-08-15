import { useEffect, useState } from 'react';

export function SafariError() {
  const [isSafari, setIsSafari] = useState(false);
  const [hasLocalhost, setHasLocalhost] = useState(false);

  useEffect(() => {
    // Detect Safari
    const userAgent = navigator.userAgent;
    const isSafariBrowser = /^((?!chrome|android).)*safari/i.test(userAgent);
    setIsSafari(isSafariBrowser);

    // Check for localhost in Supabase URL
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const hasLocalhostUrl = supabaseUrl && (
      supabaseUrl.includes('127.0.0.1') || 
      supabaseUrl.includes('localhost')
    );
    setHasLocalhost(!!hasLocalhostUrl);
  }, []);

  if (!isSafari || !hasLocalhost) {
    return null;
  }

  return (
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
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
        />
      </svg>
      <div>
        <h3 className="font-bold">Safari Security Issue</h3>
        <div className="text-sm">
          Safari is blocking connections to localhost from this HTTPS site. 
          This is a security feature. Please update your environment variables 
          to use your production Supabase URL.
        </div>
      </div>
    </div>
  );
}
