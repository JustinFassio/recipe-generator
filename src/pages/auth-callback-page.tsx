import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/SimpleAuthProvider';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading'
  );
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Handle the auth callback
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth callback error:', error);
          setStatus('error');
          setMessage(error.message || 'Authentication failed');

          // Redirect to sign in page after a delay
          setTimeout(() => {
            navigate('/auth/signin', { replace: true });
          }, 3000);
          return;
        }

        if (data.session) {
          setStatus('success');
          setMessage('Authentication successful! Redirecting...');

          // Check if there's a redirect URL in the state
          const from = searchParams.get('from') || '/recipes';

          // Redirect after a short delay
          setTimeout(() => {
            navigate(from, { replace: true });
          }, 1000);
        } else {
          setStatus('error');
          setMessage('No session found');

          setTimeout(() => {
            navigate('/auth/signin', { replace: true });
          }, 3000);
        }
      } catch (error) {
        console.error('Callback handling error:', error);
        setStatus('error');
        setMessage('An unexpected error occurred');

        setTimeout(() => {
          navigate('/auth/signin', { replace: true });
        }, 3000);
      }
    };

    handleAuthCallback();
  }, [navigate, searchParams]);

  // If user is already authenticated, redirect them
  useEffect(() => {
    if (user && status === 'loading') {
      const from = searchParams.get('from') || '/recipes';
      navigate(from, { replace: true });
    }
  }, [user, status, navigate, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-base-100">
      <div className="card w-96 bg-base-200 shadow-xl">
        <div className="card-body text-center">
          {status === 'loading' && (
            <>
              <div className="loading loading-spinner loading-lg mb-4 text-primary"></div>
              <h2 className="card-title justify-center">Authenticating</h2>
              <p className="text-base-content/60">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mb-4 text-6xl">✅</div>
              <h2 className="card-title justify-center text-success">
                Success!
              </h2>
              <p className="text-base-content/60">{message}</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mb-4 text-6xl">❌</div>
              <h2 className="card-title justify-center text-error">Error</h2>
              <p className="text-base-content/60">{message}</p>
              <div className="card-actions mt-4 justify-center">
                <button
                  className="btn btn-primary"
                  onClick={() => navigate('/auth/signin', { replace: true })}
                >
                  Back to Sign In
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
