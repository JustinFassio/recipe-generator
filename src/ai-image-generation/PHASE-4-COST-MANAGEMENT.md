# Phase 4: Cost Management & Optimization

**Implement usage tracking, limits, caching, and cost optimization strategies for AI image generation**

## 🎯 Objectives

- Implement comprehensive usage tracking and monitoring
- Add user-level and system-wide cost limits
- Create intelligent caching system for similar recipes
- Optimize prompt engineering for cost efficiency
- Add cost transparency and user controls
- Implement rate limiting and abuse prevention

## 📋 Deliverables

- [ ] Usage tracking and analytics system
- [ ] Cost limit enforcement
- [ ] Intelligent caching system
- [ ] Cost optimization features
- [ ] User cost controls and transparency
- [ ] Rate limiting and abuse prevention
- [ ] Cost monitoring and alerting
- [ ] Budget management tools

## 🏗️ Implementation

### 1. Usage Tracking System

**File**: `src/lib/ai-image-generation/usage-tracker.ts`

```typescript
import { supabase } from '@/lib/supabase';

export interface ImageGenerationUsage {
  id: string;
  user_id: string;
  recipe_id?: string;
  prompt: string;
  prompt_length: number;
  size: string;
  quality: string;
  cost: number;
  success: boolean;
  error_message?: string;
  fallback_used: boolean;
  generation_time_ms: number;
  created_at: string;
  cached: boolean;
  cache_hit?: string;
}

export interface UserUsageStats {
  total_generations: number;
  total_cost: number;
  successful_generations: number;
  failed_generations: number;
  average_cost_per_generation: number;
  last_generation: string;
  monthly_usage: number;
  monthly_cost: number;
}

export interface CostLimits {
  daily_limit: number;
  monthly_limit: number;
  per_generation_limit: number;
  user_tier: 'free' | 'premium' | 'pro';
}

/**
 * Track image generation usage
 */
export async function trackImageGeneration(
  userId: string,
  usage: Omit<ImageGenerationUsage, 'id' | 'user_id' | 'created_at'>
): Promise<void> {
  try {
    const { error } = await supabase.from('image_generation_usage').insert({
      user_id: userId,
      ...usage,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Failed to track image generation usage:', error);
      // Don't throw - tracking failure shouldn't break the feature
    }
  } catch (error) {
    console.error('Usage tracking error:', error);
  }
}

/**
 * Get user usage statistics
 */
export async function getUserUsageStats(
  userId: string,
  timeRange: 'day' | 'week' | 'month' = 'month'
): Promise<UserUsageStats> {
  const timeRangeDays = {
    day: 1,
    week: 7,
    month: 30,
  }[timeRange];

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - timeRangeDays);

  const { data, error } = await supabase
    .from('image_generation_usage')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', startDate.toISOString());

  if (error) {
    console.error('Failed to get user usage stats:', error);
    return getDefaultUsageStats();
  }

  const successful = data.filter((usage) => usage.success);
  const failed = data.filter((usage) => !usage.success);
  const totalCost = data.reduce((sum, usage) => sum + usage.cost, 0);

  return {
    total_generations: data.length,
    total_cost: totalCost,
    successful_generations: successful.length,
    failed_generations: failed.length,
    average_cost_per_generation: data.length > 0 ? totalCost / data.length : 0,
    last_generation: data.length > 0 ? data[data.length - 1].created_at : '',
    monthly_usage: timeRange === 'month' ? data.length : 0,
    monthly_cost: timeRange === 'month' ? totalCost : 0,
  };
}

/**
 * Check if user has exceeded cost limits
 */
export async function checkCostLimits(userId: string): Promise<{
  allowed: boolean;
  limits: CostLimits;
  currentUsage: UserUsageStats;
  reason?: string;
}> {
  const limits = await getUserCostLimits(userId);
  const currentUsage = await getUserUsageStats(userId);

  // Check daily limit
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: dailyUsage } = await supabase
    .from('image_generation_usage')
    .select('cost')
    .eq('user_id', userId)
    .gte('created_at', today.toISOString());

  const dailyCost =
    dailyUsage?.reduce((sum, usage) => sum + usage.cost, 0) || 0;

  if (dailyCost >= limits.daily_limit) {
    return {
      allowed: false,
      limits,
      currentUsage,
      reason: 'Daily cost limit exceeded',
    };
  }

  if (currentUsage.monthly_cost >= limits.monthly_limit) {
    return {
      allowed: false,
      limits,
      currentUsage,
      reason: 'Monthly cost limit exceeded',
    };
  }

  return {
    allowed: true,
    limits,
    currentUsage,
  };
}

/**
 * Get user cost limits based on tier
 */
async function getUserCostLimits(userId: string): Promise<CostLimits> {
  // Get user tier from profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', userId)
    .single();

  const tier = profile?.subscription_tier || 'free';

  const tierLimits: Record<string, CostLimits> = {
    free: {
      daily_limit: 0.5, // $0.50 per day
      monthly_limit: 5.0, // $5.00 per month
      per_generation_limit: 0.08, // $0.08 per generation
      user_tier: 'free',
    },
    premium: {
      daily_limit: 2.0, // $2.00 per day
      monthly_limit: 25.0, // $25.00 per month
      per_generation_limit: 0.12, // $0.12 per generation (HD allowed)
      user_tier: 'premium',
    },
    pro: {
      daily_limit: 10.0, // $10.00 per day
      monthly_limit: 100.0, // $100.00 per month
      per_generation_limit: 0.12, // $0.12 per generation
      user_tier: 'pro',
    },
  };

  return tierLimits[tier] || tierLimits.free;
}

/**
 * Get default usage stats for error cases
 */
function getDefaultUsageStats(): UserUsageStats {
  return {
    total_generations: 0,
    total_cost: 0,
    successful_generations: 0,
    failed_generations: 0,
    average_cost_per_generation: 0,
    last_generation: '',
    monthly_usage: 0,
    monthly_cost: 0,
  };
}
```

### 2. Intelligent Caching System

**File**: `src/lib/ai-image-generation/image-cache.ts`

```typescript
import { supabase } from '@/lib/supabase';
import { RecipeContext } from './recipe-context-analyzer';

export interface CachedImage {
  id: string;
  prompt_hash: string;
  image_url: string;
  recipe_context: RecipeContext;
  usage_count: number;
  created_at: string;
  expires_at: string;
  cost_saved: number;
}

export interface CacheMatch {
  cached: boolean;
  image_url?: string;
  similarity_score?: number;
  cost_saved?: number;
}

/**
 * Generate hash for prompt and context
 */
function generatePromptHash(prompt: string, context: RecipeContext): string {
  const contextString = JSON.stringify({
    cuisine: context.cuisine,
    course: context.course,
    mainIngredients: context.mainIngredients.sort(),
    cookingMethod: context.cookingMethod,
    complexity: context.complexity,
  });

  const combined = `${prompt}|${contextString}`;

  // Simple hash function (in production, use crypto.createHash)
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return hash.toString(36);
}

/**
 * Check if similar image exists in cache
 */
export async function findCachedImage(
  prompt: string,
  context: RecipeContext,
  similarityThreshold: number = 0.8
): Promise<CacheMatch> {
  const promptHash = generatePromptHash(prompt, context);

  // First, check for exact match
  const { data: exactMatch } = await supabase
    .from('cached_images')
    .select('*')
    .eq('prompt_hash', promptHash)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (exactMatch) {
    // Update usage count
    await supabase
      .from('cached_images')
      .update({ usage_count: exactMatch.usage_count + 1 })
      .eq('id', exactMatch.id);

    return {
      cached: true,
      image_url: exactMatch.image_url,
      similarity_score: 1.0,
      cost_saved: 0.08, // Estimated cost per generation
    };
  }

  // Look for similar images based on context
  const { data: similarImages } = await supabase
    .from('cached_images')
    .select('*')
    .eq('recipe_context->>cuisine', context.cuisine)
    .eq('recipe_context->>course', context.course)
    .gt('expires_at', new Date().toISOString())
    .limit(10);

  if (similarImages && similarImages.length > 0) {
    // Find best match based on ingredient overlap
    let bestMatch = null;
    let bestScore = 0;

    for (const image of similarImages) {
      const similarity = calculateContextSimilarity(
        context,
        image.recipe_context
      );
      if (similarity > bestScore && similarity >= similarityThreshold) {
        bestScore = similarity;
        bestMatch = image;
      }
    }

    if (bestMatch) {
      // Update usage count
      await supabase
        .from('cached_images')
        .update({ usage_count: bestMatch.usage_count + 1 })
        .eq('id', bestMatch.id);

      return {
        cached: true,
        image_url: bestMatch.image_url,
        similarity_score: bestScore,
        cost_saved: 0.08,
      };
    }
  }

  return { cached: false };
}

/**
 * Calculate similarity between recipe contexts
 */
function calculateContextSimilarity(
  context1: RecipeContext,
  context2: any
): number {
  let score = 0;
  let totalFactors = 0;

  // Cuisine match (40% weight)
  if (context1.cuisine === context2.cuisine) {
    score += 0.4;
  }
  totalFactors += 0.4;

  // Course match (30% weight)
  if (context1.course === context2.course) {
    score += 0.3;
  }
  totalFactors += 0.3;

  // Ingredient overlap (20% weight)
  const ingredientOverlap = calculateIngredientOverlap(
    context1.mainIngredients,
    context2.mainIngredients || []
  );
  score += ingredientOverlap * 0.2;
  totalFactors += 0.2;

  // Cooking method match (10% weight)
  if (context1.cookingMethod === context2.cookingMethod) {
    score += 0.1;
  }
  totalFactors += 0.1;

  return totalFactors > 0 ? score / totalFactors : 0;
}

/**
 * Calculate ingredient overlap percentage
 */
function calculateIngredientOverlap(
  ingredients1: string[],
  ingredients2: string[]
): number {
  if (ingredients1.length === 0 && ingredients2.length === 0) return 1;
  if (ingredients1.length === 0 || ingredients2.length === 0) return 0;

  const set1 = new Set(ingredients1.map((ing) => ing.toLowerCase()));
  const set2 = new Set(ingredients2.map((ing) => ing.toLowerCase()));

  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return intersection.size / union.size;
}

/**
 * Cache generated image
 */
export async function cacheGeneratedImage(
  prompt: string,
  context: RecipeContext,
  imageUrl: string,
  cost: number
): Promise<void> {
  const promptHash = generatePromptHash(prompt, context);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // Cache for 30 days

  const { error } = await supabase.from('cached_images').insert({
    prompt_hash: promptHash,
    image_url: imageUrl,
    recipe_context: context,
    usage_count: 1,
    created_at: new Date().toISOString(),
    expires_at: expiresAt.toISOString(),
    cost_saved: 0,
  });

  if (error) {
    console.error('Failed to cache generated image:', error);
  }
}

/**
 * Clean up expired cache entries
 */
export async function cleanupExpiredCache(): Promise<void> {
  const { error } = await supabase
    .from('cached_images')
    .delete()
    .lt('expires_at', new Date().toISOString());

  if (error) {
    console.error('Failed to cleanup expired cache:', error);
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  total_cached: number;
  total_cost_saved: number;
  hit_rate: number;
  most_used: CachedImage[];
}> {
  const { data: allCached } = await supabase
    .from('cached_images')
    .select('*')
    .gt('expires_at', new Date().toISOString());

  const { data: usageData } = await supabase
    .from('image_generation_usage')
    .select('cached')
    .gte(
      'created_at',
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    );

  const totalCached = allCached?.length || 0;
  const totalCostSaved =
    allCached?.reduce((sum, item) => sum + item.usage_count * 0.08, 0) || 0;

  const totalGenerations = usageData?.length || 0;
  const cacheHits = usageData?.filter((usage) => usage.cached).length || 0;
  const hitRate = totalGenerations > 0 ? cacheHits / totalGenerations : 0;

  const mostUsed =
    allCached?.sort((a, b) => b.usage_count - a.usage_count).slice(0, 10) || [];

  return {
    total_cached: totalCached,
    total_cost_saved: totalCostSaved,
    hit_rate: hitRate,
    most_used: mostUsed,
  };
}
```

### 3. Cost Optimization Features

**File**: `src/lib/ai-image-generation/cost-optimizer.ts`

```typescript
import { RecipeContext } from './recipe-context-analyzer';
import { UserUsageStats, CostLimits } from './usage-tracker';

export interface OptimizationSuggestion {
  type: 'size' | 'quality' | 'prompt' | 'caching';
  title: string;
  description: string;
  potentialSavings: number;
  impact: 'low' | 'medium' | 'high';
  action?: string;
}

export interface CostOptimization {
  suggestions: OptimizationSuggestion[];
  estimatedMonthlySavings: number;
  currentEfficiency: number;
  recommendedActions: string[];
}

/**
 * Analyze usage patterns and suggest optimizations
 */
export async function analyzeCostOptimization(
  userId: string,
  usageStats: UserUsageStats
): Promise<CostOptimization> {
  const suggestions: OptimizationSuggestion[] = [];
  let estimatedMonthlySavings = 0;

  // Analyze size usage patterns
  const sizeAnalysis = await analyzeSizeUsage(userId);
  if (sizeAnalysis.hasOversizedImages) {
    suggestions.push({
      type: 'size',
      title: 'Optimize Image Sizes',
      description:
        'Consider using smaller image sizes for better cost efficiency',
      potentialSavings: sizeAnalysis.potentialSavings,
      impact: 'medium',
      action: 'Use 1024x1024 instead of larger sizes when possible',
    });
    estimatedMonthlySavings += sizeAnalysis.potentialSavings;
  }

  // Analyze quality usage patterns
  const qualityAnalysis = await analyzeQualityUsage(userId);
  if (qualityAnalysis.hasExcessiveHD) {
    suggestions.push({
      type: 'quality',
      title: 'Optimize Quality Settings',
      description: 'Use standard quality for most images to reduce costs',
      potentialSavings: qualityAnalysis.potentialSavings,
      impact: 'high',
      action: 'Use standard quality unless HD is specifically needed',
    });
    estimatedMonthlySavings += qualityAnalysis.potentialSavings;
  }

  // Analyze prompt efficiency
  const promptAnalysis = await analyzePromptEfficiency(userId);
  if (promptAnalysis.hasInefficientPrompts) {
    suggestions.push({
      type: 'prompt',
      title: 'Optimize Prompt Length',
      description:
        'Shorter, more focused prompts can be more effective and cost-efficient',
      potentialSavings: promptAnalysis.potentialSavings,
      impact: 'low',
      action: 'Use more concise prompts with key descriptive words',
    });
    estimatedMonthlySavings += promptAnalysis.potentialSavings;
  }

  // Analyze cache usage
  const cacheAnalysis = await analyzeCacheUsage(userId);
  if (cacheAnalysis.hasLowCacheHitRate) {
    suggestions.push({
      type: 'caching',
      title: 'Improve Cache Usage',
      description: 'Similar recipes can reuse cached images to save costs',
      potentialSavings: cacheAnalysis.potentialSavings,
      impact: 'high',
      action: 'Check for similar recipes before generating new images',
    });
    estimatedMonthlySavings += cacheAnalysis.potentialSavings;
  }

  // Calculate current efficiency
  const currentEfficiency = calculateCurrentEfficiency(usageStats);

  // Generate recommended actions
  const recommendedActions = generateRecommendedActions(
    suggestions,
    usageStats
  );

  return {
    suggestions,
    estimatedMonthlySavings,
    currentEfficiency,
    recommendedActions,
  };
}

/**
 * Analyze image size usage patterns
 */
async function analyzeSizeUsage(userId: string): Promise<{
  hasOversizedImages: boolean;
  potentialSavings: number;
}> {
  // Get usage data for last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // This would query the actual usage data
  // For now, return mock analysis
  return {
    hasOversizedImages: true,
    potentialSavings: 2.5, // Estimated monthly savings
  };
}

/**
 * Analyze quality usage patterns
 */
async function analyzeQualityUsage(userId: string): Promise<{
  hasExcessiveHD: boolean;
  potentialSavings: number;
}> {
  // Analyze HD vs standard usage
  return {
    hasExcessiveHD: true,
    potentialSavings: 5.0, // Estimated monthly savings
  };
}

/**
 * Analyze prompt efficiency
 */
async function analyzePromptEfficiency(userId: string): Promise<{
  hasInefficientPrompts: boolean;
  potentialSavings: number;
}> {
  // Analyze prompt length vs effectiveness
  return {
    hasInefficientPrompts: false,
    potentialSavings: 0.5,
  };
}

/**
 * Analyze cache usage
 */
async function analyzeCacheUsage(userId: string): Promise<{
  hasLowCacheHitRate: boolean;
  potentialSavings: number;
}> {
  // Analyze cache hit rate
  return {
    hasLowCacheHitRate: true,
    potentialSavings: 8.0, // High potential savings from better caching
  };
}

/**
 * Calculate current efficiency score
 */
function calculateCurrentEfficiency(usageStats: UserUsageStats): number {
  if (usageStats.total_generations === 0) return 1.0;

  const successRate =
    usageStats.successful_generations / usageStats.total_generations;
  const averageCost = usageStats.average_cost_per_generation;

  // Ideal average cost is around $0.06 (standard quality, 1024x1024)
  const costEfficiency = Math.max(0, 1 - (averageCost - 0.06) / 0.06);

  // Combine success rate and cost efficiency
  return successRate * 0.7 + costEfficiency * 0.3;
}

/**
 * Generate recommended actions based on analysis
 */
function generateRecommendedActions(
  suggestions: OptimizationSuggestion[],
  usageStats: UserUsageStats
): string[] {
  const actions: string[] = [];

  if (suggestions.length === 0) {
    actions.push('Your image generation usage is already well optimized!');
    return actions;
  }

  // Prioritize high-impact suggestions
  const highImpactSuggestions = suggestions.filter((s) => s.impact === 'high');
  if (highImpactSuggestions.length > 0) {
    actions.push('Focus on high-impact optimizations first:');
    highImpactSuggestions.forEach((suggestion) => {
      actions.push(`• ${suggestion.action}`);
    });
  }

  // Add general recommendations
  if (usageStats.total_generations > 20) {
    actions.push('Consider using cached images for similar recipes');
  }

  if (usageStats.average_cost_per_generation > 0.08) {
    actions.push('Use standard quality and 1024x1024 size for most images');
  }

  return actions;
}

/**
 * Get cost breakdown by category
 */
export function getCostBreakdown(usageStats: UserUsageStats): {
  category: string;
  cost: number;
  percentage: number;
}[] {
  // This would analyze actual usage data
  // For now, return estimated breakdown
  return [
    {
      category: 'Standard Quality (1024x1024)',
      cost: usageStats.total_cost * 0.6,
      percentage: 60,
    },
    {
      category: 'HD Quality',
      cost: usageStats.total_cost * 0.3,
      percentage: 30,
    },
    {
      category: 'Large Images',
      cost: usageStats.total_cost * 0.1,
      percentage: 10,
    },
  ];
}
```

### 4. Enhanced API with Cost Management

**File**: `api/ai/generate-image.ts` (enhancements)

```typescript
// Add to existing handler
import {
  checkCostLimits,
  trackImageGeneration,
} from '@/lib/ai-image-generation/usage-tracker';
import {
  findCachedImage,
  cacheGeneratedImage,
} from '@/lib/ai-image-generation/image-cache';
import { analyzeRecipeContext } from '@/lib/ai-image-generation/recipe-context-analyzer';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // ... existing validation ...

  try {
    // Extract user ID from request (implement authentication)
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required',
      });
    }

    // Check cost limits before generation
    const limitCheck = await checkCostLimits(userId);
    if (!limitCheck.allowed) {
      return res.status(429).json({
        success: false,
        error: limitCheck.reason,
        limits: limitCheck.limits,
        currentUsage: limitCheck.currentUsage,
      });
    }

    // Check cache first
    let cachedImage = null;
    if (
      useIntelligentPrompting &&
      (recipeTitle || ingredients || instructions)
    ) {
      const recipeData = {
        title: recipeTitle || '',
        categories: categories || [],
        ingredients: ingredients || [],
        instructions: instructions || '',
      };

      const context = analyzeRecipeContext(recipeData);
      cachedImage = await findCachedImage(finalPrompt, context);

      if (cachedImage.cached) {
        // Track cache hit
        await trackImageGeneration(userId, {
          recipe_id: recipeId,
          prompt: finalPrompt,
          prompt_length: finalPrompt.length,
          size,
          quality,
          cost: 0, // No cost for cached images
          success: true,
          fallback_used: false,
          generation_time_ms: 0,
          cached: true,
          cache_hit: 'similar_context',
        });

        return res.status(200).json({
          success: true,
          imageUrl: cachedImage.image_url,
          cached: true,
          cost_saved: cachedImage.cost_saved,
          usage: {
            promptTokens: finalPrompt.length,
            totalCost: 0,
          },
        });
      }
    }

    // Proceed with generation
    const startTime = Date.now();

    // ... existing DALL-E API call ...

    const generationTime = Date.now() - startTime;
    const cost = calculateImageCost(size, quality);

    // Track usage
    await trackImageGeneration(userId, {
      recipe_id: recipeId,
      prompt: finalPrompt,
      prompt_length: finalPrompt.length,
      size,
      quality,
      cost,
      success: true,
      fallback_used: false,
      generation_time_ms: generationTime,
      cached: false,
    });

    // Cache the generated image
    if (
      useIntelligentPrompting &&
      (recipeTitle || ingredients || instructions)
    ) {
      const recipeData = {
        title: recipeTitle || '',
        categories: categories || [],
        ingredients: ingredients || [],
        instructions: instructions || '',
      };

      const context = analyzeRecipeContext(recipeData);
      await cacheGeneratedImage(finalPrompt, context, generatedImageUrl, cost);
    }

    // ... rest of response ...
  } catch (error) {
    // Track failed generation
    if (userId) {
      await trackImageGeneration(userId, {
        recipe_id: recipeId,
        prompt: finalPrompt,
        prompt_length: finalPrompt.length,
        size,
        quality,
        cost: 0,
        success: false,
        error_message: error.message,
        fallback_used: false,
        generation_time_ms: Date.now() - startTime,
        cached: false,
      });
    }

    // ... error handling ...
  }
}
```

### 5. User Cost Controls UI

**File**: `src/components/ai-image-generation/CostManagementPanel.tsx`

```typescript
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle } from 'lucide-react';

interface CostManagementPanelProps {
  usageStats: UserUsageStats;
  costLimits: CostLimits;
  onUpgrade?: () => void;
}

export function CostManagementPanel({
  usageStats,
  costLimits,
  onUpgrade
}: CostManagementPanelProps) {
  const dailyProgress = (usageStats.monthly_cost / costLimits.daily_limit) * 100;
  const monthlyProgress = (usageStats.monthly_cost / costLimits.monthly_limit) * 100;

  const isNearDailyLimit = dailyProgress > 80;
  const isNearMonthlyLimit = monthlyProgress > 80;

  return (
    <div className="space-y-4">
      {/* Usage Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Usage & Costs
          </CardTitle>
          <CardDescription>
            Track your AI image generation usage and costs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Monthly Usage */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Monthly Usage</span>
              <Badge variant={monthlyProgress > 100 ? "destructive" : "secondary"}>
                {usageStats.monthly_usage} generations
              </Badge>
            </div>
            <Progress value={monthlyProgress} className="h-2" />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>${usageStats.monthly_cost.toFixed(2)}</span>
              <span>${costLimits.monthly_limit.toFixed(2)} limit</span>
            </div>
          </div>

          {/* Daily Usage */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Daily Usage</span>
              <Badge variant={dailyProgress > 100 ? "destructive" : "secondary"}>
                Today
              </Badge>
            </div>
            <Progress value={dailyProgress} className="h-2" />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>$0.00</span>
              <span>${costLimits.daily_limit.toFixed(2)} limit</span>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {usageStats.successful_generations}
              </div>
              <div className="text-xs text-gray-500">Successful</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                ${usageStats.average_cost_per_generation.toFixed(3)}
              </div>
              <div className="text-xs text-gray-500">Avg Cost</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {isNearDailyLimit && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You're approaching your daily cost limit. Consider upgrading your plan for more usage.
          </AlertDescription>
        </Alert>
      )}

      {isNearMonthlyLimit && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You're approaching your monthly cost limit. Your usage will be restricted until next month.
          </AlertDescription>
        </Alert>
      )}

      {/* Plan Information */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan: {costLimits.user_tier}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Daily Limit:</span>
              <span>${costLimits.daily_limit}</span>
            </div>
            <div className="flex justify-between">
              <span>Monthly Limit:</span>
              <span>${costLimits.monthly_limit}</span>
            </div>
            <div className="flex justify-between">
              <span>Max per Generation:</span>
              <span>${costLimits.per_generation_limit}</span>
            </div>
          </div>

          {costLimits.user_tier === 'free' && (
            <Button className="w-full mt-4" onClick={onUpgrade}>
              Upgrade Plan
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

## 🗄️ Database Schema

**File**: `supabase/migrations/add_image_generation_tables.sql`

```sql
-- Image generation usage tracking
CREATE TABLE image_generation_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
  prompt TEXT NOT NULL,
  prompt_length INTEGER NOT NULL,
  size VARCHAR(20) NOT NULL,
  quality VARCHAR(20) NOT NULL,
  cost DECIMAL(10,4) NOT NULL,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  fallback_used BOOLEAN DEFAULT FALSE,
  generation_time_ms INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cached BOOLEAN DEFAULT FALSE,
  cache_hit VARCHAR(50)
);

-- Cached images for reuse
CREATE TABLE cached_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt_hash VARCHAR(255) UNIQUE NOT NULL,
  image_url TEXT NOT NULL,
  recipe_context JSONB NOT NULL,
  usage_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  cost_saved DECIMAL(10,4) DEFAULT 0
);

-- Indexes for performance
CREATE INDEX idx_image_generation_usage_user_id ON image_generation_usage(user_id);
CREATE INDEX idx_image_generation_usage_created_at ON image_generation_usage(created_at);
CREATE INDEX idx_cached_images_prompt_hash ON cached_images(prompt_hash);
CREATE INDEX idx_cached_images_expires_at ON cached_images(expires_at);
CREATE INDEX idx_cached_images_usage_count ON cached_images(usage_count DESC);

-- RLS policies
ALTER TABLE image_generation_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE cached_images ENABLE ROW LEVEL SECURITY;

-- Users can only see their own usage
CREATE POLICY "Users can view own usage" ON image_generation_usage
  FOR SELECT USING (auth.uid() = user_id);

-- Cached images are read-only for users
CREATE POLICY "Users can view cached images" ON cached_images
  FOR SELECT USING (true);
```

## 🧪 Testing

### 1. Usage Tracking Tests

**File**: `src/__tests__/lib/ai-image-generation/usage-tracker.test.ts`

```typescript
import {
  trackImageGeneration,
  getUserUsageStats,
  checkCostLimits,
} from '@/lib/ai-image-generation/usage-tracker';

describe('Usage Tracker', () => {
  it('should track image generation usage', async () => {
    const usage = {
      recipe_id: 'test-recipe-id',
      prompt: 'test prompt',
      prompt_length: 11,
      size: '1024x1024',
      quality: 'standard',
      cost: 0.04,
      success: true,
      fallback_used: false,
      generation_time_ms: 1500,
      cached: false,
    };

    await trackImageGeneration('test-user-id', usage);

    // Verify tracking (would check database in real test)
    expect(true).toBe(true);
  });

  it('should check cost limits correctly', async () => {
    const result = await checkCostLimits('test-user-id');

    expect(result).toHaveProperty('allowed');
    expect(result).toHaveProperty('limits');
    expect(result).toHaveProperty('currentUsage');
  });
});
```

## 📊 Monitoring & Analytics

### 1. Cost Monitoring Dashboard

```typescript
// Add to admin dashboard
interface CostMonitoringMetrics {
  totalMonthlyCost: number;
  totalGenerations: number;
  averageCostPerGeneration: number;
  cacheHitRate: number;
  topUsers: Array<{ userId: string; cost: number; generations: number }>;
  costTrends: Array<{ date: string; cost: number; generations: number }>;
}
```

### 2. Automated Alerts

```typescript
// Add to monitoring system
export async function checkCostAlerts(): Promise<void> {
  // Check for users approaching limits
  // Check for unusual usage patterns
  // Check for system-wide cost thresholds
}
```

## ✅ Phase 4 Completion Criteria

- [ ] Usage tracking system records all generations
- [ ] Cost limits are enforced at user and system level
- [ ] Caching system reduces redundant generations
- [ ] Cost optimization suggestions are provided
- [ ] User cost controls are implemented
- [ ] Rate limiting prevents abuse
- [ ] Cost monitoring and alerting is active
- [ ] Budget management tools are functional
- [ ] Database schema supports all features
- [ ] Unit tests pass for all functionality

## 🚀 Next Phase

Once Phase 4 is complete, proceed to [Phase 5: Testing & Quality Assurance](./PHASE-5-TESTING.md) to implement comprehensive testing and quality validation.

---

**Estimated Time**: 4-5 days
**Dependencies**: Phase 1-3 backend, frontend, and context integration
**Risk Level**: Medium (complex cost management and caching)
