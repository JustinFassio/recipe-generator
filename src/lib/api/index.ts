// Unified API exports - maintains backward compatibility
// This file re-exports all API methods so existing imports continue to work

// Export individual modules for direct access
export { versioningApi } from './features/versioning-api';
export { handleError } from './shared/error-handling';

// Re-export types for convenience
export type * from '../types';
