import { supabase } from '@/lib/supabase';
import {
  BUDGET_CONFIG,
  validateBudgetAmount,
  validateUserId,
  canAffordGeneration,
} from '@/config/budget';
import { BudgetPerformanceMonitor } from './budget-monitoring';

export interface UserBudget {
  user_id: string;
  monthly_budget: number;
  used_monthly: number;
  period_start: string;
  updated_at: string;
}

/**
 * Get or create user budget settings
 */
export async function getUserBudget(userId?: string): Promise<UserBudget> {
  const monitor = BudgetPerformanceMonitor.getInstance();
  const endTimer = monitor.startTimer('getUserBudget');

  try {
    const { data: user } = await supabase.auth.getUser();
    const targetUserId = userId || user.user?.id;

    // Validate user ID
    const userIdValidation = validateUserId(targetUserId);
    if (!userIdValidation.valid) {
      throw new Error(userIdValidation.error || 'User not authenticated');
    }

    // Try to get existing budget
    const { data: existingBudget, error } = await supabase
      .from('user_budgets')
      .select('*')
      .eq('user_id', targetUserId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116' && error.code !== 'PGRST205') {
      // PGRST116 = no rows returned, PGRST205 = table not found in schema cache
      throw error;
    }

    // Return existing budget or create default
    if (existingBudget) {
      return existingBudget;
    }

    // Create default budget
    const defaultBudget: UserBudget = {
      user_id: targetUserId!,
      monthly_budget: BUDGET_CONFIG.DEFAULT_MONTHLY_BUDGET,
      used_monthly: 0,
      period_start: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: newBudget, error: createError } = await supabase
      .from('user_budgets')
      .insert(defaultBudget)
      .select()
      .single();

    if (createError) {
      throw createError;
    }

    return newBudget;
  } finally {
    endTimer();
  }
}

/**
 * Update user budget settings
 */
export async function updateUserBudget(
  budgetData: Partial<UserBudget>,
  userId?: string
): Promise<UserBudget> {
  const { data: user } = await supabase.auth.getUser();
  const targetUserId = userId || user.user?.id;

  // Validate user ID
  const userIdValidation = validateUserId(targetUserId);
  if (!userIdValidation.valid) {
    throw new Error(userIdValidation.error || 'User not authenticated');
  }

  // Validate budget amount if provided
  if (budgetData.monthly_budget !== undefined) {
    const budgetValidation = validateBudgetAmount(budgetData.monthly_budget);
    if (!budgetValidation.valid) {
      throw new Error(budgetValidation.error);
    }
  }

  const updateData = {
    ...budgetData,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('user_budgets')
    .update(updateData)
    .eq('user_id', targetUserId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Update user budget after image generation
 */
export async function updateBudgetAfterGeneration(
  cost: number,
  userId?: string
): Promise<void> {
  try {
    const { data: user } = await supabase.auth.getUser();
    const targetUserId = userId || user.user?.id;

    // Validate user ID
    const userIdValidation = validateUserId(targetUserId);
    if (!userIdValidation.valid) {
      throw new Error(userIdValidation.error || 'User not authenticated');
    }

    // Get current budget first
    const { data: currentBudget } = await supabase
      .from('user_budgets')
      .select('used_monthly')
      .eq('user_id', targetUserId)
      .maybeSingle();

    if (currentBudget) {
      // Update the used_monthly amount
      const { error } = await supabase
        .from('user_budgets')
        .update({
          used_monthly: currentBudget.used_monthly + cost,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', targetUserId);

      if (error) {
        console.warn('Failed to update budget:', error);
      }
    }
  } catch (error) {
    console.warn('Budget update failed:', error);
  }
}

/**
 * Check if user can generate image based on budget
 */
export async function canGenerateImage(
  cost: number,
  userId?: string
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const budget = await getUserBudget(userId);

    // Use the configuration-based validation
    const result = canAffordGeneration(
      cost,
      budget.used_monthly,
      budget.monthly_budget
    );

    if (!result.allowed) {
      return {
        allowed: false,
        reason: result.reason || 'Budget limit would be exceeded',
      };
    }

    return { allowed: true };
  } catch (error) {
    console.warn('Budget check failed, allowing generation:', error);
    // Fail open if budget system is down
    return { allowed: BUDGET_CONFIG.ERROR_HANDLING.FAIL_OPEN };
  }
}
