import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SimpleAuthProvider';
import { clearAuthAndReload, recoverAuth } from '@/lib/auth-recovery';
import { useState, useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiresAuth?: boolean;
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  requiresAuth = true,
  redirectTo = '/auth/signin',
}: ProtectedRouteProps) {
  const { user, loading, error } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [recoveryAttempted, setRecoveryAttempted] = useState(false);
  const [recoveryLoading, setRecoveryLoading] = useState(false);

  console.log('🛡️ ProtectedRoute state:', {
    loading,
    hasUser: !!user,
    userEmail: user?.email,
    error,
    requiresAuth,
    currentPath: location.pathname,
  });

  // Show recovery options after 5 seconds of loading
  useEffect(() => {
    if (loading && !recoveryAttempted) {
      const timer = setTimeout(() => {
        setRecoveryAttempted(true);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [loading, recoveryAttempted]);

  // Show error state if there's an error
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base-100">
        <div className="card w-96 bg-error text-error-content shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Authentication Error</h2>
            <p>{error}</p>
            <div className="card-actions justify-end">
              <button
                className="btn btn-outline"
                onClick={() => window.location.reload()}
              >
                Reload
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show loading spinner while checking auth state
  if (loading) {
    const handleRecovery = async () => {
      setRecoveryLoading(true);
      try {
        const result = await recoverAuth();
        if (result.success) {
          console.log('🔧 Auth recovery successful:', result.method);
          // Instead of reloading, navigate to the current path to re-trigger auth check
          navigate(location.pathname, { replace: true });
        } else {
          console.log('🔧 Auth recovery failed:', result.error);
          // If recovery fails, clear auth and reload
          await clearAuthAndReload();
        }
      } catch (error) {
        console.error('🔧 Recovery error:', error);
        await clearAuthAndReload();
      }
    };

    const handleClearAuth = async () => {
      setRecoveryLoading(true);
      await clearAuthAndReload();
    };

    return (
      <div className="flex min-h-screen items-center justify-center bg-base-100">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg mb-4 text-primary"></div>
          <p className="text-base-content/60">Loading authentication...</p>
          <p className="text-base-content/40 mt-2 text-xs">
            Check console for debug info
          </p>

          {/* Show recovery options after 5 seconds of loading */}
          {recoveryAttempted && (
            <div className="mt-6 space-y-2">
              <p className="text-base-content/50 text-sm">
                Taking longer than usual? Try these options:
              </p>
              <div className="flex justify-center gap-2">
                <button
                  className="btn btn-outline btn-sm"
                  onClick={handleRecovery}
                  disabled={recoveryLoading}
                >
                  {recoveryLoading ? 'Recovering...' : 'Try Recovery'}
                </button>
                <button
                  className="btn btn-error btn-outline btn-sm"
                  onClick={handleClearAuth}
                  disabled={recoveryLoading}
                >
                  {recoveryLoading ? 'Clearing...' : 'Clear & Reload'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // If auth is required but user is not authenticated, redirect to sign in
  if (requiresAuth && !user) {
    console.log('🚫 Redirecting to sign in - no user');
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // If auth is NOT required but user IS authenticated, optionally redirect
  // This is useful for auth pages that shouldn't be accessible when logged in
  if (!requiresAuth && user && redirectTo) {
    console.log('🔄 Redirecting authenticated user away from auth page');
    return <Navigate to={redirectTo} replace />;
  }

  console.log('✅ Rendering protected content');
  return <>{children}</>;
}

// Convenience component for public routes that redirect authenticated users
export function PublicRoute({
  children,
  redirectTo = '/recipes',
}: {
  children: React.ReactNode;
  redirectTo?: string;
}) {
  return (
    <ProtectedRoute requiresAuth={false} redirectTo={redirectTo}>
      {children}
    </ProtectedRoute>
  );
}

// Loading component for auth states
export function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-base-100">
      <div className="text-center">
        <div className="loading loading-spinner loading-lg mb-4 text-primary"></div>
        <p className="text-base-content/60">Loading...</p>
      </div>
    </div>
  );
}
