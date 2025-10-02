import { supabase } from '@/lib/supabase';

export interface UserBudget {
  id?: string;
  user_id: string;
  monthly_limit: number;
  daily_limit: number;
  weekly_limit: number;
  alert_threshold: number; // Percentage of limit (e.g., 80 for 80%)
  auto_pause_enabled: boolean;
  pause_at_limit: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface BudgetAlert {
  id?: string;
  user_id: string;
  alert_type: 'threshold' | 'limit_reached' | 'limit_exceeded';
  budget_type: 'daily' | 'weekly' | 'monthly';
  current_amount: number;
  limit_amount: number;
  percentage: number;
  message: string;
  is_read: boolean;
  created_at?: string;
}

export interface BudgetStatus {
  daily: {
    used: number;
    limit: number;
    remaining: number;
    percentage: number;
  };
  weekly: {
    used: number;
    limit: number;
    remaining: number;
    percentage: number;
  };
  monthly: {
    used: number;
    limit: number;
    remaining: number;
    percentage: number;
  };
  is_paused: boolean;
  can_generate: boolean;
  next_reset: {
    daily: string;
    weekly: string;
    monthly: string;
  };
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

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    throw error;
  }

  // Return existing budget or create default
  if (existingBudget) {
    return existingBudget;
  }

  // Create default budget
  const defaultBudget: Omit<UserBudget, 'id'> = {
    user_id: targetUserId,
    monthly_limit: 10, // $10/month default
    daily_limit: 1, // $1/day default
    weekly_limit: 3, // $3/week default
    alert_threshold: 80, // Alert at 80% of limit
    auto_pause_enabled: true,
    pause_at_limit: true,
    created_at: new Date().toISOString(),
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
 * Get current budget status
 */
export async function getBudgetStatus(userId?: string): Promise<BudgetStatus> {
  const { data: user } = await supabase.auth.getUser();
  const targetUserId = userId || user.user?.id;

  if (!targetUserId) {
    throw new Error('User not authenticated');
  }

  const budget = await getUserBudget(targetUserId);

  // Get current usage
  const now = new Date();
  const dailyStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const weeklyStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthlyStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const { data: costs, error } = await supabase
    .from('image_generation_costs')
    .select('cost, created_at')
    .eq('user_id', targetUserId);

  if (error) {
    throw error;
  }

  const dailyUsed = costs
    .filter(c => new Date(c.created_at) >= dailyStart)
    .reduce((sum, c) => sum + c.cost, 0);

  const weeklyUsed = costs
    .filter(c => new Date(c.created_at) >= weeklyStart)
    .reduce((sum, c) => sum + c.cost, 0);

  const monthlyUsed = costs
    .filter(c => new Date(c.created_at) >= monthlyStart)
    .reduce((sum, c) => sum + c.cost, 0);

  const dailyRemaining = Math.max(0, budget.daily_limit - dailyUsed);
  const weeklyRemaining = Math.max(0, budget.weekly_limit - weeklyUsed);
  const monthlyRemaining = Math.max(0, budget.monthly_limit - monthlyUsed);

  const isPaused = budget.pause_at_limit && (
    dailyUsed >= budget.daily_limit ||
    weeklyUsed >= budget.weekly_limit ||
    monthlyUsed >= budget.monthly_limit
  );

  const canGenerate = !isPaused && (
    dailyRemaining > 0 &&
    weeklyRemaining > 0 &&
    monthlyRemaining > 0
  );

  // Calculate next reset times
  const nextDailyReset = new Date(now);
  nextDailyReset.setDate(nextDailyReset.getDate() + 1);
  nextDailyReset.setHours(0, 0, 0, 0);

  const nextWeeklyReset = new Date(now);
  nextWeeklyReset.setDate(nextWeeklyReset.getDate() + (7 - nextWeeklyReset.getDay()));
  nextWeeklyReset.setHours(0, 0, 0, 0);

  const nextMonthlyReset = new Date(now);
  nextMonthlyReset.setMonth(nextMonthlyReset.getMonth() + 1);
  nextMonthlyReset.setDate(1);
  nextMonthlyReset.setHours(0, 0, 0, 0);

  return {
    daily: {
      used: dailyUsed,
      limit: budget.daily_limit,
      remaining: dailyRemaining,
      percentage: (dailyUsed / budget.daily_limit) * 100,
    },
    weekly: {
      used: weeklyUsed,
      limit: budget.weekly_limit,
      remaining: weeklyRemaining,
      percentage: (weeklyUsed / budget.weekly_limit) * 100,
    },
    monthly: {
      used: monthlyUsed,
      limit: budget.monthly_limit,
      remaining: monthlyRemaining,
      percentage: (monthlyUsed / budget.monthly_limit) * 100,
    },
    is_paused: isPaused,
    can_generate: canGenerate,
    next_reset: {
      daily: nextDailyReset.toISOString(),
      weekly: nextWeeklyReset.toISOString(),
      monthly: nextMonthlyReset.toISOString(),
    },
  };
}

/**
 * Check if user can generate image based on budget
 */
export async function canGenerateImage(
  cost: number,
  userId?: string
): Promise<{ allowed: boolean; reason?: string }> {
  const status = await getBudgetStatus(userId);

  if (!status.can_generate) {
    return { allowed: false, reason: 'Budget limit reached. Generation is paused.' };
  }

  if (cost > status.daily.remaining) {
    return { allowed: false, reason: `Daily budget limit would be exceeded. Remaining: $${status.daily.remaining.toFixed(2)}` };
  }

  if (cost > status.weekly.remaining) {
    return { allowed: false, reason: `Weekly budget limit would be exceeded. Remaining: $${status.weekly.remaining.toFixed(2)}` };
  }

  if (cost > status.monthly.remaining) {
    return { allowed: false, reason: `Monthly budget limit would be exceeded. Remaining: $${status.monthly.remaining.toFixed(2)}` };
  }

  return { allowed: true };
}

/**
 * Create budget alert
 */
export async function createBudgetAlert(
  alertData: Omit<BudgetAlert, 'id' | 'created_at'>,
  userId?: string
): Promise<BudgetAlert> {
  const { data: user } = await supabase.auth.getUser();
  const targetUserId = userId || user.user?.id;

  if (!targetUserId) {
    throw new Error('User not authenticated');
  }

  const alert: Omit<BudgetAlert, 'id'> = {
    ...alertData,
    user_id: targetUserId,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('budget_alerts')
    .insert(alert)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Get user budget alerts
 */
export async function getUserBudgetAlerts(
  userId?: string,
  unreadOnly: boolean = false
): Promise<BudgetAlert[]> {
  const { data: user } = await supabase.auth.getUser();
  const targetUserId = userId || user.user?.id;

  if (!targetUserId) {
    throw new Error('User not authenticated');
  }

  let query = supabase
    .from('budget_alerts')
    .select('*')
    .eq('user_id', targetUserId)
    .order('created_at', { ascending: false });

  if (unreadOnly) {
    query = query.eq('is_read', false);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Mark alert as read
 */
export async function markAlertAsRead(alertId: string): Promise<void> {
  const { error } = await supabase
    .from('budget_alerts')
    .update({ is_read: true })
    .eq('id', alertId);

  if (error) {
    throw error;
  }
}

/**
 * Check for budget alerts and create them if needed
 */
export async function checkAndCreateBudgetAlerts(userId?: string): Promise<void> {
  const { data: user } = await supabase.auth.getUser();
  const targetUserId = userId || user.user?.id;

  if (!targetUserId) {
    throw new Error('User not authenticated');
  }

  const budget = await getUserBudget(targetUserId);
  const status = await getBudgetStatus(targetUserId);

  // Check for threshold alerts
  if (budget.alert_threshold > 0) {
    const threshold = budget.alert_threshold / 100;

    // Daily threshold alert
    if (status.daily.percentage >= threshold * 100 && status.daily.percentage < 100) {
      await createBudgetAlert({
        user_id: targetUserId,
        alert_type: 'threshold',
        budget_type: 'daily',
        current_amount: status.daily.used,
        limit_amount: status.daily.limit,
        percentage: status.daily.percentage,
        message: `Daily budget at ${status.daily.percentage.toFixed(1)}% of limit ($${status.daily.used.toFixed(2)} / $${status.daily.limit.toFixed(2)})`,
        is_read: false,
      });
    }

    // Weekly threshold alert
    if (status.weekly.percentage >= threshold * 100 && status.weekly.percentage < 100) {
      await createBudgetAlert({
        user_id: targetUserId,
        alert_type: 'threshold',
        budget_type: 'weekly',
        current_amount: status.weekly.used,
        limit_amount: status.weekly.limit,
        percentage: status.weekly.percentage,
        message: `Weekly budget at ${status.weekly.percentage.toFixed(1)}% of limit ($${status.weekly.used.toFixed(2)} / $${status.weekly.limit.toFixed(2)})`,
        is_read: false,
      });
    }

    // Monthly threshold alert
    if (status.monthly.percentage >= threshold * 100 && status.monthly.percentage < 100) {
      await createBudgetAlert({
        user_id: targetUserId,
        alert_type: 'threshold',
        budget_type: 'monthly',
        current_amount: status.monthly.used,
        limit_amount: status.monthly.limit,
        percentage: status.monthly.percentage,
        message: `Monthly budget at ${status.monthly.percentage.toFixed(1)}% of limit ($${status.monthly.used.toFixed(2)} / $${status.monthly.limit.toFixed(2)})`,
        is_read: false,
      });
    }
  }

  // Check for limit reached alerts
  if (status.daily.percentage >= 100) {
    await createBudgetAlert({
      user_id: targetUserId,
      alert_type: 'limit_reached',
      budget_type: 'daily',
      current_amount: status.daily.used,
      limit_amount: status.daily.limit,
      percentage: status.daily.percentage,
      message: `Daily budget limit reached! ($${status.daily.used.toFixed(2)} / $${status.daily.limit.toFixed(2)})`,
      is_read: false,
    });
  }

  if (status.weekly.percentage >= 100) {
    await createBudgetAlert({
      user_id: targetUserId,
      alert_type: 'limit_reached',
      budget_type: 'weekly',
      current_amount: status.weekly.used,
      limit_amount: status.weekly.limit,
      percentage: status.weekly.percentage,
      message: `Weekly budget limit reached! ($${status.weekly.used.toFixed(2)} / $${status.weekly.limit.toFixed(2)})`,
      is_read: false,
    });
  }

  if (status.monthly.percentage >= 100) {
    await createBudgetAlert({
      user_id: targetUserId,
      alert_type: 'limit_reached',
      budget_type: 'monthly',
      current_amount: status.monthly.used,
      limit_amount: status.monthly.limit,
      percentage: status.monthly.percentage,
      message: `Monthly budget limit reached! ($${status.monthly.used.toFixed(2)} / $${status.monthly.limit.toFixed(2)})`,
      is_read: false,
    });
  }
}
