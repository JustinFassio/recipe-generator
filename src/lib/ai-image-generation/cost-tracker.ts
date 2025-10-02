import { supabase } from '@/lib/supabase';

export interface ImageGenerationCost {
  id?: string;
  user_id: string;
  recipe_id?: string;
  prompt: string;
  size: '1024x1024' | '1024x1792' | '1792x1024';
  quality: 'standard' | 'hd';
  cost: number;
  tokens_used?: number;
  generation_time_ms?: number;
  success: boolean;
  error_message?: string;
  created_at?: string;
  image_url?: string;
}

export interface UserCostSummary {
  total_cost: number;
  total_generations: number;
  successful_generations: number;
  failed_generations: number;
  average_cost_per_generation: number;
  cost_by_quality: {
    standard: number;
    hd: number;
  };
  cost_by_size: {
    '1024x1024': number;
    '1024x1792': number;
    '1792x1024': number;
  };
  daily_cost: number;
  weekly_cost: number;
  monthly_cost: number;
}

export interface CostAnalytics {
  user_id: string;
  period: 'day' | 'week' | 'month' | 'year';
  start_date: string;
  end_date: string;
  total_cost: number;
  generation_count: number;
  success_rate: number;
  average_generation_time: number;
  cost_trend: 'increasing' | 'decreasing' | 'stable';
  peak_usage_hour: number;
  most_used_quality: 'standard' | 'hd';
  most_used_size: '1024x1024' | '1024x1792' | '1792x1024';
}

/**
 * Calculate cost for image generation based on size and quality
 */
export function calculateImageCost(
  size: '1024x1024' | '1024x1792' | '1792x1024',
  quality: 'standard' | 'hd'
): number {
  const costs = {
    '1024x1024': { standard: 0.04, hd: 0.08 },
    '1024x1792': { standard: 0.08, hd: 0.12 },
    '1792x1024': { standard: 0.08, hd: 0.12 },
  };

  return costs[size][quality];
}

/**
 * Track image generation cost
 */
export async function trackImageGenerationCost(
  costData: Omit<ImageGenerationCost, 'id' | 'created_at'>
): Promise<ImageGenerationCost> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    throw new Error('User not authenticated');
  }

  const costRecord: Omit<ImageGenerationCost, 'id'> = {
    ...costData,
    user_id: user.user.id,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('image_generation_costs')
    .insert(costRecord)
    .select()
    .single();

  if (error) {
    console.error('Failed to track image generation cost:', error);
    throw error;
  }

  return data;
}

/**
 * Get user cost summary
 */
export async function getUserCostSummary(
  userId?: string,
  period: 'day' | 'week' | 'month' | 'all' = 'month'
): Promise<UserCostSummary> {
  const { data: user } = await supabase.auth.getUser();
  const targetUserId = userId || user.user?.id;

  if (!targetUserId) {
    throw new Error('User not authenticated');
  }

  let dateFilter = '';
  switch (period) {
    case 'day':
      dateFilter = `created_at >= '${new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()}'`;
      break;
    case 'week':
      dateFilter = `created_at >= '${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()}'`;
      break;
    case 'month':
      dateFilter = `created_at >= '${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()}'`;
      break;
    default:
      dateFilter = '';
  }

  let query = supabase
    .from('image_generation_costs')
    .select('*')
    .eq('user_id', targetUserId);

  if (dateFilter) {
    query = query.gte('created_at', dateFilter.split("'")[1]);
  }

  const { data: costs, error } = await query;

  if (error) {
    console.error('Failed to fetch user costs:', error);
    throw error;
  }

  const totalCost = costs.reduce((sum: number, cost: any) => sum + cost.cost, 0);
  const totalGenerations = costs.length;
  const successfulGenerations = costs.filter((c: any) => c.success).length;
  const failedGenerations = totalGenerations - successfulGenerations;

  const costByQuality = costs.reduce(
    (acc: any, cost: any) => {
      acc[cost.quality] += cost.cost;
      return acc;
    },
    { standard: 0, hd: 0 }
  );

  const costBySize = costs.reduce(
    (acc: any, cost: any) => {
      acc[cost.size] += cost.cost;
      return acc;
    },
    { '1024x1024': 0, '1024x1792': 0, '1792x1024': 0 }
  );

  // Calculate daily, weekly, monthly costs
  const now = new Date();
  const dailyStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const weeklyStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthlyStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const dailyCost = costs
    .filter((c: any) => new Date(c.created_at) >= dailyStart)
    .reduce((sum: number, c: any) => sum + c.cost, 0);

  const weeklyCost = costs
    .filter((c: any) => new Date(c.created_at) >= weeklyStart)
    .reduce((sum: number, c: any) => sum + c.cost, 0);

  const monthlyCost = costs
    .filter((c: any) => new Date(c.created_at) >= monthlyStart)
    .reduce((sum: number, c: any) => sum + c.cost, 0);

  return {
    total_cost: totalCost,
    total_generations: totalGenerations,
    successful_generations: successfulGenerations,
    failed_generations: failedGenerations,
    average_cost_per_generation: totalGenerations > 0 ? totalCost / totalGenerations : 0,
    cost_by_quality: costByQuality,
    cost_by_size: costBySize,
    daily_cost: dailyCost,
    weekly_cost: weeklyCost,
    monthly_cost: monthlyCost,
  };
}

/**
 * Get cost analytics for a specific period
 */
export async function getCostAnalytics(
  userId?: string,
  period: 'day' | 'week' | 'month' | 'year' = 'month'
): Promise<CostAnalytics> {
  const { data: user } = await supabase.auth.getUser();
  const targetUserId = userId || user.user?.id;

  if (!targetUserId) {
    throw new Error('User not authenticated');
  }

  const now = new Date();
  let startDate: Date;
  let endDate = now;

  switch (period) {
    case 'day':
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'year':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
  }

  const { data: costs, error } = await supabase
    .from('image_generation_costs')
    .select('*')
    .eq('user_id', targetUserId)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  if (error) {
    console.error('Failed to fetch cost analytics:', error);
    throw error;
  }

  const totalCost = costs.reduce((sum: number, cost: any) => sum + cost.cost, 0);
  const generationCount = costs.length;
  const successfulCount = costs.filter((c: any) => c.success).length;
  const successRate = generationCount > 0 ? successfulCount / generationCount : 0;

  const averageGenerationTime = costs
    .filter((c: any) => c.generation_time_ms)
    .reduce((sum: number, c: any) => sum + (c.generation_time_ms || 0), 0) / 
    costs.filter((c: any) => c.generation_time_ms).length || 0;

  // Calculate cost trend (simplified - compare first half vs second half)
  const midPoint = Math.floor(costs.length / 2);
  const firstHalfCost = costs.slice(0, midPoint).reduce((sum: number, c: any) => sum + c.cost, 0);
  const secondHalfCost = costs.slice(midPoint).reduce((sum: number, c: any) => sum + c.cost, 0);
  
  let costTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
  if (secondHalfCost > firstHalfCost * 1.1) costTrend = 'increasing';
  else if (secondHalfCost < firstHalfCost * 0.9) costTrend = 'decreasing';

  // Find peak usage hour
  const hourCounts = costs.reduce((acc: any, cost: any) => {
    const hour = new Date(cost.created_at).getHours();
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const peakUsageHour = Object.entries(hourCounts)
    .sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0] || 0;

  // Find most used quality and size
  const qualityCounts = costs.reduce((acc: any, cost: any) => {
    acc[cost.quality] = (acc[cost.quality] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sizeCounts = costs.reduce((acc: any, cost: any) => {
    acc[cost.size] = (acc[cost.size] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mostUsedQuality = Object.entries(qualityCounts)
    .sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0] as 'standard' | 'hd' || 'standard';

  const mostUsedSize = Object.entries(sizeCounts)
    .sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0] as '1024x1024' | '1024x1792' | '1792x1024' || '1024x1024';

  return {
    user_id: targetUserId,
    period,
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString(),
    total_cost: totalCost,
    generation_count: generationCount,
    success_rate: successRate,
    average_generation_time: averageGenerationTime,
    cost_trend: costTrend,
    peak_usage_hour: parseInt(peakUsageHour as string),
    most_used_quality: mostUsedQuality,
    most_used_size: mostUsedSize,
  };
}

/**
 * Check if user has exceeded budget limit
 */
export async function checkBudgetLimit(
  userId?: string,
  budgetLimit?: number
): Promise<{ exceeded: boolean; currentCost: number; limit: number }> {
  const summary = await getUserCostSummary(userId, 'month');
  const limit = budgetLimit || 10; // Default $10 monthly limit

  return {
    exceeded: summary.monthly_cost >= limit,
    currentCost: summary.monthly_cost,
    limit,
  };
}

/**
 * Get cost optimization suggestions
 */
export async function getCostOptimizationSuggestions(
  userId?: string
): Promise<string[]> {
  const summary = await getUserCostSummary(userId, 'month');
  const analytics = await getCostAnalytics(userId, 'month');
  const suggestions: string[] = [];

  // High HD usage suggestion
  if (summary.cost_by_quality.hd > summary.cost_by_quality.standard) {
    suggestions.push('Consider using Standard quality instead of HD for routine images to reduce costs by 50%');
  }

  // Large size usage suggestion
  if (summary.cost_by_size['1024x1792'] + summary.cost_by_size['1792x1024'] > summary.cost_by_size['1024x1024']) {
    suggestions.push('Using Square (1024x1024) size for most images can reduce costs by 50% compared to Portrait/Landscape');
  }

  // High failure rate suggestion
  if (analytics.success_rate < 0.8) {
    suggestions.push('High failure rate detected. Check your prompts for content policy violations or try simplified prompts');
  }

  // High usage suggestion
  if (summary.monthly_cost > 5) {
    suggestions.push('Consider reducing image generation frequency or using lower quality settings to manage costs');
  }

  // Peak usage suggestion
  if (analytics.peak_usage_hour >= 9 && analytics.peak_usage_hour <= 17) {
    suggestions.push('Peak usage during business hours. Consider generating images during off-peak times for better performance');
  }

  return suggestions;
}
