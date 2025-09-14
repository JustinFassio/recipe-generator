import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthProvider';
import { createLogger } from '@/lib/logger';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiresAuth?: boolean;
  redirectTo?: string;
}

// Create logger instance outside component to prevent recreation on every render
const logger = createLogger('ProtectedRoute');

export function ProtectedRoute({
  children,
  requiresAuth = true,
  redirectTo = '/auth/signin',
}: ProtectedRouteProps) {
  const { user, loading, error } = useAuth();
  const location = useLocation();

  // Enhanced debug logging for production troubleshooting
  logger.debug('ProtectedRoute render', {
    loading,
    hasUser: !!user,
    hasError: !!error,
    requiresAuth,
    currentPath: location.pathname,
    userEmail: user?.email,
    userId: user?.id,
    timestamp: new Date().toISOString(),
    isProduction: import.meta.env.PROD,
  });

  // Additional console logging for production debugging
  console.log('🔐 [ProtectedRoute] Auth state check:', {
    loading,
    hasUser: !!user,
    userEmail: user?.email,
    hasError: !!error,
    errorMessage: error,
    requiresAuth,
    currentPath: location.pathname,
    isProduction: import.meta.env.PROD,
  });

  // Show error state if there's an error
  if (error) {
    return (
      <div className="bg-base-100 flex min-h-screen items-center justify-center">
        <div className="card bg-error text-error-content w-96 shadow-xl">
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
      <div className="bg-base-100 flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-primary mb-4"></div>
          <p className="text-base-content/60">Loading authentication...</p>
        </div>
      </div>
    );
  }

  // If auth is required but user is not authenticated, redirect to sign in
  if (requiresAuth && !user) {
    logger.auth('Redirecting to sign in - no user');
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // If auth is NOT required but user IS authenticated, optionally redirect
  // This is useful for auth pages that shouldn't be accessible when logged in
  if (!requiresAuth && user && redirectTo) {
    logger.auth('Redirecting authenticated user away from auth page');
    return <Navigate to={redirectTo} replace />;
  }

  // console.log('✅ Rendering protected content');
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
    <div className="bg-base-100 flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="loading loading-spinner loading-lg text-primary mb-4"></div>
        <p className="text-base-content/60">Loading...</p>
      </div>
    </div>
  );
}
