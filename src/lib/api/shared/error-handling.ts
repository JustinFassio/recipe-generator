import { trackDatabaseError, trackAPIError } from '../../error-tracking';

// Enhanced error handler with error tracking
export function handleError(error: unknown, operation: string): never {
  const isPostgrestError =
    error &&
    typeof error === 'object' &&
    ('code' in error || 'hint' in error || 'details' in error);

  const errorMessage = (() => {
    if (error instanceof Error) return error.message;
    if (isPostgrestError) {
      const e = error as { message?: string; code?: string; details?: string };
      return (
        [e.code, e.message, e.details].filter(Boolean).join(' | ') ||
        'Unknown error'
      );
    }
    return 'Unknown error';
  })();

  // Determine error category and track appropriately
  if (isPostgrestError) {
    // Supabase database error
    trackDatabaseError(`${operation}: ${errorMessage}`, error, { operation });
  } else {
    // General API error
    trackAPIError(`${operation}: ${errorMessage}`, error, { operation });
  }

  console.error(`${operation} error:`, error);
  throw new Error(`${operation} failed: ${errorMessage}`);
}
