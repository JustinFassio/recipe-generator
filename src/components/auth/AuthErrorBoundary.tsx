import React, { Component, ErrorInfo, ReactNode } from 'react';
import { createLogger } from '@/lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

const logger = createLogger('AuthErrorBoundary');

export class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error, errorInfo: null };
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

  private handleRetry = () => {
    logger.debug('AuthErrorBoundary retry triggered');
    this.setState({ hasError: false, error: null, errorInfo: null });

    // Force a page reload to reset auth context
    window.location.reload();
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
                  ? 'Authentication context was lost during page update. This can happen during development.'
                  : this.state.error?.message ||
                    'An authentication error occurred.'}
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
                <button className="btn btn-outline" onClick={this.handleRetry}>
                  Reload Page
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
