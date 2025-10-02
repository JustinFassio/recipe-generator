import { supabase } from '@/lib/supabase';

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
  const { data: user } = await supabase.auth.getUser();
  const targetUserId = userId || user.user?.id;

  if (!targetUserId) {
    throw new Error('User not authenticated');
  }

  // Try to get existing budget
  const { data: existingBudget, error } = await supabase
    .from('user_budgets')
    .select('*')
    .eq('user_id', targetUserId)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows returned
    throw error;
  }

  // Return existing budget or create default
  if (existingBudget) {
    return existingBudget;
  }

  // Create default budget
  const defaultBudget: UserBudget = {
    user_id: targetUserId,
    monthly_budget: 10, // $10/month default
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

  if (!targetUserId) {
    throw new Error('User not authenticated');
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

    if (!targetUserId) {
      throw new Error('User not authenticated');
    }

    // Get current budget first
    const { data: currentBudget } = await supabase
      .from('user_budgets')
      .select('used_monthly')
      .eq('user_id', targetUserId)
      .single();

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
    const remaining = budget.monthly_budget - budget.used_monthly;

    if (cost > remaining) {
      return {
        allowed: false,
        reason: `Monthly budget limit would be exceeded. Remaining: $${remaining.toFixed(2)}`,
      };
    }

    return { allowed: true };
  } catch (error) {
    console.warn('Budget check failed, allowing generation:', error);
    return { allowed: true };
  }
}
