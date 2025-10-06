/**
 * Budget Manager Tests
 * 
 * Comprehensive unit tests for the budget manager functionality.
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  getUserBudget, 
  updateUserBudget, 
  updateBudgetAfterGeneration, 
  canGenerateImage 
} from '@/lib/ai-image-generation/budget-manager';
import { BUDGET_CONFIG } from '@/config/budget';

// Mock Supabase
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        maybeSingle: vi.fn(),
        single: vi.fn(),
      })),
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(),
      })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  })),
};

vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabase,
}));

describe('Budget Manager', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
  };

  const mockBudget = {
    user_id: 'test-user-id',
    monthly_budget: 10,
    used_monthly: 2,
    period_start: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getUserBudget', () => {
    test('should return existing budget for authenticated user', async () => {
      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock existing budget
      mockSupabase.from().select().eq().maybeSingle.mockResolvedValue({
        data: mockBudget,
        error: null,
      });

      const result = await getUserBudget();

      expect(result).toEqual(mockBudget);
      expect(mockSupabase.from).toHaveBeenCalledWith('user_budgets');
    });

    test('should create default budget for new user', async () => {
      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock no existing budget
      mockSupabase.from().select().eq().maybeSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });

      // Mock budget creation
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: mockBudget,
        error: null,
      });

      const result = await getUserBudget();

      expect(result).toEqual(mockBudget);
      expect(mockSupabase.from().insert).toHaveBeenCalledWith({
        user_id: 'test-user-id',
        monthly_budget: BUDGET_CONFIG.DEFAULT_MONTHLY_BUDGET,
        used_monthly: 0,
        period_start: expect.any(String),
        updated_at: expect.any(String),
      });
    });

    test('should throw error for unauthenticated user', async () => {
      // Mock unauthenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(getUserBudget()).rejects.toThrow('User not authenticated');
    });

    test('should throw error for invalid user ID', async () => {
      // Mock authenticated user with invalid ID
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'invalid-id' } },
        error: null,
      });

      await expect(getUserBudget()).rejects.toThrow('User ID must be a valid UUID');
    });

    test('should handle database errors gracefully', async () => {
      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock database error
      mockSupabase.from().select().eq().maybeSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST001', message: 'Database error' },
      });

      await expect(getUserBudget()).rejects.toThrow('Database error');
    });
  });

  describe('updateUserBudget', () => {
    test('should update budget successfully', async () => {
      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock successful update
      mockSupabase.from().update().eq().select().single.mockResolvedValue({
        data: { ...mockBudget, monthly_budget: 20 },
        error: null,
      });

      const result = await updateUserBudget({ monthly_budget: 20 });

      expect(result.monthly_budget).toBe(20);
      expect(mockSupabase.from().update).toHaveBeenCalledWith({
        monthly_budget: 20,
        updated_at: expect.any(String),
      });
    });

    test('should validate budget amount', async () => {
      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      await expect(updateUserBudget({ monthly_budget: -1 })).rejects.toThrow(
        'Budget must be at least $1'
      );

      await expect(updateUserBudget({ monthly_budget: 2000 })).rejects.toThrow(
        'Budget cannot exceed $1000'
      );
    });

    test('should throw error for unauthenticated user', async () => {
      // Mock unauthenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(updateUserBudget({ monthly_budget: 20 })).rejects.toThrow(
        'User not authenticated'
      );
    });
  });

  describe('updateBudgetAfterGeneration', () => {
    test('should update budget after successful generation', async () => {
      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock current budget
      mockSupabase.from().select().eq().maybeSingle.mockResolvedValue({
        data: { used_monthly: 2 },
        error: null,
      });

      // Mock successful update
      mockSupabase.from().update().eq.mockResolvedValue({
        data: null,
        error: null,
      });

      await updateBudgetAfterGeneration(0.05);

      expect(mockSupabase.from().update).toHaveBeenCalledWith({
        used_monthly: 2.05,
        updated_at: expect.any(String),
      });
    });

    test('should handle missing budget gracefully', async () => {
      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock no existing budget
      mockSupabase.from().select().eq().maybeSingle.mockResolvedValue({
        data: null,
        error: null,
      });

      // Should not throw error
      await expect(updateBudgetAfterGeneration(0.05)).resolves.not.toThrow();
    });

    test('should handle update errors gracefully', async () => {
      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock current budget
      mockSupabase.from().select().eq().maybeSingle.mockResolvedValue({
        data: { used_monthly: 2 },
        error: null,
      });

      // Mock update error
      mockSupabase.from().update().eq.mockResolvedValue({
        data: null,
        error: { message: 'Update failed' },
      });

      // Should not throw error (graceful degradation)
      await expect(updateBudgetAfterGeneration(0.05)).resolves.not.toThrow();
    });
  });

  describe('canGenerateImage', () => {
    test('should allow generation when budget is sufficient', async () => {
      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock sufficient budget
      mockSupabase.from().select().eq().maybeSingle.mockResolvedValue({
        data: mockBudget,
        error: null,
      });

      const result = await canGenerateImage(0.05);

      expect(result.allowed).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    test('should deny generation when budget is insufficient', async () => {
      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock insufficient budget
      const insufficientBudget = {
        ...mockBudget,
        used_monthly: 9.5, // Only $0.50 remaining
      };

      mockSupabase.from().select().eq().maybeSingle.mockResolvedValue({
        data: insufficientBudget,
        error: null,
      });

      const result = await canGenerateImage(0.75); // $0.75 cost

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Insufficient budget');
    });

    test('should fail open when budget system is down', async () => {
      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock budget system failure
      mockSupabase.from().select().eq().maybeSingle.mockRejectedValue(
        new Error('Database connection failed')
      );

      const result = await canGenerateImage(0.05);

      expect(result.allowed).toBe(BUDGET_CONFIG.ERROR_HANDLING.FAIL_OPEN);
    });

    test('should handle invalid cost values', async () => {
      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock sufficient budget
      mockSupabase.from().select().eq().maybeSingle.mockResolvedValue({
        data: mockBudget,
        error: null,
      });

      const result = await canGenerateImage(-1); // Invalid cost

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Insufficient budget');
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      // Mock network error
      mockSupabase.auth.getUser.mockRejectedValue(
        new Error('Network error')
      );

      await expect(getUserBudget()).rejects.toThrow('Network error');
    });

    test('should handle malformed responses', async () => {
      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock malformed response
      mockSupabase.from().select().eq().maybeSingle.mockResolvedValue({
        data: null,
        error: null,
      });

      // Mock budget creation with malformed response
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: null,
        error: { message: 'Insert failed' },
      });

      await expect(getUserBudget()).rejects.toThrow('Insert failed');
    });
  });

  describe('Performance', () => {
    test('should complete operations within reasonable time', async () => {
      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock fast response
      mockSupabase.from().select().eq().maybeSingle.mockResolvedValue({
        data: mockBudget,
        error: null,
      });

      const startTime = Date.now();
      await getUserBudget();
      const duration = Date.now() - startTime;

      // Should complete within 100ms (mocked)
      expect(duration).toBeLessThan(100);
    });
  });
});
