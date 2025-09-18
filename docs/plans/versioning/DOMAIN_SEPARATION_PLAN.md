# Domain Separation Implementation Plan

## Fixing the DualRatingDisplay Architectural Issues

### 🚨 **Critical Problem Identified**

The `DualRatingDisplay` component is the **root cause** of the versioning system problems. It violates fundamental software architecture principles by mixing multiple domains into a single monolithic component.

**Current Issues:**

1. **Single Responsibility Violation**: One component handles versioning, ratings, analytics, and navigation
2. **Artificial Data Coupling**: Creates fake rating stats from version data
3. **Navigation Bugs**: Inconsistent recipe ID usage causing `/recipe/undefined` errors
4. **Performance Issues**: Unnecessary re-renders and data fetching
5. **Maintainability Problems**: Impossible to modify one system without affecting others

---

## 📋 **Phase 1: Component Separation (Week 1)**

### **1.1: Create Separated Components**

#### **VersionNavigator Component (Pure Versioning)**

```typescript
// src/components/recipes/version-navigator.tsx
interface VersionNavigatorProps {
  recipeId: string;
  currentVersion?: number;
  onVersionSelect: (versionNumber: number) => void;
  className?: string;
}

export function VersionNavigator({
  recipeId,
  currentVersion,
  onVersionSelect,
  className
}: VersionNavigatorProps) {
  const [versions, setVersions] = useState<RecipeVersion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVersions();
  }, [recipeId]);

  const loadVersions = async () => {
    try {
      setLoading(true);
      // ONLY version data - no ratings, no analytics
      const versionData = await versioningApi.getRecipeVersions(recipeId);
      setVersions(versionData);
    } catch (error) {
      console.error('Failed to load versions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className={className}>Loading versions...</div>;
  }

  if (versions.length === 0) {
    return (
      <div className={className}>
        <p>Only one version exists for this recipe.</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <h3>Recipe Versions</h3>
      <div className="space-y-3">
        {versions.map(version => (
          <VersionCard
            key={version.id}
            version={version}
            isSelected={version.version_number === currentVersion}
            onSelect={() => onVersionSelect(version.version_number)}
          />
        ))}
      </div>
    </div>
  );
}

// Supporting component
function VersionCard({ version, isSelected, onSelect }: {
  version: RecipeVersion;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
        isSelected
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/50'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center gap-2 mb-2">
        <Badge variant={isSelected ? 'default' : 'secondary'}>
          v{version.version_number}
        </Badge>
        {version.version_name && (
          <span className="text-sm font-medium text-muted-foreground">
            {version.version_name}
          </span>
        )}
      </div>

      {version.changelog && (
        <div className="text-sm text-muted-foreground">
          <strong>Changes:</strong> {version.changelog}
        </div>
      )}

      <div className="text-xs text-muted-foreground mt-2">
        Created {new Date(version.created_at).toLocaleDateString()}
      </div>
    </div>
  );
}
```

#### **RatingDisplay Component (Pure Ratings)**

```typescript
// src/components/recipes/rating-display.tsx
interface RatingDisplayProps {
  recipeId: string;
  versionNumber?: number;
  showAggregateRating?: boolean;
  allowRating?: boolean;
  className?: string;
}

export function RatingDisplay({
  recipeId,
  versionNumber,
  showAggregateRating = false,
  allowRating = true,
  className
}: RatingDisplayProps) {
  const [ratingData, setRatingData] = useState<RatingData | null>(null);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRatingData();
  }, [recipeId, versionNumber, showAggregateRating]);

  const loadRatingData = async () => {
    try {
      setLoading(true);

      let data: RatingData;
      if (showAggregateRating) {
        data = await ratingApi.getAggregateRating(recipeId);
      } else if (versionNumber) {
        data = await ratingApi.getVersionRating(recipeId, versionNumber);
      } else {
        data = await ratingApi.getRecipeRating(recipeId);
      }

      setRatingData(data);

      // Load user's rating if authenticated
      const user = await supabase.auth.getUser();
      if (user.data.user) {
        const userRatingData = await ratingApi.getUserRating(recipeId, versionNumber);
        setUserRating(userRatingData?.rating || null);
      }
    } catch (error) {
      console.error('Failed to load rating data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRating = async (rating: number) => {
    try {
      await ratingApi.submitRating(recipeId, versionNumber, rating);
      setUserRating(rating);
      await loadRatingData(); // Refresh data
    } catch (error) {
      console.error('Failed to submit rating:', error);
    }
  };

  if (loading) {
    return <div className={className}>Loading ratings...</div>;
  }

  return (
    <div className={className}>
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold mb-2">
            {showAggregateRating ? 'Overall Rating' : `Version ${versionNumber || 'Current'} Rating`}
          </h4>
          <StarRating
            rating={ratingData?.average || 0}
            count={ratingData?.count || 0}
            size="md"
          />
        </div>

        {allowRating && (
          <div>
            <h5 className="font-medium mb-2">Your Rating</h5>
            <InteractiveStarRating
              rating={userRating || 0}
              onRate={handleRating}
            />
          </div>
        )}

        {ratingData?.distribution && (
          <div>
            <h5 className="font-medium mb-2">Rating Distribution</h5>
            <RatingDistribution distribution={ratingData.distribution} />
          </div>
        )}
      </div>
    </div>
  );
}
```

#### **AnalyticsPanel Component (Pure Analytics)**

```typescript
// src/components/recipes/analytics-panel.tsx
interface AnalyticsPanelProps {
  recipeId: string;
  versionNumber?: number;
  showDetailedAnalytics?: boolean;
  className?: string;
}

export function AnalyticsPanel({
  recipeId,
  versionNumber,
  showDetailedAnalytics = false,
  className
}: AnalyticsPanelProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
    trackView(); // Track this view
  }, [recipeId, versionNumber]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await analyticsApi.getRecipeAnalytics(recipeId, versionNumber);
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const trackView = async () => {
    try {
      await analyticsApi.trackRecipeView(recipeId, versionNumber);
    } catch (error) {
      console.error('Failed to track view:', error);
    }
  };

  if (loading) {
    return <div className={className}>Loading analytics...</div>;
  }

  return (
    <div className={className}>
      <h4 className="font-semibold mb-4">Analytics</h4>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {analytics?.views || 0}
          </div>
          <div className="text-sm text-muted-foreground">Views</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {analytics?.uniqueUsers || 0}
          </div>
          <div className="text-sm text-muted-foreground">Unique Users</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {analytics?.engagementRate.toFixed(1) || 0}%
          </div>
          <div className="text-sm text-muted-foreground">Engagement</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">
            {analytics?.lastViewed ? new Date(analytics.lastViewed).toLocaleDateString() : 'Never'}
          </div>
          <div className="text-sm text-muted-foreground">Last Viewed</div>
        </div>
      </div>

      {showDetailedAnalytics && analytics && (
        <div className="mt-6">
          <h5 className="font-medium mb-3">Detailed Analytics</h5>
          <AnalyticsChart data={analytics} />
        </div>
      )}
    </div>
  );
}
```

### **1.2: Create Composed Dashboard**

#### **RecipeAnalyticsDashboard (Orchestrator)**

```typescript
// src/components/recipes/recipe-analytics-dashboard.tsx
interface RecipeAnalyticsDashboardProps {
  recipeId: string;
  currentVersion?: number;
  onVersionChange: (versionNumber: number) => void;
  className?: string;
}

export function RecipeAnalyticsDashboard({
  recipeId,
  currentVersion,
  onVersionChange,
  className
}: RecipeAnalyticsDashboardProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Version Navigation - Independent System */}
      <VersionNavigator
        recipeId={recipeId}
        currentVersion={currentVersion}
        onVersionSelect={onVersionChange}
      />

      {/* Dual Rating Display - Independent Systems */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RatingDisplay
          recipeId={recipeId}
          versionNumber={currentVersion}
          className="border-blue-200 bg-blue-50/50 p-6 rounded-lg"
        />
        <RatingDisplay
          recipeId={recipeId}
          showAggregateRating={true}
          allowRating={false}
          className="border-green-200 bg-green-50/50 p-6 rounded-lg"
        />
      </div>

      {/* Analytics Panel - Independent System */}
      <AnalyticsPanel
        recipeId={recipeId}
        versionNumber={currentVersion}
        showDetailedAnalytics={true}
      />
    </div>
  );
}
```

### **1.3: Update RecipeViewPage**

```typescript
// Update src/pages/recipe-view-page.tsx to use separated components
export function RecipeViewPage() {
  // ... existing code ...

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-teal-50 p-4">
      <div className="mx-auto max-w-4xl">
        {/* ... existing recipe display ... */}

        {/* REPLACE DualRatingDisplay with separated dashboard */}
        {recipe && (
          <RecipeAnalyticsDashboard
            recipeId={id!}
            currentVersion={requestedVersion || undefined}
            onVersionChange={(versionNumber) => {
              navigate(`/recipe/${id}?version=${versionNumber}`);
            }}
            className="mt-8"
          />
        )}

        {/* ... rest of component ... */}
      </div>
    </div>
  );
}
```

---

## 📋 **Phase 2: Database Schema Separation (Week 1-2)**

### **2.1: Create Domain-Specific Tables**

```sql
-- Migration: 20250918000001_separate_rating_analytics_domains.sql

-- Rating Domain Tables
CREATE TABLE recipe_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  version_number INTEGER, -- NULL = rating applies to current recipe
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- A user can rate each version once
  UNIQUE(recipe_id, version_number, user_id)
);

-- Creator ratings (separate from community ratings)
CREATE TABLE recipe_creator_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  version_number INTEGER, -- NULL = applies to current recipe
  creator_rating INTEGER CHECK (creator_rating >= 1 AND creator_rating <= 5),
  creator_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(recipe_id, version_number)
);

-- Analytics Domain Tables
CREATE TABLE recipe_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  version_number INTEGER, -- NULL = applies to current recipe
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'share', 'save', 'print', 'comment')),
  user_id UUID REFERENCES auth.users(id), -- NULL for anonymous events
  metadata JSONB DEFAULT '{}', -- Additional event data
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX idx_recipe_ratings_recipe_version ON recipe_ratings(recipe_id, version_number);
CREATE INDEX idx_recipe_ratings_user ON recipe_ratings(user_id);
CREATE INDEX idx_creator_ratings_recipe ON recipe_creator_ratings(recipe_id);
CREATE INDEX idx_recipe_analytics_recipe_event ON recipe_analytics(recipe_id, event_type);
CREATE INDEX idx_recipe_analytics_created_at ON recipe_analytics(created_at);
CREATE INDEX idx_recipe_analytics_user ON recipe_analytics(user_id) WHERE user_id IS NOT NULL;

-- Enable RLS on new tables
ALTER TABLE recipe_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_creator_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ratings
CREATE POLICY "Users can view ratings for accessible recipes" ON recipe_ratings
  FOR SELECT USING (
    recipe_id IN (
      SELECT id FROM recipes
      WHERE user_id = auth.uid() OR is_public = true
    )
  );

CREATE POLICY "Users can rate accessible recipes" ON recipe_ratings
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND recipe_id IN (
      SELECT id FROM recipes
      WHERE user_id = auth.uid() OR is_public = true
    )
  );

-- RLS Policies for creator ratings
CREATE POLICY "Only creators can manage creator ratings" ON recipe_creator_ratings
  FOR ALL USING (
    recipe_id IN (
      SELECT id FROM recipes WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for analytics
CREATE POLICY "Analytics are viewable by recipe owners" ON recipe_analytics
  FOR SELECT USING (
    recipe_id IN (
      SELECT id FROM recipes WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can create analytics events" ON recipe_analytics
  FOR INSERT WITH CHECK (true); -- Analytics tracking should be unrestricted
```

### **2.2: Migrate Existing Data**

```sql
-- Migration: 20250918000002_migrate_rating_data.sql

-- Migrate creator ratings from recipe_content_versions to separate table
INSERT INTO recipe_creator_ratings (recipe_id, version_number, creator_rating, created_at)
SELECT
  recipe_id,
  version_number,
  creator_rating,
  created_at
FROM recipe_content_versions
WHERE creator_rating IS NOT NULL;

-- Remove creator_rating from version table (clean domain separation)
ALTER TABLE recipe_content_versions DROP COLUMN creator_rating;

-- If recipes table has creator_rating, migrate it too
INSERT INTO recipe_creator_ratings (recipe_id, creator_rating, created_at)
SELECT
  id as recipe_id,
  creator_rating,
  created_at
FROM recipes
WHERE creator_rating IS NOT NULL
ON CONFLICT (recipe_id, version_number) DO NOTHING; -- Handle duplicates

-- Remove creator_rating from recipes table
ALTER TABLE recipes DROP COLUMN IF EXISTS creator_rating;
```

---

## 📋 **Phase 3: API Separation (Week 2)**

### **3.1: Create Domain-Specific APIs**

#### **Rating API (src/lib/api/features/rating-api.ts)**

```typescript
export const ratingApi = {
  async getRecipeRating(recipeId: string): Promise<RatingData> {
    const { data, error } = await supabase
      .from('recipe_ratings')
      .select('rating, comment, created_at, user_id')
      .eq('recipe_id', recipeId)
      .is('version_number', null);

    if (error) throw error;
    return this.aggregateRatings(data);
  },

  async getVersionRating(
    recipeId: string,
    versionNumber: number
  ): Promise<RatingData> {
    const { data, error } = await supabase
      .from('recipe_ratings')
      .select('rating, comment, created_at, user_id')
      .eq('recipe_id', recipeId)
      .eq('version_number', versionNumber);

    if (error) throw error;
    return this.aggregateRatings(data);
  },

  async getAggregateRating(recipeId: string): Promise<RatingData> {
    const { data, error } = await supabase
      .from('recipe_ratings')
      .select('rating, comment, created_at, user_id')
      .eq('recipe_id', recipeId);

    if (error) throw error;
    return this.aggregateRatings(data);
  },

  async submitRating(
    recipeId: string,
    versionNumber: number | null,
    rating: number,
    comment?: string
  ): Promise<void> {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) throw new Error('User must be authenticated to rate');

    const { error } = await supabase.from('recipe_ratings').upsert({
      recipe_id: recipeId,
      version_number: versionNumber,
      user_id: userId,
      rating,
      comment,
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;
  },

  async getUserRating(
    recipeId: string,
    versionNumber?: number
  ): Promise<{ rating: number } | null> {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return null;

    const { data, error } = await supabase
      .from('recipe_ratings')
      .select('rating')
      .eq('recipe_id', recipeId)
      .eq('version_number', versionNumber || null)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  aggregateRatings(ratings: any[]): RatingData {
    if (ratings.length === 0) {
      return { average: 0, count: 0, distribution: [0, 0, 0, 0, 0] };
    }

    const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
    const average = sum / ratings.length;
    const distribution = [1, 2, 3, 4, 5].map(
      (star) => ratings.filter((r) => r.rating === star).length
    );

    return { average, count: ratings.length, distribution };
  },
};
```

#### **Analytics API (src/lib/api/features/analytics-api.ts)**

```typescript
export const analyticsApi = {
  async trackRecipeView(
    recipeId: string,
    versionNumber?: number
  ): Promise<void> {
    const userId = (await supabase.auth.getUser()).data.user?.id;

    const { error } = await supabase.from('recipe_analytics').insert({
      recipe_id: recipeId,
      version_number: versionNumber,
      event_type: 'view',
      user_id: userId,
      metadata: {
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        referrer: document.referrer,
      },
    });

    // Ignore duplicate entries (same user viewing same recipe/version)
    if (error && error.code !== '23505') {
      throw error;
    }
  },

  async getRecipeAnalytics(
    recipeId: string,
    versionNumber?: number
  ): Promise<AnalyticsData> {
    const { data, error } = await supabase
      .from('recipe_analytics')
      .select('event_type, created_at, user_id')
      .eq('recipe_id', recipeId)
      .eq('version_number', versionNumber || null);

    if (error) throw error;
    return this.aggregateAnalytics(data);
  },

  aggregateAnalytics(events: any[]): AnalyticsData {
    const views = events.filter((e) => e.event_type === 'view').length;
    const uniqueUsers = new Set(
      events.filter((e) => e.user_id).map((e) => e.user_id)
    ).size;
    const engagementRate = uniqueUsers > 0 ? (views / uniqueUsers) * 100 : 0;

    return {
      views,
      uniqueUsers,
      engagementRate,
      lastViewed: events.length > 0 ? events[0].created_at : null,
    };
  },
};
```

### **3.2: Update Main API Index**

```typescript
// src/lib/api/index.ts - Export separated APIs
export { versioningApi } from './features/versioning-api';
export { ratingApi } from './features/rating-api';
export { analyticsApi } from './features/analytics-api';
export { creatorRatingApi } from './features/creator-rating-api';

// Maintain backward compatibility temporarily
export const recipeApi = {
  // ... existing recipe CRUD methods ...

  // Deprecated: Use versioningApi directly
  getRecipeVersions: versioningApi.getRecipeVersions,
  createVersion: versioningApi.createVersion,

  // Deprecated: Use ratingApi directly
  submitRating: ratingApi.submitRating,

  // Deprecated: Use analyticsApi directly
  trackView: analyticsApi.trackRecipeView,
};
```

---

## 📋 **Phase 4: Testing & Validation (Week 2-3)**

### **4.1: Component Testing**

```typescript
// tests/components/version-navigator.test.tsx
describe('VersionNavigator', () => {
  test('displays versions correctly', async () => {
    const mockVersions = [
      { id: '1', version_number: 2, version_name: 'Latest' },
      { id: '2', version_number: 1, version_name: 'Original' }
    ];

    jest.spyOn(versioningApi, 'getRecipeVersions').mockResolvedValue(mockVersions);

    render(
      <VersionNavigator
        recipeId="recipe-123"
        currentVersion={2}
        onVersionSelect={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Latest')).toBeInTheDocument();
      expect(screen.getByText('Original')).toBeInTheDocument();
    });
  });

  test('handles version selection', async () => {
    const onVersionSelect = jest.fn();

    render(
      <VersionNavigator
        recipeId="recipe-123"
        onVersionSelect={onVersionSelect}
      />
    );

    await waitFor(() => {
      fireEvent.click(screen.getByText('v1'));
    });

    expect(onVersionSelect).toHaveBeenCalledWith(1);
  });
});
```

### **4.2: API Testing**

```typescript
// tests/api/rating-api.test.ts
describe('RatingAPI', () => {
  test('aggregates ratings correctly', async () => {
    const mockRatings = [
      { rating: 5, user_id: 'user1' },
      { rating: 4, user_id: 'user2' },
      { rating: 5, user_id: 'user3' },
    ];

    jest.spyOn(supabase, 'from').mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      is: jest.fn().mockResolvedValue({ data: mockRatings, error: null }),
    });

    const result = await ratingApi.getRecipeRating('recipe-123');

    expect(result).toEqual({
      average: 4.67,
      count: 3,
      distribution: [0, 0, 0, 1, 2], // [1-star, 2-star, 3-star, 4-star, 5-star]
    });
  });
});
```

### **4.3: Integration Testing**

```typescript
// tests/integration/separated-systems.test.tsx
describe('Separated Systems Integration', () => {
  test('systems work independently', async () => {
    // Test that version changes don't affect ratings
    const { rerender } = render(
      <RecipeAnalyticsDashboard
        recipeId="recipe-123"
        currentVersion={1}
        onVersionChange={jest.fn()}
      />
    );

    // Change version
    rerender(
      <RecipeAnalyticsDashboard
        recipeId="recipe-123"
        currentVersion={2}
        onVersionChange={jest.fn()}
      />
    );

    // Verify rating system still works independently
    expect(screen.getByText(/rating/i)).toBeInTheDocument();
    expect(screen.getByText(/analytics/i)).toBeInTheDocument();
  });
});
```

---

## 📋 **Phase 5: Cleanup & Optimization (Week 3)**

### **5.1: Remove Deprecated Code**

```bash
# Remove the monolithic component
rm src/components/recipes/dual-rating-display.tsx

# Remove deprecated API methods
# Update src/lib/api/index.ts to remove backward compatibility
```

### **5.2: Type System Updates**

```typescript
// src/lib/types.ts - Clean separated types

// Versioning Domain Types
export interface RecipeVersion {
  id: string;
  recipe_id: string;
  version_number: number;
  version_name: string | null;
  changelog: string | null;
  title: string;
  ingredients: string[];
  instructions: string;
  notes: string | null;
  setup: string[];
  categories: string[];
  cooking_time: string | null;
  difficulty: string | null;
  image_url: string | null;
  created_at: string;
  created_by: string;
  is_published: boolean;
}

// Rating Domain Types
export interface RatingData {
  average: number;
  count: number;
  distribution: number[]; // [1-star, 2-star, 3-star, 4-star, 5-star]
}

export interface UserRating {
  rating: number;
  comment?: string;
  created_at: string;
}

// Analytics Domain Types
export interface AnalyticsData {
  views: number;
  uniqueUsers: number;
  engagementRate: number;
  lastViewed: string | null;
}

// Remove deprecated types
// ❌ VersionStats - was artificial coupling
// ❌ AggregateStats - was artificial coupling
// ❌ VersionWithStats - was artificial coupling
```

---

## 📊 **Success Metrics**

### **Technical Metrics**

- [ ] **Component Size**: Each component < 100 lines
- [ ] **Single Responsibility**: Each component manages only one domain
- [ ] **Zero Artificial Data**: No fake/empty data in any component
- [ ] **Independent Systems**: Can modify one system without affecting others
- [ ] **Performance**: 50% reduction in unnecessary API calls

### **Bug Resolution Metrics**

- [ ] **Navigation Fixed**: Zero `/recipe/undefined` errors
- [ ] **Data Consistency**: No artificial rating stats
- [ ] **Component Isolation**: Changes to rating don't affect versioning
- [ ] **Clean State Management**: Each component manages < 3 state variables

### **Maintainability Metrics**

- [ ] **Team Productivity**: Different developers can work on different systems
- [ ] **Testing**: 100% test coverage for each separated component
- [ ] **Documentation**: Clear API documentation for each domain
- [ ] **Type Safety**: Strong TypeScript typing for each domain

---

## 🎯 **Migration Timeline**

### **Week 1: Component Separation**

- **Day 1-2**: Create VersionNavigator, RatingDisplay, AnalyticsPanel
- **Day 3-4**: Create RecipeAnalyticsDashboard orchestrator
- **Day 5**: Update RecipeViewPage to use new components
- **Day 6-7**: Testing and bug fixes

### **Week 2: Database & API Separation**

- **Day 1-2**: Create separated database tables
- **Day 3-4**: Migrate existing data
- **Day 5-7**: Create separated APIs and test integration

### **Week 3: Cleanup & Optimization**

- **Day 1-2**: Remove deprecated DualRatingDisplay
- **Day 3-4**: Clean up API exports and type definitions
- **Day 5-7**: Performance optimization and final testing

---

**This separation plan will eliminate the root cause of the versioning system problems by creating clean, focused components that follow the Single Responsibility Principle and can evolve independently.**
