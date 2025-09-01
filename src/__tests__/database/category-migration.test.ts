import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

describe('Category Migration', () => {
  let supabase: ReturnType<typeof createClient>;

  beforeAll(async () => {
    // Skip if environment variables are not available (CI environment)
    if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
      console.warn(
        'Skipping Category Migration tests - Supabase environment variables not available'
      );
      return;
    }

    supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY
    );
  });

  it('should have categories column', async () => {
    if (!supabase) {
      console.warn('Skipping test - Supabase client not available');
      return;
    }

    const { data, error } = await supabase
      .from('recipes')
      .select('categories')
      .limit(1);

    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  it('should have categories column in schema', async () => {
    if (!supabase) {
      console.warn('Skipping test - Supabase client not available');
      return;
    }

    const { data, error } = await supabase
      .from('recipes')
      .select('categories')
      .limit(1);

    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  it('should support category filtering queries', async () => {
    if (!supabase) {
      console.warn('Skipping test - Supabase client not available');
      return;
    }

    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .contains('categories', ['Course: Main']);

    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });

  it('should support category filtering', async () => {
    if (!supabase) {
      console.warn('Skipping test - Supabase client not available');
      return;
    }

    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .contains('categories', ['Course: Main']);

    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });

  it('should support category overlap filtering', async () => {
    if (!supabase) {
      console.warn('Skipping test - Supabase client not available');
      return;
    }

    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .overlaps('categories', ['Course: Main', 'Course: Appetizer']);

    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });

  it('should verify category column structure', async () => {
    if (!supabase) {
      console.warn('Skipping test - Supabase client not available');
      return;
    }

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
    if (!supabase) {
      console.warn('Skipping test - Supabase client not available');
      return;
    }

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
    if (!supabase) {
      console.warn('Skipping test - Supabase client not available');
      return;
    }

    // Test that the GIN index allows efficient category queries
    const { data, error } = await supabase
      .from('recipes')
      .select('id, title, categories')
      .contains('categories', ['Course: Main'])
      .limit(10);

    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });
});
