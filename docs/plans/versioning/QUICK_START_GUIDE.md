# Recipe Versioning Quick Start Guide
## Immediate Implementation Steps

### 🚀 **TL;DR - Fix the Problem Now**

The current versioning system shows duplicate recipes because it treats versions as separate recipe entities. This guide provides the fastest path to fix the core issue while maintaining data integrity.

**Current Problem:**
```
My Recipes:
❌ Zucchini Noodles with Pesto (v1)
❌ Zucchini Noodles with Pesto (v2) 
❌ Zucchini Noodles with Pesto (v3)
```

**Target Result:**
```
My Recipes:
✅ Zucchini Noodles with Pesto
    └── [Version Selector: v3 | v2 | v1]
```

---

## ⚡ **Option A: Quick Frontend Fix (2 hours)**
*Recommended for immediate deployment*

### **Problem Analysis**
The issue is in `src/pages/recipe-view-page.tsx` around line 235. The system automatically loads version content even when no version is requested, causing URLs like `/recipe/ID` to show version content instead of original recipe content.

```typescript
// CURRENT BROKEN CODE:
if (!requestedVersion && versionsData && versionsData.length > 0) {
  const latestVersion = versionsData[0];
  setVersionContent(latestVersion); // ← THIS CAUSES THE PROBLEM
}
```

### **Step 1: Fix Display Logic (30 minutes)**

**Edit `src/pages/recipe-view-page.tsx`:**

Find this code around line 235:
```typescript
// If no specific version requested, automatically load the latest version content
if (!requestedVersion && versionsData && versionsData.length > 0) {
  const latestVersion = versionsData[0]; // Versions are ordered newest first
  console.log(`🔄 Auto-loading latest version: ${latestVersion.version_number}`);
  setVersionContent(latestVersion);
}
```

Replace it with:
```typescript
// FIXED: Only load version content when explicitly requested via URL parameter
if (requestedVersion && versionsData && versionsData.length > 0) {
  const requestedVersionData = versionsData.find(v => v.version_number === requestedVersion);
  if (requestedVersionData) {
    console.log(`🔄 Loading requested version: ${requestedVersion}`);
    setVersionContent(requestedVersionData);
  }
}
```

### **Step 2: Test the Fix (15 minutes)**

```bash
# Start the dev server
npm run dev

# Test the URLs:
# 1. http://localhost:5174/recipe/11111111-1111-1111-1111-111111111120
#    Should show ORIGINAL recipe content
# 2. http://localhost:5174/recipe/11111111-1111-1111-1111-111111111120?version=1
#    Should show VERSION 1 content
```

### **Step 3: Deploy (15 minutes)**

```bash
# Test build
npm run build

# Deploy to production
vercel deploy --prod
```

**Expected Result:**
- ✅ `/recipe/ID` shows original recipe content
- ✅ `/recipe/ID?version=X` shows version X content
- ✅ No duplicate recipes in recipe list
- ✅ Version selector still works

---

## 🔧 **Option B: Complete Database Refactor (2-3 weeks)**
*Recommended for long-term production stability*

### **Why This Is Better**
- Eliminates duplicate recipes at the database level
- Uses proper temporal versioning pattern
- Leverages Supabase built-in tools
- Production-ready with audit trails

### **Quick Implementation Steps**

#### **Phase 1: Create New Schema (Day 1)**
```sql
-- Create the new versioning table
CREATE TABLE recipe_content_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  version_name TEXT,
  changelog TEXT,
  
  -- Full recipe content snapshot
  title TEXT NOT NULL,
  ingredients TEXT[] NOT NULL,
  instructions TEXT NOT NULL,
  notes TEXT,
  setup TEXT[] DEFAULT '{}',
  categories TEXT[] DEFAULT '{}',
  cooking_time TEXT,
  difficulty TEXT,
  creator_rating INTEGER,
  image_url TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  is_published BOOLEAN DEFAULT false,
  
  UNIQUE(recipe_id, version_number)
);
```

#### **Phase 2: Migrate Data (Day 2)**
```sql
-- Migrate existing version data to new table
WITH recipe_families AS (
  SELECT id as original_id, title, ingredients, instructions, notes, setup, categories,
         cooking_time, difficulty, creator_rating, image_url, user_id, created_at
  FROM recipes WHERE parent_recipe_id IS NULL
),
version_data AS (
  SELECT rf.original_id as recipe_id,
         COALESCE(r.version_number, 1) as version_number,
         rv.version_name, rv.changelog,
         r.title, r.ingredients, r.instructions, r.notes, r.setup, r.categories,
         r.cooking_time, r.difficulty, r.creator_rating, r.image_url,
         r.user_id as created_by, r.created_at,
         (r.version_number = (SELECT MAX(r2.version_number) FROM recipes r2 
                              WHERE COALESCE(r2.parent_recipe_id, r2.id) = rf.original_id)) as is_latest
  FROM recipe_families rf
  LEFT JOIN recipes r ON (r.id = rf.original_id OR find_original_recipe_id(r.id) = rf.original_id)
  LEFT JOIN recipe_versions rv ON rv.version_recipe_id = r.id
)
INSERT INTO recipe_content_versions (
  recipe_id, version_number, version_name, changelog,
  title, ingredients, instructions, notes, setup, categories,
  cooking_time, difficulty, creator_rating, image_url,
  created_by, created_at, is_published
)
SELECT recipe_id, version_number, version_name, changelog,
       title, ingredients, instructions, notes, setup, categories,
       cooking_time, difficulty, creator_rating, image_url,
       created_by, created_at, is_latest
FROM version_data;
```

#### **Phase 3: Clean Up (Day 3)**
```sql
-- Remove duplicate recipes (keep only originals)
DELETE FROM recipes WHERE parent_recipe_id IS NOT NULL;

-- Add current version tracking
ALTER TABLE recipes ADD COLUMN current_version_id UUID REFERENCES recipe_content_versions(id);

-- Update recipes to point to latest versions
UPDATE recipes r SET current_version_id = v.id
FROM recipe_content_versions v
WHERE v.recipe_id = r.id AND v.is_published = true;
```

#### **Phase 4: Update API (Day 4-7)**
Create new clean API methods:
```typescript
// src/lib/api/features/clean-versioning-api.ts
export const cleanVersioningApi = {
  async getRecipeVersions(recipeId: string): Promise<RecipeVersion[]> {
    const { data, error } = await supabase
      .from('recipe_content_versions')
      .select('*')
      .eq('recipe_id', recipeId)
      .order('version_number', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },
  
  async createVersion(recipeId: string, versionData: CreateVersionData): Promise<RecipeVersion> {
    // Implementation here
  }
};
```

#### **Phase 5: Update Frontend (Day 8-10)**
- Update components to use new API
- Remove duplicate recipe logic
- Add version publishing UI

**For detailed implementation, see:**
- `docs/plans/versioning/PRODUCTION_READY_VERSIONING_PLAN.md`
- `docs/plans/versioning/IMPLEMENTATION_ROADMAP.md`

---

## 🧪 **Testing Your Fix**

### **Manual Testing Checklist**

#### **Option A Testing (Frontend Fix)**
- [ ] Navigate to `/recipe/ID` - shows original content
- [ ] Navigate to `/recipe/ID?version=1` - shows version 1 content
- [ ] Recipe list shows only one entry per recipe
- [ ] Version selector still works
- [ ] Creating new versions works
- [ ] No JavaScript errors in console

#### **Option B Testing (Database Refactor)**
- [ ] All Option A tests pass
- [ ] Database has no duplicate recipes
- [ ] Version creation uses new schema
- [ ] Audit trail is populated
- [ ] Performance is acceptable
- [ ] RLS policies work correctly

### **Automated Testing**
```bash
# Run existing tests
npm test

# Run E2E tests
npm run test:e2e

# Check for TypeScript errors
npm run type-check
```

---

## 🚨 **Emergency Rollback**

### **Option A Rollback (Frontend Fix)**
If the frontend fix causes issues, simply revert the change:

```typescript
// Restore original code in recipe-view-page.tsx
if (!requestedVersion && versionsData && versionsData.length > 0) {
  const latestVersion = versionsData[0];
  console.log(`🔄 Auto-loading latest version: ${latestVersion.version_number}`);
  setVersionContent(latestVersion);
}
```

### **Option B Rollback (Database Refactor)**
```bash
# Restore from backup
npx supabase db reset --project-ref YOUR_PROJECT_REF
psql -h YOUR_HOST -p 5432 -U postgres -d postgres < backup_pre_migration.sql
```

---

## 🎯 **Success Criteria**

### **Immediate Success (Option A)**
- [ ] Recipe list shows one entry per recipe (no duplicates)
- [ ] Original recipe content displays by default
- [ ] Version content displays only when requested via URL
- [ ] All existing functionality still works
- [ ] No performance degradation

### **Long-term Success (Option B)**
- [ ] All Option A criteria met
- [ ] Database schema is clean and maintainable
- [ ] Audit trail tracks all changes
- [ ] System scales to thousands of versions
- [ ] Real-time updates work correctly

---

## 📞 **Need Help?**

### **Common Issues**

**Issue**: "Recipe not found" errors after fix
**Solution**: Check that `baseRecipe` is not null and route parameters are valid

**Issue**: Version selector doesn't show versions
**Solution**: Verify `versions` state is populated and API calls are working

**Issue**: TypeScript errors after changes
**Solution**: Update type definitions in `src/lib/types.ts`

### **Debug Commands**
```bash
# Check current recipe data
curl "http://localhost:54321/rest/v1/recipes?id=eq.RECIPE_ID" \
  -H "apikey: YOUR_ANON_KEY"

# Check version data
curl "http://localhost:54321/rest/v1/recipe_content_versions?recipe_id=eq.RECIPE_ID" \
  -H "apikey: YOUR_ANON_KEY"

# Check browser console for errors
# Open DevTools → Console tab
```

### **Contact**
- **Slack**: #versioning-help
- **Email**: dev-team@company.com
- **Documentation**: `docs/plans/versioning/`

---

**Choose your path:**
- **Need it fixed NOW?** → Go with Option A (2 hours)
- **Want it done RIGHT?** → Go with Option B (2-3 weeks)
- **Not sure?** → Start with Option A, plan Option B for later