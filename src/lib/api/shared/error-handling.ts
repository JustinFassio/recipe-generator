import { trackDatabaseError, trackAPIError } from '../../error-tracking';

// Enhanced error handler with error tracking
export function handleError(error: unknown, operation: string): never {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';

  // Determine error category and track appropriately
  if (
    error &&
    typeof error === 'object' &&
    ('code' in error || 'hint' in error || 'details' in error)
  ) {
    // Supabase database error
    trackDatabaseError(`${operation}: ${errorMessage}`, error, { operation });
  } else {
    // General API error
    trackAPIError(`${operation}: ${errorMessage}`, error, { operation });
  }

  console.error(`${operation} error:`, error);
  throw new Error(`${operation} failed: ${errorMessage}`);
}
