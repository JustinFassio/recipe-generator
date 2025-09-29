# Phase 1: Data Foundation

## Overview

**Duration**: 2-3 weeks  
**Objective**: Establish enhanced data structures and progress tracking infrastructure to support longitudinal health analysis.

## Goals

1. **Enhanced Database Schema**: Extend evaluation reports with progress tracking capabilities
2. **Data Migration Strategy**: Safely migrate existing evaluation data
3. **Progress Metrics Framework**: Define standardized progress measurements
4. **Data Validation**: Ensure data integrity and consistency

## Technical Implementation

### 1. Database Schema Enhancements

#### New Tables

**`evaluation_progress_tracking`**

```sql
CREATE TABLE evaluation_progress_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  report_id UUID NOT NULL REFERENCES evaluation_reports(report_id),
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_unit TEXT,
  progress_direction TEXT CHECK (progress_direction IN ('improving', 'declining', 'stable')),
  significance_level NUMERIC DEFAULT 0.5 CHECK (significance_level >= 0 AND significance_level <= 1),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_progress_tracking_user_metric ON evaluation_progress_tracking(user_id, metric_name);
CREATE INDEX idx_progress_tracking_report ON evaluation_progress_tracking(report_id);
```

**`health_milestones`**

```sql
CREATE TABLE health_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  milestone_type TEXT NOT NULL,
  milestone_name TEXT NOT NULL,
  target_value NUMERIC,
  current_value NUMERIC,
  achieved_at TIMESTAMP WITH TIME ZONE,
  target_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'achieved', 'overdue')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_milestones_user ON health_milestones(user_id);
CREATE INDEX idx_milestones_status ON health_milestones(status);
```

**`progress_analytics`**

```sql
CREATE TABLE progress_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL,
  analysis_data JSONB NOT NULL,
  confidence_score NUMERIC DEFAULT 0.5 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  insights TEXT[],
  recommendations TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_progress_analytics_user ON progress_analytics(user_id);
CREATE INDEX idx_progress_analytics_type ON progress_analytics(analysis_type);
```

#### Enhanced Evaluation Reports

**Add progress tracking fields to `evaluation_reports`**:

```sql
ALTER TABLE evaluation_reports
ADD COLUMN progress_summary JSONB,
ADD COLUMN trend_analysis JSONB,
ADD COLUMN previous_report_id UUID REFERENCES evaluation_reports(report_id),
ADD COLUMN progress_score NUMERIC DEFAULT 0.0,
ADD COLUMN key_improvements TEXT[],
ADD COLUMN areas_of_concern TEXT[];
```

### 2. Progress Metrics Framework

#### Core Health Metrics

**Nutritional Metrics**

```typescript
interface NutritionalProgress {
  diet_quality_score: {
    current: number;
    previous: number;
    trend: 'improving' | 'declining' | 'stable';
    change_percentage: number;
  };
  nutritional_completeness: {
    current: number;
    previous: number;
    trend: 'improving' | 'declining' | 'stable';
    change_percentage: number;
  };
  anti_inflammatory_index: {
    current: number;
    previous: number;
    trend: 'improving' | 'declining' | 'stable';
    change_percentage: number;
  };
}
```

**Skill Development Metrics**

```typescript
interface SkillProgress {
  cooking_confidence: {
    current: number;
    previous: number;
    trend: 'improving' | 'declining' | 'stable';
    change_percentage: number;
  };
  technique_mastery: {
    current: string[];
    previous: string[];
    new_techniques: string[];
    improved_techniques: string[];
  };
  equipment_utilization: {
    current: number;
    previous: number;
    trend: 'improving' | 'declining' | 'stable';
    change_percentage: number;
  };
}
```

**Behavioral Metrics**

```typescript
interface BehavioralProgress {
  meal_planning_consistency: {
    current: number;
    previous: number;
    trend: 'improving' | 'declining' | 'stable';
    change_percentage: number;
  };
  ingredient_exploration: {
    current: string[];
    previous: string[];
    new_ingredients: string[];
    exploration_rate: number;
  };
  cooking_frequency: {
    current: number;
    previous: number;
    trend: 'improving' | 'declining' | 'stable';
    change_percentage: number;
  };
}
```

### 3. Data Migration Strategy

#### Migration Script: `scripts/migrate-evaluation-data.ts`

```typescript
import { supabase } from '@/lib/supabase';

interface MigrationResult {
  reportsProcessed: number;
  progressMetricsCreated: number;
  milestonesCreated: number;
  errors: string[];
}

export async function migrateEvaluationData(): Promise<MigrationResult> {
  const result: MigrationResult = {
    reportsProcessed: 0,
    progressMetricsCreated: 0,
    milestonesCreated: 0,
    errors: [],
  };

  try {
    // Get all existing evaluation reports
    const { data: reports, error: reportsError } = await supabase
      .from('evaluation_reports')
      .select('*')
      .order('evaluation_date', { ascending: true });

    if (reportsError) throw reportsError;

    // Process each user's reports chronologically
    const userReports = groupReportsByUser(reports);

    for (const [userId, userReportList] of Object.entries(userReports)) {
      await processUserReports(userId, userReportList, result);
    }

    return result;
  } catch (error) {
    result.errors.push(`Migration failed: ${error.message}`);
    return result;
  }
}

async function processUserReports(
  userId: string,
  reports: any[],
  result: MigrationResult
) {
  for (let i = 0; i < reports.length; i++) {
    const currentReport = reports[i];
    const previousReport = i > 0 ? reports[i - 1] : null;

    // Extract progress metrics
    const progressMetrics = extractProgressMetrics(
      currentReport,
      previousReport
    );

    // Create progress tracking records
    for (const metric of progressMetrics) {
      const { error } = await supabase
        .from('evaluation_progress_tracking')
        .insert({
          user_id: userId,
          report_id: currentReport.report_id,
          ...metric,
        });

      if (error) {
        result.errors.push(
          `Failed to create progress metric: ${error.message}`
        );
      } else {
        result.progressMetricsCreated++;
      }
    }

    // Create milestones
    const milestones = extractMilestones(currentReport);
    for (const milestone of milestones) {
      const { error } = await supabase.from('health_milestones').insert({
        user_id: userId,
        ...milestone,
      });

      if (error) {
        result.errors.push(`Failed to create milestone: ${error.message}`);
      } else {
        result.milestonesCreated++;
      }
    }

    result.reportsProcessed++;
  }
}
```

### 4. Data Validation System

#### Validation Functions

```typescript
// src/lib/progress-validation.ts
export interface ProgressValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateProgressData(data: any): ProgressValidationResult {
  const result: ProgressValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  // Validate metric values
  if (data.metric_value < 0 || data.metric_value > 100) {
    result.errors.push('Metric value must be between 0 and 100');
    result.isValid = false;
  }

  // Validate progress direction
  const validDirections = ['improving', 'declining', 'stable'];
  if (!validDirections.includes(data.progress_direction)) {
    result.errors.push('Invalid progress direction');
    result.isValid = false;
  }

  // Validate significance level
  if (data.significance_level < 0 || data.significance_level > 1) {
    result.warnings.push('Significance level should be between 0 and 1');
  }

  return result;
}
```

### 5. API Layer Enhancements

#### Progress Tracking API

```typescript
// src/lib/progress-tracking-api.ts
export interface ProgressTrackingAPI {
  // Create progress metrics
  createProgressMetrics(
    userId: string,
    reportId: string,
    metrics: ProgressMetric[]
  ): Promise<{ success: boolean; error?: string }>;

  // Get user progress history
  getUserProgressHistory(
    userId: string,
    metricName?: string,
    timeRange?: { start: Date; end: Date }
  ): Promise<ProgressMetric[]>;

  // Calculate progress trends
  calculateProgressTrends(
    userId: string,
    metricName: string
  ): Promise<ProgressTrend>;

  // Get milestone status
  getMilestoneStatus(
    userId: string,
    milestoneType?: string
  ): Promise<HealthMilestone[]>;
}

export class SupabaseProgressTrackingAPI implements ProgressTrackingAPI {
  async createProgressMetrics(
    userId: string,
    reportId: string,
    metrics: ProgressMetric[]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('evaluation_progress_tracking')
        .insert(
          metrics.map((metric) => ({
            user_id: userId,
            report_id: reportId,
            ...metric,
          }))
        );

      if (error) throw error;

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getUserProgressHistory(
    userId: string,
    metricName?: string,
    timeRange?: { start: Date; end: Date }
  ): Promise<ProgressMetric[]> {
    let query = supabase
      .from('evaluation_progress_tracking')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (metricName) {
      query = query.eq('metric_name', metricName);
    }

    if (timeRange) {
      query = query
        .gte('created_at', timeRange.start.toISOString())
        .lte('created_at', timeRange.end.toISOString());
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  async calculateProgressTrends(
    userId: string,
    metricName: string
  ): Promise<ProgressTrend> {
    const metrics = await this.getUserProgressHistory(userId, metricName);

    if (metrics.length < 2) {
      return {
        trend: 'insufficient_data',
        change_percentage: 0,
        confidence: 0,
      };
    }

    const firstValue = metrics[0].metric_value;
    const lastValue = metrics[metrics.length - 1].metric_value;
    const changePercentage = ((lastValue - firstValue) / firstValue) * 100;

    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    if (changePercentage > 5) trend = 'improving';
    else if (changePercentage < -5) trend = 'declining';

    return {
      trend,
      change_percentage: changePercentage,
      confidence: calculateConfidence(metrics),
    };
  }

  async getMilestoneStatus(
    userId: string,
    milestoneType?: string
  ): Promise<HealthMilestone[]> {
    let query = supabase
      .from('health_milestones')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (milestoneType) {
      query = query.eq('milestone_type', milestoneType);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }
}
```

## Testing Strategy

### Unit Tests

- Progress metric validation
- Data migration functions
- API layer methods
- Database schema constraints

### Integration Tests

- End-to-end data flow
- Cross-table relationships
- Performance with large datasets

### Data Quality Tests

- Migration accuracy
- Data consistency checks
- Performance benchmarks

## Success Criteria

### Technical Metrics

- ✅ **Database Schema**: All new tables and indexes created
- ✅ **Data Migration**: 100% of existing reports migrated successfully
- ✅ **API Performance**: <100ms response time for progress queries
- ✅ **Data Validation**: 100% of progress metrics pass validation

### Quality Metrics

- ✅ **Data Integrity**: No data loss during migration
- ✅ **Performance**: Queries handle 10,000+ progress records efficiently
- ✅ **Consistency**: All progress metrics follow standardized format

## Deliverables

1. **Enhanced Database Schema** with progress tracking tables
2. **Data Migration Scripts** for existing evaluation data
3. **Progress Metrics Framework** with standardized measurements
4. **API Layer** for progress tracking operations
5. **Validation System** for data quality assurance
6. **Comprehensive Tests** for all new functionality

## Next Steps

Upon completion of Phase 1:

1. **Data Foundation** will be ready for progress analysis
2. **Migration** of existing evaluation data will be complete
3. **API Layer** will support progress tracking operations
4. **Ready for Phase 2**: Progress Analysis Engine implementation

---

**Status**: 📋 Ready for Implementation  
**Dependencies**: None  
**Blockers**: None
