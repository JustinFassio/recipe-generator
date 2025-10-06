# AI Image Generation Budget System - Implementation Guide

## 📋 Overview

This guide provides step-by-step instructions for implementing and maintaining the AI Image Generation Budget System. It covers setup, configuration, troubleshooting, and best practices.

## 🚀 Quick Start

### 1. Database Setup

Ensure the required tables exist in your Supabase database:

```sql
-- Create user_budgets table
CREATE TABLE IF NOT EXISTS user_budgets (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id),
    monthly_budget NUMERIC NOT NULL DEFAULT 10,
    used_monthly NUMERIC NOT NULL DEFAULT 0,
    period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create image_generation_costs table
CREATE TABLE IF NOT EXISTS image_generation_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    prompt TEXT NOT NULL,
    size TEXT NOT NULL,
    quality TEXT NOT NULL,
    cost NUMERIC NOT NULL,
    success BOOLEAN NOT NULL,
    image_url TEXT,
    generation_time_ms INTEGER,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 2. RLS Policies

Set up Row Level Security policies:

```sql
-- Enable RLS
ALTER TABLE user_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_generation_costs ENABLE ROW LEVEL SECURITY;

-- User budgets policies
CREATE POLICY "Users can view their own budget" ON user_budgets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own budget" ON user_budgets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert their own budget" ON user_budgets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Image generation costs policies
CREATE POLICY "Users can view their own costs" ON image_generation_costs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own costs" ON image_generation_costs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### 3. Environment Configuration

Add budget configuration to your environment:

```typescript
// config/budget.ts
export const BUDGET_CONFIG = {
  DEFAULT_MONTHLY_BUDGET: 10,
  MIN_MONTHLY_BUDGET: 1,
  MAX_MONTHLY_BUDGET: 1000,
  COST_PER_IMAGE: {
    '1024x1024': { standard: 0.04, hd: 0.08 },
    '1024x1792': { standard: 0.08, hd: 0.12 },
    '1792x1024': { standard: 0.08, hd: 0.12 },
  },
} as const;
```

## 🔧 Implementation Steps

### Step 1: Budget Manager Setup

1. **Install Dependencies**:

   ```bash
   npm install @supabase/supabase-js
   ```

2. **Create Budget Manager**:

   ```typescript
   // src/lib/ai-image-generation/budget-manager.ts
   import { supabase } from '@/lib/supabase';
   import { BUDGET_CONFIG } from '@/config/budget';

   export interface UserBudget {
     user_id: string;
     monthly_budget: number;
     used_monthly: number;
     period_start: string;
     updated_at: string;
   }

   export async function getUserBudget(userId?: string): Promise<UserBudget> {
     // Implementation as shown in audit
   }
   ```

### Step 2: Cost Tracking Integration

1. **Add to Image Generation Flow**:

   ```typescript
   // In your image generation function
   import {
     canGenerateImage,
     updateBudgetAfterGeneration,
   } from '@/lib/ai-image-generation/budget-manager';

   export async function generateImage(
     prompt: string,
     options: GenerationOptions
   ) {
     // 1. Check budget before generation
     const budgetCheck = await canGenerateImage(expectedCost);
     if (!budgetCheck.allowed) {
       throw new Error(budgetCheck.reason);
     }

     // 2. Generate image
     const result = await callImageGenerationAPI(prompt, options);

     // 3. Update budget after successful generation
     if (result.success) {
       await updateBudgetAfterGeneration(actualCost);
     }

     return result;
   }
   ```

### Step 3: User Interface Implementation

1. **Create Budget Settings Component**:

   ```typescript
   // src/components/settings/budget-settings.tsx
   import {
     getUserBudget,
     updateUserBudget,
   } from '@/lib/ai-image-generation/budget-manager';

   export function BudgetSettings() {
     const [budget, setBudget] = useState<UserBudget | null>(null);

     // Implementation focusing only on working features
     // Remove non-functional UI elements
   }
   ```

2. **Add Budget Status Display**:
   ```typescript
   // Show current budget status
   <div className="budget-status">
     <div className="remaining">
       ${budget.monthly_budget - budget.used_monthly} remaining
     </div>
     <div className="used">
       ${budget.used_monthly} of ${budget.monthly_budget} used
     </div>
   </div>
   ```

## 🧪 Testing Implementation

### Unit Tests

1. **Budget Manager Tests**:

   ```typescript
   // tests/budget-manager.test.ts
   import {
     getUserBudget,
     canGenerateImage,
   } from '@/lib/ai-image-generation/budget-manager';

   describe('Budget Manager', () => {
     test('should create default budget for new user', async () => {
       const budget = await getUserBudget('new-user-id');
       expect(budget.monthly_budget).toBe(10);
       expect(budget.used_monthly).toBe(0);
     });

     test('should check budget limits correctly', async () => {
       const result = await canGenerateImage(5); // $5 cost
       expect(result.allowed).toBe(true);
     });
   });
   ```

2. **UI Component Tests**:

   ```typescript
   // tests/budget-settings.test.tsx
   import { render, screen } from '@testing-library/react';
   import { BudgetSettings } from '@/components/settings/budget-settings';

   describe('Budget Settings', () => {
     test('should display current budget status', () => {
       render(<BudgetSettings />);
       expect(screen.getByText('Monthly Remaining')).toBeInTheDocument();
     });
   });
   ```

### Integration Tests

1. **Database Integration**:
   ```typescript
   // tests/integration/budget-integration.test.ts
   describe('Budget Integration', () => {
     test('should create and update budget records', async () => {
       // Test full database operations
     });
   });
   ```

## 🔍 Monitoring & Debugging

### 1. Budget System Health Check

Create a health check function:

```typescript
// src/lib/ai-image-generation/budget-health-check.ts
export async function checkBudgetSystemHealth(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  issues: string[];
}> {
  const issues: string[] = [];

  try {
    // Test budget creation
    const testBudget = await getUserBudget('test-user');
    if (!testBudget) {
      issues.push('Budget creation failed');
    }
  } catch (error) {
    issues.push(`Budget system error: ${error.message}`);
  }

  return {
    status:
      issues.length === 0
        ? 'healthy'
        : issues.length < 3
          ? 'degraded'
          : 'unhealthy',
    issues,
  };
}
```

### 2. Debug Logging

Add comprehensive logging:

```typescript
// src/lib/ai-image-generation/budget-manager.ts
export async function getUserBudget(userId?: string): Promise<UserBudget> {
  console.log(`[Budget] Getting budget for user: ${userId}`);

  try {
    const { data: user } = await supabase.auth.getUser();
    console.log(`[Budget] User authenticated: ${!!user.user}`);

    // ... rest of implementation

    console.log(`[Budget] Budget retrieved successfully:`, budget);
    return budget;
  } catch (error) {
    console.error(`[Budget] Error getting budget:`, error);
    throw error;
  }
}
```

### 3. Common Issues & Solutions

#### Issue: 404 Errors for user_budgets

**Symptoms**:

```
GET user_budgets?select=*&user_id=eq.xxx 404 (Not Found)
```

**Solutions**:

1. Check if user is authenticated:

   ```typescript
   const { data: user } = await supabase.auth.getUser();
   console.log('User authenticated:', !!user.user);
   ```

2. Verify RLS policies:

   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'user_budgets';
   ```

3. Test budget creation:
   ```typescript
   try {
     const budget = await getUserBudget();
     console.log('Budget created:', budget);
   } catch (error) {
     console.error('Budget creation failed:', error);
   }
   ```

#### Issue: Budget Not Updated After Generation

**Symptoms**:

- Budget not reflecting recent image generation costs
- `used_monthly` not increasing

**Solutions**:

1. Check if `updateBudgetAfterGeneration` is called:

   ```typescript
   // In your image generation function
   if (result.success) {
     console.log('Updating budget with cost:', actualCost);
     await updateBudgetAfterGeneration(actualCost);
   }
   ```

2. Verify cost tracking:
   ```typescript
   // Check if cost is being tracked
   const { data: costs } = await supabase
     .from('image_generation_costs')
     .select('*')
     .eq('user_id', userId)
     .order('created_at', { ascending: false })
     .limit(5);
   ```

## 📊 Performance Optimization

### 1. Caching Strategy

Implement budget data caching:

```typescript
// src/lib/ai-image-generation/budget-cache.ts
const budgetCache = new Map<
  string,
  { budget: UserBudget; timestamp: number }
>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getCachedBudget(
  userId: string
): Promise<UserBudget | null> {
  const cached = budgetCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.budget;
  }

  const budget = await getUserBudget(userId);
  budgetCache.set(userId, { budget, timestamp: Date.now() });
  return budget;
}
```

### 2. Batch Operations

Optimize multiple budget updates:

```typescript
// src/lib/ai-image-generation/budget-batch.ts
export async function updateMultipleBudgets(
  updates: Array<{ userId: string; cost: number }>
) {
  const promises = updates.map(({ userId, cost }) =>
    updateBudgetAfterGeneration(cost, userId)
  );

  await Promise.allSettled(promises);
}
```

## 🔒 Security Best Practices

### 1. Input Validation

```typescript
// src/lib/ai-image-generation/budget-validation.ts
export function validateBudgetInput(input: any): UserBudget {
  if (!input.user_id || typeof input.user_id !== 'string') {
    throw new Error('Invalid user_id');
  }

  if (typeof input.monthly_budget !== 'number' || input.monthly_budget < 0) {
    throw new Error('Invalid monthly_budget');
  }

  return input as UserBudget;
}
```

### 2. Rate Limiting

```typescript
// src/lib/ai-image-generation/budget-rate-limit.ts
const rateLimitMap = new Map<string, number>();

export function checkRateLimit(
  userId: string,
  maxRequests = 10,
  windowMs = 60000
): boolean {
  const now = Date.now();
  const userRequests = rateLimitMap.get(userId) || 0;

  if (userRequests >= maxRequests) {
    return false;
  }

  rateLimitMap.set(userId, userRequests + 1);
  setTimeout(() => {
    const current = rateLimitMap.get(userId) || 0;
    rateLimitMap.set(userId, Math.max(0, current - 1));
  }, windowMs);

  return true;
}
```

## 📈 Analytics & Reporting

### 1. Budget Analytics

```typescript
// src/lib/ai-image-generation/budget-analytics.ts
export async function getBudgetAnalytics(
  userId: string,
  period: 'week' | 'month' | 'year'
) {
  const { data: costs } = await supabase
    .from('image_generation_costs')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', getPeriodStart(period))
    .order('created_at', { ascending: false });

  return {
    totalSpent: costs.reduce((sum, cost) => sum + cost.cost, 0),
    totalGenerations: costs.length,
    successfulGenerations: costs.filter((c) => c.success).length,
    averageCost: costs.reduce((sum, cost) => sum + cost.cost, 0) / costs.length,
    costBySize: groupBy(costs, 'size'),
    costByQuality: groupBy(costs, 'quality'),
  };
}
```

### 2. Budget Alerts

```typescript
// src/lib/ai-image-generation/budget-alerts.ts
export async function checkBudgetAlerts(userId: string) {
  const budget = await getUserBudget(userId);
  const usagePercentage = (budget.used_monthly / budget.monthly_budget) * 100;

  const alerts = [];

  if (usagePercentage >= 90) {
    alerts.push({
      type: 'critical',
      message: 'Budget nearly exhausted',
      percentage: usagePercentage,
    });
  } else if (usagePercentage >= 75) {
    alerts.push({
      type: 'warning',
      message: 'Budget 75% used',
      percentage: usagePercentage,
    });
  }

  return alerts;
}
```

## 🚀 Deployment Checklist

### Pre-Deployment

- [ ] Database tables created with proper RLS policies
- [ ] Environment variables configured
- [ ] Budget manager functions tested
- [ ] UI components working correctly
- [ ] Error handling implemented
- [ ] Logging configured
- [ ] Monitoring set up

### Post-Deployment

- [ ] Budget system health check passing
- [ ] User budget creation working
- [ ] Cost tracking functional
- [ ] UI displaying correct data
- [ ] Error rates within acceptable limits
- [ ] Performance metrics acceptable

## 📚 Additional Resources

- [Budget Manager Audit Report](./budget-manager-audit.md)
- [Budget Settings UI Audit Report](./budget-settings-audit.md)
- [Database Schema Documentation](../supabase/database-schema.md)
- [Security & RLS Guide](../supabase/security-rls.md)
- [Testing Guide](../testing/testing-guide.md)

---

## 🆘 Support

If you encounter issues with the budget system:

1. Check the [Troubleshooting Guide](./README.md#troubleshooting)
2. Review the audit reports for known issues
3. Check the health check endpoint
4. Review application logs for error details
5. Verify database connectivity and RLS policies

For additional support, refer to the main project documentation or contact the development team.
