/**
 * Budget System Health Check
 *
 * This module provides health check functionality for the budget system
 * to monitor its status and identify issues.
 */

import { supabase } from '@/lib/supabase';
import { getUserBudget, canGenerateImage } from './budget-manager';
import { BUDGET_CONFIG } from '@/config/budget';

export interface BudgetHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  issues: string[];
  checks: {
    database: boolean;
    authentication: boolean;
    budgetCreation: boolean;
    budgetValidation: boolean;
    costCalculation: boolean;
  };
  timestamp: string;
}

/**
 * Perform comprehensive health check of the budget system
 */
export async function checkBudgetSystemHealth(): Promise<BudgetHealthStatus> {
  const issues: string[] = [];
  const checks = {
    database: false,
    authentication: false,
    budgetCreation: false,
    budgetValidation: false,
    costCalculation: false,
  };

  try {
    // Check 1: Database connectivity
    try {
      const { error } = await supabase
        .from('user_budgets')
        .select('count')
        .limit(1);

      if (error) {
        issues.push(`Database connectivity issue: ${error.message}`);
      } else {
        checks.database = true;
      }
    } catch (error) {
      issues.push(`Database connection failed: ${error}`);
    }

    // Check 2: Authentication system
    try {
      const { data: user } = await supabase.auth.getUser();
      if (user.user) {
        checks.authentication = true;
      } else {
        issues.push('Authentication system not accessible');
      }
    } catch (error) {
      issues.push(`Authentication check failed: ${error}`);
    }

    // Check 3: Budget creation (if authenticated)
    try {
      const { data: user } = await supabase.auth.getUser();
      if (user.user) {
        const budget = await getUserBudget(user.user.id);
        if (budget) {
          checks.budgetCreation = true;
        } else {
          issues.push('Budget creation failed');
        }
      }
    } catch (error) {
      issues.push(`Budget creation check failed: ${error}`);
    }

    // Check 4: Budget validation
    try {
      const testBudget = {
        user_id: 'test-user-id',
        monthly_budget: BUDGET_CONFIG.DEFAULT_MONTHLY_BUDGET,
        used_monthly: 0,
        period_start: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Validate budget structure
      if (
        testBudget.monthly_budget >= BUDGET_CONFIG.MIN_MONTHLY_BUDGET &&
        testBudget.monthly_budget <= BUDGET_CONFIG.MAX_MONTHLY_BUDGET
      ) {
        checks.budgetValidation = true;
      } else {
        issues.push('Budget validation logic failed');
      }
    } catch (error) {
      issues.push(`Budget validation check failed: ${error}`);
    }

    // Check 5: Cost calculation
    try {
      const testCost = BUDGET_CONFIG.COST_PER_IMAGE['1024x1024'].standard;
      if (testCost > 0 && testCost < 1) {
        checks.costCalculation = true;
      } else {
        issues.push('Cost calculation configuration invalid');
      }
    } catch (error) {
      issues.push(`Cost calculation check failed: ${error}`);
    }
  } catch (error) {
    issues.push(`Health check system error: ${error}`);
  }

  // Determine overall status
  const passedChecks = Object.values(checks).filter(Boolean).length;
  const totalChecks = Object.keys(checks).length;

  let status: 'healthy' | 'degraded' | 'unhealthy';
  if (passedChecks === totalChecks) {
    status = 'healthy';
  } else if (passedChecks >= totalChecks * 0.6) {
    status = 'degraded';
  } else {
    status = 'unhealthy';
  }

  return {
    status,
    issues,
    checks,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Quick health check for monitoring endpoints
 */
export async function quickBudgetHealthCheck(): Promise<{
  status: 'ok' | 'error';
  message: string;
}> {
  try {
    // Simple database connectivity check
    const { error } = await supabase
      .from('user_budgets')
      .select('count')
      .limit(1);

    if (error) {
      return {
        status: 'error',
        message: `Database error: ${error.message}`,
      };
    }

    return {
      status: 'ok',
      message: 'Budget system is healthy',
    };
  } catch (error) {
    return {
      status: 'error',
      message: `Health check failed: ${error}`,
    };
  }
}

/**
 * Get budget system metrics
 */
export async function getBudgetSystemMetrics(): Promise<{
  totalUsers: number;
  totalBudgets: number;
  averageBudget: number;
  totalSpent: number;
  systemUptime: string;
}> {
  try {
    // Get total users with budgets
    const { data: budgets, error } = await supabase
      .from('user_budgets')
      .select('monthly_budget, used_monthly');

    if (error) {
      throw new Error(`Failed to fetch budget metrics: ${error.message}`);
    }

    const totalBudgets = budgets?.length || 0;
    const totalUsers = totalBudgets; // Assuming 1:1 relationship
    const averageBudget =
      totalBudgets > 0
        ? budgets.reduce((sum, b) => sum + b.monthly_budget, 0) / totalBudgets
        : 0;
    const totalSpent =
      budgets?.reduce((sum, b) => sum + b.used_monthly, 0) || 0;

    return {
      totalUsers,
      totalBudgets,
      averageBudget: Math.round(averageBudget * 100) / 100,
      totalSpent: Math.round(totalSpent * 100) / 100,
      systemUptime: 'N/A', // Would need to track system start time
    };
  } catch (error) {
    console.error('Failed to get budget metrics:', error);
    return {
      totalUsers: 0,
      totalBudgets: 0,
      averageBudget: 0,
      totalSpent: 0,
      systemUptime: 'Error',
    };
  }
}

/**
 * Test budget system functionality
 */
export async function testBudgetSystem(): Promise<{
  success: boolean;
  results: {
    budgetCreation: boolean;
    budgetValidation: boolean;
    costCalculation: boolean;
    budgetCheck: boolean;
  };
  errors: string[];
}> {
  const results = {
    budgetCreation: false,
    budgetValidation: false,
    costCalculation: false,
    budgetCheck: false,
  };
  const errors: string[] = [];

  try {
    // Test 1: Budget creation
    try {
      const { data: user } = await supabase.auth.getUser();
      if (user.user) {
        const budget = await getUserBudget(user.user.id);
        if (budget) {
          results.budgetCreation = true;
        } else {
          errors.push('Budget creation test failed');
        }
      } else {
        errors.push('No authenticated user for budget creation test');
      }
    } catch (error) {
      errors.push(`Budget creation test error: ${error}`);
    }

    // Test 2: Budget validation
    try {
      const testAmount = BUDGET_CONFIG.DEFAULT_MONTHLY_BUDGET;
      if (
        testAmount >= BUDGET_CONFIG.MIN_MONTHLY_BUDGET &&
        testAmount <= BUDGET_CONFIG.MAX_MONTHLY_BUDGET
      ) {
        results.budgetValidation = true;
      } else {
        errors.push('Budget validation test failed');
      }
    } catch (error) {
      errors.push(`Budget validation test error: ${error}`);
    }

    // Test 3: Cost calculation
    try {
      const cost = BUDGET_CONFIG.COST_PER_IMAGE['1024x1024'].standard;
      if (cost > 0 && cost < 1) {
        results.costCalculation = true;
      } else {
        errors.push('Cost calculation test failed');
      }
    } catch (error) {
      errors.push(`Cost calculation test error: ${error}`);
    }

    // Test 4: Budget check
    try {
      const result = await canGenerateImage(0.05); // Test with $0.05 cost
      if (typeof result.allowed === 'boolean') {
        results.budgetCheck = true;
      } else {
        errors.push('Budget check test failed');
      }
    } catch (error) {
      errors.push(`Budget check test error: ${error}`);
    }
  } catch (error) {
    errors.push(`Budget system test error: ${error}`);
  }

  const success = Object.values(results).every(Boolean) && errors.length === 0;

  return {
    success,
    results,
    errors,
  };
}
