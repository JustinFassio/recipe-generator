import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/DebugAuthProvider';

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

  console.log('🛡️ ProtectedRoute state:', {
    loading,
    hasUser: !!user,
    userEmail: user?.email,
    error,
    requiresAuth,
    currentPath: location.pathname,
  });

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
    return (
      <div className="flex min-h-screen items-center justify-center bg-base-100">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg mb-4 text-primary"></div>
          <p className="text-base-content/60">Loading authentication...</p>
          <p className="text-base-content/40 mt-2 text-xs">
            Check console for debug info
          </p>
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
