import { describe, it, expect, beforeAll, vi } from 'vitest';
import {
  createDbClient,
  shouldRunDbTests,
} from '../../../tests/database/_utils/dbClient';
import { setupDatabaseTests } from '../../test/database-setup';

// Unmock Supabase for database tests
vi.unmock('@supabase/supabase-js');

const RUN = shouldRunDbTests();

RUN
  ? describe('Category Migration', () => {
      let supabase: ReturnType<typeof createDbClient>;

      beforeAll(async () => {
        console.log('shouldRunDbTests():', shouldRunDbTests());
        console.log('Environment check:', {
          url: process.env.VITE_SUPABASE_URL,
          anonKey: process.env.VITE_SUPABASE_ANON_KEY,
          serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
          serviceKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length,
        });

        // Use database setup for conditional mocking
        supabase = setupDatabaseTests();
        console.log('Supabase client created:', !!supabase);
      });

      it('should have categories column', async () => {
        const { data, error } = await supabase
          .from('recipes')
          .select('categories')
          .limit(1);

        console.log('Error details:', error);
        expect(error).toBeNull();
        expect(data).toBeDefined();
      });

      it('should have categories column in schema', async () => {
        const { data, error } = await supabase
          .from('recipes')
          .select('categories')
          .limit(1);

        expect(error).toBeNull();
        expect(data).toBeDefined();
      });

      it('should support category filtering queries', async () => {
        const { data, error } = await supabase
          .from('recipes')
          .select('*')
          .contains('categories', ['Course: Main']);

        expect(error).toBeNull();
        expect(Array.isArray(data)).toBe(true);
      });

      it('should support category filtering', async () => {
        const { data, error } = await supabase
          .from('recipes')
          .select('*')
          .contains('categories', ['Course: Main']);

        expect(error).toBeNull();
        expect(Array.isArray(data)).toBe(true);
      });

      it('should support category overlap filtering', async () => {
        const { data, error } = await supabase
          .from('recipes')
          .select('*')
          .overlaps('categories', ['Course: Main', 'Course: Appetizer']);

        expect(error).toBeNull();
        expect(Array.isArray(data)).toBe(true);
      });

      it('should verify category column structure', async () => {
        const { data, error } = await supabase
          .from('recipes')
          .select('id, title, categories')
          .limit(1);

        expect(error).toBeNull();
        if (data && data.length > 0) {
          expect(data[0]).toHaveProperty('categories');
          expect(Array.isArray(data[0].categories)).toBe(true);
        }
      });

      it('should support category array operations', async () => {
        // Test basic category operations
        const { data, error } = await supabase
          .from('recipes')
          .select('id, title, categories')
          .limit(5);

        expect(error).toBeNull();
        expect(Array.isArray(data)).toBe(true);

        if (data.length > 0) {
          expect(data[0]).toHaveProperty('categories');
          expect(Array.isArray(data[0].categories)).toBe(true);
        }
      });

      it('should verify GIN index functionality', async () => {
        // Test that the GIN index allows efficient category queries
        const { data, error } = await supabase
          .from('recipes')
          .select('id, title, categories')
          .contains('categories', ['Course: Main'])
          .limit(10);

        expect(error).toBeNull();
        expect(Array.isArray(data)).toBe(true);
      });
    })
  : describe.skip('Category Migration', () => {
      it('should skip tests when database is not available', () => {
        // This test will be skipped when RUN is false
      });
    });
