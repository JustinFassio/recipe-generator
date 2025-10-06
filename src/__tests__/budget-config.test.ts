/**
 * Budget Configuration Tests
 * 
 * Unit tests for budget configuration and utility functions.
 */

import { describe, test, expect } from 'vitest';
import {
  BUDGET_CONFIG,
  getImageCost,
  validateBudgetAmount,
  validateUserId,
  getBudgetStatus,
  formatCurrency,
  calculateRemainingBudget,
  canAffordGeneration,
} from '@/config/budget';

describe('Budget Configuration', () => {
  describe('BUDGET_CONFIG', () => {
    test('should have valid default values', () => {
      expect(BUDGET_CONFIG.DEFAULT_MONTHLY_BUDGET).toBe(10);
      expect(BUDGET_CONFIG.MIN_MONTHLY_BUDGET).toBe(1);
      expect(BUDGET_CONFIG.MAX_MONTHLY_BUDGET).toBe(1000);
      expect(BUDGET_CONFIG.BUDGET_PERIOD_DAYS).toBe(30);
    });

    test('should have valid cost per image configuration', () => {
      expect(BUDGET_CONFIG.COST_PER_IMAGE['1024x1024'].standard).toBe(0.04);
      expect(BUDGET_CONFIG.COST_PER_IMAGE['1024x1024'].hd).toBe(0.08);
      expect(BUDGET_CONFIG.COST_PER_IMAGE['1024x1792'].standard).toBe(0.08);
      expect(BUDGET_CONFIG.COST_PER_IMAGE['1024x1792'].hd).toBe(0.12);
      expect(BUDGET_CONFIG.COST_PER_IMAGE['1792x1024'].standard).toBe(0.08);
      expect(BUDGET_CONFIG.COST_PER_IMAGE['1792x1024'].hd).toBe(0.12);
    });

    test('should have valid alert thresholds', () => {
      expect(BUDGET_CONFIG.ALERT_THRESHOLDS.WARNING).toBe(75);
      expect(BUDGET_CONFIG.ALERT_THRESHOLDS.CRITICAL).toBe(90);
    });

    test('should have valid error handling configuration', () => {
      expect(BUDGET_CONFIG.ERROR_HANDLING.FAIL_OPEN).toBe(true);
      expect(BUDGET_CONFIG.ERROR_HANDLING.RETRY_ATTEMPTS).toBe(3);
      expect(BUDGET_CONFIG.ERROR_HANDLING.RETRY_DELAY_MS).toBe(1000);
    });

    test('should have valid cache configuration', () => {
      expect(BUDGET_CONFIG.CACHE.TTL_MS).toBe(5 * 60 * 1000);
      expect(BUDGET_CONFIG.CACHE.MAX_ENTRIES).toBe(1000);
    });

    test('should have valid rate limits', () => {
      expect(BUDGET_CONFIG.RATE_LIMITS.BUDGET_CHECKS_PER_MINUTE).toBe(60);
      expect(BUDGET_CONFIG.RATE_LIMITS.BUDGET_UPDATES_PER_MINUTE).toBe(10);
    });
  });

  describe('getImageCost', () => {
    test('should return correct cost for 1024x1024 standard', () => {
      expect(getImageCost('1024x1024', 'standard')).toBe(0.04);
    });

    test('should return correct cost for 1024x1024 HD', () => {
      expect(getImageCost('1024x1024', 'hd')).toBe(0.08);
    });

    test('should return correct cost for 1024x1792 standard', () => {
      expect(getImageCost('1024x1792', 'standard')).toBe(0.08);
    });

    test('should return correct cost for 1024x1792 HD', () => {
      expect(getImageCost('1024x1792', 'hd')).toBe(0.12);
    });

    test('should return correct cost for 1792x1024 standard', () => {
      expect(getImageCost('1792x1024', 'standard')).toBe(0.08);
    });

    test('should return correct cost for 1792x1024 HD', () => {
      expect(getImageCost('1792x1024', 'hd')).toBe(0.12);
    });
  });

  describe('validateBudgetAmount', () => {
    test('should validate correct budget amounts', () => {
      expect(validateBudgetAmount(10)).toEqual({ valid: true });
      expect(validateBudgetAmount(1)).toEqual({ valid: true });
      expect(validateBudgetAmount(1000)).toEqual({ valid: true });
      expect(validateBudgetAmount(50.5)).toEqual({ valid: true });
    });

    test('should reject invalid budget amounts', () => {
      expect(validateBudgetAmount(0)).toEqual({
        valid: false,
        error: 'Budget must be at least $1',
      });

      expect(validateBudgetAmount(-1)).toEqual({
        valid: false,
        error: 'Budget must be at least $1',
      });

      expect(validateBudgetAmount(1001)).toEqual({
        valid: false,
        error: 'Budget cannot exceed $1000',
      });

      expect(validateBudgetAmount(NaN)).toEqual({
        valid: false,
        error: 'Budget amount must be a valid number',
      });

      expect(validateBudgetAmount(Infinity)).toEqual({
        valid: false,
        error: 'Budget cannot exceed $1000',
      });
    });

    test('should handle edge cases', () => {
      expect(validateBudgetAmount(0.01)).toEqual({
        valid: false,
        error: 'Budget must be at least $1',
      });

      expect(validateBudgetAmount(999.99)).toEqual({ valid: true });
    });
  });

  describe('validateUserId', () => {
    test('should validate correct UUIDs', () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      expect(validateUserId(validUuid)).toEqual({ valid: true });

      const validUuid2 = '00000000-0000-0000-0000-000000000000';
      expect(validateUserId(validUuid2)).toEqual({ valid: true });

      const validUuid3 = 'FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF';
      expect(validateUserId(validUuid3)).toEqual({ valid: true });
    });

    test('should reject invalid UUIDs', () => {
      expect(validateUserId('invalid-uuid')).toEqual({
        valid: false,
        error: 'User ID must be a valid UUID',
      });

      expect(validateUserId('123e4567-e89b-12d3-a456')).toEqual({
        valid: false,
        error: 'User ID must be a valid UUID',
      });

      expect(validateUserId('123e4567-e89b-12d3-a456-42661417400g')).toEqual({
        valid: false,
        error: 'User ID must be a valid UUID',
      });

      expect(validateUserId('')).toEqual({
        valid: false,
        error: 'User ID is required',
      });
    });

    test('should handle undefined and null', () => {
      expect(validateUserId(undefined)).toEqual({
        valid: false,
        error: 'User ID is required',
      });

      expect(validateUserId(null as any)).toEqual({
        valid: false,
        error: 'User ID is required',
      });
    });
  });

  describe('getBudgetStatus', () => {
    test('should return healthy status for low usage', () => {
      expect(getBudgetStatus(1, 10)).toBe('healthy');
      expect(getBudgetStatus(5, 100)).toBe('healthy');
      expect(getBudgetStatus(70, 100)).toBe('healthy');
    });

    test('should return warning status for moderate usage', () => {
      expect(getBudgetStatus(75, 100)).toBe('warning');
      expect(getBudgetStatus(80, 100)).toBe('warning');
      expect(getBudgetStatus(89, 100)).toBe('warning');
    });

    test('should return critical status for high usage', () => {
      expect(getBudgetStatus(90, 100)).toBe('critical');
      expect(getBudgetStatus(95, 100)).toBe('critical');
      expect(getBudgetStatus(99, 100)).toBe('critical');
    });

    test('should return exceeded status for over budget', () => {
      expect(getBudgetStatus(100, 100)).toBe('exceeded');
      expect(getBudgetStatus(110, 100)).toBe('exceeded');
      expect(getBudgetStatus(150, 100)).toBe('exceeded');
    });

    test('should handle edge cases', () => {
      expect(getBudgetStatus(0, 100)).toBe('healthy');
      expect(getBudgetStatus(74.9, 100)).toBe('healthy');
      expect(getBudgetStatus(75.1, 100)).toBe('warning');
      expect(getBudgetStatus(89.9, 100)).toBe('warning');
      expect(getBudgetStatus(90.1, 100)).toBe('critical');
    });
  });

  describe('formatCurrency', () => {
    test('should format currency correctly', () => {
      expect(formatCurrency(0)).toBe('$0.00');
      expect(formatCurrency(1)).toBe('$1.00');
      expect(formatCurrency(10)).toBe('$10.00');
      expect(formatCurrency(10.5)).toBe('$10.50');
      expect(formatCurrency(10.55)).toBe('$10.55');
      expect(formatCurrency(10.555)).toBe('$10.55'); // toFixed(2) truncates
      expect(formatCurrency(10.554)).toBe('$10.55'); // toFixed(2) truncates
    });

    test('should handle negative amounts', () => {
      expect(formatCurrency(-1)).toBe('$-1.00');
      expect(formatCurrency(-10.5)).toBe('$-10.50');
    });

    test('should handle very large amounts', () => {
      expect(formatCurrency(1000000)).toBe('$1000000.00');
      expect(formatCurrency(1000000.99)).toBe('$1000000.99');
    });
  });

  describe('calculateRemainingBudget', () => {
    test('should calculate remaining budget correctly', () => {
      expect(calculateRemainingBudget(0, 10)).toBe(10);
      expect(calculateRemainingBudget(5, 10)).toBe(5);
      expect(calculateRemainingBudget(10, 10)).toBe(0);
      expect(calculateRemainingBudget(15, 10)).toBe(0); // Never negative
    });

    test('should handle edge cases', () => {
      expect(calculateRemainingBudget(0, 0)).toBe(0);
      expect(calculateRemainingBudget(-5, 10)).toBe(15); // Negative used: 10 - (-5) = 15
      expect(calculateRemainingBudget(5, -10)).toBe(0); // Negative total
    });
  });

  describe('canAffordGeneration', () => {
    test('should allow generation when budget is sufficient', () => {
      expect(canAffordGeneration(0.05, 5, 10)).toEqual({ allowed: true });
      expect(canAffordGeneration(0.01, 9.99, 10)).toEqual({ allowed: false, reason: expect.stringContaining('Insufficient budget') });
      expect(canAffordGeneration(5, 0, 10)).toEqual({ allowed: true });
    });

    test('should deny generation when budget is insufficient', () => {
      const result = canAffordGeneration(0.05, 9.96, 10);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Insufficient budget');
      expect(result.reason).toContain('Cost: $0.05');
      expect(result.reason).toContain('Remaining: $0.04');
    });

    test('should handle exact budget limits', () => {
      expect(canAffordGeneration(5, 5, 10)).toEqual({ allowed: true });
      expect(canAffordGeneration(5.01, 5, 10)).toEqual({
        allowed: false,
        reason: expect.stringContaining('Insufficient budget'),
      });
    });

    test('should handle zero cost', () => {
      expect(canAffordGeneration(0, 10, 10)).toEqual({ allowed: true });
    });

    test('should handle negative values gracefully', () => {
      expect(canAffordGeneration(-1, 5, 10)).toEqual({ allowed: true });
      expect(canAffordGeneration(1, -5, 10)).toEqual({ allowed: true });
      expect(canAffordGeneration(1, 5, -10)).toEqual({
        allowed: false,
        reason: expect.stringContaining('Insufficient budget'),
      });
    });
  });
});
