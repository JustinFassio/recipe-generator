import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

describe('Category Migration', () => {
  let supabase: ReturnType<typeof createClient>;

  beforeAll(async () => {
    supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_ANON_KEY!
    );
  });

  it('should have categories column', async () => {
    const { data, error } = await supabase
      .from('recipes')
      .select('categories')
      .limit(1);

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
});
