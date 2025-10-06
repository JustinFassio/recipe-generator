/**
 * Budget Configuration
 *
 * This file contains all budget-related configuration constants
 * to replace hardcoded values throughout the application.
 */

export const BUDGET_CONFIG = {
  // Default budget settings
  DEFAULT_MONTHLY_BUDGET: 10,
  MIN_MONTHLY_BUDGET: 1,
  MAX_MONTHLY_BUDGET: 1000,

  // Budget period settings
  BUDGET_PERIOD_DAYS: 30,

  // Cost per image generation (in USD)
  COST_PER_IMAGE: {
    '1024x1024': {
      standard: 0.04,
      hd: 0.08,
    },
    '1024x1792': {
      standard: 0.08,
      hd: 0.12,
    },
    '1792x1024': {
      standard: 0.08,
      hd: 0.12,
    },
  },

  // Budget alert thresholds
  ALERT_THRESHOLDS: {
    WARNING: 75, // 75% of budget used
    CRITICAL: 90, // 90% of budget used
    HIGH_SPENDING_MULTIPLIER: 10, // Alert when total spent exceeds average budget by 10x
  },

  // Error handling settings
  ERROR_HANDLING: {
    FAIL_OPEN: true, // Allow generation if budget system fails
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY_MS: 1000,
  },

  // Cache settings
  CACHE: {
    TTL_MS: 5 * 60 * 1000, // 5 minutes
    MAX_ENTRIES: 1000,
  },

  // Rate limiting
  RATE_LIMITS: {
    BUDGET_CHECKS_PER_MINUTE: 60,
    BUDGET_UPDATES_PER_MINUTE: 10,
  },

  // Performance monitoring thresholds
  PERFORMANCE_THRESHOLDS: {
    SLOW_OPERATION_MS: 1000, // Log operations taking longer than 1 second
  },

  // Monitoring configuration
  MONITORING: {
    DEFAULT_WATCHDOG_INTERVAL_MS: 60000, // Default 1 minute watchdog interval
  },

  // Health check thresholds
  HEALTH_THRESHOLDS: {
    DEGRADED_PERCENTAGE: 0.6, // 60% - system considered degraded if this percentage of checks pass
  },
} as const;

/**
 * Get cost for image generation based on size and quality
 */
export function getImageCost(
  size: keyof typeof BUDGET_CONFIG.COST_PER_IMAGE,
  quality: 'standard' | 'hd'
): number {
  return BUDGET_CONFIG.COST_PER_IMAGE[size][quality];
}

/**
 * Validate budget amount
 */
export function validateBudgetAmount(amount: number): {
  valid: boolean;
  error?: string;
} {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return { valid: false, error: 'Budget amount must be a valid number' };
  }

  if (amount < BUDGET_CONFIG.MIN_MONTHLY_BUDGET) {
    return {
      valid: false,
      error: `Budget must be at least $${BUDGET_CONFIG.MIN_MONTHLY_BUDGET}`,
    };
  }

  if (amount > BUDGET_CONFIG.MAX_MONTHLY_BUDGET) {
    return {
      valid: false,
      error: `Budget cannot exceed $${BUDGET_CONFIG.MAX_MONTHLY_BUDGET}`,
    };
  }

  return { valid: true };
}

/**
 * Validate user ID format
 */
export function validateUserId(userId?: string): {
  valid: boolean;
  error?: string;
} {
  if (!userId) {
    return { valid: false, error: 'User ID is required' };
  }

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId)) {
    return { valid: false, error: 'User ID must be a valid UUID' };
  }

  return { valid: true };
}

/**
 * Get budget status based on usage
 */
export function getBudgetStatus(
  used: number,
  total: number
): 'healthy' | 'warning' | 'critical' | 'exceeded' {
  const percentage = (used / total) * 100;

  if (percentage >= 100) return 'exceeded';
  if (percentage >= BUDGET_CONFIG.ALERT_THRESHOLDS.CRITICAL) return 'critical';
  if (percentage >= BUDGET_CONFIG.ALERT_THRESHOLDS.WARNING) return 'warning';
  return 'healthy';
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

/**
 * Calculate remaining budget
 */
export function calculateRemainingBudget(used: number, total: number): number {
  return Math.max(0, total - used);
}

/**
 * Check if generation is allowed based on budget
 */
export function canAffordGeneration(
  cost: number,
  used: number,
  total: number
): { allowed: boolean; reason?: string } {
  const remaining = calculateRemainingBudget(used, total);

  if (cost > remaining) {
    return {
      allowed: false,
      reason: `Insufficient budget. Cost: ${formatCurrency(cost)}, Remaining: ${formatCurrency(remaining)}`,
    };
  }

  return { allowed: true };
}
