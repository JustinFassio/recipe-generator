/**
 * Database Test Setup
 * Provides real Supabase client for database tests
 */

import { vi } from 'vitest';
import {
  createDbClient,
  shouldRunDbTests,
} from '../../tests/database/_utils/dbClient';

/**
 * Setup database tests with real Supabase client
 * This function should be called in database test files
 */
export const setupDatabaseTests = () => {
  if (shouldRunDbTests()) {
    // Clear all mocks to ensure clean state
    vi.clearAllMocks();

    // Restore real fetch for database tests
    vi.restoreAllMocks();

    // Unmock Supabase for database tests
    vi.unmock('@/lib/supabase');
    vi.unmock('@supabase/supabase-js');

    // Use real Supabase client with service role for admin operations
    return createDbClient('service');
  } else {
    throw new Error('Database tests require Supabase environment variables');
  }
};

/**
 * Check if database tests should run
 */
export const shouldRunDatabaseTests = () => {
  return shouldRunDbTests();
};
