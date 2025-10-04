# Recipe Image Gallery System

**Status:** 🟡 Planning (Blueprint Ready)  
**Priority:** P2 Medium  
**Type:** Feature Enhancement  
**Estimated Effort:** M (2-3 days)  
**Created:** 2025-10-07  
**Last Updated:** 2025-10-07

## Problem Statement

### What is the issue?

Current recipe system only supports a single primary image per recipe. Users need:

- Multiple images per recipe (progress photos, final result, variations)
- Image metadata (captions, alt text)
- AI-generated images alongside user uploads
- Primary image selection
- Image gallery display

### How does it manifest?

- Users can only upload one image per recipe
- No way to show cooking process visually
- AI-generated images replace manual uploads
- No image management UI
- Accessibility suffers (no alt text)

### When was it discovered?

- User feature request
- Attempted implementation in `feature/debug-production-csp-errors` branch
- Commit `66ed6ca` created components but had type issues

### Impact Assessment

- **Users Affected:** All users creating/viewing recipes
- **Severity:** Medium (feature enhancement, not critical bug)
- **Workaround Available:** Yes - users can use external image hosting and paste URLs

## Root Cause Analysis

### Why does this limitation exist?

1. **Database Schema Design**
   - Original schema: `recipes.image_url` (single string)
   - Simple, but not extensible

2. **UI Design**
   - Recipe form designed for single image
   - Recipe view expects single image
   - No gallery component built

3. **AI Image Integration**
   - AI generation produces one image
   - No concept of image collection

### Contributing Factors

- MVP focused on core functionality
- Image handling added as afterthought
- No multi-image requirement initially
- Schema evolution not planned

## Work Done in Original Branch

### Components Created (Need Cleanup)

**1. recipe-image-gallery.tsx** (428 lines)

- Gallery display component
- Image carousel/grid
- Metadata overlay
- Primary image indicator

**Issues:**

- Type safety problems
- Not integrated with forms
- Missing error boundaries

**2. recipe-image-manager.tsx** (490 lines)

- Upload interface
- Drag and drop
- Image metadata editing
- Primary image selection
- AI generation integration

**Issues:**

- `Record<string, any>` types (fixed to `Record<string, unknown>` then to proper type)
- Not fully tested
- Large component (could be split)

**3. use-recipe-images.ts** (185 lines)

- React Query hooks for image operations
- Optimistic updates
- Cache management

**Issues:**

- Type exports missing
- Error handling incomplete
- No loading states

### API Layer Created (In rating-api.ts)

**image-gallery-api.ts** (180 lines)

```typescript
export const imageGalleryApi = {
  async getRecipeImages(recipeId: string): Promise<RecipeImage[]>
  async addRecipeImage(imageData: Omit<RecipeImage, 'id' | 'created_at' | 'updated_at'>): Promise<RecipeImage>
  async updateRecipeImage(imageId: string, updates: Partial<RecipeImage>): Promise<void>
  async deleteRecipeImage(imageId: string): Promise<void>
  async setPrimaryImage(recipeId: string, imageId: string): Promise<void>
}
```

**Issues:**

- Type definitions incomplete
- Error handling inconsistent
- No transaction support

## Proposed Solution (Improved Implementation)

### High-Level Approach

Build image gallery system incrementally on stable API foundation:

1. **Database Schema** (if not exists)
2. **API Layer** (types-first approach)
3. **React Hooks** (data management)
4. **UI Components** (presentation layer)
5. **Integration** (connect to forms and views)

### Technical Details

#### Database Schema Required

```sql
-- Check if recipe_images table exists
-- If not, create migration

CREATE TABLE IF NOT EXISTS recipe_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  alt_text TEXT,
  is_primary BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  uploaded_by UUID REFERENCES auth.users(id),
  generation_method TEXT CHECK (generation_method IN ('manual', 'ai_generated', 'imported')),
  generation_cost_id UUID REFERENCES ai_generation_costs(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_primary_per_recipe UNIQUE(recipe_id, is_primary) WHERE is_primary = true
);

-- Indexes
CREATE INDEX idx_recipe_images_recipe_id ON recipe_images(recipe_id);
CREATE INDEX idx_recipe_images_primary ON recipe_images(recipe_id, is_primary) WHERE is_primary = true;

-- RLS Policies
ALTER TABLE recipe_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view images for recipes they can view"
  ON recipe_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_images.recipe_id
      AND (recipes.is_public = true OR recipes.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can manage images for their recipes"
  ON recipe_images FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_images.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );
```

#### Type Definitions (Define First!)

```typescript
// src/lib/types/image-gallery.ts

export interface RecipeImage {
  id: string;
  recipe_id: string;
  image_url: string;
  caption?: string | null;
  alt_text?: string | null;
  is_primary: boolean;
  display_order: number;
  uploaded_by?: string | null;
  generation_method: 'manual' | 'ai_generated' | 'imported';
  generation_cost_id?: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ImageWithMetadata {
  id: string;
  file?: File;
  preview: string;
  image_url?: string;
  caption: string;
  alt_text: string;
  is_primary: boolean;
  is_new: boolean;
  is_ai_generated?: boolean;
}

export interface ImageUploadResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}
```

#### API Layer (Clean Implementation)

```typescript
// src/lib/api/features/image-gallery-api.ts

import { supabase } from '@/lib/supabase';
import { handleError } from '../shared/error-handling';
import type { RecipeImage } from '@/lib/types/image-gallery';

export const imageGalleryApi = {
  /**
   * Get all images for a recipe
   * @param recipeId - Recipe UUID
   * @returns Array of recipe images ordered by display_order
   */
  async getRecipeImages(recipeId: string): Promise<RecipeImage[]> {
    const { data, error } = await supabase
      .from('recipe_images')
      .select('*')
      .eq('recipe_id', recipeId)
      .order('display_order', { ascending: true });

    if (error) {
      handleError(error, 'Get recipe images');
      return [];
    }

    return data || [];
  },

  /**
   * Add a new image to a recipe
   * @param imageData - Image data without id/timestamps
   * @returns Created recipe image
   */
  async addRecipeImage(
    imageData: Omit<RecipeImage, 'id' | 'created_at' | 'updated_at'>
  ): Promise<RecipeImage> {
    const { data, error } = await supabase
      .from('recipe_images')
      .insert(imageData)
      .select()
      .single();

    if (error) throw new Error(`Failed to add image: ${error.message}`);
    return data;
  },

  /**
   * Update image metadata
   * @param imageId - Image UUID
   * @param updates - Partial image data to update
   */
  async updateRecipeImage(
    imageId: string,
    updates: Partial<
      Omit<RecipeImage, 'id' | 'recipe_id' | 'created_at' | 'updated_at'>
    >
  ): Promise<void> {
    const { error } = await supabase
      .from('recipe_images')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', imageId);

    if (error) throw new Error(`Failed to update image: ${error.message}`);
  },

  /**
   * Delete an image from a recipe
   * @param imageId - Image UUID
   */
  async deleteRecipeImage(imageId: string): Promise<void> {
    const { error } = await supabase
      .from('recipe_images')
      .delete()
      .eq('id', imageId);

    if (error) throw new Error(`Failed to delete image: ${error.message}`);
  },

  /**
   * Set an image as the primary image for a recipe
   * @param recipeId - Recipe UUID
   * @param imageId - Image UUID to set as primary
   */
  async setPrimaryImage(recipeId: string, imageId: string): Promise<void> {
    // This should be a database function to ensure atomicity
    const { error } = await supabase.rpc('set_primary_recipe_image', {
      p_recipe_id: recipeId,
      p_image_id: imageId,
    });

    if (error) throw new Error(`Failed to set primary image: ${error.message}`);
  },
};
```

#### Database Function (For Atomic Primary Image Update)

```sql
-- Create function to atomically update primary image
CREATE OR REPLACE FUNCTION set_primary_recipe_image(
  p_recipe_id UUID,
  p_image_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Remove primary flag from all images for this recipe
  UPDATE recipe_images
  SET is_primary = false
  WHERE recipe_id = p_recipe_id;

  -- Set new primary image
  UPDATE recipe_images
  SET is_primary = true
  WHERE id = p_image_id AND recipe_id = p_recipe_id;

  -- Verify the update worked
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Image % not found for recipe %', p_image_id, p_recipe_id;
  END IF;
END;
$$;
```

## Implementation Plan

### Prerequisites

- [ ] Database schema exists (check with Supabase MCP)
- [ ] API refactoring foundation complete (Phase 1)
- [ ] Image upload utilities stable
- [ ] Type system established

### Steps

#### Phase 1: Database & Types (Day 1)

1. **Verify/Create Database Schema**
   - Check if `recipe_images` table exists
   - Create migration if needed
   - Add RLS policies
   - Create helper functions

2. **Define Type System**
   - Create `src/lib/types/image-gallery.ts`
   - Export all interfaces
   - Add JSDoc documentation

**Branch:** `feature/image-gallery-types-and-schema`  
**Files Changed:** 2-3 files, ~200 lines  
**Tests:** Schema validation, type exports

---

#### Phase 2: API Layer (Day 2)

1. **Implement API Module**
   - Create `src/lib/api/features/image-gallery-api.ts`
   - All methods fully typed
   - Error handling robust
   - Transaction support where needed

2. **Add API Tests**
   - Unit tests for each method
   - Error scenario coverage
   - Mock Supabase responses

**Branch:** `feature/image-gallery-api`  
**Files Changed:** 3-4 files, ~400 lines  
**Tests:** 90%+ coverage

---

#### Phase 3: React Hooks (Day 3)

1. **Create Custom Hooks**

   ```typescript
   // src/hooks/use-recipe-images.ts

   export function useRecipeImages(recipeId: string) {
     return useQuery({
       queryKey: ['recipe-images', recipeId],
       queryFn: () => imageGalleryApi.getRecipeImages(recipeId),
     });
   }

   export function useAddRecipeImage() {
     const queryClient = useQueryClient();
     return useMutation({
       mutationFn: imageGalleryApi.addRecipeImage,
       onSuccess: (data) => {
         queryClient.invalidateQueries(['recipe-images', data.recipe_id]);
       },
     });
   }

   // ... other hooks
   ```

2. **Add Hook Tests**
   - Test query behavior
   - Test mutation optimistic updates
   - Test error states

**Branch:** `feature/image-gallery-hooks`  
**Files Changed:** 2-3 files, ~250 lines  
**Tests:** 85%+ coverage

---

#### Phase 4: UI Components (Day 4-5)

1. **Create RecipeImageManager Component**
   - Upload interface (drag & drop)
   - Image preview grid
   - Metadata editing
   - Primary image selection
   - AI generation integration

2. **Create RecipeImageGallery Component**
   - Display multiple images
   - Carousel/lightbox view
   - Responsive design
   - Accessibility features

3. **Add Component Tests**
   - Rendering tests
   - Interaction tests
   - Accessibility tests

**Branch:** `feature/image-gallery-components`  
**Files Changed:** 4-6 files, ~800 lines  
**Tests:** 80%+ coverage

---

#### Phase 5: Integration (Day 6)

1. **Update Recipe Form**
   - Integrate RecipeImageManager
   - Handle multiple images in submission
   - Update validation

2. **Update Recipe View**
   - Integrate RecipeImageGallery
   - Display all images
   - Maintain single-image fallback

3. **Add E2E Tests**
   - Upload multiple images
   - Set primary image
   - View gallery
   - Delete images

**Branch:** `feature/image-gallery-integration`  
**Files Changed:** 3-5 files, ~300 lines  
**Tests:** E2E coverage

### Code Changes Summary

#### Files to Create

- `src/lib/types/image-gallery.ts` - Type definitions
- `src/lib/api/features/image-gallery-api.ts` - API layer
- `src/hooks/use-recipe-images.ts` - React hooks
- `src/components/recipes/recipe-image-manager.tsx` - Upload UI
- `src/components/recipes/recipe-image-gallery.tsx` - Display UI
- `src/__tests__/lib/api/features/image-gallery-api.test.ts` - API tests
- `src/__tests__/hooks/use-recipe-images.test.ts` - Hook tests
- `src/__tests__/components/recipes/recipe-image-gallery.test.tsx` - Component tests
- `tests/e2e/recipe-image-gallery.spec.ts` - E2E tests

#### Files to Modify

- `src/components/recipes/recipe-form.tsx` - Add image manager
- `src/components/recipes/recipe-view.tsx` - Add gallery display
- `src/lib/types.ts` - Import and re-export image gallery types

#### Database Migrations

- `supabase/migrations/YYYYMMDD_create_recipe_images_table.sql`
- `supabase/migrations/YYYYMMDD_add_recipe_image_functions.sql`

### Testing Strategy

#### Unit Tests

- [ ] API methods tested independently
- [ ] Hooks tested with mocked API
- [ ] Components tested with mocked hooks
- [ ] Error scenarios covered
- [ ] Edge cases handled

#### Integration Tests

- [ ] Upload flow end-to-end
- [ ] Primary image selection
- [ ] Image deletion with primary reassignment
- [ ] AI generation integration
- [ ] Metadata updates

#### E2E Tests

- [ ] User uploads multiple images
- [ ] User selects primary image
- [ ] User views gallery
- [ ] User edits image metadata
- [ ] User deletes images
- [ ] Recipe with no images (fallback)

## Lessons from Original Attempt

### What Worked ✅

1. **Component Architecture**
   - Separation of upload (manager) and display (gallery)
   - Good UX patterns (drag & drop, metadata editing)
   - AI integration considered

2. **Feature Completeness**
   - Comprehensive functionality
   - Edge cases considered
   - Accessibility included

### What Didn't Work ❌

1. **Built on Unstable Foundation**
   - API refactoring happening simultaneously
   - Type errors from other modules affected this
   - Couldn't test in isolation

2. **Type Safety Gaps**
   - `Record<string, any>` used extensively
   - Types not exported properly
   - Interfaces not shared between layers

3. **Bundled with Too Much**
   - Part of 18-file, 3,000-line change
   - Review impossible
   - Couldn't merge due to other issues

### Key Insights

1. **Build on Stable Base**
   - Wait for API refactoring to complete
   - Or build without depending on unreleased API changes

2. **Types Must Be Bulletproof**
   - Define before implementation
   - Export everything needed
   - Test type exports work

3. **Incremental Feature Development**
   - Schema first
   - API second
   - Hooks third
   - Components last
   - Each step independently reviewable

## Improved Implementation Strategy

### Layered Approach

```
┌─────────────────────────────────────┐
│  UI Layer (Components)              │
│  - RecipeImageGallery               │
│  - RecipeImageManager               │
└──────────┬──────────────────────────┘
           │ uses
┌──────────▼──────────────────────────┐
│  Hook Layer (React Query)           │
│  - useRecipeImages                  │
│  - useAddRecipeImage                │
│  - useUpdateRecipeImage             │
└──────────┬──────────────────────────┘
           │ uses
┌──────────▼──────────────────────────┐
│  API Layer (Business Logic)         │
│  - imageGalleryApi                  │
└──────────┬──────────────────────────┘
           │ uses
┌──────────▼──────────────────────────┐
│  Database Layer (Supabase)          │
│  - recipe_images table              │
│  - RLS policies                     │
│  - Helper functions                 │
└─────────────────────────────────────┘
```

**Build bottom-up, test each layer independently**

### Type Safety Checklist

For each layer:

**Database Layer:**

- [ ] Schema matches type definitions
- [ ] RLS policies tested
- [ ] Functions return expected types

**API Layer:**

- [ ] All parameters explicitly typed
- [ ] Return types explicit (no inference)
- [ ] Error types defined
- [ ] JSDoc complete

**Hook Layer:**

- [ ] Query/mutation types correct
- [ ] Data transformations typed
- [ ] Error states typed
- [ ] Loading states handled

**UI Layer:**

- [ ] Props interfaces complete
- [ ] Event handlers typed
- [ ] State types explicit
- [ ] Children types correct

## Success Criteria

### Functional Requirements

- [ ] Users can upload multiple images per recipe
- [ ] Users can select primary image
- [ ] Users can add captions and alt text
- [ ] Images display in gallery view
- [ ] AI-generated images integrate seamlessly
- [ ] Drag-and-drop upload works
- [ ] Image deletion works correctly
- [ ] Primary image auto-selected for single images

### Non-Functional Requirements

- [ ] Zero TypeScript errors
- [ ] 85%+ test coverage
- [ ] Lighthouse accessibility score > 90
- [ ] Page load time < 3s with 5 images
- [ ] Mobile responsive
- [ ] Works offline (with cached images)

### User Experience Requirements

- [ ] Intuitive upload interface
- [ ] Clear visual feedback
- [ ] Error messages helpful
- [ ] Loading states smooth
- [ ] Works on mobile devices
- [ ] Keyboard navigation supported

## Dependencies

### Blocked By

- Image upload utilities must be stable
- File processing must handle multiple images
- Supabase storage quotas considered

### Blocks

- Advanced recipe features (video, 3D images)
- Recipe sharing with image galleries
- Social features (image likes, comments)

### Related Work

- API Refactoring ([api-refactoring.md](./api-refactoring.md))
- CSP and Image Handling ([csp-and-image-handling.md](./csp-and-image-handling.md))

## Risks & Mitigation

| Risk                     | Probability | Impact | Mitigation                                       |
| ------------------------ | ----------- | ------ | ------------------------------------------------ |
| Storage costs increase   | High        | Medium | Image compression, quotas, monitoring            |
| Performance degradation  | Medium      | Medium | Lazy loading, pagination, CDN                    |
| Complex state management | Medium      | High   | Well-tested hooks, clear data flow               |
| Accessibility issues     | Medium      | Medium | ARIA labels, keyboard nav, screen reader testing |
| Mobile upload failures   | Medium      | High   | Progressive enhancement, better error handling   |
| Type errors compound     | Low         | High   | Test each layer independently                    |

## Extracting Work from Original Branch

### Files to Review and Salvage

1. **recipe-image-gallery.tsx** (428 lines)
   - **Salvage:** UI patterns, component structure
   - **Discard:** Type definitions (redo properly)
   - **Improve:** Split into smaller components

2. **recipe-image-manager.tsx** (490 lines)
   - **Salvage:** Upload logic, drag-and-drop
   - **Discard:** `Record<string, any>` types
   - **Improve:** Better error handling, smaller component

3. **use-recipe-images.ts** (185 lines)
   - **Salvage:** Hook patterns, React Query setup
   - **Discard:** Type issues
   - **Improve:** Optimistic updates, better caching

4. **image-gallery-api.ts** (180 lines)
   - **Salvage:** Method signatures, API structure
   - **Discard:** Type definitions (redo in types file first)
   - **Improve:** Error handling, transaction support

### How to Extract

**Don't Copy-Paste Directly!** Instead:

1. **Reference for Patterns**

   ```bash
   # Read the original file
   git show 66ed6ca:src/components/recipes/recipe-image-gallery.tsx > /tmp/original-gallery.tsx

   # Use as reference while writing clean version
   # Copy good patterns, fix issues as you go
   ```

2. **Extract Specific Functions**

   ```typescript
   // If a function is good, extract its logic:

   // From original (has type issues)
   const handleFileUpload = async (files: FileList) => {
     // ... good logic here ...
   };

   // To new (properly typed)
   const handleFileUpload = async (
     files: FileList
   ): Promise<ImageUploadResult[]> => {
     // ... same logic, better types ...
   };
   ```

3. **Learn from Mistakes**
   - Original used `Record<string, any>` → New uses `ImageWithMetadata`
   - Original had no tests → New has comprehensive tests
   - Original built on unstable API → New builds on stable foundation

## Implementation Checklist

### Phase 1: Database Schema ✅

- [ ] Check if `recipe_images` table exists
- [ ] Create migration if needed
- [ ] Add RLS policies
- [ ] Create helper functions
- [ ] Test schema with direct queries

### Phase 2: Type Definitions ✅

- [ ] Create `image-gallery.ts` types file
- [ ] Define all interfaces
- [ ] Add JSDoc comments
- [ ] Export all types
- [ ] Verify imports work in other files

### Phase 3: API Layer ✅

- [ ] Implement `image-gallery-api.ts`
- [ ] Full type coverage
- [ ] Error handling consistent
- [ ] Add unit tests
- [ ] Verify TypeScript compilation

### Phase 4: React Hooks ✅

- [ ] Create `use-recipe-images.ts`
- [ ] Implement all CRUD hooks
- [ ] Optimistic updates
- [ ] Cache invalidation
- [ ] Add hook tests

### Phase 5: UI Components ✅

- [ ] Create `recipe-image-manager.tsx`
- [ ] Create `recipe-image-gallery.tsx`
- [ ] Responsive design
- [ ] Accessibility features
- [ ] Component tests

### Phase 6: Integration ✅

- [ ] Update `recipe-form.tsx`
- [ ] Update `recipe-view.tsx`
- [ ] Add E2E tests
- [ ] Manual testing
- [ ] Documentation

## Code Review Guidelines

### For Each PR

**Schema/Types PR:**

- [ ] Types match database schema exactly
- [ ] All types exported
- [ ] JSDoc complete
- [ ] No breaking changes

**API PR:**

- [ ] Methods use defined types
- [ ] Error handling comprehensive
- [ ] No `any` types
- [ ] Tests cover all methods
- [ ] Backward compatible

**Hooks PR:**

- [ ] React Query patterns correct
- [ ] Optimistic updates safe
- [ ] Cache strategy sound
- [ ] Types flow through

**Components PR:**

- [ ] Accessibility complete
- [ ] Responsive design
- [ ] Error states handled
- [ ] Loading states smooth
- [ ] Props fully typed

**Integration PR:**

- [ ] Forms submit correctly
- [ ] Views display correctly
- [ ] E2E tests pass
- [ ] No regressions

## Timeline

| Phase               | PRs       | Duration     | Dependencies | Status         |
| ------------------- | --------- | ------------ | ------------ | -------------- |
| 1. Database & Types | 1         | 1 day        | None         | ⏳ Not Started |
| 2. API Layer        | 1         | 1 day        | Phase 1      | ⏳ Not Started |
| 3. React Hooks      | 1         | 1 day        | Phase 2      | ⏳ Not Started |
| 4. UI Components    | 2         | 2 days       | Phase 3      | ⏳ Not Started |
| 5. Integration      | 1         | 1 day        | Phase 4      | ⏳ Not Started |
| **Total**           | **6 PRs** | **6-8 days** | Sequential   | ⏳             |

## Resources

### Original Work to Reference

- Branch: `feature/debug-production-csp-errors`
- Commit: `66ed6ca` (contains all three components)
- **Use as reference, not copy source**

### Documentation

- [Supabase Storage Best Practices](https://supabase.com/docs/guides/storage/best-practices)
- [React Query Image Upload Pattern](https://tanstack.com/query/latest/docs/react/guides/optimistic-updates)
- [Accessible Image Galleries](https://www.w3.org/WAI/tutorials/carousels/)

### Examples

- Multi-image upload: [react-dropzone](https://react-dropzone.js.org/)
- Image galleries: [yet-another-react-lightbox](https://yet-another-react-lightbox.com/)

## Notes

### Implementation Notes

- Start only after CSP fixes are merged
- Ensure stable base before building
- Each phase should be independently deployable
- Monitor storage costs as usage grows

### Review Notes

- Each PR should be < 500 lines if possible
- Focus on one layer per review
- Verify type safety at each step
- Test accessibility thoroughly

### Deployment Notes

- Database migration must run before code deployment
- Consider feature flag for gradual rollout
- Monitor storage usage after deployment
- Have rollback plan ready

---

**Current Status:** Documented, waiting for API foundation  
**Next Action:** Complete API refactoring Phase 1, then start Phase 1 of this plan  
**Estimated Start Date:** 2-3 weeks (after API foundation ready)

## Quick Start (When Ready)

```bash
# Phase 1: Schema and Types
git checkout -b feature/image-gallery-schema-types main
# Create migration
# Create types file
# Test and commit

# Phase 2: API Layer
git checkout -b feature/image-gallery-api main
# Implement API
# Add tests
# Verify TypeScript
# Commit and merge

# ... continue through phases
```
