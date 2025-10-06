/**
 * Budget Health Check Tests
 * 
 * Unit tests for budget system health check functionality.
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  checkBudgetSystemHealth,
  quickBudgetHealthCheck,
  getBudgetSystemMetrics,
  testBudgetSystem,
} from '@/lib/ai-image-generation/budget-health-check';

// Mock Supabase
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      limit: vi.fn(),
      eq: vi.fn(() => ({
        maybeSingle: vi.fn(),
      })),
    })),
  })),
};

vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabase,
}));

// Mock budget manager
vi.mock('@/lib/ai-image-generation/budget-manager', () => ({
  getUserBudget: vi.fn(),
  canGenerateImage: vi.fn(),
}));

describe('Budget Health Check', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('checkBudgetSystemHealth', () => {
    test('should return healthy status when all checks pass', async () => {
      // Mock all systems working
      mockSupabase.from().select().limit.mockResolvedValue({
        data: [{ count: 1 }],
        error: null,
      });

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user' } },
        error: null,
      });

      const { getUserBudget } = await import('@/lib/ai-image-generation/budget-manager');
      vi.mocked(getUserBudget).mockResolvedValue({
        user_id: 'test-user',
        monthly_budget: 10,
        used_monthly: 0,
        period_start: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      });

      const result = await checkBudgetSystemHealth();

      expect(result.status).toBe('healthy');
      expect(result.issues).toHaveLength(0);
      expect(result.checks.database).toBe(true);
      expect(result.checks.authentication).toBe(true);
      expect(result.checks.budgetCreation).toBe(true);
      expect(result.checks.budgetValidation).toBe(true);
      expect(result.checks.costCalculation).toBe(true);
    });

    test('should return degraded status when some checks fail', async () => {
      // Mock database working but authentication failing
      mockSupabase.from().select().limit.mockResolvedValue({
        data: [{ count: 1 }],
        error: null,
      });

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await checkBudgetSystemHealth();

      expect(result.status).toBe('degraded');
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.checks.database).toBe(true);
      expect(result.checks.authentication).toBe(false);
    });

    test('should return unhealthy status when critical checks fail', async () => {
      // Mock database failure
      mockSupabase.from().select().limit.mockRejectedValue(
        new Error('Database connection failed')
      );

      const result = await checkBudgetSystemHealth();

      expect(result.status).toBe('unhealthy');
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.checks.database).toBe(false);
    });

    test('should handle database connectivity issues', async () => {
      // Mock database error
      mockSupabase.from().select().limit.mockResolvedValue({
        data: null,
        error: { message: 'Connection timeout' },
      });

      const result = await checkBudgetSystemHealth();

      expect(result.issues).toContain('Database connectivity issue: Connection timeout');
      expect(result.checks.database).toBe(false);
    });

    test('should handle authentication system issues', async () => {
      // Mock database working
      mockSupabase.from().select().limit.mockResolvedValue({
        data: [{ count: 1 }],
        error: null,
      });

      // Mock authentication error
      mockSupabase.auth.getUser.mockRejectedValue(
        new Error('Auth service unavailable')
      );

      const result = await checkBudgetSystemHealth();

      expect(result.issues).toContain('Authentication check failed: Error: Auth service unavailable');
      expect(result.checks.authentication).toBe(false);
    });

    test('should handle budget creation failures', async () => {
      // Mock database and auth working
      mockSupabase.from().select().limit.mockResolvedValue({
        data: [{ count: 1 }],
        error: null,
      });

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user' } },
        error: null,
      });

      // Mock budget creation failure
      const { getUserBudget } = await import('@/lib/ai-image-generation/budget-manager');
      vi.mocked(getUserBudget).mockRejectedValue(
        new Error('Budget creation failed')
      );

      const result = await checkBudgetSystemHealth();

      expect(result.issues).toContain('Budget creation check failed: Error: Budget creation failed');
      expect(result.checks.budgetCreation).toBe(false);
    });

    test('should include timestamp in result', async () => {
      // Mock all systems working
      mockSupabase.from().select().limit.mockResolvedValue({
        data: [{ count: 1 }],
        error: null,
      });

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user' } },
        error: null,
      });

      const { getUserBudget } = await import('@/lib/ai-image-generation/budget-manager');
      vi.mocked(getUserBudget).mockResolvedValue({
        user_id: 'test-user',
        monthly_budget: 10,
        used_monthly: 0,
        period_start: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      });

      const result = await checkBudgetSystemHealth();

      expect(result.timestamp).toBeDefined();
      expect(new Date(result.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('quickBudgetHealthCheck', () => {
    test('should return ok status when database is accessible', async () => {
      mockSupabase.from().select().limit.mockResolvedValue({
        data: [{ count: 1 }],
        error: null,
      });

      const result = await quickBudgetHealthCheck();

      expect(result.status).toBe('ok');
      expect(result.message).toBe('Budget system is healthy');
    });

    test('should return error status when database is inaccessible', async () => {
      mockSupabase.from().select().limit.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const result = await quickBudgetHealthCheck();

      expect(result.status).toBe('error');
      expect(result.message).toContain('Database error');
    });

    test('should handle exceptions gracefully', async () => {
      mockSupabase.from().select().limit.mockRejectedValue(
        new Error('Network error')
      );

      const result = await quickBudgetHealthCheck();

      expect(result.status).toBe('error');
      expect(result.message).toContain('Health check failed');
    });
  });

  describe('getBudgetSystemMetrics', () => {
    test('should return correct metrics when data is available', async () => {
      const mockBudgets = [
        { monthly_budget: 10, used_monthly: 2 },
        { monthly_budget: 20, used_monthly: 5 },
        { monthly_budget: 15, used_monthly: 3 },
      ];

      mockSupabase.from().select().eq.mockResolvedValue({
        data: mockBudgets,
        error: null,
      });

      const result = await getBudgetSystemMetrics();

      expect(result.totalUsers).toBe(3);
      expect(result.totalBudgets).toBe(3);
      expect(result.averageBudget).toBe(15); // (10 + 20 + 15) / 3
      expect(result.totalSpent).toBe(10); // 2 + 5 + 3
      expect(result.systemUptime).toBe('N/A');
    });

    test('should handle empty data gracefully', async () => {
      mockSupabase.from().select().eq.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await getBudgetSystemMetrics();

      expect(result.totalUsers).toBe(0);
      expect(result.totalBudgets).toBe(0);
      expect(result.averageBudget).toBe(0);
      expect(result.totalSpent).toBe(0);
    });

    test('should handle database errors gracefully', async () => {
      mockSupabase.from().select().eq.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const result = await getBudgetSystemMetrics();

      expect(result.totalUsers).toBe(0);
      expect(result.totalBudgets).toBe(0);
      expect(result.averageBudget).toBe(0);
      expect(result.totalSpent).toBe(0);
      expect(result.systemUptime).toBe('Error');
    });

    test('should handle exceptions gracefully', async () => {
      mockSupabase.from().select().eq.mockRejectedValue(
        new Error('Network error')
      );

      const result = await getBudgetSystemMetrics();

      expect(result.totalUsers).toBe(0);
      expect(result.totalBudgets).toBe(0);
      expect(result.averageBudget).toBe(0);
      expect(result.totalSpent).toBe(0);
      expect(result.systemUptime).toBe('Error');
    });
  });

  describe('testBudgetSystem', () => {
    test('should return success when all tests pass', async () => {
      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user' } },
        error: null,
      });

      // Mock budget manager functions
      const { getUserBudget, canGenerateImage } = await import('@/lib/ai-image-generation/budget-manager');
      vi.mocked(getUserBudget).mockResolvedValue({
        user_id: 'test-user',
        monthly_budget: 10,
        used_monthly: 0,
        period_start: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      });

      vi.mocked(canGenerateImage).mockResolvedValue({
        allowed: true,
      });

      const result = await testBudgetSystem();

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.results.budgetCreation).toBe(true);
      expect(result.results.budgetValidation).toBe(true);
      expect(result.results.costCalculation).toBe(true);
      expect(result.results.budgetCheck).toBe(true);
    });

    test('should return failure when tests fail', async () => {
      // Mock unauthenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await testBudgetSystem();

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.results.budgetCreation).toBe(false);
    });

    test('should handle individual test failures', async () => {
      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user' } },
        error: null,
      });

      // Mock budget creation failure
      const { getUserBudget } = await import('@/lib/ai-image-generation/budget-manager');
      vi.mocked(getUserBudget).mockRejectedValue(
        new Error('Budget creation failed')
      );

      const result = await testBudgetSystem();

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Budget creation test error: Error: Budget creation failed');
      expect(result.results.budgetCreation).toBe(false);
    });

    test('should handle system errors gracefully', async () => {
      // Mock system error
      mockSupabase.auth.getUser.mockRejectedValue(
        new Error('System error')
      );

      const result = await testBudgetSystem();

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Budget system test error: Error: System error');
    });
  });
});
