import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
};

type State = {
  hasError: boolean;
  error?: Error;
  errorId?: string;
};

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorId: Date.now().toString(36),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);

    if (typeof window !== 'undefined') {
      const va = (
        window as Window & {
          va?: (
            event: 'beforeSend' | 'event' | 'pageview',
            properties?: unknown
          ) => void;
        }
      ).va;
      va?.('event', {
        name: 'error-boundary',
        data: {
          message: error.message,
          stack: error.stack?.slice(0, 800),
          errorId: this.state.errorId,
        },
      });
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
            <p className="text-base-content/70 mb-6">
              Please try again.{' '}
              {this.state.errorId && (
                <span className="block mt-2 text-sm">
                  Error ID: {this.state.errorId}
                </span>
              )}
            </p>
            <button
              className="btn btn-primary w-full"
              onClick={() =>
                this.setState({
                  hasError: false,
                  error: undefined,
                  errorId: undefined,
                })
              }
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
