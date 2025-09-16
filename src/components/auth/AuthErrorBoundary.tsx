import React, { Component, ErrorInfo, ReactNode } from 'react';
import { createLogger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isRetrying: boolean;
}

const logger = createLogger('AuthErrorBoundary');

export class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isRetrying: false,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error, errorInfo: null, isRetrying: false };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('AuthErrorBoundary caught an error:', error);
    logger.error('Error info:', errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // In development, provide more detailed error information
    if (import.meta.env.DEV) {
      console.group('🔴 AuthErrorBoundary Error Details');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Component Stack:', errorInfo.componentStack);
      console.groupEnd();
    }
  }

  private handleRetry = async () => {
    logger.debug('AuthErrorBoundary graceful retry triggered');
    this.setState({ isRetrying: true });

    try {
      // Attempt graceful auth recovery without page reload
      logger.debug('Attempting to refresh auth session...');

      // Refresh the auth session to restore context
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        logger.warn(
          'Session refresh failed, attempting sign out and redirect:',
          sessionError
        );
        // If session refresh fails, sign out gracefully and redirect to auth
        await supabase.auth.signOut();
        window.location.href = '/auth/signin';
        return;
      }

      if (session) {
        logger.debug('Auth session restored successfully');
        // Session is valid, reset error state and let app continue
        this.setState({
          hasError: false,
          error: null,
          errorInfo: null,
          isRetrying: false,
        });
      } else {
        logger.debug('No valid session found, redirecting to auth');
        // No session, redirect to sign in without reload
        window.location.href = '/auth/signin';
      }
    } catch (recoveryError) {
      logger.error('Graceful recovery failed:', recoveryError);
      // Only fallback to reload if graceful recovery completely fails
      this.setState({ isRetrying: false });

      // Give user choice between reload and sign out
      const userChoice = confirm(
        'Authentication recovery failed. Would you like to reload the page (OK) or sign out (Cancel)?'
      );

      if (userChoice) {
        window.location.reload();
      } else {
        await supabase.auth.signOut();
        window.location.href = '/auth/signin';
      }
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI for auth errors
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="bg-base-100 flex min-h-screen items-center justify-center">
          <div className="card bg-error text-error-content w-96 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Authentication Error</h2>
              <p>
                {this.state.error?.message?.includes(
                  'useAuth must be used within an AuthProvider'
                )
                  ? "Authentication context was lost. We'll try to restore your session without losing your current work."
                  : this.state.error?.message?.includes('auth')
                    ? 'Your authentication session encountered an issue. We can try to recover it gracefully.'
                    : this.state.error?.message ||
                      "An authentication error occurred. We'll attempt to recover your session."}
              </p>

              {import.meta.env.DEV && this.state.error && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm opacity-75">
                    🔧 Debug Info (Development)
                  </summary>
                  <div className="mt-2 text-xs bg-base-100 text-base-content p-2 rounded">
                    <div>
                      <strong>Error:</strong> {this.state.error.message}
                    </div>
                    <div>
                      <strong>Stack:</strong>
                    </div>
                    <pre className="text-xs overflow-auto max-h-32">
                      {this.state.error.stack}
                    </pre>
                  </div>
                </details>
              )}

              <div className="card-actions justify-end">
                <button
                  className="btn btn-outline"
                  onClick={this.handleRetry}
                  disabled={this.state.isRetrying}
                >
                  {this.state.isRetrying ? (
                    <>
                      <span className="loading loading-spinner loading-xs"></span>
                      Recovering...
                    </>
                  ) : (
                    'Try Again'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Convenience wrapper for auth-related components
export function withAuthErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function AuthErrorBoundaryWrapper(props: P) {
    return (
      <AuthErrorBoundary fallback={fallback}>
        <Component {...props} />
      </AuthErrorBoundary>
    );
  };
}
