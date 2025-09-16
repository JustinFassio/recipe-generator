import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthProvider';
import { createLogger } from '@/lib/logger';
import { useEffect, useRef } from 'react';

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
  const navigate = useNavigate();
  
  // Track component mount state to prevent race conditions
  const isMountedRef = useRef(true);
  const loadingTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Loading timeout fallback - prevent infinite loading states
  useEffect(() => {
    if (loading) {
      // Clear any existing timeout
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      
      // Set 30-second timeout for loading state
      loadingTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current && loading) {
          logger.error('Loading timeout - forcing navigation to sign-in after 30s');
          logger.error('Auth state at timeout:', { user: !!user, loading, error, location: location.pathname });
          
          // Force navigation to sign-in if still loading after 30s
          if (requiresAuth) {
            navigate(redirectTo, { 
              state: { from: location, reason: 'timeout' },
              replace: true 
            });
          }
        }
      }, 30000);
    } else {
      // Clear timeout when loading completes
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = undefined;
      }
    }
    
    // Cleanup timeout on unmount or dependency change
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [loading, user, error, location.pathname, navigate, redirectTo, requiresAuth]);
  
  // Component unmount detection
  useEffect(() => {
    isMountedRef.current = true;
    logger.debug('ProtectedRoute mounted', { path: location.pathname });
    
    return () => {
      isMountedRef.current = false;
      logger.debug('ProtectedRoute unmounting', { path: location.pathname });
      
      // Clear any pending timeouts on unmount
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [location.pathname]);

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
          
          {/* Development mode debug panel */}
          {import.meta.env.DEV && (
            <div className="mt-8 p-4 bg-base-200 rounded-lg text-left max-w-md mx-auto">
              <h3 className="font-bold text-sm mb-2">🔧 Auth Debug Info</h3>
              <div className="text-xs space-y-1 text-base-content/80">
                <div>Path: <code>{location.pathname}</code></div>
                <div>Loading: <code>{loading ? 'true' : 'false'}</code></div>
                <div>User: <code>{user ? user.email : 'null'}</code></div>
                <div>Error: <code>{error || 'null'}</code></div>
                <div>Requires Auth: <code>{requiresAuth ? 'true' : 'false'}</code></div>
                <div>Mounted: <code>{isMountedRef.current ? 'true' : 'false'}</code></div>
                <div>Timeout Active: <code>{loadingTimeoutRef.current ? 'true' : 'false'}</code></div>
              </div>
              <button 
                className="btn btn-xs btn-outline mt-2"
                onClick={() => {
                  logger.debug('Manual navigation triggered from debug panel');
                  navigate(redirectTo, { replace: true });
                }}
              >
                Force Navigation
              </button>
            </div>
          )}
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
